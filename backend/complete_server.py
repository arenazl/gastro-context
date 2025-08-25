#!/usr/bin/env python3
"""
Servidor completo con conexión MySQL real usando urllib para conectarse a la DB
"""
import http.server
import socketserver
import json
import hashlib
import urllib.request
import urllib.parse
import base64
import ssl
import os
import mimetypes
import time
import logging
import traceback
from datetime import datetime
from decimal import Decimal
from urllib.parse import urlparse, parse_qs
# from crash_diagnostics import CrashDiagnostics
# from mercadopago_config import create_payment_preference, process_webhook
# import google.generativeai as genai

# Usar puerto de Heroku si está disponible, sino usar 9002 para desarrollo local
PORT = int(os.environ.get('PORT', 9002))

# Configurar Gemini AI (comentado por ahora)
# GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyD7N-EUhvQ5NI9c8PTwewkuCiX8QvRVgfw')
# genai.configure(api_key=GEMINI_API_KEY)

# Directorio para imágenes estáticas
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
PRODUCTS_IMG_DIR = os.path.join(STATIC_DIR, 'products')

# Configurar logging súper detallado
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# Configurar logging con múltiples archivos
def setup_logging():
    """Configurar logging súper detallado"""
    
    # Logger principal
    logger = logging.getLogger('gastro_server')
    logger.setLevel(logging.DEBUG)
    
    # Formato detallado
    detailed_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Archivo general (todo)
    general_handler = logging.FileHandler(
        os.path.join(LOG_DIR, 'gastro_server.log'), 
        encoding='utf-8'
    )
    general_handler.setLevel(logging.DEBUG)
    general_handler.setFormatter(detailed_formatter)
    
    # Archivo de errores solamente
    error_handler = logging.FileHandler(
        os.path.join(LOG_DIR, 'errors.log'), 
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    
    # Archivo de requests HTTP
    requests_handler = logging.FileHandler(
        os.path.join(LOG_DIR, 'http_requests.log'), 
        encoding='utf-8'
    )
    requests_handler.setLevel(logging.INFO)
    requests_handler.setFormatter(detailed_formatter)
    
    # Archivo de operaciones de base de datos
    db_handler = logging.FileHandler(
        os.path.join(LOG_DIR, 'database.log'), 
        encoding='utf-8'
    )
    db_handler.setLevel(logging.DEBUG)
    db_handler.setFormatter(detailed_formatter)
    
    # Consola también
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('[%(asctime)s] %(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)
    
    # Agregar handlers
    logger.addHandler(general_handler)
    logger.addHandler(error_handler)
    logger.addHandler(requests_handler)
    logger.addHandler(db_handler)
    logger.addHandler(console_handler)
    
    return logger

# Inicializar logging
logger = setup_logging()
logger.info("🚀 Sistema de logging inicializado")
logger.info(f"📁 Logs guardados en: {LOG_DIR}")

# Inicializar sistema de diagnósticos
# crash_diagnostics = CrashDiagnostics(LOG_DIR)
logger.info("🔍 Sistema de diagnósticos de crashes inicializado")

def log_detailed(level, category, message, extra_data=None):
    """Log súper detallado con categorías"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    
    log_entry = {
        'timestamp': timestamp,
        'level': level,
        'category': category,
        'message': message,
        'extra': extra_data or {}
    }
    
    if level == 'ERROR':
        logger.error(f"[{category}] {message} | Extra: {extra_data}")
    elif level == 'WARN':
        logger.warning(f"[{category}] {message} | Extra: {extra_data}")
    elif level == 'DEBUG':
        logger.debug(f"[{category}] {message} | Extra: {extra_data}")
    else:
        logger.info(f"[{category}] {message} | Extra: {extra_data}")

def log_request(method, path, headers, body=None):
    """Log detallado de requests HTTP"""
    log_detailed('INFO', 'HTTP_REQUEST', f"{method} {path}", {
        'headers': dict(headers),
        'body_size': len(body) if body else 0,
        'user_agent': headers.get('User-Agent', 'Unknown'),
        'origin': headers.get('Origin', 'Unknown')
    })

def log_response(status_code, response_size, processing_time):
    """Log detallado de responses HTTP"""
    log_detailed('INFO', 'HTTP_RESPONSE', f"Status {status_code}", {
        'response_size': response_size,
        'processing_time_ms': round(processing_time * 1000, 2),
        'status_category': 'success' if status_code < 400 else 'error'
    })

def log_db_operation(operation, query, params=None, result_count=None, execution_time=None, error=None):
    """Log súper detallado de operaciones de base de datos"""
    extra_data = {
        'query': query[:200] + '...' if len(query) > 200 else query,
        'params': params,
        'result_count': result_count,
        'execution_time_ms': round(execution_time * 1000, 2) if execution_time else None
    }
    
    if error:
        extra_data['error'] = str(error)
        log_detailed('ERROR', 'DATABASE', f"Error en {operation}", extra_data)
    else:
        log_detailed('INFO', 'DATABASE', f"{operation} exitosa", extra_data)

# Configuración MySQL - Aiven
MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Cache simple en memoria (60 segundos)
cache = {}

# Cache global para datos del restaurante (productos, categorías, etc.)
# Se carga una vez y se mantiene en memoria
restaurant_data_cache = {
    'products': None,
    'categories': None,
    'ingredients': None,
    'product_ingredients': None,
    'last_updated': None,
    'cache_duration': 3600  # 1 hora
}

# Cache para respuestas de IA (evitar llamadas repetitivas)
ai_response_cache = {
    'pairings': {},  # Cache de maridajes por producto
    'recommendations': {},  # Cache de recomendaciones por búsqueda
    'cache_duration': 1800  # 30 minutos
}

# 🧠 SISTEMA DE CONTEXTO PERSISTENTE (como ChatGPT)
conversation_threads = {
    # 'thread_id': {
    #     'context_initialized': True,
    #     'restaurant_data': {...},
    #     'conversation_history': [...],
    #     'created_at': timestamp,
    #     'last_activity': timestamp
    # }
}

# Función para limpiar threads viejos (evitar memory leak)
def cleanup_old_threads():
    current_time = time.time()
    expired_threads = []
    
    for thread_id, thread_data in conversation_threads.items():
        # Eliminar threads inactivos por más de 2 horas
        if current_time - thread_data.get('last_activity', 0) > 7200:
            expired_threads.append(thread_id)
    
    for thread_id in expired_threads:
        del conversation_threads[thread_id]
        logger.info(f"[THREAD_CLEANUP] Thread {thread_id} eliminado por inactividad")

# Función para obtener o crear thread
def get_or_create_thread(thread_id):
    cleanup_old_threads()  # Limpiar threads viejos
    
    if thread_id not in conversation_threads:
        conversation_threads[thread_id] = {
            'context_initialized': False,
            'restaurant_data': None,
            'conversation_history': [],
            'created_at': time.time(),
            'last_activity': time.time()
        }
        logger.info(f"[THREAD_CREATE] Nuevo thread creado: {thread_id}")
    else:
        conversation_threads[thread_id]['last_activity'] = time.time()
    
    return conversation_threads[thread_id]
CACHE_TTL = 60  # segundos

# Pool de conexiones global - Inicializar al arrancar
connection_pool = None
pool_recovery_attempts = 0
MAX_RECOVERY_ATTEMPTS = 3

# Inicializar pool al importar el módulo
def load_restaurant_data():
    """Cargar todos los datos del restaurante en memoria de una sola vez"""
    global restaurant_data_cache
    
    connection = None
    cursor = None
    
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        logger.info("[CACHE] Cargando datos del restaurante en memoria...")
        
        # Cargar productos con categorías
        query_products = """
        SELECT p.id, p.name, p.description, p.price, p.category_id,
               c.name as category_name, p.image_url, p.available,
               s.name as subcategory_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories s ON p.subcategory_id = s.id
        WHERE p.available = 1
        ORDER BY c.name, p.name
        """
        cursor.execute(query_products)
        products = cursor.fetchall()
        
        # Cargar categorías
        query_categories = """
        SELECT id, name, description, icon, color
        FROM categories
        WHERE is_active = 1
        ORDER BY sort_order
        """
        cursor.execute(query_categories)
        categories = cursor.fetchall()
        
        # Cargar ingredientes con URLs de imágenes
        query_ingredients = """
        SELECT id, name, name_en, category, unit, is_allergen, 
               allergen_type, is_vegetarian, is_vegan, is_gluten_free
        FROM ingredients
        """
        cursor.execute(query_ingredients)
        ingredients = cursor.fetchall()
        
        # 🎨 MAPEO DE INGREDIENTES A IMÁGENES para interfaz interactiva
        ingredient_images = {
            # Carnes
            'carne de res': 'http://172.29.228.80:9002/static/products/beef.jpg',
            'carne': 'http://172.29.228.80:9002/static/products/meat.jpg',
            'pollo': 'http://172.29.228.80:9002/static/products/grilled-chicken.jpg',
            
            # Vegetales
            'tomate': 'http://172.29.228.80:9002/static/products/ensalada-caprese.jpg',
            'ajo': 'http://172.29.228.80:9002/static/products/bruschetta-mixta.jpg',
            'cebolla': 'http://172.29.228.80:9002/static/products/french-onion-soup.jpg',
            
            # Especias y condimentos
            'sal': 'http://172.29.228.80:9002/static/products/steak.jpg',
            'pimienta negra': 'http://172.29.228.80:9002/static/products/filet-mignon.jpg',
            'aceite de oliva': 'http://172.29.228.80:9002/static/products/ensalada-mediterranea.jpg',
            
            # Lácteos
            'queso': 'http://172.29.228.80:9002/static/products/cuatro-quesos.jpg',
            'mozzarella': 'http://172.29.228.80:9002/static/products/margherita.jpg',
            'parmesano': 'http://172.29.228.80:9002/static/products/caesar-salad.jpg',
            
            # Default para ingredientes sin imagen específica
            'default': 'http://172.29.228.80:9002/static/products/house-burger.jpg'
        }
        
        # Agregar image_url a cada ingrediente
        for ingredient in ingredients:
            ingredient_name_lower = ingredient['name'].lower()
            # Buscar imagen específica o usar default
            image_url = ingredient_images.get(ingredient_name_lower, ingredient_images['default'])
            ingredient['image_url'] = image_url
        
        # Cargar relaciones producto-ingredientes
        query_product_ingredients = """
        SELECT pi.product_id, pi.ingredient_id, pi.quantity, pi.unit, pi.is_optional,
               i.name as ingredient_name, i.name_en, i.is_allergen, i.allergen_type,
               i.is_vegetarian, i.is_vegan, i.is_gluten_free
        FROM product_ingredients pi
        JOIN ingredients i ON pi.ingredient_id = i.id
        ORDER BY pi.product_id, pi.is_optional ASC
        """
        cursor.execute(query_product_ingredients)
        product_ingredients = cursor.fetchall()
        
        # Organizar ingredientes por producto
        ingredients_by_product = {}
        for pi in product_ingredients:
            product_id = pi['product_id']
            if product_id not in ingredients_by_product:
                ingredients_by_product[product_id] = []
            
            # Obtener imagen del ingrediente
            ingredient_name_lower = pi['ingredient_name'].lower()
            ingredient_image = ingredient_images.get(ingredient_name_lower, ingredient_images['default'])
            
            ingredients_by_product[product_id].append({
                'name': pi['ingredient_name'],
                'name_en': pi['name_en'],
                'quantity': float(pi['quantity']) if pi['quantity'] else None,
                'unit': pi['unit'],
                'is_optional': bool(pi['is_optional']),
                'is_allergen': bool(pi['is_allergen']),
                'allergen_type': pi['allergen_type'],
                'is_vegetarian': bool(pi['is_vegetarian']),
                'is_vegan': bool(pi['is_vegan']),
                'is_gluten_free': bool(pi['is_gluten_free']),
                'image_url': ingredient_image  # 🎨 URL de imagen para interfaz interactiva
            })
        
        # Filtrar productos para maridajes
        pairing_products = []
        for product in products:
            product_category = (product.get('category_name', '') or '').lower()
            product_name_lower = (product.get('name', '') or '').lower()
            
            if any(keyword in product_category or keyword in product_name_lower for keyword in [
                'bebida', 'vino', 'cerveza', 'jugo', 'café', 'cocktail', 'agua',
                'ensalada', 'entrada', 'sopa', 'pan', 'queso', 'postre'
            ]):
                pairing_products.append({
                    'id': product['id'],
                    'name': product['name'],
                    'description': product.get('description', ''),
                    'category': product.get('category_name', ''),
                    'price': float(product.get('price', 0)),
                    'image_url': product.get('image_url', ''),
                    'image_filename': product.get('image_filename', '')
                })
        
        # Actualizar caché
        restaurant_data_cache.update({
            'products': products,
            'categories': categories,
            'ingredients': ingredients,
            'ingredients_by_product': ingredients_by_product,
            'pairing_products': pairing_products,
            'last_updated': time.time()
        })
        
        logger.info(f"[CACHE] Datos cargados: {len(products)} productos, {len(categories)} categorías, "
                   f"{len(ingredients)} ingredientes, {len(pairing_products)} productos para maridaje")
        
    except Exception as e:
        logger.error(f"[CACHE] Error cargando datos del restaurante: {e}")
        raise
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

def get_restaurant_data():
    """Obtener datos del restaurante desde caché o cargarlos si es necesario"""
    global restaurant_data_cache
    
    current_time = time.time()
    
    # Verificar si necesita actualizar caché
    if (restaurant_data_cache['last_updated'] is None or
        current_time - restaurant_data_cache['last_updated'] > restaurant_data_cache['cache_duration']):
        load_restaurant_data()
    
    return restaurant_data_cache

def init_pool():
    """Inicializar pool de conexiones con logging detallado"""
    global connection_pool, pool_recovery_attempts
    
    try:
        import mysql.connector.pooling
        
        log_detailed('INFO', 'POOL_INIT', f"Inicializando pool de conexiones MySQL (intento {pool_recovery_attempts + 1})", {
            'host': MYSQL_CONFIG['host'],
            'port': MYSQL_CONFIG['port'],
            'database': MYSQL_CONFIG['database'],
            'attempt': pool_recovery_attempts + 1
        })
        
        # Pool de conexiones MEJORADO: más conexiones para evitar agotamiento
        # - pool_size=10: Mantiene 10 conexiones permanentes
        # - Las conexiones se REUTILIZAN automáticamente
        # - IMPORTANTE: Siempre devolver las conexiones al pool
        connection_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name=f"gastro_pool_v{int(time.time())}",  # Nombre único por reinicio
            pool_size=10,  # AUMENTADO: 10 conexiones para manejar más carga
            pool_reset_session=True,  # Resetear sesión para evitar problemas
            host=MYSQL_CONFIG['host'],
            port=MYSQL_CONFIG['port'],
            user=MYSQL_CONFIG['user'],
            password=MYSQL_CONFIG['password'],
            database=MYSQL_CONFIG['database'],
            ssl_disabled=False,
            autocommit=True,
            connect_timeout=20,  # Timeout de conexión aumentado
            raise_on_warnings=False
        )
        
        log_detailed('INFO', 'POOL_SUCCESS', "Pool de conexiones inicializado exitosamente", {
            'pool_name': connection_pool.pool_name,
            'pool_size': connection_pool.pool_size
        })
        
        pool_recovery_attempts = 0  # Reset counter on success
        return True
        
    except Exception as e:
        pool_recovery_attempts += 1
        log_detailed('ERROR', 'POOL_INIT', f"Error creando pool: {e}", {
            'error_type': type(e).__name__,
            'attempt': pool_recovery_attempts,
            'traceback': traceback.format_exc()
        })
        
        connection_pool = None
        return False

def recover_pool():
    """Middleware de recuperación automática del pool"""
    global connection_pool, pool_recovery_attempts
    
    if pool_recovery_attempts >= MAX_RECOVERY_ATTEMPTS:
        log_detailed('ERROR', 'POOL_RECOVERY', "Máximo de intentos de recuperación alcanzado", {
            'max_attempts': MAX_RECOVERY_ATTEMPTS,
            'current_attempts': pool_recovery_attempts
        })
        return False
    
    log_detailed('WARN', 'POOL_RECOVERY', "Iniciando recuperación del pool de conexiones", {
        'previous_pool': connection_pool,
        'attempt': pool_recovery_attempts + 1
    })
    
    # Limpiar pool anterior si existe
    if connection_pool:
        try:
            # Intentar cerrar pool anterior
            log_detailed('DEBUG', 'POOL_CLEANUP', "Limpiando pool anterior")
            connection_pool = None
            time.sleep(1)  # Esperar un momento
        except Exception as cleanup_error:
            log_detailed('WARN', 'POOL_CLEANUP', f"Error limpiando pool anterior: {cleanup_error}")
    
    # Reinicializar pool
    success = init_pool()
    
    if success:
        log_detailed('INFO', 'POOL_RECOVERY', "Recuperación del pool exitosa", {
            'new_pool_name': connection_pool.pool_name if connection_pool else 'None'
        })
    else:
        log_detailed('ERROR', 'POOL_RECOVERY', "Falló la recuperación del pool")
    
    return success

def execute_mysql_query_with_recovery(query, params=None, retry_count=0):
    """Middleware que ejecuta queries con recuperación automática y diagnóstico inteligente"""
    MAX_RETRIES = 2
    
    try:
        return execute_mysql_query(query, params)
        
    except Exception as e:
        # ============ NUEVO: DIAGNÓSTICO INTELIGENTE ============
        # Analizar el error con el sistema de diagnósticos
        error_analysis = crash_diagnostics.analyze_error(
            error_message=str(e),
            error_type=type(e).__name__,
            traceback_info=traceback.format_exc()
        )
        
        error_category = error_analysis['category']
        solution_info = error_analysis['solution_info']
        
        # Log del diagnóstico
        log_detailed('ERROR', 'ERROR_DIAGNOSED', f"Error diagnosticado: {error_category}", {
            'error': str(e),
            'category': error_category,
            'description': solution_info['description'],
            'severity': solution_info['severity'],
            'occurrence_count': error_analysis['occurrence_count'],
            'suggested_solutions': solution_info['solutions'],
            'auto_recovery_available': solution_info['auto_recovery']
        })
        
        # Decidir si intentar recuperación automática basado en diagnóstico
        should_recover = crash_diagnostics.should_auto_recover(error_category)
        
        if should_recover and retry_count < MAX_RETRIES:
            recovery_strategy = crash_diagnostics.get_recovery_strategy(error_category)
            
            log_detailed('WARN', 'INTELLIGENT_RECOVERY', f"Iniciando recuperación inteligente para {error_category}", {
                'strategy': recovery_strategy,
                'retry_count': retry_count,
                'max_retries': MAX_RETRIES
            })
            
            # Ejecutar estrategia de recuperación específica
            recovery_success = execute_recovery_strategy(error_category, recovery_strategy)
            
            if recovery_success:
                log_detailed('INFO', 'RECOVERY_SUCCESS', f"Recuperación exitosa para {error_category}")
                time.sleep(0.5)  # Pequeña pausa
                return execute_mysql_query_with_recovery(query, params, retry_count + 1)
            else:
                log_detailed('ERROR', 'RECOVERY_FAILED', f"Falló la recuperación para {error_category}, usando fallback")
                return execute_fallback_query(query, params)
        else:
            # No recuperación automática disponible o reintentos agotados
            reason = "reintentos agotados" if retry_count >= MAX_RETRIES else "sin recuperación automática"
            
            log_detailed('ERROR', 'QUERY_FATAL', f"Error irrecuperable: {reason}", {
                'error': str(e),
                'error_type': type(e).__name__,
                'error_category': error_category,
                'retry_count': retry_count,
                'should_recover': should_recover,
                'diagnostic_report': crash_diagnostics.generate_status_report()
            })
            
            # Generar reporte de diagnóstico final
            print(f"\n{'='*60}")
            print(f"🚨 ERROR CRÍTICO DIAGNOSTICADO: {error_category}")
            print(f"📋 Descripción: {solution_info['description']}")
            print(f"⚠️  Severidad: {solution_info['severity']}")
            print(f"🔄 Ocurrencias: {error_analysis['occurrence_count']}")
            print(f"💡 Soluciones sugeridas: {', '.join(solution_info['solutions'])}")
            print(f"🤖 Recuperación automática: {'SÍ' if solution_info['auto_recovery'] else 'NO'}")
            print(f"{'='*60}\n")
            
            raise

def execute_recovery_strategy(error_category, recovery_strategy):
    """Ejecutar estrategia de recuperación específica basada en el diagnóstico"""
    
    log_detailed('INFO', 'RECOVERY_STRATEGY', f"Ejecutando estrategia para {error_category}", {
        'available_solutions': recovery_strategy['solutions'],
        'severity': recovery_strategy['severity']
    })
    
    solutions = recovery_strategy['solutions']
    
    # Estrategias específicas de recuperación
    if 'recover_pool' in solutions or 'increase_pool_size' in solutions:
        return recover_pool()
    
    elif 'reconnect_mysql' in solutions:
        return reconnect_mysql()
    
    elif 'kill_existing_process' in solutions:
        return kill_conflicting_process()
    
    elif 'garbage_collection' in solutions:
        return force_garbage_collection()
    
    else:
        log_detailed('WARN', 'RECOVERY_STRATEGY', f"Sin estrategia específica para {error_category}")
        return recover_pool()  # Fallback genérico

def reconnect_mysql():
    """Estrategia específica para reconectar MySQL"""
    log_detailed('INFO', 'MYSQL_RECONNECT', "Intentando reconectar a MySQL")
    return recover_pool()

def kill_conflicting_process():
    """Matar proceso que está usando el puerto"""
    log_detailed('WARN', 'KILL_PROCESS', f"Intentando liberar puerto {PORT}")
    try:
        os.system(f"lsof -ti:{PORT} | head -1 | xargs kill -9 2>/dev/null")
        time.sleep(2)
        return True
    except Exception as e:
        log_detailed('ERROR', 'KILL_PROCESS', f"Error matando proceso: {e}")
        return False

def force_garbage_collection():
    """Forzar recolección de basura"""
    log_detailed('INFO', 'GARBAGE_COLLECT', "Forzando garbage collection")
    try:
        import gc
        collected = gc.collect()
        log_detailed('INFO', 'GARBAGE_COLLECT', f"Objetos recolectados: {collected}")
        return True
    except Exception as e:
        log_detailed('ERROR', 'GARBAGE_COLLECT', f"Error en garbage collection: {e}")
        return False

def execute_fallback_query(query, params=None):
    """Fallback: ejecutar query sin pool como último recurso"""
    log_detailed('WARN', 'FALLBACK_QUERY', "Usando conexión directa como fallback", {
        'query_preview': query[:100]
    })
    
    try:
        import mysql.connector
        connection = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
        cursor = connection.cursor(dictionary=True)
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        result = cursor.fetchall()
        cursor.close()
        connection.close()
        
        log_detailed('INFO', 'FALLBACK_SUCCESS', "Fallback query exitosa", {
            'result_count': len(result)
        })
        
        return result
        
    except Exception as fallback_error:
        log_detailed('ERROR', 'FALLBACK_FAILED', f"Fallback también falló: {fallback_error}", {
            'error_type': type(fallback_error).__name__,
            'traceback': traceback.format_exc()
        })
        raise

# Pool se inicializa en el main, no aquí
# success = init_pool()
# if not success:
#     log_detailed('WARN', 'STARTUP', "Pool inicial falló, se usará conexión directa como fallback")

def get_from_cache(key):
    """Obtener de cache si no está expirado"""
    if key in cache:
        data, timestamp = cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return data
    return None

def set_cache(key, data):
    """Guardar en cache"""
    cache[key] = (data, time.time())

def execute_mysql_query(query, params=None):
    """Ejecutar consulta MySQL con pool de conexiones - CON LOGGING SÚPER DETALLADO"""
    global connection_pool
    
    start_time = time.time()
    connection = None
    cursor = None
    operation_id = f"db_{int(time.time() * 1000)}"
    
    # Log de inicio súper detallado
    log_detailed('DEBUG', 'DATABASE_START', f"Iniciando query {operation_id}", {
        'query_preview': query[:150] + '...' if len(query) > 150 else query,
        'query_length': len(query),
        'has_params': params is not None,
        'params': params,
        'pool_available': connection_pool is not None
    })
    
    try:
        # Si no hay pool, usar conexión directa
        if connection_pool is None:
            log_detailed('WARN', 'DATABASE_POOL', "Pool no disponible, usando conexión directa", {
                'operation_id': operation_id,
                'fallback_reason': 'no_pool'
            })
            
            try:
                import mysql.connector
                log_detailed('DEBUG', 'DATABASE_CONNECT', "Creando conexión directa a MySQL", {
                    'operation_id': operation_id,
                    'host': MYSQL_CONFIG['host'],
                    'port': MYSQL_CONFIG['port'],
                    'database': MYSQL_CONFIG['database']
                })
                
                connection = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
                cursor = connection.cursor(dictionary=True)
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                result = cursor.fetchall()
                cursor.close()
                connection.close()
                
                elapsed = time.time() - start_time
                log_db_operation("DIRECT_QUERY", query, params, len(result), elapsed)
                
                return result
                
            except Exception as direct_error:
                log_detailed('ERROR', 'DATABASE_DIRECT', f"Error en conexión directa: {direct_error}", {
                    'operation_id': operation_id,
                    'error_type': type(direct_error).__name__,
                    'traceback': traceback.format_exc()
                })
                raise
        
        # Usar pool de conexiones (mucho más rápido)
        connection = None
        cursor = None
        try:
            log_detailed('DEBUG', 'DATABASE_POOL', "Obteniendo conexión del pool", {
                'operation_id': operation_id,
                'pool_name': connection_pool.pool_name if hasattr(connection_pool, 'pool_name') else 'unknown'
            })
            
            connection = connection_pool.get_connection()
            
            log_detailed('DEBUG', 'DATABASE_POOL', "Conexión obtenida exitosamente", {
                'operation_id': operation_id,
                'connection_id': id(connection)
            })
            
            cursor = connection.cursor(dictionary=True)
            
            # Ejecutar query
            log_detailed('DEBUG', 'DATABASE_EXECUTE', "Ejecutando query en cursor", {
                'operation_id': operation_id,
                'cursor_id': id(cursor)
            })
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result = cursor.fetchall()
            
            elapsed = time.time() - start_time
            log_db_operation("POOL_QUERY", query, params, len(result), elapsed)
            
            log_detailed('DEBUG', 'DATABASE_SUCCESS', f"Query {operation_id} completada exitosamente", {
                'operation_id': operation_id,
                'result_count': len(result),
                'elapsed_ms': round(elapsed * 1000, 2)
            })
            
            return result
            
        except Exception as e:
            log_detailed('ERROR', 'DATABASE_POOL', f"Error en query del pool: {e}", {
                'operation_id': operation_id,
                'error_type': type(e).__name__
            })
            raise
        
        finally:
            # IMPORTANTE: Siempre cerrar cursor y devolver conexión al pool
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()  # Devuelve al pool, no cierra realmente
                except:
                    pass
            
    except ImportError:
            # Si no hay mysql.connector, intentar PyMySQL
            try:
                import pymysql
                
                connection = pymysql.connect(
                    host=MYSQL_CONFIG['host'],
                    port=MYSQL_CONFIG['port'],
                    user=MYSQL_CONFIG['user'],
                    password=MYSQL_CONFIG['password'],
                    database=MYSQL_CONFIG['database'],
                    ssl={'ca': None}  # Para conexiones SSL sin verificación
                )
                
                cursor = connection.cursor(pymysql.cursors.DictCursor)
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                result = cursor.fetchall()
                cursor.close()
                connection.close()
                
                return result
                
            except ImportError:
                print("FALTA INSTALAR: mysql-connector-python o pymysql")
                return None
            
    except Exception as e:
        print(f"Error conectando a MySQL: {e}")
        return None

# Cache para mejorar performance
CACHE = {
    'categories': None,
    'categories_time': None,
    'products': {},
    'tables': None,
    'tables_time': None
}

CACHE_DURATION = 60  # segundos

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def get_cached_or_fetch(cache_key, fetch_func, *args):
    """Helper para manejar cache usando el nuevo sistema"""
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    result = fetch_func(*args)
    set_cache(cache_key, result)
    return result

class CompleteServerHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Type', 'application/json')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)
        
        # Servir imágenes estáticas
        if path.startswith('/static/products/'):
            self.serve_static_file(path)
            return
            
        # Health check
        if path == '/' or path == '/health':
            self.send_json_response({
                'name': 'Restaurant Management System',
                'version': '2.0.0',
                'status': 'operational',
                'server': 'complete_server',
                'database': 'MySQL Aiven'
            })
            
        # Crear tabla kitchen_queue_items
        elif path == '/api/create-kitchen-table':
            try:
                result = self.create_kitchen_queue_table()
                self.send_json_response({'success': True, 'message': result})
            except Exception as e:
                self.send_error_response(500, str(e))
                
        # Agregar columna payment_status
        elif path == '/api/add-payment-status':
            connection = None
            cursor = None
            try:
                connection = connection_pool.get_connection()
                cursor = connection.cursor()
                
                # Primero verificar si la columna existe
                cursor.execute("""
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'gastro' 
                    AND TABLE_NAME = 'orders' 
                    AND COLUMN_NAME = 'payment_status'
                """)
                
                if not cursor.fetchone():
                    cursor.execute("""
                        ALTER TABLE orders 
                        ADD COLUMN payment_status 
                        ENUM('pending', 'paid', 'partial', 'refunded', 'cancelled') 
                        DEFAULT 'pending' 
                        AFTER status
                    """)
                connection.commit()
                
                self.send_json_response({'success': True, 'message': 'Columna payment_status agregada'})
            except Exception as e:
                self.send_error_response(500, str(e))
            finally:
                if cursor: cursor.close()
                if connection: connection.close()
                
        # Test directo de base de datos
        elif path == '/api/test-db':
            connection = None
            cursor = None
            try:
                import traceback
                import time
                start_time = time.time()
                
                # Test directo sin cache - MEJORADO con manejo de conexiones
                connection = connection_pool.get_connection()
                cursor = connection.cursor()
                
                # Query de test simple
                test_query = "SELECT COUNT(*) as total_products FROM products"
                cursor.execute(test_query)
                result = cursor.fetchone()
                
                # Query más compleja para test completo
                complex_query = """
                SELECT 
                    c.name as category_name,
                    COUNT(p.id) as product_count,
                    AVG(p.price) as avg_price
                FROM categories c 
                LEFT JOIN products p ON c.id = p.category_id 
                WHERE c.is_active = 1 
                GROUP BY c.id, c.name 
                ORDER BY product_count DESC 
                LIMIT 5
                """
                cursor.execute(complex_query)
                complex_result = cursor.fetchall()
                
                execution_time = time.time() - start_time
                
                self.send_json_response({
                    "status": "SUCCESS",
                    "message": "Conexión a base de datos funcionando correctamente",
                    "test_results": {
                        "simple_test": {
                            "query": test_query,
                            "result": result[0] if result else None
                        },
                        "complex_test": {
                            "query": complex_query.strip(),
                            "results": complex_result,
                            "result_count": len(complex_result)
                        }
                    },
                    "performance": {
                        "execution_time_ms": round(execution_time * 1000, 2),
                        "connection_pool": "Active"
                    },
                    "database_info": {
                        "host": "mysql-aiven-arenazl.e.aivencloud.com",
                        "port": 23108,
                        "database": "gastro"
                    }
                })
                
            except Exception as e:
                import traceback
                error_details = {
                    "status": "ERROR",
                    "message": "Error real de conexión a base de datos",
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "error_code": getattr(e, 'errno', None),
                    "sql_state": getattr(e, 'sqlstate', None),
                    "traceback_lines": traceback.format_exc().split('\n'),
                    "full_traceback": traceback.format_exc(),
                    "connection_details": {
                        "host": "mysql-aiven-arenazl.e.aivencloud.com",
                        "port": 23108,
                        "database": "gastro"
                    }
                }
                log_detailed('ERROR', 'DATABASE_TEST_ERROR', f"Error en test de BD: {str(e)}", error_details)
                self.send_json_response(error_details)
            
            finally:
                # CRÍTICO: Siempre liberar conexiones al pool
                if cursor:
                    try:
                        cursor.close()
                    except:
                        pass
                if connection:
                    try:
                        connection.close()  # Devuelve al pool
                    except:
                        pass
            
        # Categorías
        elif path in ['/api/categories', '/api/v1/products/categories']:
            try:
                categories = get_cached_or_fetch('categories', self.get_categories_data)
                self.send_json_response(categories)
            except Exception as e:
                import traceback
                error_details = {
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc()
                }
                log_detailed('ERROR', 'DATABASE_ERROR', f"Error en categorías: {str(e)}", error_details)
                self.send_error_response(503, f"ERROR REAL: {str(e)} | Tipo: {type(e).__name__}")
            
        # Subcategorías
        elif path == '/api/subcategories':
            try:
                category_id = query.get('category_id', [None])[0]
                subcategories = self.get_subcategories_data(category_id)
                self.send_json_response(subcategories)
            except Exception as e:
                self.send_error_response(503, f"Error de base de datos: {str(e)}")
            
        # Productos (con cache)
        elif path == '/api/products':
            try:
                category_id = query.get('category_id', [None])[0]
                subcategory_id = query.get('subcategory_id', [None])[0]
                
                # Intentar obtener de cache primero
                cache_key = f"products_{category_id}_{subcategory_id}"
                cached_data = get_from_cache(cache_key)
                
                if cached_data:
                    self.send_json_response(cached_data)
                else:
                    products = self.get_products_data(category_id, subcategory_id)
                    set_cache(cache_key, products)  # Guardar en cache
                    self.send_json_response(products)
            except Exception as e:
                self.send_error_response(503, f"Error de base de datos: {str(e)}")
            
        # Producto individual
        elif path.startswith('/api/products/') and path != '/api/products/upload':
            try:
                product_id = int(path.split('/')[-1])
                product = self.get_single_product(product_id)
                if product:
                    self.send_json_response(product)
                else:
                    self.send_error(404)
            except:
                self.send_error(404)
                
        # Mesas
        elif path == '/api/tables':
            tables = get_cached_or_fetch('tables', self.get_tables_data)
            self.send_json_response(tables)
            
        # Todas las órdenes
        elif path == '/api/orders':
            try:
                connection = connection_pool.get_connection()
                cursor = connection.cursor()
                
                query = """
                SELECT o.id, o.table_number, o.customer_id, o.status, 
                       o.payment_status, o.subtotal, o.tax, o.total,
                       o.created_at, u.first_name as waiter
                FROM orders o
                LEFT JOIN users u ON o.waiter_id = u.id
                WHERE o.status IN ('pending', 'preparing')
                ORDER BY o.created_at DESC
                """
                
                cursor.execute(query)
                rows = cursor.fetchall()
                
                orders = []
                for row in rows:
                    order_id = row[0]
                    
                    # Obtener items de cada orden
                    items_query = """
                    SELECT oi.id, oi.product_id, oi.quantity, oi.price, oi.notes,
                           p.name as product_name
                    FROM order_items oi
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = %s
                    """
                    cursor.execute(items_query, (order_id,))
                    items_rows = cursor.fetchall()
                    
                    items = []
                    for item_row in items_rows:
                        items.append({
                            'id': item_row[0],
                            'product_id': item_row[1],
                            'product_name': item_row[5],
                            'quantity': item_row[2],
                            'price': float(item_row[3]) if item_row[3] else 0,
                            'notes': item_row[4]
                        })
                    
                    orders.append({
                        'id': row[0],
                        'table_number': row[1],
                        'customer_id': row[2],
                        'status': row[3],
                        'payment_status': row[4],
                        'subtotal': float(row[5]) if row[5] else 0,
                        'tax': float(row[6]) if row[6] else 0,
                        'total': float(row[7]) if row[7] else 0,
                        'created_at': str(row[8]) if row[8] else None,
                        'waiter': row[9] or 'Sin asignar',
                        'items': items
                    })
                
                self.send_json_response(orders)
                
            except Exception as e:
                logger.error(f"Error obteniendo órdenes: {e}")
                self.send_json_response([])
            finally:
                if cursor: cursor.close()
                if connection: connection.close()
        
        # Órdenes de cocina (formato antiguo)
        elif path == '/api/orders/kitchen':
            orders = self.get_kitchen_orders()
            self.send_json_response(orders)
            
        # Cola de cocina (para drag-and-drop)
        elif path == '/api/kitchen/queue':
            try:
                connection = connection_pool.get_connection()
                cursor = connection.cursor()
                
                query = """
                SELECT 
                    kq.id,
                    kq.order_id,
                    kq.order_item_id,
                    kq.product_name,
                    kq.quantity,
                    kq.station,
                    kq.status,
                    kq.special_instructions,
                    kq.table_number,
                    kq.waiter_name,
                    kq.created_at,
                    kq.started_at,
                    TIMESTAMPDIFF(MINUTE, kq.created_at, NOW()) as waiting_minutes,
                    CASE 
                        WHEN kq.started_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(MINUTE, kq.started_at, NOW()) 
                        ELSE 0 
                    END as cooking_minutes
                FROM kitchen_queue_items kq
                WHERE kq.status NOT IN ('cancelled')
                ORDER BY kq.created_at ASC
                """
                
                cursor.execute(query)
                rows = cursor.fetchall()
                
                items = []
                for row in rows:
                    items.append({
                        'id': row[0],
                        'order_id': row[1],
                        'order_item_id': row[2],
                        'product_name': row[3],
                        'quantity': row[4],
                        'station': row[5],
                        'status': row[6],
                        'special_instructions': row[7],
                        'table_number': row[8],
                        'waiter_name': row[9],
                        'created_at': str(row[10]) if row[10] else None,
                        'started_at': str(row[11]) if row[11] else None,
                        'waiting_minutes': row[12],
                        'cooking_minutes': row[13]
                    })
                
                self.send_json_response(items)
                
            except Exception as e:
                logger.error(f"Error obteniendo cola de cocina: {e}")
                self.send_json_response([])
            finally:
                if cursor: cursor.close()
                if connection: connection.close()
            
        # Clientes
        elif path == '/api/customers':
            search = query.get('search', [''])[0]
            customers = self.get_customers_data(search)
            self.send_json_response(customers)
            
        # Usuario actual
        elif path in ['/api/v1/auth/me', '/api/users/me']:
            self.send_json_response({
                "id": 1,
                "email": "admin@restaurant.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin"
            })
        
        # Configuración de empresa
        elif path == '/api/company/settings':
            try:
                settings = self.get_company_settings()
                self.send_json_response(settings)
            except Exception as e:
                logger.error(f"Error obteniendo configuración: {e}")
                self.send_error_response(500, str(e))
        
        # Lista de empresas
        elif path == '/api/companies':
            try:
                companies = self.get_companies_data()
                self.send_json_response(companies)
            except Exception as e:
                logger.error(f"Error obteniendo empresas: {e}")
                self.send_error_response(500, str(e))
        
        # Lista de usuarios
        elif path == '/api/users':
            try:
                users = self.get_users_data()
                self.send_json_response(users)
            except Exception as e:
                logger.error(f"Error obteniendo usuarios: {e}")
                self.send_error_response(500, str(e))
        
        # Lista de roles
        elif path == '/api/roles':
            try:
                roles = self.get_roles_data()
                self.send_json_response(roles)
            except Exception as e:
                logger.error(f"Error obteniendo roles: {e}")
                self.send_error_response(500, str(e))
        
        # Lista de areas
        elif path.startswith('/api/areas'):
            try:
                areas = self.get_areas_data()
                self.send_json_response(areas)
            except Exception as e:
                logger.error(f"Error obteniendo areas: {e}")
                self.send_error_response(500, str(e))
        
        # Lista de addresses
        elif path.startswith('/api/addresses'):
            try:
                addresses = self.get_addresses_data()
                self.send_json_response(addresses)
            except Exception as e:
                logger.error(f"Error obteniendo addresses: {e}")
                self.send_error_response(500, str(e))
        
        # Inicialización de caché del menú
        elif path == '/api/menu/init':
            try:
                logger.info("[INIT] Inicializando caché del menú interactivo...")
                restaurant_data = get_restaurant_data()  # Esto cargará todo el caché
                
                self.send_json_response({
                    'status': 'success',
                    'message': 'Caché inicializado correctamente',
                    'data': {
                        'products_count': len(restaurant_data.get('products', [])),
                        'categories_count': len(restaurant_data.get('categories', [])),
                        'ingredients_count': len(restaurant_data.get('ingredients', [])),
                        'pairing_products_count': len(restaurant_data.get('pairing_products', []))
                    }
                })
                
            except Exception as e:
                logger.error(f"Error inicializando caché del menú: {str(e)}")
                self.send_json_response({
                    'status': 'error',
                    'message': f'Error inicializando caché: {str(e)}'
                })
        
        # Búsqueda de clientes
        elif path == '/api/customers/search':
            try:
                search_term = query.get('q', [''])[0]
                if len(search_term) < 2:
                    self.send_json_response([])
                else:
                    customers = self.search_customers(search_term)
                    self.send_json_response(customers)
            except Exception as e:
                logger.error(f"Error buscando clientes: {e}")
                self.send_error_response(500, str(e))
        
        # Direcciones de un cliente específico  
        elif path.startswith('/api/customers/') and path.endswith('/addresses'):
            try:
                # Extraer customer_id del path
                parts = path.split('/')
                customer_id = int(parts[3])  # /api/customers/{id}/addresses
                addresses = self.get_customer_addresses(customer_id)
                self.send_json_response(addresses)
            except ValueError:
                self.send_error_response(400, "ID de cliente inválido")
            except Exception as e:
                logger.error(f"Error obteniendo direcciones del cliente: {e}")
                self.send_error_response(500, str(e))
        
        # Configuración de área específica
        elif path.startswith('/api/area-settings/'):
            area_id = path.split('/')[-1]
            try:
                area_id = int(area_id)
                company_id = query.get('company_id', [1])[0]
                settings = self.get_area_settings(area_id, int(company_id))
                if settings:
                    self.send_json_response(settings)
                else:
                    # Retornar configuración default si no existe
                    default_settings = {
                        'area_id': area_id,
                        'company_id': int(company_id),
                        'final_x_position': 0,
                        'final_y_position': 0,
                        'zoom_level': 1.0,
                        'grid_size': 20,
                        'show_grid': True,
                        'background_color': '#F3F4F6'
                    }
                    self.send_json_response(default_settings)
            except ValueError:
                self.send_error_response(400, "ID de área inválido")
            except Exception as e:
                logger.error(f"Error obteniendo configuración del área: {e}")
                self.send_error_response(500, str(e))
        
        # Configuración general del mapa
        elif path.startswith('/api/map-settings'):
            try:
                company_id = query.get('company_id', [1])[0]
                settings = self.get_map_settings(int(company_id))
                if settings:
                    self.send_json_response(settings)
                else:
                    # Retornar configuración default si no existe
                    default_settings = {
                        'company_id': int(company_id),
                        'map_x_position': 0,
                        'map_y_position': 0,
                        'global_zoom': 1.0,
                        'grid_enabled': True,
                        'snap_to_grid': True,
                        'grid_color': '#E5E7EB',
                        'canvas_width': 1200,
                        'canvas_height': 800,
                        'auto_save': True
                    }
                    self.send_json_response(default_settings)
            except Exception as e:
                logger.error(f"Error obteniendo configuración del mapa: {e}")
                self.send_error_response(500, str(e))
        
        # Endpoint especial para agregar columnas faltantes
        elif path == '/api/fix-company-settings-table':
            try:
                result = self.fix_company_settings_table()
                self.send_json_response({'success': True, 'message': 'Tabla corregida', 'details': result})
            except Exception as e:
                logger.error(f"Error corrigiendo tabla: {e}")
                self.send_error_response(500, str(e))
        
        # Reportes - Ventas
        elif path == '/api/reports/sales':
            try:
                start_date = query.get('start_date', [None])[0]
                end_date = query.get('end_date', [None])[0]
                sales_report = self.get_sales_report(start_date, end_date)
                self.send_json_response(sales_report)
            except Exception as e:
                logger.error(f"Error obteniendo reporte de ventas: {e}")
                self.send_error_response(500, str(e))
        
        # Reportes - Métricas de mesas
        elif path == '/api/reports/tables':
            try:
                table_metrics = self.get_table_metrics()
                self.send_json_response(table_metrics)
            except Exception as e:
                logger.error(f"Error obteniendo métricas de mesas: {e}")
                self.send_error_response(500, str(e))
        
        # Reportes - Métricas de clientes
        elif path == '/api/reports/customers':
            try:
                customer_metrics = self.get_customer_metrics()
                self.send_json_response(customer_metrics)
            except Exception as e:
                logger.error(f"Error obteniendo métricas de clientes: {e}")
                self.send_error_response(500, str(e))
        
        # Reportes - Métricas de inventario
        elif path == '/api/reports/inventory':
            try:
                inventory_metrics = self.get_inventory_metrics()
                self.send_json_response(inventory_metrics)
            except Exception as e:
                logger.error(f"Error obteniendo métricas de inventario: {e}")
                self.send_error_response(500, str(e))
        
        # Reportes - KPIs de rendimiento
        elif path == '/api/reports/performance':
            try:
                performance_metrics = self.get_performance_metrics()
                self.send_json_response(performance_metrics)
            except Exception as e:
                logger.error(f"Error obteniendo KPIs de rendimiento: {e}")
                self.send_error_response(500, str(e))
        
        # Debug: Análisis de estructura de BD
        elif path == '/api/debug/database-structure':
            try:
                result = self.analyze_database_structure()
                self.send_json_response(result)
            except Exception as e:
                logger.error(f"Error analizando estructura de BD: {e}")
                self.send_error_response(500, str(e))
        
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        path = urlparse(self.path).path
        
        if path == '/api/auth/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                email = data.get('email')
                
                # Generate token
                token = hashlib.md5(f"{email}{datetime.now()}".encode()).hexdigest()
                
                self.send_json_response({
                    'access_token': token,
                    'token_type': 'bearer',
                    'user': {
                        'id': 1,
                        'email': email,
                        'first_name': 'Admin',
                        'last_name': 'User',
                        'role': 'admin'
                    }
                })
            except Exception as e:
                self.send_error_response(500, str(e))
                
        elif path == '/api/auth/logout':
            self.send_json_response({'success': True, 'message': 'Logged out'})
            
        elif path == '/api/orders':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                order_id = self.create_order(data)
                
                self.send_json_response({
                    'id': order_id,
                    'table_number': data.get('table_number', 1),
                    'status': 'pending',
                    'total_amount': data.get('total', 0),
                    'message': 'Order created successfully'
                })
            except Exception as e:
                self.send_error_response(500, str(e))
        
        elif path == '/api/kitchen/queue':
            # Crear nuevo item en la cola de cocina
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                item_id = self.create_kitchen_queue_item(data)
                
                self.send_json_response({
                    'id': item_id,
                    'success': True
                })
            except Exception as e:
                self.send_error_response(500, str(e))
        
        elif path == '/api/payment/create-preference':
            # Crear preferencia de pago con MercadoPago
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                logger.info(f"Creando preferencia de pago para orden: {data.get('order_id')}")
                
                # Crear preferencia en MercadoPago
                preference_result = create_payment_preference(data)
                
                if preference_result['success']:
                    self.send_json_response(preference_result)
                else:
                    self.send_error_response(400, preference_result.get('error', 'Error creando preferencia'))
            except Exception as e:
                logger.error(f"Error creando preferencia de pago: {str(e)}")
                self.send_error_response(500, str(e))
        
        elif path == '/api/chat/menu-ai':
            # 🧠 SISTEMA DE CONTEXTO PERSISTENTE (como ChatGPT)
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                user_message = data.get('message', '')
                context = data.get('context', {})
                thread_id = data.get('threadId', f"thread_{int(time.time() * 1000)}")
                
                # 🎆 OBTENER O CREAR THREAD
                thread = get_or_create_thread(thread_id)
                
                # 📜 PASO 1: INICIALIZAR CONTEXTO (solo la primera vez)
                if not thread['context_initialized']:
                    logger.info(f"[CONTEXT_INIT] Inicializando contexto para thread {thread_id}")
                    
                    # Cargar datos del restaurante SOLO una vez
                    restaurant_data = get_restaurant_data()
                    thread['restaurant_data'] = restaurant_data
                    thread['context_initialized'] = True
                    
                    # Si es el primer mensaje, puede ser de setup
                    if user_message.lower() in ['setup', 'init', 'initialize']:
                        self.send_json_response({
                            'response': 'Contexto inicializado correctamente. ¡Ya conozco todo el menú!',
                            'threadId': thread_id,
                            'status': 'context_ready',
                            'stats': {
                                'products_loaded': len(restaurant_data.get('products', [])),
                                'categories_loaded': len(set([p['category_name'] for p in restaurant_data.get('products', []) if p['category_name']])),
                                'ingredients_loaded': len(restaurant_data.get('ingredients_by_product', {}))
                            }
                        })
                        return
                
                # 🤖 PASO 2: AI INTERPRETA CON CONTEXTO PERSISTENTE
                products_data = thread['restaurant_data'].get('products', [])
                user_intent = self.interpret_user_intent_with_ai_persistent(user_message, thread_id, context)
                
                # 🎯 PASO 3: EJECUTAR ACCIÓN SEGÚN LA INTENCIÓN INTERPRETADA
                # Agregar threadId a la respuesta
                def send_response_with_thread(response_data):
                    response_data['threadId'] = thread_id
                    self.send_json_response(response_data)
                # 🎭 MANEJAR SALUDOS Y CONVERSACIÓN CASUAL PRIMERO
                if user_intent['intent_type'] == 'greeting':
                    # Usuario está saludando - responder amigablemente sin productos
                    send_response_with_thread({
                        'response': user_intent.get('response_text', '¡Hola! 👋 ¡Bienvenido! ¿En qué te puedo ayudar hoy? Puedo mostrarte nuestras especialidades, recomendarte algo rico o contarte sobre cualquier plato del menú.'),
                        'recommendedProducts': [],  # NO enviar productos en saludos
                        'status': 'success',
                        'query_type': 'greeting'
                    })
                    return
                
                elif user_intent['intent_type'] == 'casual_conversation':
                    # Usuario está haciendo charla casual - responder naturalmente sin productos
                    send_response_with_thread({
                        'response': user_intent.get('response_text', '¡De nada! Estoy acá para ayudarte con lo que necesites del menú. 😊'),
                        'recommendedProducts': [],  # NO enviar productos en charla casual
                        'status': 'success',
                        'query_type': 'casual_conversation'
                    })
                    return
                
                elif user_intent['intent_type'] == 'specific_product_ingredients':
                    # Usuario quiere ingredientes de un producto específico
                    product = user_intent['target_product']
                    ingredients = self.get_product_ingredients(product['id'])
                    
                    # Generar respuesta final con IA usando SOLO ingredientes reales
                    final_response = self.generate_ingredients_response_with_ai(
                        user_message, product['name'], ingredients
                    )
                    
                    send_response_with_thread({
                        'response': final_response,
                        'recommendedProducts': [{
                            'id': product['id'],
                            'name': product['name'],
                            'description': product['description'],
                            'price': float(product['price']),
                            'category': product['category_name'],
                            'image_url': product['image_url']
                        }],
                        'ingredients': ingredients,
                        'status': 'success',
                        'query_type': 'specific_product_ingredients'
                    })
                    return
                
                elif user_intent['intent_type'] == 'product_pairings':
                    # Usuario quiere maridajes/acompañamientos de un producto específico
                    product = user_intent['target_product']
                    
                    # Obtener maridajes reales de la BD usando IA controlada
                    pairing_response, pairing_products = self.generate_pairings_response_with_ai(
                        user_message, product['name'], product['category_name'], products_data
                    )
                    
                    send_response_with_thread({
                        'response': pairing_response,
                        'recommendedProducts': pairing_products,
                        'status': 'success',
                        'query_type': 'product_pairings'
                    })
                    return
                
                elif user_intent['intent_type'] == 'smart_beverage_recommendation':
                    # Usuario quiere bebida inteligente según contexto
                    context_data = data.get('context', {})
                    selected_food = context_data.get('selectedFood', None)
                    selected_pairing = context_data.get('selectedPairing', None)
                    weather = context_data.get('weather', 'templado')
                    temperature = context_data.get('temperature', 22)
                    time_of_day = context_data.get('timeOfDay', 'tarde')
                    
                    # Generar recomendación inteligente de bebida
                    beverage_response, beverage_products = self.generate_smart_beverage_recommendation(
                        user_message, selected_food, selected_pairing, weather, temperature, time_of_day, products_data
                    )
                    
                    send_response_with_thread({
                        'response': beverage_response,
                        'recommendedProducts': beverage_products,
                        'status': 'success',
                        'query_type': 'smart_beverage_recommendation'
                    })
                    return
                
                elif user_intent['intent_type'] == 'specific_product_info':
                    # Usuario quiere información general de un producto
                    product = user_intent['target_product']
                    
                    self.send_json_response({
                        'response': user_intent['response_text'],
                        'recommendedProducts': [{
                            'id': product['id'],
                            'name': product['name'],
                            'description': product['description'],
                            'price': float(product['price']),
                            'category': product['category_name'],
                            'image_url': product['image_url']
                        }],
                        'status': 'success',
                        'query_type': 'specific_product_info'
                    })
                    return
                
                elif user_intent['intent_type'] == 'product_recommendations':
                    # Usuario quiere recomendaciones generales - generar con IA
                    recommendation_response, recommendation_products = self.generate_intelligent_recommendations(
                        user_message, products_data, thread_id
                    )
                    
                    send_response_with_thread({
                        'response': recommendation_response,
                        'categorizedProducts': recommendation_products,  # Ahora es un dict de categorías
                        'status': 'success',
                        'query_type': 'categorized_recommendations'
                    })
                    return
                
                else:
                    # Fallback: recomendaciones generales
                    recommended_products = [{
                        'id': p['id'],
                        'name': p['name'],
                        'description': p['description'],
                        'price': float(p['price']),
                        'category': p['category_name'],
                        'image_url': p['image_url']
                    } for p in products_data[:4]]
                
                
                # Si no hay coincidencias, recomendar populares
                if not recommended_products and products_data:
                    recommended_products = [
                        {
                            'id': p['id'],
                            'name': p['name'],
                            'description': p['description'],
                            'price': float(p['price']),
                            'category': p['category_name'],
                            'image_url': p['image_url']
                        }
                        for p in products_data[:4]
                    ]
                
                # Generar respuesta final
                response_text = user_intent.get('response_text', 'Te muestro algunas opciones deliciosas:')
                
                self.send_json_response({
                    'response': response_text,
                    'recommendedProducts': recommended_products[:4],
                    'status': 'success'
                })
                    
            except Exception as e:
                logger.error(f"Error en menú interactivo AI: {str(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                self.send_json_response({
                    'response': f'Error procesando: {str(e)}',
                    'recommendedProducts': [],
                    'status': 'error',
                    'error_details': str(e)
                })
        
        elif path == '/api/chat/pairings':
            # Obtener maridajes e ingredientes para un producto usando IA con caché
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                product_id = data.get('product_id', None)
                product_name = data.get('product', '')
                category = data.get('category', '')
                
                # Generar maridajes inteligentes con IA (usa caché internamente)
                pairings = self.generate_ai_pairings(product_name, category)
                
                # Obtener ingredientes desde caché
                ingredients = []
                if product_id:
                    ingredients = self.get_product_ingredients(product_id)
                
                self.send_json_response({
                    'pairings': pairings,
                    'ingredients': ingredients,
                    'status': 'success'
                })
                
            except Exception as e:
                logger.error(f"Error obteniendo maridajes: {str(e)}")
                self.send_json_response({
                    'pairings': [],
                    'ingredients': [],
                    'status': 'error'
                })
        
        elif path == '/api/chat/gemini':
            # Chat con Gemini AI para recomendaciones gastronómicas
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                user_message = data.get('message', '')
                context = data.get('context', {})
                
                # Obtener productos de la base de datos
                query = """
                SELECT p.id, p.name, p.description, p.price, p.category_id,
                       c.name as category_name, p.image_url
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.available = 1
                ORDER BY c.name, p.name
                """
                products_data = execute_mysql_query_with_recovery(query)
                
                # Organizar productos por categoría
                menu_by_category = {}
                for product in products_data:
                    category = product['category_name'] or 'Sin categoría'
                    if category not in menu_by_category:
                        menu_by_category[category] = []
                    menu_by_category[category].append({
                        'name': product['name'],
                        'description': product['description'],
                        'price': float(product['price'])
                    })
                
                # Crear contexto detallado del menú
                menu_text = "MENÚ COMPLETO DEL RESTAURANTE:\n\n"
                for category, items in menu_by_category.items():
                    menu_text += f"\n{category.upper()}:\n"
                    for item in items:
                        menu_text += f"- {item['name']}: {item['description']} (${item['price']:.2f})\n"
                
                # Configurar el modelo Gemini
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                # Crear prompt enriquecido con el menú real
                prompt = f"""
                Eres un asistente virtual experto en gastronomía de nuestro restaurante. 
                Tu objetivo es guiar a los clientes para hacer su pedido de forma personalizada.
                
                {menu_text}
                
                INSTRUCCIONES IMPORTANTES:
                1. SIEMPRE recomienda productos REALES del menú con sus precios exactos
                2. Pregunta sobre preferencias (vegetariano, picante, sin gluten, etc.)
                3. Sugiere combos o maridajes (bebida + plato principal + postre)
                4. Menciona los precios cuando recomiendas
                5. Usa emojis para hacer la conversación más visual y atractiva
                6. Si piden algo que no está en el menú, sugiere alternativas similares
                7. Sé conciso pero informativo (máximo 4-5 líneas)
                
                Mesa: {context.get('tableId', '1')}
                Mensaje del cliente: {user_message}
                
                Responde de forma amigable y profesional, como un sommelier experto.
                """
                
                # Generar respuesta
                response = model.generate_content(prompt)
                
                # Buscar productos mencionados en la respuesta para enviar imágenes
                mentioned_products = []
                response_text = response.text.lower()
                for product in products_data:
                    if product['name'].lower() in response_text:
                        mentioned_products.append({
                            'id': product['id'],
                            'name': product['name'],
                            'price': float(product['price']),
                            'image': product['image_url']
                        })
                
                self.send_json_response({
                    'response': response.text,
                    'products': mentioned_products[:3],  # Máximo 3 productos
                    'status': 'success'
                })
                
            except Exception as e:
                logger.error(f"Error en chat con Gemini: {str(e)}")
                self.send_json_response({
                    'response': '🤖 Disculpa, estoy teniendo un momento de actualización. Mientras tanto, te recomiendo nuestras especialidades: Pizza Margherita ($18), Hamburguesa Clásica ($15) o Ensalada César ($12). ¿Cuál te gustaría probar?',
                    'status': 'error',
                    'error': str(e)
                })
        
        elif path == '/api/webhooks/mercadopago':
            # Webhook de MercadoPago para notificaciones de pago
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                logger.info(f"Webhook MercadoPago recibido: {data}")
                
                # Procesar webhook
                payment_info = process_webhook(data)
                
                if payment_info:
                    # Actualizar el estado de la orden en la BD
                    order_id = payment_info.get('external_reference')
                    payment_status = payment_info.get('status')
                    
                    if order_id and payment_status == 'approved':
                        # Actualizar orden como pagada
                        query = """
                        UPDATE orders 
                        SET payment_status = 'paid',
                            payment_method = 'mercadopago',
                            payment_id = %s,
                            updated_at = NOW()
                        WHERE id = %s
                        """
                        execute_mysql_query_with_recovery(query, (payment_info.get('payment_id'), order_id))
                        logger.info(f"Orden {order_id} marcada como pagada")
                
                self.send_response(200)
                self.end_headers()
            except Exception as e:
                logger.error(f"Error procesando webhook: {str(e)}")
                self.send_response(200)  # Siempre responder 200 a MercadoPago
                self.end_headers()
                
        elif path.startswith('/api/tables/') and '/status' in path:
            # Update table status
            table_id = path.split('/')[3]
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                status = data.get('status')
                
                # Clear tables cache
                CACHE['tables'] = None
                
                self.send_json_response({
                    'success': True,
                    'table_id': table_id,
                    'status': status
                })
            except Exception as e:
                self.send_error_response(500, str(e))
                
        elif path.startswith('/api/orders/') and '/status' in path:
            # Update order status
            order_id = path.split('/')[3]
            self.send_json_response({'success': True, 'order_id': order_id})
        
        elif path.startswith('/api/area-settings/'):
            # Guardar configuración de área
            area_id = path.split('/')[-1]
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                area_id = int(area_id)
                data = json.loads(post_data)
                company_id = data.get('company_id', 1)
                
                result = self.save_area_settings(area_id, data, company_id)
                self.send_json_response(result)
                
            except ValueError:
                self.send_error_response(400, "ID de área inválido")
            except json.JSONDecodeError:
                self.send_error_response(400, "JSON inválido")
            except Exception as e:
                logger.error(f"Error guardando configuración del área: {e}")
                self.send_error_response(500, str(e))
        
        elif path.startswith('/api/map-settings'):
            # Guardar configuración del mapa
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                company_id = data.get('company_id', 1)
                
                result = self.save_map_settings(data, company_id)
                self.send_json_response(result)
                
            except json.JSONDecodeError:
                self.send_error_response(400, "JSON inválido")
            except Exception as e:
                logger.error(f"Error guardando configuración del mapa: {e}")
                self.send_error_response(500, str(e))

        elif path == '/api/customers':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                customer_id = self.create_customer(data)
                
                # Obtener el cliente creado para retornarlo
                customer = self.get_customer_by_id(customer_id)
                self.send_json_response(customer)
                
            except json.JSONDecodeError:
                self.send_error_response(400, "JSON inválido")
            except Exception as e:
                logger.error(f"Error creando cliente: {e}")
                self.send_error_response(500, str(e))

        elif path == '/api/addresses':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                address_id = self.create_address(data)
                
                # Obtener la dirección creada para retornarla
                address = self.get_address_by_id(address_id)
                self.send_json_response(address)
                
            except json.JSONDecodeError:
                self.send_error_response(400, "JSON inválido")
            except Exception as e:
                logger.error(f"Error creando dirección: {e}")
                self.send_error_response(500, str(e))

        elif path == '/api/setup/fix-customers-schema':
            # Endpoint para recrear las tablas customers/addresses correctamente
            try:
                result = self.fix_customers_schema()
                self.send_json_response(result)
            except Exception as e:
                logger.error(f"Error arreglando schema de clientes: {e}")
                self.send_error_response(500, str(e))
                
        elif path == '/api/setup/create-kitchen-queue-table':
            # Endpoint para crear la tabla mejorada de kitchen_queue
            try:
                result = self.create_kitchen_queue_table()
                self.send_json_response(result)
            except Exception as e:
                logger.error(f"Error creando tabla kitchen_queue: {e}")
                self.send_error_response(500, str(e))
                
        elif path == '/api/setup/create-test-orders':
            # Endpoint para crear pedidos de prueba
            try:
                result = self.create_test_orders()
                self.send_json_response(result)
            except Exception as e:
                logger.error(f"Error creando pedidos de prueba: {e}")
                self.send_error_response(500, str(e))
                
        elif path == '/api/setup/add-missing-columns':
            # Endpoint para agregar columnas faltantes
            try:
                result = self.add_missing_columns()
                self.send_json_response(result)
            except Exception as e:
                logger.error(f"Error agregando columnas: {e}")
                self.send_error_response(500, str(e))
                
        elif path == '/api/debug/database-structure':
            # Endpoint para analizar la estructura completa de la BD
            try:
                result = self.analyze_database_structure()
                self.send_json_response(result)
            except Exception as e:
                logger.error(f"Error analizando estructura de BD: {e}")
                self.send_error_response(500, str(e))
            
        else:
            self.send_error(404)
    
    def do_PUT(self):
        """Handle PUT requests"""
        path = urlparse(self.path).path
        
        # Update customer
        if path.startswith('/api/customers/') and not path.endswith('/addresses'):
            try:
                customer_id = int(path.split('/')[-1])
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                
                self.update_customer(customer_id, data)
                customer = self.get_customer_by_id(customer_id)
                self.send_json_response(customer)
                
            except json.JSONDecodeError:
                self.send_error_response(400, "JSON inválido")
            except Exception as e:
                logger.error(f"Error actualizando cliente: {e}")
                self.send_error_response(500, str(e))
                
        # Update address
        elif path.startswith('/api/addresses/'):
            try:
                address_id = int(path.split('/')[-1])
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                
                self.update_address(address_id, data)
                address = self.get_address_by_id(address_id)
                self.send_json_response(address)
                
            except json.JSONDecodeError:
                self.send_error_response(400, "JSON inválido")
            except Exception as e:
                logger.error(f"Error actualizando dirección: {e}")
                self.send_error_response(500, str(e))
        
        elif path.startswith('/api/tables/'):
            # Update table position and properties
            try:
                table_id = path.split('/')[-1]
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length).decode('utf-8')
                table_data = json.loads(post_data)
                
                # Update table in database
                connection = None
                cursor = None
                try:
                    connection = connection_pool.get_connection()
                    cursor = connection.cursor()
                    
                    # Update table position and properties
                    query = """
                    UPDATE tables 
                    SET x = %s, y = %s, width = %s, height = %s, 
                        rotation = %s, shape = %s, capacity = %s,
                        status = %s, number = %s
                    WHERE id = %s
                    """
                    params = (
                        table_data.get('x', 100),
                        table_data.get('y', 100),
                        table_data.get('width', 80),
                        table_data.get('height', 80),
                        table_data.get('rotation', 0),
                        table_data.get('shape', 'square'),
                        table_data.get('capacity', 4),
                        table_data.get('status', 'available'),
                        table_data.get('number'),
                        table_id
                    )
                    cursor.execute(query, params)
                    connection.commit()
                    
                    # Clear cache
                    CACHE['tables'] = None
                    
                    self.send_json_response({'success': True, 'table_id': table_id})
                    
                finally:
                    if cursor: cursor.close()
                    if connection: connection.close()
                    
            except Exception as e:
                logger.error(f"Error actualizando mesa: {e}")
                self.send_error_response(500, str(e))
                
        elif path.startswith('/api/kitchen/queue/'):
            # Actualizar estado de item en cola de cocina
            try:
                item_id = int(path.split('/')[-1])
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                
                success = self.update_kitchen_queue_item(item_id, data.get('status'))
                if success:
                    self.send_json_response({'success': True})
                else:
                    self.send_error_response(500, 'Error actualizando item')
                    
            except Exception as e:
                logger.error(f"Error actualizando item de cocina: {e}")
                self.send_error_response(500, str(e))
                
        elif path.startswith('/api/products/'):
            # Update product
            product_id = path.split('/')[-1]
            self.send_json_response({'success': True, 'product_id': product_id})
        elif path == '/api/company/settings':
            # Update company settings
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length).decode('utf-8')
                settings_data = json.loads(post_data)
                
                success = self.update_company_settings(settings_data)
                if success:
                    self.send_json_response({'success': True, 'message': 'Configuraciones actualizadas exitosamente'})
                else:
                    self.send_error_response(500, 'Error actualizando configuraciones')
            except Exception as e:
                logger.error(f"Error actualizando configuración de empresa: {e}")
                self.send_error_response(500, str(e))
        else:
            self.send_error(404)
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        path = urlparse(self.path).path
        
        if path.startswith('/api/addresses/'):
            # Delete address
            try:
                address_id = int(path.split('/')[-1])
                self.delete_address(address_id)
                self.send_json_response({'success': True})
            except Exception as e:
                logger.error(f"Error eliminando dirección: {e}")
                self.send_error_response(500, str(e))
                
        elif path.startswith('/api/products/'):
            # Delete product
            product_id = path.split('/')[-1]
            self.send_json_response({'success': True, 'deleted': product_id})
        else:
            self.send_error(404)
    
    # Data fetching methods with realistic data structure
    def get_categories_data(self):
        """Get categories from MySQL database ONLY"""
        query = """
        SELECT id, name, icon, color, sort_order, is_active
        FROM categories 
        WHERE is_active = 1
        ORDER BY sort_order ASC, name ASC
        """
        
        result = execute_mysql_query_with_recovery(query)
        if result is not None:
            return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener categorías")
    
    def get_subcategories_data(self, category_id):
        """Get subcategories from MySQL database ONLY"""
        if not category_id:
            # Si no hay category_id, devolver TODAS las subcategorías activas
            query = """
            SELECT id, name, category_id, sort_order, is_active, icon
            FROM subcategories 
            WHERE is_active = 1
            ORDER BY category_id, sort_order ASC, name ASC
            """
            result = execute_mysql_query_with_recovery(query, None)
        else:
            query = """
            SELECT id, name, category_id, sort_order, is_active, icon
            FROM subcategories 
            WHERE category_id = %s AND is_active = 1
            ORDER BY sort_order ASC, name ASC
            """
            result = execute_mysql_query_with_recovery(query, (category_id,))
        
        if result is not None:
            return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener subcategorías")
    
    def get_products_data(self, category_id, subcategory_id):
        """Get products from MySQL database ONLY"""
        query = """
        SELECT id, name, price, category_id, subcategory_id, 
               description, available, image_url, image_filename
        FROM products 
        WHERE available = 1
        """
        params = []
        
        if category_id:
            query += " AND category_id = %s"
            params.append(category_id)
            
        if subcategory_id:
            query += " AND subcategory_id = %s"
            params.append(subcategory_id)
            
        query += " ORDER BY name ASC"
        
        result = execute_mysql_query_with_recovery(query, params if params else None)
        if result is not None:
            # Transformar URLs de imágenes
            for product in result:
                if product.get('image_url'):
                    # Si es una URL de Pexels, ya está convertida a nombre de archivo
                    if not product['image_url'].startswith('http'):
                        # Es un nombre de archivo local
                        product['image_url'] = f"http://172.29.228.80:9002/static/products/{product['image_url']}"
            return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener productos")
    
    def get_single_product(self, product_id):
        """Get single product by ID from MySQL database ONLY"""
        query = """
        SELECT id, name, price, category_id, subcategory_id, 
               description, available, image_url, image_filename
        FROM products 
        WHERE id = %s AND available = 1
        """
        
        result = execute_mysql_query_with_recovery(query, (product_id,))
        if result is not None and len(result) > 0:
            product = result[0]
            # Transformar URL de imagen
            if product.get('image_url'):
                if not product['image_url'].startswith('http'):
                    product['image_url'] = f"http://172.29.228.80:9001/static/products/{product['image_url']}"
            return product
        elif result is not None and len(result) == 0:
            return None
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener producto")
    
    def get_tables_data(self):
        """Get restaurant tables from MySQL database ONLY"""
        query = """
        SELECT id, number, capacity, location, status,
               x, y, width, height, rotation, shape
        FROM tables 
        ORDER BY number ASC
        """
        
        result = execute_mysql_query_with_recovery(query)
        if result is not None:
            return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener mesas")
    
    def get_kitchen_queue(self):
        """Get all items in kitchen queue for drag-and-drop interface"""
        try:
            query = """
            SELECT 
                kq.id,
                kq.order_id,
                kq.order_item_id,
                kq.product_name,
                kq.quantity,
                kq.station,
                kq.status,
                kq.special_instructions,
                kq.table_number,
                kq.waiter_name,
                kq.created_at,
                kq.started_at,
                TIMESTAMPDIFF(MINUTE, kq.created_at, NOW()) as waiting_minutes,
                CASE 
                    WHEN kq.started_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, kq.started_at, NOW()) 
                    ELSE 0 
                END as cooking_minutes
            FROM kitchen_queue_items kq
            WHERE kq.status NOT IN ('cancelled')
            ORDER BY kq.created_at ASC
            """
            
            result = execute_mysql_query_with_recovery(query)
            if result is not None:
                items = []
                for row in result:
                    items.append({
                        'id': row[0],
                        'order_id': row[1],
                        'order_item_id': row[2],
                        'product_name': row[3],
                        'quantity': row[4],
                        'station': row[5],
                        'status': row[6],
                        'special_instructions': row[7],
                        'table_number': row[8],
                        'waiter_name': row[9],
                        'created_at': str(row[10]) if row[10] else None,
                        'started_at': str(row[11]) if row[11] else None,
                        'waiting_minutes': row[12],
                        'cooking_minutes': row[13]
                    })
                return items
            return []
        except Exception as e:
            logger.error(f"Error getting kitchen queue: {e}")
            return []
    
    def get_kitchen_orders(self):
        """Get kitchen orders from the new kitchen_queue_items table"""
        try:
            # Obtener items de la cola de cocina agrupados por orden
            query = """
            SELECT 
                kq.id,
                kq.order_id,
                kq.order_item_id,
                kq.table_number,
                kq.product_name,
                kq.quantity,
                kq.station,
                kq.status,
                kq.priority,
                kq.special_instructions,
                kq.waiter_name,
                kq.created_at,
                kq.started_at,
                kq.estimated_minutes,
                TIMESTAMPDIFF(MINUTE, kq.created_at, NOW()) as waiting_minutes,
                CASE 
                    WHEN kq.started_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, kq.started_at, NOW()) 
                    ELSE 0 
                END as cooking_minutes,
                CASE
                    WHEN kq.status = 'delayed' THEN 'red'
                    WHEN TIMESTAMPDIFF(MINUTE, kq.created_at, NOW()) > kq.estimated_minutes THEN 'yellow'
                    ELSE 'green'
                END as alert_color
            FROM kitchen_queue_items kq
            WHERE kq.status NOT IN ('delivered', 'cancelled')
            ORDER BY 
                FIELD(kq.priority, 'vip', 'rush', 'normal'),
                kq.order_id,
                kq.created_at ASC
            """
            
            result = execute_mysql_query_with_recovery(query)
            if not result:
                return []
            
            # Agrupar por orden
            orders_dict = {}
            for item in result:
                order_id = item['order_id']
                
                if order_id not in orders_dict:
                    orders_dict[order_id] = {
                        "id": order_id,
                        "table_number": item['table_number'],
                        "waiter": item['waiter_name'] or 'Sin asignar',
                        "priority": item['priority'],
                        "created_at": item['created_at'].isoformat() if hasattr(item['created_at'], 'isoformat') else str(item['created_at']),
                        "items": []
                    }
                
                orders_dict[order_id]["items"].append({
                    "id": item['id'],
                    "item_id": item['order_item_id'],
                    "name": item['product_name'],
                    "quantity": item['quantity'],
                    "station": item['station'],
                    "status": item['status'],
                    "special_instructions": item['special_instructions'],
                    "waiting_minutes": item['waiting_minutes'],
                    "cooking_minutes": item['cooking_minutes'],
                    "estimated_minutes": item['estimated_minutes'],
                    "alert_color": item['alert_color'],
                    "started_at": item['started_at'].isoformat() if item['started_at'] else None
                })
            
            return list(orders_dict.values())
            
        except Exception as e:
            print(f"Error en get_kitchen_orders: {str(e)}")
            # Retornar datos de ejemplo para que no falle
            return [{
                "id": 1,
                "table_number": 1,
                "status": "pending",
                "ordered_at": "2024-01-15T12:00:00",
                "waiter": "Demo",
                "items": [
                    {
                        "id": 1,
                        "product_name": "Hamburguesa Clásica",
                        "quantity": 2,
                        "status": "pending",
                        "notes": ""
                    }
                ]
            }]
    
    def get_customers_data(self, search):
        """Get customers from MySQL database ONLY"""
        if not search:
            # Si no hay búsqueda, retornar todos los clientes activos
            query = """
            SELECT id, first_name, last_name, email, phone, loyalty_points, 
                   total_visits, total_spent, is_active, created_at, updated_at
            FROM customers 
            WHERE is_active = 1
            ORDER BY first_name ASC, last_name ASC
            LIMIT 50
            """
            result = execute_mysql_query_with_recovery(query, None)
            if result is not None:
                return result
        else:
            # Si hay búsqueda, filtrar por criterio
            query = """
            SELECT id, first_name, last_name, email, phone, loyalty_points,
                   total_visits, total_spent, is_active, created_at, updated_at
            FROM customers 
            WHERE is_active = 1 AND (
                CONCAT(first_name, ' ', last_name) LIKE %s OR 
                phone LIKE %s OR 
                email LIKE %s
            )
            ORDER BY first_name ASC, last_name ASC
            LIMIT 10
            """
            
            search_pattern = f"%{search}%"
            result = execute_mysql_query_with_recovery(query, (search_pattern, search_pattern, search_pattern))
            if result is not None:
                return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener clientes")
    
    def create_order(self, order_data):
        """Create new order in MySQL database"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            
            # Insertar orden principal
            query = """
            INSERT INTO orders (
                table_number, customer_id, waiter_id, 
                status, payment_status, 
                subtotal, tax, total, 
                notes, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """
            
            params = (
                order_data.get('table_number'),
                order_data.get('customer_id'),
                1,  # waiter_id por defecto
                order_data.get('status', 'pending'),
                order_data.get('payment_status', 'pending'),
                order_data.get('subtotal', 0),
                order_data.get('tax', 0),
                order_data.get('total', 0),
                order_data.get('notes', '')
            )
            
            cursor.execute(query, params)
            order_id = cursor.lastrowid
            
            # Insertar items de la orden
            for item in order_data.get('items', []):
                product = item.get('product', {})
                quantity = item.get('quantity', 1)
                price = product.get('price', 0)
                
                item_query = """
                INSERT INTO order_items (
                    order_id, product_id, quantity, 
                    price, notes
                ) VALUES (%s, %s, %s, %s, %s)
                """
                
                item_params = (
                    order_id,
                    product.get('id'),
                    quantity,
                    price,
                    item.get('notes', '')
                )
                
                cursor.execute(item_query, item_params)
            
            connection.commit()
            return order_id
            
        except Exception as e:
            logger.error(f"Error creando orden: {e}")
            if connection:
                connection.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def get_company_settings(self):
        """Get company settings from MySQL database ONLY"""
        query = """
        SELECT cs.*, c.name as company_name
        FROM company_settings cs
        LEFT JOIN companies c ON cs.company_id = c.id
        WHERE cs.company_id = 1
        LIMIT 1
        """
        
        result = execute_mysql_query_with_recovery(query, None)
        if result is not None and len(result) > 0:
            settings = result[0]
            # Convertir a formato esperado por el frontend
            return {
                'currency_symbol': settings.get('currency_symbol', '$'),
                'currency_position': settings.get('currency_position', 'before'),
                'decimal_places': settings.get('decimal_places', 2),
                'tax_enabled': settings.get('tax_enabled', True),
                'tax_percentage': float(settings.get('tax_percentage', 21.0)),
                'tax_name': settings.get('tax_name', 'IVA'),
                'tax_included_in_price': settings.get('tax_included_in_price', False),
                'order_prefix': settings.get('order_prefix', 'ORD'),
                'order_number_length': settings.get('order_number_length', 6),
                'auto_print_kitchen': settings.get('auto_print_kitchen', True),
                'auto_print_receipt': settings.get('auto_print_receipt', False),
                'require_table_selection': settings.get('require_table_selection', True),
                'require_customer_info': settings.get('require_customer_info', False),
                'show_product_images': settings.get('show_product_images', True),
                'allow_out_of_stock_orders': settings.get('allow_out_of_stock_orders', False),
                'track_inventory': settings.get('track_inventory', True),
                'theme': settings.get('theme', 'light'),
                'primary_color': settings.get('primary_color', '#3B82F6'),
                'timezone': settings.get('timezone', 'America/Argentina/Buenos_Aires'),
                'language': settings.get('language', 'es'),
                'date_format': settings.get('date_format', 'DD/MM/YYYY'),
                'time_format': settings.get('time_format', '24h'),
                'company_name': settings.get('company_name', 'Gastro Premium')
            }
        else:
            # Devolver configuración por defecto si no existe
            return {
                'currency_symbol': '$',
                'currency_position': 'before',
                'decimal_places': 2,
                'tax_enabled': True,
                'tax_percentage': 21.0,
                'tax_name': 'IVA',
                'tax_included_in_price': False,
                'order_prefix': 'ORD',
                'order_number_length': 6,
                'auto_print_kitchen': True,
                'auto_print_receipt': False,
                'require_table_selection': True,
                'require_customer_info': False,
                'show_product_images': True,
                'allow_out_of_stock_orders': False,
                'track_inventory': True,
                'theme': 'light',
                'primary_color': '#3B82F6',
                'timezone': 'America/Argentina/Buenos_Aires',
                'language': 'es',
                'date_format': 'DD/MM/YYYY',
                'time_format': '24h',
                'company_name': 'Gastro Premium'
            }
    
    def update_company_settings(self, settings_data):
        """Update company settings in MySQL database"""
        try:
            # Lista de campos que se pueden actualizar (basada en la estructura real de la tabla)
            allowed_fields = [
                # Configuraciones generales
                'currency_symbol', 'currency_position', 'decimal_places', 'thousand_separator', 'decimal_separator',
                # Impuestos
                'tax_enabled', 'tax_percentage', 'tax_name', 'tax_included_in_price',
                # Pedidos
                'order_prefix', 'order_number_length', 'auto_print_kitchen', 'auto_print_receipt', 
                'require_table_selection', 'require_customer_info',
                # Mesas
                'table_auto_available_after_payment', 'table_reservation_enabled', 'table_reservation_max_hours',
                # Productos
                'show_product_images', 'allow_out_of_stock_orders', 'track_inventory', 'low_stock_alert_threshold',
                # Interfaz
                'theme', 'primary_color', 'secondary_color', 'logo_position', 'show_company_name',
                # Horario
                'timezone', 'opening_time', 'closing_time', 'working_days',
                # Notificaciones
                'email_notifications_enabled', 'sms_notifications_enabled', 'notification_email', 'notification_phone',
                # Pagos
                'cash_enabled', 'card_enabled', 'digital_wallet_enabled', 'allow_partial_payments',
                'tip_enabled', 'tip_suggestions',
                # Delivery
                'delivery_enabled', 'delivery_fee', 'minimum_delivery_order', 'delivery_radius_km',
                # Descuentos
                'allow_manual_discounts', 'max_discount_percentage', 'require_manager_approval_discount',
                # Empleados
                'employee_clock_in_required', 'track_employee_sales', 'commission_enabled', 'commission_percentage',
                # Reportes
                'daily_report_auto_send', 'daily_report_time', 'weekly_report_enabled', 'monthly_report_enabled',
                # Idioma y región
                'language', 'date_format', 'time_format'
            ]
            
            # Filtrar solo los campos permitidos que están en los datos
            update_fields = []
            update_values = []
            
            for field in allowed_fields:
                if field in settings_data:
                    update_fields.append(f"{field} = %s")
                    # Convertir booleanos a enteros para MySQL
                    value = settings_data[field]
                    if isinstance(value, bool):
                        value = 1 if value else 0
                    update_values.append(value)
            
            if not update_fields:
                return True  # No hay nada que actualizar
            
            # Agregar company_id al final
            update_values.append(1)  # company_id = 1
            
            query = f"""
            UPDATE company_settings 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE company_id = %s
            """
            
            result = execute_mysql_query_with_recovery(query, update_values)
            
            # Si no se actualizó ninguna fila, puede ser que no exista el registro
            # En ese caso, crear uno nuevo
            if result is not None:
                return True
            else:
                # Intentar crear el registro si no existe
                return self.create_company_settings(settings_data)
                
        except Exception as e:
            logger.error(f"Error actualizando configuraciones de empresa: {e}")
            return False
    
    def create_company_settings(self, settings_data):
        """Create company settings record if it doesn't exist"""
        try:
            # Valores por defecto
            defaults = {
                'currency_symbol': '$',
                'currency_position': 'before',
                'decimal_places': 2,
                'tax_enabled': True,
                'tax_percentage': 21.0,
                'tax_name': 'IVA',
                'tax_included_in_price': False,
                'order_prefix': 'ORD',
                'order_number_length': 6,
                'auto_print_kitchen': True,
                'auto_print_receipt': False,
                'require_table_selection': True,
                'require_customer_info': False,
                'show_product_images': True,
                'allow_out_of_stock_orders': False,
                'track_inventory': True,
                'theme': 'light',
                'primary_color': '#3B82F6',
                'timezone': 'America/Argentina/Buenos_Aires',
                'language': 'es',
                'date_format': 'DD/MM/YYYY',
                'time_format': '24h'
            }
            
            # Combinar valores por defecto con los datos recibidos
            final_data = {**defaults, **settings_data}
            
            # Convertir booleanos a enteros
            for key, value in final_data.items():
                if isinstance(value, bool):
                    final_data[key] = 1 if value else 0
            
            fields = list(final_data.keys())
            values = list(final_data.values())
            values.append(1)  # company_id
            
            placeholders = ', '.join(['%s'] * len(fields))
            field_names = ', '.join(fields)
            
            query = f"""
            INSERT INTO company_settings 
            ({field_names}, company_id, created_at, updated_at)
            VALUES ({placeholders}, %s, NOW(), NOW())
            """
            
            result = execute_mysql_query_with_recovery(query, values)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error creando configuraciones de empresa: {e}")
            return False
    
    def fix_company_settings_table(self):
        """Add missing columns to company_settings table"""
        try:
            # Primero verificar qué columnas existen
            check_query = "SHOW COLUMNS FROM company_settings"
            existing_columns = execute_mysql_query_with_recovery(check_query)
            existing_column_names = [col['Field'] for col in existing_columns] if existing_columns else []
            
            # Definir las columnas que queremos agregar
            columns_to_add = [
                ("thousand_separator", "VARCHAR(5) DEFAULT ','"),
                ("decimal_separator", "VARCHAR(5) DEFAULT '.'"),
                ("date_format", "VARCHAR(20) DEFAULT 'DD/MM/YYYY'"),
                ("time_format", "ENUM('12h', '24h') DEFAULT '24h'"),
                ("table_auto_available_after_payment", "BOOLEAN DEFAULT TRUE"),
                ("table_reservation_enabled", "BOOLEAN DEFAULT TRUE"),
                ("table_reservation_max_hours", "INT DEFAULT 2"),
                ("low_stock_alert_threshold", "INT DEFAULT 10"),
                ("secondary_color", "VARCHAR(7) DEFAULT '#10B981'"),
                ("logo_position", "ENUM('left', 'center', 'right') DEFAULT 'left'"),
                ("show_company_name", "BOOLEAN DEFAULT TRUE"),
                ("opening_time", "TIME DEFAULT '08:00:00'"),
                ("closing_time", "TIME DEFAULT '23:00:00'"),
                ("working_days", "JSON DEFAULT '[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]'")
            ]
            
            results = []
            results.append(f"📋 Columnas existentes: {existing_column_names}")
            
            for column_name, column_definition in columns_to_add:
                if column_name not in existing_column_names:
                    try:
                        query = f"ALTER TABLE company_settings ADD COLUMN {column_name} {column_definition}"
                        execute_mysql_query_with_recovery(query)
                        results.append(f"✅ Agregada columna: {column_name}")
                    except Exception as e:
                        results.append(f"❌ Error agregando {column_name}: {str(e)}")
                else:
                    results.append(f"⏭️ Columna ya existe: {column_name}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error agregando columnas faltantes: {e}")
            raise
    
    def get_companies_data(self):
        """Get companies from MySQL database ONLY"""
        query = """
        SELECT id, name, email, phone, address, tax_id, logo_url, is_active,
               created_at, updated_at
        FROM companies 
        WHERE is_active = 1
        ORDER BY name ASC
        """
        
        result = execute_mysql_query_with_recovery(query, None)
        if result is not None:
            return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener empresas")
    
    def get_users_data(self):
        """Get users from MySQL database"""
        # Crear tabla si no existe
        create_query = """
        CREATE TABLE IF NOT EXISTS app_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            company_id INT NOT NULL DEFAULT 1,
            role_id INT NOT NULL DEFAULT 1,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
        execute_mysql_query_with_recovery(create_query, None)
        
        # Insertar datos por defecto si no existen
        insert_default = """
        INSERT IGNORE INTO app_users (username, email, password, full_name, company_id, role_id) 
        VALUES 
        ('admin', 'admin@gastro.com', 'admin123', 'Administrador', 1, 1),
        ('chef1', 'chef@gastro.com', 'chef123', 'Chef Principal', 1, 2),
        ('mozo1', 'mozo1@gastro.com', 'mozo123', 'Mozo 1', 1, 3)
        """
        execute_mysql_query_with_recovery(insert_default, None)
        
        query = """
        SELECT id, username, email, full_name, company_id, role_id, is_active,
               created_at, updated_at
        FROM app_users 
        WHERE is_active = 1
        ORDER BY full_name ASC
        """
        
        result = execute_mysql_query_with_recovery(query, None)
        if result is not None:
            return result
        
        raise Exception("No se puede acceder a la base de datos para obtener usuarios")
    
    def get_roles_data(self):
        """Get roles from MySQL database"""
        query = """
        SELECT id, name, description, permissions, created_at
        FROM roles 
        ORDER BY name ASC
        """
        
        result = execute_mysql_query_with_recovery(query, None)
        if result is not None:
            return result
        
        raise Exception("No se puede acceder a la base de datos para obtener roles")
    
    def get_areas_data(self):
        """Get areas from MySQL database"""
        # Crear tabla si no existe
        create_query = """
        CREATE TABLE IF NOT EXISTS areas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            capacity INT NOT NULL DEFAULT 0,
            outdoor TINYINT(1) DEFAULT 0,
            color VARCHAR(7) DEFAULT '#3B82F6',
            company_id INT NOT NULL DEFAULT 1,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
        execute_mysql_query_with_recovery(create_query, None)
        
        # Insertar datos por defecto si no existen
        insert_default = """
        INSERT IGNORE INTO areas (name, description, capacity, outdoor, color, company_id) 
        VALUES 
        ('Salón Principal', 'Área principal del restaurante', 50, 0, '#3B82F6', 1),
        ('Terraza', 'Área exterior con vista', 24, 1, '#10B981', 1),
        ('Salón VIP', 'Área exclusiva', 12, 0, '#8B5CF6', 1)
        """
        execute_mysql_query_with_recovery(insert_default, None)
        
        query = """
        SELECT id, name, description, capacity, outdoor, color, company_id, is_active,
               created_at, updated_at
        FROM areas 
        WHERE is_active = 1
        ORDER BY name ASC
        """
        
        result = execute_mysql_query_with_recovery(query, None)
        if result is not None:
            return result
        
        raise Exception("No se puede acceder a la base de datos para obtener areas")
    
    def get_addresses_data(self):
        """Get addresses from MySQL database"""
        query = """
        SELECT id, customer_id, company_id, address_type, street_address, city, 
               state_province, postal_code, country, is_default, is_active, 
               created_at, updated_at
        FROM addresses 
        WHERE is_active = 1
        ORDER BY customer_id ASC, is_default DESC
        """
        
        result = execute_mysql_query_with_recovery(query, None)
        if result is not None:
            return result
        
        raise Exception("No se puede acceder a la base de datos para obtener addresses")
    
    def search_customers(self, search_term):
        """Search customers by name or phone"""
        query = """
        SELECT id, first_name, last_name, email, phone, dni, 
               loyalty_points, total_visits, total_spent, notes
        FROM customers 
        WHERE is_active = 1 
        AND (LOWER(CONCAT(first_name, ' ', last_name)) LIKE %s 
             OR phone LIKE %s
             OR email LIKE %s)
        ORDER BY first_name, last_name
        LIMIT 10
        """
        
        search_pattern = f"%{search_term.lower()}%"
        params = (search_pattern, search_pattern, search_pattern)
        
        result = execute_mysql_query_with_recovery(query, params)
        if result is not None:
            return result
        
        raise Exception("No se puede buscar clientes")
    
    def get_customer_addresses(self, customer_id):
        """Get all addresses for a specific customer"""
        query = """
        SELECT id, customer_id, company_id, address_type, street_address, city, 
               state_province, postal_code, country, latitude, longitude,
               is_default, delivery_instructions, is_active
        FROM addresses 
        WHERE customer_id = %s AND is_active = 1
        ORDER BY is_default DESC, address_type
        """
        
        params = (customer_id,)
        result = execute_mysql_query_with_recovery(query, params)
        if result is not None:
            return result
        
        raise Exception(f"No se pueden obtener direcciones del cliente {customer_id}")
    
    def get_area_settings(self, area_id, company_id=1):
        """Get area settings from MySQL database"""
        query = """
        SELECT area_id, company_id, final_x_position, final_y_position, 
               zoom_level, grid_size, show_grid, background_color,
               created_at, updated_at
        FROM area_settings 
        WHERE area_id = %s AND company_id = %s
        """
        
        result = execute_mysql_query_with_recovery(query, (area_id, company_id))
        if result is not None:
            return result[0] if result else None
        
        raise Exception("No se puede acceder a la base de datos para obtener configuración del área")
    
    def save_area_settings(self, area_id, settings, company_id=1):
        """Save area settings to MySQL database"""
        query = """
        INSERT INTO area_settings 
        (area_id, company_id, final_x_position, final_y_position, zoom_level, 
         grid_size, show_grid, background_color)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        final_x_position = VALUES(final_x_position),
        final_y_position = VALUES(final_y_position),
        zoom_level = VALUES(zoom_level),
        grid_size = VALUES(grid_size),
        show_grid = VALUES(show_grid),
        background_color = VALUES(background_color),
        updated_at = CURRENT_TIMESTAMP
        """
        
        params = (
            area_id, company_id,
            settings.get('final_x_position', 0),
            settings.get('final_y_position', 0),
            settings.get('zoom_level', 1.0),
            settings.get('grid_size', 20),
            settings.get('show_grid', True),
            settings.get('background_color', '#F3F4F6')
        )
        
        result = execute_mysql_query_with_recovery(query, params)
        if result is not None:
            return {"success": True, "message": "Configuración del área guardada correctamente"}
        
        raise Exception("No se puede guardar la configuración del área en la base de datos")
    
    def get_map_settings(self, company_id=1):
        """Get map settings from MySQL database"""
        query = """
        SELECT company_id, map_x_position, map_y_position, global_zoom,
               grid_enabled, snap_to_grid, grid_color, canvas_width, canvas_height,
               auto_save, created_at, updated_at
        FROM map_settings 
        WHERE company_id = %s
        """
        
        result = execute_mysql_query_with_recovery(query, (company_id,))
        if result is not None:
            return result[0] if result else None
        
        raise Exception("No se puede acceder a la base de datos para obtener configuración del mapa")
    
    def save_map_settings(self, settings, company_id=1):
        """Save map settings to MySQL database"""
        query = """
        INSERT INTO map_settings 
        (company_id, map_x_position, map_y_position, global_zoom,
         grid_enabled, snap_to_grid, grid_color, canvas_width, canvas_height, auto_save)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        map_x_position = VALUES(map_x_position),
        map_y_position = VALUES(map_y_position),
        global_zoom = VALUES(global_zoom),
        grid_enabled = VALUES(grid_enabled),
        snap_to_grid = VALUES(snap_to_grid),
        grid_color = VALUES(grid_color),
        canvas_width = VALUES(canvas_width),
        canvas_height = VALUES(canvas_height),
        auto_save = VALUES(auto_save),
        updated_at = CURRENT_TIMESTAMP
        """
        
        params = (
            company_id,
            settings.get('map_x_position', 0),
            settings.get('map_y_position', 0),
            settings.get('global_zoom', 1.0),
            settings.get('grid_enabled', True),
            settings.get('snap_to_grid', True),
            settings.get('grid_color', '#E5E7EB'),
            settings.get('canvas_width', 1200),
            settings.get('canvas_height', 800),
            settings.get('auto_save', True)
        )
        
        result = execute_mysql_query_with_recovery(query, params)
        if result is not None:
            return {"success": True, "message": "Configuración del mapa guardada correctamente"}
        
        raise Exception("No se puede guardar la configuración del mapa en la base de datos")
    
    def get_sales_report(self, start_date=None, end_date=None):
        """Get sales report with key metrics"""
        # Por defecto, últimos 30 días
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            from datetime import timedelta
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Ventas totales
        sales_query = """
        SELECT 
            COUNT(DISTINCT o.id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_revenue,
            COALESCE(AVG(o.total_amount), 0) as avg_ticket,
            COUNT(DISTINCT DATE(o.created_at)) as days_with_sales
        FROM orders o
        WHERE o.status IN ('completed', 'paid')
        AND DATE(o.created_at) BETWEEN %s AND %s
        """
        
        sales_data = execute_mysql_query_with_recovery(sales_query, (start_date, end_date))
        
        # Ventas por día
        daily_sales_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders,
            COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE status IN ('completed', 'paid')
        AND DATE(created_at) BETWEEN %s AND %s
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
        """
        
        daily_sales = execute_mysql_query_with_recovery(daily_sales_query, (start_date, end_date))
        
        # Productos más vendidos
        top_products_query = """
        SELECT 
            p.name as product_name,
            c.name as category_name,
            COUNT(oi.id) as times_sold,
            SUM(oi.quantity) as quantity_sold,
            SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('completed', 'paid')
        AND DATE(o.created_at) BETWEEN %s AND %s
        GROUP BY p.id, p.name, c.name
        ORDER BY quantity_sold DESC
        LIMIT 10
        """
        
        top_products = execute_mysql_query_with_recovery(top_products_query, (start_date, end_date))
        
        # Categorías más vendidas
        category_sales_query = """
        SELECT 
            c.name as category_name,
            COUNT(DISTINCT oi.id) as items_sold,
            SUM(oi.quantity) as quantity_sold,
            SUM(oi.subtotal) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('completed', 'paid')
        AND DATE(o.created_at) BETWEEN %s AND %s
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        """
        
        category_sales = execute_mysql_query_with_recovery(category_sales_query, (start_date, end_date))
        
        return {
            'period': {'start_date': start_date, 'end_date': end_date},
            'summary': sales_data[0] if sales_data else {},
            'daily_sales': daily_sales or [],
            'top_products': top_products or [],
            'category_sales': category_sales or []
        }
    
    def get_table_metrics(self):
        """Get table occupancy and turnover metrics"""
        # Estado actual de las mesas
        table_status_query = """
        SELECT 
            status,
            COUNT(*) as count
        FROM tables
        GROUP BY status
        """
        
        table_status = execute_mysql_query_with_recovery(table_status_query, None)
        
        # Rotación de mesas (últimas 24 horas)
        turnover_query = """
        SELECT 
            t.number as table_number,
            t.capacity,
            COUNT(DISTINCT o.id) as orders_count,
            COALESCE(AVG(TIMESTAMPDIFF(MINUTE, o.created_at, o.updated_at)), 0) as avg_duration_minutes
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id 
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY t.id, t.number, t.capacity
        ORDER BY orders_count DESC
        """
        
        table_turnover = execute_mysql_query_with_recovery(turnover_query, None)
        
        # Ocupación por hora del día (última semana)
        hourly_occupancy_query = """
        SELECT 
            HOUR(o.created_at) as hour,
            COUNT(DISTINCT o.table_id) as tables_occupied,
            COUNT(DISTINCT o.id) as orders_count
        FROM orders o
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY HOUR(o.created_at)
        ORDER BY hour
        """
        
        hourly_occupancy = execute_mysql_query_with_recovery(hourly_occupancy_query, None)
        
        return {
            'table_status': table_status or [],
            'table_turnover': table_turnover or [],
            'hourly_occupancy': hourly_occupancy or []
        }
    
    def get_customer_metrics(self):
        """Get customer metrics and loyalty data"""
        # Resumen de clientes
        customer_summary_query = """
        SELECT 
            COUNT(*) as total_customers,
            COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_customers,
            AVG(loyalty_points) as avg_loyalty_points,
            AVG(total_visits) as avg_visits,
            AVG(total_spent) as avg_spent
        FROM customers
        """
        
        customer_summary = execute_mysql_query_with_recovery(customer_summary_query, None)
        
        # Top clientes
        top_customers_query = """
        SELECT 
            CONCAT(first_name, ' ', last_name) as name,
            email,
            loyalty_points,
            total_visits,
            total_spent,
            CASE 
                WHEN total_visits >= 20 THEN 'VIP'
                WHEN total_visits >= 10 THEN 'Frequent'
                WHEN total_visits >= 5 THEN 'Regular'
                ELSE 'New'
            END as customer_type
        FROM customers
        WHERE is_active = 1
        ORDER BY total_spent DESC
        LIMIT 10
        """
        
        top_customers = execute_mysql_query_with_recovery(top_customers_query, None)
        
        # Distribución de clientes por tipo
        customer_distribution_query = """
        SELECT 
            CASE 
                WHEN total_visits >= 20 THEN 'VIP'
                WHEN total_visits >= 10 THEN 'Frequent'
                WHEN total_visits >= 5 THEN 'Regular'
                ELSE 'New'
            END as customer_type,
            COUNT(*) as count,
            AVG(total_spent) as avg_spent
        FROM customers
        WHERE is_active = 1
        GROUP BY customer_type
        ORDER BY avg_spent DESC
        """
        
        customer_distribution = execute_mysql_query_with_recovery(customer_distribution_query, None)
        
        return {
            'summary': customer_summary[0] if customer_summary else {},
            'top_customers': top_customers or [],
            'customer_distribution': customer_distribution or []
        }
    
    def get_inventory_metrics(self):
        """Get inventory and product metrics"""
        # Productos con bajo stock
        low_stock_query = """
        SELECT 
            p.name as product_name,
            c.name as category_name,
            p.stock_quantity,
            p.min_stock,
            p.unit,
            CASE 
                WHEN p.stock_quantity <= 0 THEN 'Out of Stock'
                WHEN p.stock_quantity <= p.min_stock THEN 'Low Stock'
                ELSE 'OK'
            END as stock_status
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.stock_quantity <= p.min_stock * 1.5
        AND p.is_active = 1
        ORDER BY p.stock_quantity ASC
        """
        
        low_stock = execute_mysql_query_with_recovery(low_stock_query, None)
        
        # Valor del inventario
        inventory_value_query = """
        SELECT 
            c.name as category_name,
            COUNT(p.id) as product_count,
            SUM(p.stock_quantity * p.price) as inventory_value,
            AVG(p.stock_quantity) as avg_stock
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        GROUP BY c.id, c.name
        ORDER BY inventory_value DESC
        """
        
        inventory_value = execute_mysql_query_with_recovery(inventory_value_query, None)
        
        # Rotación de inventario (últimos 30 días)
        inventory_turnover_query = """
        SELECT 
            p.name as product_name,
            p.stock_quantity as current_stock,
            COALESCE(SUM(oi.quantity), 0) as quantity_sold,
            CASE 
                WHEN p.stock_quantity > 0 
                THEN ROUND(COALESCE(SUM(oi.quantity), 0) / p.stock_quantity, 2)
                ELSE 0
            END as turnover_rate
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND o.status IN ('completed', 'paid')
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, p.stock_quantity
        ORDER BY turnover_rate DESC
        LIMIT 20
        """
        
        inventory_turnover = execute_mysql_query_with_recovery(inventory_turnover_query, None)
        
        return {
            'low_stock_items': low_stock or [],
            'inventory_value': inventory_value or [],
            'inventory_turnover': inventory_turnover or []
        }
    
    def get_performance_metrics(self):
        """Get restaurant performance KPIs"""
        # KPIs principales
        kpis_query = """
        SELECT 
            (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as orders_today,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status IN ('completed', 'paid')) as revenue_today,
            (SELECT COUNT(*) FROM tables WHERE status = 'occupied') as tables_occupied,
            (SELECT COUNT(*) FROM tables) as total_tables,
            (SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) FROM orders WHERE status = 'completed' AND DATE(created_at) = CURDATE()) as avg_order_time,
            (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE DATE(created_at) = CURDATE()) as unique_customers_today
        """
        
        kpis = execute_mysql_query_with_recovery(kpis_query, None)
        
        # Comparación con período anterior
        comparison_query = """
        SELECT 
            'current_week' as period,
            COUNT(*) as orders,
            COALESCE(SUM(total_amount), 0) as revenue,
            COALESCE(AVG(total_amount), 0) as avg_ticket
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status IN ('completed', 'paid')
        UNION ALL
        SELECT 
            'previous_week' as period,
            COUNT(*) as orders,
            COALESCE(SUM(total_amount), 0) as revenue,
            COALESCE(AVG(total_amount), 0) as avg_ticket
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status IN ('completed', 'paid')
        """
        
        comparison = execute_mysql_query_with_recovery(comparison_query, None)
        
        return {
            'current_kpis': kpis[0] if kpis else {},
            'period_comparison': comparison or []
        }
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps(data, cls=DecimalEncoder).encode())
    
    def send_error_response(self, code, message):
        """Send error response"""
        self.send_response(code)
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())
    
    def serve_static_file(self, path):
        """Serve static image files"""
        # Construir ruta completa del archivo
        file_path = os.path.join(os.path.dirname(__file__), path.lstrip('/'))
        
        print(f"DEBUG: Intentando servir archivo: {file_path}")
        
        # Verificar que el archivo existe
        if not os.path.exists(file_path):
            print(f"DEBUG: Archivo no existe: {file_path}")
            self.send_error(404)
            return
        
        if not os.path.isfile(file_path):
            print(f"DEBUG: No es un archivo: {file_path}")
            self.send_error(404)
            return
        
        # Obtener tipo MIME
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Enviar archivo
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                self.send_response(200)
                # NO agregar CORS aquí porque end_headers() ya lo hace
                self.send_header('Content-Type', mime_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Cache-Control', 'public, max-age=3600')  # Cache por 1 hora
                # end_headers() agregará los CORS automáticamente
                self.end_headers()
                self.wfile.write(content)
        except Exception as e:
            print(f"Error sirviendo archivo estático: {e}")
            self.send_error(500)

    def create_customer(self, data):
        """Crear un nuevo cliente"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            query = """
                INSERT INTO customers (first_name, last_name, phone, email, dni, notes, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """
            
            cursor.execute(query, (
                data.get('first_name', ''),
                data.get('last_name', ''),
                data.get('phone'),
                data.get('email'),
                data.get('dni'),
                data.get('notes')
            ))
            
            connection.commit()
            return cursor.lastrowid

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def create_kitchen_queue_item(self, data):
        """Crear un nuevo item en la cola de cocina"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            
            # Determinar la estación basándose en el producto
            station = data.get('station', 'general')
            
            query = """
            INSERT INTO kitchen_queue_items (
                order_id, order_item_id, product_name, quantity,
                station, status, special_instructions,
                table_number, waiter_name, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """
            
            params = (
                data['order_id'],
                data['order_item_id'],
                data['product_name'],
                data.get('quantity', 1),
                station,
                data.get('status', 'viewed'),
                data.get('special_instructions'),
                data['table_number'],
                data.get('waiter_name', 'Sin asignar')
            )
            
            cursor.execute(query, params)
            connection.commit()
            
            return cursor.lastrowid
            
        except Exception as e:
            logger.error(f"Error creando item en cola de cocina: {e}")
            if connection:
                connection.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def update_kitchen_queue_item(self, item_id, new_status):
        """Actualizar el estado de un item en la cola de cocina"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            
            # Actualizar estado y tiempos según el nuevo estado
            if new_status == 'preparing':
                query = """
                UPDATE kitchen_queue_items 
                SET status = %s, started_at = NOW() 
                WHERE id = %s
                """
            elif new_status == 'ready':
                query = """
                UPDATE kitchen_queue_items 
                SET status = %s, ready_at = NOW() 
                WHERE id = %s
                """
            elif new_status == 'delivered':
                query = """
                UPDATE kitchen_queue_items 
                SET status = %s, delivered_at = NOW() 
                WHERE id = %s
                """
            else:
                query = """
                UPDATE kitchen_queue_items 
                SET status = %s 
                WHERE id = %s
                """
            
            cursor.execute(query, (new_status, item_id))
            connection.commit()
            
            return cursor.rowcount > 0
            
        except Exception as e:
            logger.error(f"Error actualizando item en cola de cocina: {e}")
            if connection:
                connection.rollback()
            return False
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def update_customer(self, customer_id, data):
        """Actualizar un cliente existente"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            query = """
                UPDATE customers 
                SET first_name = %s, last_name = %s, phone = %s, 
                    email = %s, dni = %s, notes = %s
                WHERE id = %s
            """
            
            cursor.execute(query, (
                data.get('first_name', ''),
                data.get('last_name', ''),
                data.get('phone'),
                data.get('email'),
                data.get('dni'),
                data.get('notes'),
                customer_id
            ))
            
            connection.commit()
            return True
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def update_address(self, address_id, data):
        """Actualizar una dirección existente"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            query = """
                UPDATE addresses 
                SET address_type = %s, street_address = %s, city = %s,
                    state_province = %s, postal_code = %s, country = %s,
                    latitude = %s, longitude = %s, is_default = %s,
                    delivery_instructions = %s, formatted_address = %s
                WHERE id = %s
            """
            
            cursor.execute(query, (
                data.get('address_type', 'home'),
                data.get('street_address', ''),
                data.get('city', ''),
                data.get('state_province'),
                data.get('postal_code'),
                data.get('country', 'Argentina'),
                data.get('latitude'),
                data.get('longitude'),
                data.get('is_default', False),
                data.get('delivery_instructions'),
                data.get('formatted_address'),
                address_id
            ))
            
            connection.commit()
            return True
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def create_address(self, data):
        """Crear una nueva dirección"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            query = """
                INSERT INTO addresses (customer_id, address_type, street_address, city, 
                       state_province, postal_code, country, latitude, longitude, 
                       is_default, delivery_instructions, formatted_address, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """
            
            cursor.execute(query, (
                data.get('customer_id'),
                data.get('address_type', 'home'),
                data.get('street_address', ''),
                data.get('city', ''),
                data.get('state_province'),
                data.get('postal_code'),
                data.get('country'),
                data.get('latitude'),
                data.get('longitude'),
                data.get('is_default', False),
                data.get('delivery_instructions'),
                data.get('formatted_address')
            ))
            
            connection.commit()
            return cursor.lastrowid

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def interpret_user_intent_with_ai_persistent(self, user_message, thread_id, context=None):
        """Interpretar intención usando contexto persistente (como ChatGPT)"""
        try:
            import google.generativeai as genai
            
            # Configurar Gemini si no está configurado
            if not hasattr(self, '_genai_configured'):
                genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
                self._genai_configured = True
            
            # Obtener thread con contexto persistente
            thread = conversation_threads.get(thread_id)
            if not thread or not thread['context_initialized']:
                raise Exception(f"Thread {thread_id} no inicializado")
            
            # Obtener contexto del usuario
            selected_food = context.get('selectedFood') if context else None
            selected_pairing = context.get('selectedPairing') if context else None
            
            context_info = ""
            if selected_food:
                context_info += f"\nCONTEXTO: Ya eligió {selected_food}"
                if selected_pairing:
                    context_info += f" con {selected_pairing}"
            
            # Agregar mensaje al historial del thread
            thread['conversation_history'].append({
                'type': 'user',
                'message': user_message,
                'timestamp': time.time()
            })
            
            # 🧠 HISTORIAL DE CONVERSACIÓN para contexto
            conversation_context = ""
            if len(thread['conversation_history']) > 0:
                last_messages = thread['conversation_history'][-4:]  # Últimos 4 mensajes
                for msg in last_messages:
                    if msg['type'] == 'user':
                        conversation_context += f"USUARIO: {msg['message']}\n"
                    else:
                        conversation_context += f"ASISTENTE: {msg.get('intent', 'response')} sobre producto ID {msg.get('target_product_id', 'N/A')}\n"
            
            # 🚀 PROMPT SÚPER LIVIANO (sin dataset - ya lo tiene en memoria)
            prompt = f"""CONTINUANDO CONVERSACIÓN EN THREAD {thread_id}.

HISTORIAL RECIENTE:
{conversation_context}

USUARIO DICE AHORA: "{user_message}"{context_info}

YA CONOCES TODO EL MENÚ (productos, categorías, ingredientes).

IMPORTANTE: PRIMERO DETERMINA SI ES UNA CONVERSACIÓN CASUAL O UNA CONSULTA SOBRE EL MENÚ.

DETERMINA LA INTENCIÓN Y RESPONDE JSON:

{{
  "intent_type": "casual_conversation|greeting|specific_product_ingredients|specific_product_info|product_pairings|smart_beverage_recommendation|product_recommendations|general_inquiry",
  "target_product_id": "ID del producto si aplica o null",
  "response_text": "Respuesta natural en español argentino",
  "confidence": "0-100"
}}

CRITERIOS DE CLASIFICACIÓN:
- Si es SALUDO (hola, cómo estás, buen día, qué tal, etc): "greeting"
- Si es CHARLA CASUAL (gracias, de nada, adiós, chau, hasta luego, etc): "casual_conversation"
- Si pregunta QUÉ TIENE, INGREDIENTES: "specific_product_ingredients"
- Si pregunta ACOMPAÑAR, MARIDAJES: "product_pairings" (y usar producto del historial si no especifica)
- Si contexto tiene selectedFood Y pregunta BEBIDA: "smart_beverage_recommendation"
- Si pregunta PRECIO, INFO: "specific_product_info"
- Si quiere RECOMENDACIONES: "product_recommendations"
- Si no está claro o es consulta general: "general_inquiry"

REGLA CRÍTICA: Si el usuario saluda o hace conversación casual, NO recomiendes productos. Solo responde de forma amigable.

RESPONDE SOLO JSON:"""
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            logger.info(f"[AI_RESPONSE] Raw response: {response.text[:200]}...")
            
            # Parsear respuesta
            import re
            json_match = re.search(r'\{.*?\}', response.text, re.DOTALL)
            if json_match:
                try:
                    ai_response = json.loads(json_match.group(0))
                    logger.info(f"[AI_PARSED] Intent: {ai_response.get('intent_type')}, Product ID: {ai_response.get('target_product_id')}")
                except json.JSONDecodeError as e:
                    logger.error(f"[AI_JSON_ERROR] No se pudo parsear JSON: {e}")
                    raise Exception("Error parsing AI response")
                
                # Buscar producto en el thread data
                products_data = thread['restaurant_data'].get('products', [])
                target_product = None
                if ai_response.get('target_product_id'):
                    target_product = next((p for p in products_data 
                                         if str(p['id']) == str(ai_response['target_product_id'])), None)
                
                if not target_product and ai_response['intent_type'] in ['specific_product_ingredients', 'specific_product_info', 'product_pairings']:
                    # Buscar por nombre usando múltiples estrategias
                    logger.info(f"[PRODUCT_SEARCH] Buscando producto para mensaje: '{user_message}'")
                    
                    message_lower = user_message.lower()
                    best_product = None
                    max_matches = 0
                    
                    for product in products_data:
                        product_name_lower = product['name'].lower()
                        
                        # Estrategia 1: Coincidencia exacta o contiene
                        if product_name_lower in message_lower or message_lower in product_name_lower:
                            target_product = product
                            logger.info(f"[PRODUCT_FOUND] Coincidencia exacta: {product['name']} (ID: {product['id']})")
                            break
                        
                        # Estrategia 2: Coincidencia de palabras
                        product_words = product_name_lower.split()
                        message_words = message_lower.split()
                        matches = sum(1 for word in product_words if word in message_words)
                        
                        if matches > max_matches and matches > 0:
                            max_matches = matches
                            best_product = product
                    
                    # Si no hay coincidencia exacta, usar la mejor coincidencia de palabras
                    if not target_product and best_product and max_matches > 0:
                        target_product = best_product
                        logger.info(f"[PRODUCT_FOUND] Mejor coincidencia: {target_product['name']} (ID: {target_product['id']}) con {max_matches} palabras coincidentes")
                    
                    if not target_product:
                        logger.warning(f"[PRODUCT_NOT_FOUND] No se encontró producto para: '{user_message}'")
                
                # Agregar respuesta IA al historial
                thread['conversation_history'].append({
                    'type': 'assistant',
                    'intent': ai_response['intent_type'],
                    'response': ai_response['response_text'],
                    'target_product_id': target_product['id'] if target_product else None,
                    'timestamp': time.time()
                })
                
                return {
                    'intent_type': ai_response['intent_type'],
                    'target_product': target_product,
                    'response_text': ai_response['response_text'],
                    'confidence': ai_response.get('confidence', 80),
                    'recommended_products': []  # Se llenará después según el intent
                }
            else:
                logger.error(f"[AI_NO_JSON] No se encontró JSON en la respuesta: {response.text}")
                raise Exception("No JSON found in AI response")
            
        except Exception as e:
            logger.error(f"Error en interpretación persistente: {e}")
        
        # Fallback
        return {
            'intent_type': 'product_recommendations',
            'target_product': None,
            'response_text': '¿Qué tenés ganas de comer? Te ayudo a encontrar algo delicioso.',
            'confidence': 50,
            'recommended_products': []
        }
    
    def interpret_user_intent_with_ai(self, user_message, products_data, context=None):
        """Usar IA para interpretar qué quiere realmente el usuario"""
        try:
            import google.generativeai as genai
            
            # Configurar Gemini si no está configurado
            if not hasattr(self, '_genai_configured'):
                genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
                self._genai_configured = True
            
            # Buscar productos que podrían coincidir con el mensaje
            potential_products = []
            message_words = user_message.lower().split()
            
            for product in products_data:
                product_name_lower = product['name'].lower()
                # Buscar coincidencias de palabras
                if any(word in product_name_lower or product_name_lower in word 
                      for word in message_words if len(word) > 3):
                    potential_products.append(product)
            
            # Limitar a los 10 productos más relevantes
            limited_products = potential_products[:10]
            
            # Crear prompt para que la IA interprete la intención
            # Obtener contexto
            selected_food = context.get('selectedFood') if context else None
            selected_pairing = context.get('selectedPairing') if context else None
            
            context_info = ""
            if selected_food:
                context_info += f"\nCONTEXTO: Ya eligió {selected_food}"
                if selected_pairing:
                    context_info += f" con {selected_pairing}"
            
            prompt = f"""SISTEMA: Eres un asistente de restaurante. El usuario dice: "{user_message}"{context_info}

PRODUCTOS DISPONIBLES:
{chr(10).join([f"- {p['name']} (ID: {p['id']}) - {p['category_name']} - ${p['price']}" for p in limited_products[:5]])}

TU TAREA: Determinar qué quiere el usuario y responder EN FORMATO JSON:

{{
  "intent_type": "specific_product_ingredients|specific_product_info|product_pairings|smart_beverage_recommendation|product_recommendations|general_inquiry",
  "target_product_id": "ID del producto si aplica o null",
  "response_text": "Respuesta natural en español argentino",
  "confidence": "0-100"
}}

CRITERIOS:
- Si pregunta QUÉ TIENE, INGREDIENTES, CÓMO ESTÁ HECHO: intent_type = "specific_product_ingredients"
- Si pregunta CON QUÉ ACOMPAÑAR, MARIDAJES, QUÉ COMBINA: intent_type = "product_pairings"
- Si el contexto tiene selectedFood Y pregunta BEBIDA/QUÉ TOMAR: intent_type = "smart_beverage_recommendation"
- Si pregunta sobre PRECIO, INFO GENERAL: intent_type = "specific_product_info" 
- Si quiere RECOMENDACIONES, QUÉ ME RECOMENDÁS: intent_type = "product_recommendations"
- SIEMPRE encuentra el producto más similar aunque no sea exacto

EJEMPLO:
Usuario: "que tiene el bacon cheeseburger?"
Respuesta: {{"intent_type":"specific_product_ingredients","target_product_id":"123","response_text":"Te muestro todos los ingredientes del Bacon Cheeseburger:","confidence":"95"}}

RESPONDE SOLO JSON:"""
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Parsear respuesta JSON de la IA
            import json
            import re
            
            # Extraer JSON de la respuesta
            json_match = re.search(r'\{.*?\}', response.text, re.DOTALL)
            if json_match:
                ai_response = json.loads(json_match.group(0))
                
                # Buscar el producto específico si la IA lo identificó
                target_product = None
                if ai_response.get('target_product_id'):
                    target_product = next((p for p in limited_products 
                                         if str(p['id']) == str(ai_response['target_product_id'])), None)
                
                # Si no encontró por ID, buscar por nombre
                if not target_product and ai_response['intent_type'] in ['specific_product_ingredients', 'specific_product_info', 'product_pairings']:
                    target_product = limited_products[0] if limited_products else None
                
                return {
                    'intent_type': ai_response['intent_type'],
                    'target_product': target_product,
                    'response_text': ai_response['response_text'],
                    'confidence': ai_response.get('confidence', 80),
                    'recommended_products': [{
                        'id': p['id'],
                        'name': p['name'],
                        'description': p['description'],
                        'price': float(p['price']),
                        'category': p['category_name'],
                        'image_url': p['image_url']
                    } for p in limited_products[:4]] if ai_response['intent_type'] == 'product_recommendations' else []
                }
            
        except Exception as e:
            logger.error(f"Error interpretando intención del usuario: {e}")
        
        # Fallback si falla la IA
        return {
            'intent_type': 'product_recommendations',
            'target_product': None,
            'response_text': '¿Qué tenés ganas de comer? Te muestro algunas opciones:',
            'confidence': 50,
            'recommended_products': [{
                'id': p['id'],
                'name': p['name'],
                'description': p['description'],
                'price': float(p['price']),
                'category': p['category_name'],
                'image_url': p['image_url']
            } for p in products_data[:4]]
        }
    
    def generate_ingredients_response_with_ai(self, user_message, product_name, real_ingredients):
        """Generar respuesta de ingredientes usando SOLO los ingredientes reales de la BD"""
        try:
            import google.generativeai as genai
            
            # Configurar Gemini si no está configurado
            if not hasattr(self, '_genai_configured'):
                genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
                self._genai_configured = True
            
            # Preparar lista de ingredientes reales
            ingredients_list = [f"- {ing['name']} ({ing['quantity']} {ing.get('unit', '')})" 
                              for ing in real_ingredients]
            ingredients_text = chr(10).join(ingredients_list)
            
            # Prompt ESTRICTO: solo usar ingredientes reales
            prompt = f"""TAREA: Responder sobre ingredientes del {product_name}.
            
USUARIO PREGUNTÓ: "{user_message}"
            
INGREDIENTES REALES EN BASE DE DATOS:
{ingredients_text}

INSTRUCCIONES ESTRICTAS:
1. USAR SOLO los ingredientes listados arriba
2. NO inventar ingredientes nuevos
3. NO mencionar ingredientes que no estén en la lista
4. Responder en español argentino natural
5. Ser informativo sobre las cantidades

EJEMPLO DE RESPUESTA:
"Te muestro los ingredientes del {product_name}: [listar SOLO los de la BD con cantidades]"

RESPONDE:"""            
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generando respuesta de ingredientes: {e}")
            # Fallback: respuesta simple con ingredientes reales
            ingredients_names = [ing['name'] for ing in real_ingredients]
            return f"El {product_name} contiene: {', '.join(ingredients_names)}."
    
    def generate_pairings_response_with_ai(self, user_message, product_name, product_category, all_products):
        """Generar maridajes usando SOLO productos reales de la BD"""
        try:
            import google.generativeai as genai
            
            # Configurar Gemini si no está configurado
            if not hasattr(self, '_genai_configured'):
                genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
                self._genai_configured = True
            
            # Obtener TODAS las categorías disponibles dinámicamente
            all_categories = list(set([p['category_name'] for p in all_products if p['category_name']]))
            categories_info = chr(10).join([f"- {cat}" for cat in all_categories])
            
            # La IA decidirá dinámicamente qué categorías son apropiadas para acompañar
            
            # Preparar TODOS los productos disponibles
            all_products_list = chr(10).join([
                f"- {p['name']} (${p['price']}) - {p['category_name']} - {p.get('description', '')}" 
                for p in all_products[:30]  # Limitar para optimizar IA
            ])
            
            # Prompt DINÁMICO: La IA interpreta qué categorías son acompañamientos
            prompt = f"""TAREA: Recomendar maridajes/acompañamientos para {product_name} ({product_category}).
            
USUARIO PREGUNTÓ: "{user_message}"
            
CATEGORÍAS DISPONIBLES:
{categories_info}

TODOS LOS PRODUCTOS DISPONIBLES:
{all_products_list}

INSTRUCCIONES INTELIGENTES:
1. INTERPRETAR dinámicamente qué categorías/productos pueden acompañar a {product_name}
2. NO hardcodear - DEDUCIR qué combina bien
3. Considerar: entradas, guarniciones, ensaladas, sides, etc.
4. USAR SOLO productos de la lista
5. Explicar por qué combinan gastronómicamente
6. Responder en español argentino natural

EJEMPLO INTELIGENTE:
"Analizando las categorías, para acompañar {product_name} identifico que [categorías] son apropiadas.
Te recomiendo: [productos que complementen]"

INTERPRETA DINÁMICAMENTE Y RESPONDE:"""            
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Seleccionar productos mencionados en la respuesta
            response_text = response.text.strip()
            selected_products = []
            
            # Buscar productos mencionados en la respuesta IA
            for product in all_products:
                if product['name'].lower() in response_text.lower():
                    selected_products.append({
                        'id': product['id'],
                        'name': product['name'],
                        'description': product['description'],
                        'price': float(product['price']),
                        'category': product['category_name'],
                        'image_url': product['image_url']
                    })
            
            # Si no seleccionó ningún producto, fallback dinámico
            if not selected_products:
                selected_products = [{
                    'id': p['id'],
                    'name': p['name'],
                    'description': p['description'],
                    'price': float(p['price']),
                    'category': p['category_name'],
                    'image_url': p['image_url']
                } for p in all_products[:3]]
            
            return response_text, selected_products[:4]
            
        except Exception as e:
            logger.error(f"Error generando maridajes: {e}")
            # Fallback: respuesta simple con primeros productos
            fallback_products = [{
                'id': p['id'],
                'name': p['name'],
                'description': p['description'],
                'price': float(p['price']),
                'category': p['category_name'],
                'image_url': p['image_url']
            } for p in all_products[:3]]
            
            return f"Para acompañar el {product_name}, te sugerimos nuestras opciones de la carta.", fallback_products
    
    def generate_smart_beverage_recommendation(self, user_message, selected_food, selected_pairing, weather, temperature, time_of_day, all_products):
        """Generar recomendación inteligente de bebida según contexto"""
        try:
            import google.generativeai as genai
            
            # Configurar Gemini si no está configurado
            if not hasattr(self, '_genai_configured'):
                genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
                self._genai_configured = True
            
            # Obtener TODAS las categorías disponibles dinámicamente
            all_categories = list(set([p['category_name'] for p in all_products if p['category_name']]))
            
            # Preparar contexto de categorías para que la IA decida
            categories_info = chr(10).join([f"- {cat}" for cat in all_categories])
            
            # La IA decidirá dinámicamente qué categorías son apropiadas para beber
            # sin hardcodear NADA
            
            # Preparar TODOS los productos disponibles
            all_products_list = chr(10).join([
                f"- {p['name']} (${p['price']}) - {p['category_name']} - {p.get('description', '')}" 
                for p in all_products[:50]  # Limitar para optimizar IA
            ])
            
            # Prompt DINÁMICO: La IA interpreta qué son bebidas
            prompt = f"""ERES UN SOMMELIER EXPERTO EN MARIDAJES.
            
CONTEXTO DE LA COMIDA:
- Comida elegida: {selected_food or 'No especificada'}
- Acompañamiento: {selected_pairing or 'No especificado'}
- Clima: {weather}
- Temperatura: {temperature}°C
- Momento del día: {time_of_day}
- Usuario preguntó: "{user_message}"
            
CATEGORÍAS DISPONIBLES EN NUESTRO MENÚ:
{categories_info}

TODOS LOS PRODUCTOS DISPONIBLES:
{all_products_list}

TU MISIÓN INTELIGENTE:
1. INTERPRETAR qué categorías/productos son apropiados para BEBER
2. Analizar TODO el contexto (comida, clima, temperatura, hora)
3. SOLO recomendar productos que sean líquidos/bebibles
4. Explicar el RAZONAMIENTO científico del maridaje
5. NO hardcodear - INTERPRETAR dinámicamente

CONSIDERAR:
- ¿Qué productos son líquidos por naturaleza?
- ¿Qué categorías sugieren bebidas?
- ¿Es comida pesada o liviana?
- ¿Qué necesita el paladar?
- ¿Cómo afecta el clima/temperatura?

EJEMPLO DE RESPUESTA:
"Analizando las categorías disponibles, identifico que [categorías] contienen bebidas.
Considerando tu [comida] con [acompañamiento], y el clima de [temperatura]°C...

Te recomiendo:
• [Producto líquido 1] - Razón científica
• [Producto líquido 2] - Por qué funciona"

INTERPRETA DINÁMICAMENTE Y RESPONDE:"""            
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            # Buscar productos mencionados en la respuesta IA
            response_text = response.text.strip()
            selected_products = []
            
            for product in all_products:
                if product['name'].lower() in response_text.lower():
                    selected_products.append({
                        'id': product['id'],
                        'name': product['name'],
                        'description': product['description'],
                        'price': float(product['price']),
                        'category': product['category_name'],
                        'image_url': product['image_url']
                    })
            
            # Si no seleccionó productos específicos, la IA falló en interpretación
            if not selected_products:
                # Fallback: dejar que la IA decida qué recomendar sin filtros
                selected_products = [{
                    'id': p['id'],
                    'name': p['name'],
                    'description': p['description'],
                    'price': float(p['price']),
                    'category': p['category_name'],
                    'image_url': p['image_url']
                } for p in all_products[:3]]
            
            return response_text, selected_products[:3]
            
        except Exception as e:
            logger.error(f"Error generando recomendación inteligente de bebida: {e}")
            # Fallback simple
            return "Te recomiendo una bebida refrescante para acompañar.", []
    
    def generate_ai_response(self, user_message, category, products):
        """Generar respuesta contextual dinámica basada en los productos encontrados"""
        import random
        
        # Respuestas dinámicas basadas en lo que el usuario escribió y lo que encontramos
        if not products:
            return '¿Qué tenés ganas de comer? Te ayudo a encontrar algo delicioso en nuestro menú.'
        
        # Determinar categoría dinámicamente del primer producto encontrado
        first_product = products[0]
        product_category = first_product.get('category', '').lower() if first_product.get('category') else ''
        
        # Respuestas contextuales dinámicas
        general_responses = [
            f'Perfecto! Te muestro {first_product["name"]} y otras opciones que te van a encantar.',
            f'Excelente elección! {first_product["name"]} es una de nuestras especialidades.',
            f'Buena elección! Te recomiendo especialmente {first_product["name"]}.',
            f'Te va a encantar! {first_product["name"]} es realmente delicioso.'
        ]
        
        # Añadir contexto específico si detectamos palabras clave en la consulta
        user_lower = user_message.lower()
        if any(word in user_lower for word in ['ingredientes', 'tiene', 'lleva']):
            return f'Te muestro toda la información sobre {first_product["name"]}, incluyendo sus ingredientes:'
        elif any(word in user_lower for word in ['precio', 'cuesta', 'vale']):
            return f'{first_product["name"]} cuesta ${first_product["price"]}. ¡Te muestro más opciones!'
        elif len(products) > 1:
            return f'Encontré varias opciones para vos! Te muestro {first_product["name"]} y otras delicias.'
        
        return random.choice(general_responses)
    
    def get_product_ingredients(self, product_id):
        """Obtener ingredientes de un producto desde caché"""
        try:
            restaurant_data = get_restaurant_data()
            ingredients_by_product = restaurant_data.get('ingredients_by_product', {})
            
            return ingredients_by_product.get(product_id, [])
            
        except Exception as e:
            logger.error(f"Error obteniendo ingredientes del producto {product_id}: {e}")
            return []

    def generate_ai_pairings(self, product_name, category):
        """Generar maridajes inteligentes usando IA con productos desde caché"""
        global ai_response_cache
        
        try:
            # Verificar caché de respuestas IA
            cache_key = f"{product_name.lower()}_{category.lower()}"
            current_time = time.time()
            
            if (cache_key in ai_response_cache['pairings'] and 
                current_time - ai_response_cache['pairings'][cache_key]['timestamp'] < ai_response_cache['cache_duration']):
                logger.info(f"[AI_CACHE] Usando maridajes cacheados para {product_name}")
                return ai_response_cache['pairings'][cache_key]['data']
            
            # Obtener productos para maridajes desde caché
            restaurant_data = get_restaurant_data()
            all_pairing_products = restaurant_data.get('pairing_products', [])
            
            if not all_pairing_products:
                return self.get_fallback_pairings(product_name, category)
            
            # 🎯 FILTRADO INTELIGENTE: Solo productos relevantes para el maridaje
            category_lower = category.lower() if category else ''
            product_lower = product_name.lower()
            
            # Filtrar productos más apropiados para maridaje según el plato principal
            relevant_products = []
            
            # Lógica de filtrado inteligente
            # Filtrado dinámico basado en categorías reales de la base de datos
            main_dish_categories = ['pasta', 'pizza', 'carne', 'hamburguesa', 'sandwich', 'pollo']
            if any(keyword in category_lower or keyword in product_lower for keyword in main_dish_categories):
                # Para platos principales, buscar bebidas, entradas y postres
                for p in all_pairing_products:
                    p_category = p['category'].lower()
                    p_name = p['name'].lower()
                    if any(word in p_category or word in p_name for word in ['bebida', 'vino', 'cerveza', 'agua', 'entrada', 'ensalada', 'postre']):
                        relevant_products.append(p)
            else:
                # Para otros casos, usar todos los productos de maridaje
                relevant_products = all_pairing_products
            
            # Limitar a máximo 15 productos (optimización de tokens)
            limited_products = relevant_products[:15]
            
            # Crear prompt COMPACTO para Gemini (menos tokens)
            products_text = "\n".join([
                f"{p['id']}|{p['name']}|{p['category']}|${p['price']:.0f}"
                for p in limited_products
            ])
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # 📝 PROMPT COMPACTO Y EFICIENTE con matching parcial
            prompt = f"""Sommelier experto: Cliente ordenó "{product_name}" ({category}).

PRODUCTOS (ID|Nombre|Categoría|$):
{products_text}

Selecciona 3 mejores maridajes (usa palabras clave, no nombres exactos):
- PERAS con dulce → ID de cualquier producto con "peras"  
- VINO tinto → ID de cualquier producto con "vino" y "tinto"
- PAN → ID de cualquier producto con "pan"

JSON: {{"pairings":[{{"product_id":ID,"reason":"1 línea","type":"wine/beverage/side/dessert"}}]}}"""
            
            logger.info(f"[AI] Consultando Gemini para maridajes de {product_name} (tokens reducidos)")
            response = model.generate_content(prompt)
            
            # Parsear respuesta JSON
            import json
            import re
            
            # Extraer JSON de la respuesta
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                ai_response = json.loads(json_match.group())
                
                formatted_pairings = []
                for pairing in ai_response.get('pairings', []):
                    product_id = pairing.get('product_id')
                    # Buscar el producto en la lista limitada
                    matched_product = next((p for p in limited_products if p['id'] == product_id), None)
                    
                    if matched_product:
                        formatted_pairings.append({
                            'id': matched_product['id'],
                            'name': matched_product['name'],
                            'product_id': product_id,
                            'description': pairing.get('reason', matched_product.get('description', '')),
                            'type': pairing.get('type', 'side'),
                            'price': matched_product['price'],
                            'image_url': matched_product.get('image_url', ''),
                            'category': matched_product.get('category', ''),
                            'category_name': matched_product.get('category_name', matched_product.get('category', ''))
                        })
                
                # 💾 GUARDAR EN CACHÉ para futuras consultas
                ai_response_cache['pairings'][cache_key] = {
                    'data': formatted_pairings,
                    'timestamp': current_time
                }
                
                logger.info(f"[AI_CACHE] Guardado maridaje para {product_name} en caché")
                return formatted_pairings
            
        except Exception as e:
            logger.error(f"Error generando maridajes con IA: {e}")
        
        # Fallback si falla la IA
        return self.get_fallback_pairings(product_name, category)
    
    def get_fallback_pairings(self, product_name, category):
        """Maridajes de respaldo cuando falla la IA"""
        return [
            {'name': 'Agua mineral', 'description': 'Refrescante y versátil', 'type': 'beverage'},
            {'name': 'Vino de la casa', 'description': 'Selección del sommelier', 'type': 'wine'},
            {'name': 'Pan artesanal', 'description': 'Acompañamiento perfecto', 'type': 'side'}
        ]

    def get_customer_by_id(self, customer_id):
        """Obtener cliente por ID"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            cursor.execute("""
                SELECT id, first_name, last_name, phone, email, dni, notes,
                       loyalty_points, total_visits, total_spent, created_at
                FROM customers WHERE id = %s
            """, (customer_id,))
            
            result = cursor.fetchone()
            if result:
                return {
                    'id': result[0],
                    'first_name': result[1],
                    'last_name': result[2],
                    'phone': result[3],
                    'email': result[4],
                    'dni': result[5],
                    'notes': result[6],
                    'loyalty_points': result[7],
                    'total_visits': result[8],
                    'total_spent': float(result[9]) if result[9] else 0,
                    'created_at': result[10].isoformat() if result[10] else None
                }
            return None

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def delete_address(self, address_id):
        """Eliminar una dirección (soft delete)"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            query = """
                UPDATE addresses 
                SET is_active = 0
                WHERE id = %s
            """
            
            cursor.execute(query, (address_id,))
            connection.commit()
            return True
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def get_address_by_id(self, address_id):
        """Obtener dirección por ID"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            cursor.execute("""
                SELECT id, customer_id, address_type, street_address, city, 
                       state_province, postal_code, country, latitude, longitude,
                       is_default, delivery_instructions, formatted_address, created_at
                FROM addresses WHERE id = %s
            """, (address_id,))
            
            result = cursor.fetchone()
            if result:
                return {
                    'id': result[0],
                    'customer_id': result[1],
                    'address_type': result[2],
                    'street_address': result[3],
                    'city': result[4],
                    'state_province': result[5],
                    'postal_code': result[6],
                    'country': result[7],
                    'latitude': result[8],
                    'longitude': result[9],
                    'is_default': bool(result[10]),
                    'delivery_instructions': result[11],
                    'formatted_address': result[12],
                    'created_at': result[13]
                }
            return None

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def create_kitchen_queue_table(self):
        """Crear tabla mejorada para cola de cocina"""
        connection = None
        cursor = None
        
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            
            # Primero eliminar la tabla si existe
            cursor.execute("DROP TABLE IF EXISTS kitchen_queue_items")
            
            # Crear la nueva tabla
            cursor.execute("""
                CREATE TABLE kitchen_queue_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_id INT NOT NULL,
                    order_item_id INT NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    
                    -- Estación de cocina
                    station ENUM('grill', 'salads', 'desserts', 'drinks', 'fryer', 'general') DEFAULT 'general',
                    
                    -- Estados específicos de cocina
                    status ENUM('new', 'viewed', 'preparing', 'delayed', 'ready', 'delivered', 'cancelled') DEFAULT 'new',
                    
                    -- Prioridad
                    priority ENUM('normal', 'rush', 'vip') DEFAULT 'normal',
                    
                    -- Asignación y tiempos
                    assigned_chef_id INT,
                    started_at TIMESTAMP NULL,
                    ready_at TIMESTAMP NULL,
                    delivered_at TIMESTAMP NULL,
                    
                    -- Tiempos estimados vs reales
                    estimated_minutes INT DEFAULT 10,
                    actual_minutes INT,
                    
                    -- Información adicional
                    delay_reason TEXT,
                    special_instructions TEXT,
                    table_number INT NOT NULL,
                    waiter_name VARCHAR(100),
                    
                    -- Metadata
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    -- Índices para búsquedas rápidas
                    INDEX idx_order (order_id),
                    INDEX idx_status (status),
                    INDEX idx_station (station),
                    INDEX idx_priority (priority),
                    INDEX idx_created (created_at),
                    
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
                )
            """)
            
            # Crear vista para el dashboard
            cursor.execute("""
                CREATE OR REPLACE VIEW kitchen_display AS
                SELECT 
                    kq.id,
                    kq.order_id,
                    kq.table_number,
                    kq.product_name,
                    kq.quantity,
                    kq.station,
                    kq.status,
                    kq.priority,
                    kq.special_instructions,
                    kq.waiter_name,
                    kq.created_at,
                    kq.started_at,
                    TIMESTAMPDIFF(MINUTE, kq.created_at, NOW()) as waiting_minutes,
                    CASE 
                        WHEN kq.started_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(MINUTE, kq.started_at, NOW()) 
                        ELSE 0 
                    END as cooking_minutes,
                    kq.estimated_minutes,
                    CASE
                        WHEN kq.status = 'delayed' THEN 'red'
                        WHEN TIMESTAMPDIFF(MINUTE, kq.created_at, NOW()) > kq.estimated_minutes THEN 'yellow'
                        ELSE 'green'
                    END as alert_color
                FROM kitchen_queue_items kq
                WHERE kq.status NOT IN ('delivered', 'cancelled')
                ORDER BY 
                    FIELD(kq.priority, 'vip', 'rush', 'normal'),
                    kq.created_at ASC
            """)
            
            connection.commit()
            
            return {
                "success": True,
                "message": "Tabla kitchen_queue_items creada exitosamente",
                "details": [
                    "✅ Tabla kitchen_queue_items creada",
                    "✅ Vista kitchen_display creada",
                    "✅ Índices y foreign keys configurados"
                ]
            }
            
        except Exception as e:
            if connection:
                connection.rollback()
            logger.error(f"Error creando tabla kitchen_queue: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def create_test_orders(self):
        """Crear pedidos de prueba para la cocina"""
        connection = None
        cursor = None
        results = []
        
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            
            # Primero, obtener algunos productos
            cursor.execute("SELECT id, name, price FROM products WHERE available = 1 LIMIT 10")
            products = cursor.fetchall()
            
            if not products:
                # Crear algunos productos de prueba si no hay
                test_products = [
                    ('Hamburguesa Classic', 12.50, 1, 1, 'Deliciosa hamburguesa con queso'),
                    ('Pizza Margherita', 18.00, 1, 1, 'Pizza tradicional italiana'),
                    ('Ensalada César', 9.50, 2, 1, 'Ensalada fresca con pollo'),
                    ('Pasta Carbonara', 15.00, 3, 1, 'Pasta cremosa con panceta'),
                    ('Milanesa con Papas', 16.50, 1, 1, 'Milanesa de ternera con papas fritas')
                ]
                
                for name, price, cat_id, subcat_id, desc in test_products:
                    cursor.execute("""
                        INSERT INTO products (name, price, category_id, subcategory_id, available, description)
                        VALUES (%s, %s, %s, %s, 1, %s)
                    """, (name, price, cat_id, subcat_id, desc))
                
                connection.commit()
                
                # Obtener los productos recién creados
                cursor.execute("SELECT id, name, price FROM products WHERE available = 1")
                products = cursor.fetchall()
            
            # Crear algunos pedidos con diferentes estados
            orders_data = [
                {'table': 5, 'status': 'pending', 'notes': 'Sin cebolla en la hamburguesa'},
                {'table': 3, 'status': 'preparing', 'notes': 'Cliente alérgico a frutos secos'},
                {'table': 8, 'status': 'preparing', 'notes': 'Apurar por favor'},
                {'table': 2, 'status': 'ready', 'notes': 'Agregar extra queso'}
            ]
            
            for order_data in orders_data:
                # Insertar el pedido
                cursor.execute("""
                    INSERT INTO orders (table_number, waiter_id, status, notes, subtotal, tax, total)
                    VALUES (%s, %s, %s, %s, 0, 0, 0)
                """, (order_data['table'], 1, order_data['status'], order_data['notes']))
                
                order_id = cursor.lastrowid
                
                # Agregar 2-3 items al pedido
                total = 0.0
                for i in range(min(3, len(products))):
                    product = products[i]
                    quantity = (i % 2) + 1  # 1 o 2
                    price = float(product[2])
                    subtotal = price * quantity
                    total += subtotal
                    
                    cursor.execute("""
                        INSERT INTO order_items (order_id, product_id, quantity, price, notes)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (order_id, product[0], quantity, price, f"Item: {product[1]}"))
                    
                    item_id = cursor.lastrowid
                    
                    # Crear registro en kitchen_queue_items
                    # Determinar la estación basado en el nombre del producto
                    station = 'general'
                    if 'ensalada' in product[1].lower():
                        station = 'salads'
                    elif 'pizza' in product[1].lower() or 'hamburguesa' in product[1].lower():
                        station = 'grill'
                    elif 'pasta' in product[1].lower() or 'milanesa' in product[1].lower():
                        station = 'general'
                    
                    # Determinar prioridad basado en el estado del pedido
                    priority = 'normal'
                    if order_data['status'] == 'ready':
                        priority = 'rush'
                    
                    cursor.execute("""
                        INSERT INTO kitchen_queue_items (
                            order_id, order_item_id, product_name, quantity,
                            station, status, priority, table_number, waiter_name,
                            special_instructions, estimated_minutes
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        order_id, item_id, product[1], quantity,
                        station, order_data['status'], priority, 
                        order_data['table'], 'Admin',
                        order_data['notes'], 10 if station == 'salads' else 15
                    ))
                
                # Actualizar el total del pedido
                tax = total * 0.21
                grand_total = total + tax
                
                cursor.execute("""
                    UPDATE orders SET subtotal = %s, tax = %s, total = %s WHERE id = %s
                """, (total, tax, grand_total, order_id))
                
                results.append(f"✅ Pedido #{order_id} - Mesa {order_data['table']} - {order_data['status']}")
            
            connection.commit()
            
            return {
                "success": True,
                "message": "Pedidos de prueba creados",
                "details": results
            }
            
        except Exception as e:
            if connection:
                connection.rollback()
            logger.error(f"Error creando pedidos de prueba: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def add_missing_columns(self):
        """Agregar columnas faltantes a las tablas"""
        connection = None
        cursor = None
        results = []
        
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()
            
            # Agregar columnas a customers
            columns_to_add = [
                ("customers", "loyalty_points", "INT DEFAULT 0"),
                ("customers", "total_visits", "INT DEFAULT 0"),
                ("customers", "total_spent", "DECIMAL(10,2) DEFAULT 0.00"),
                ("customers", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                ("addresses", "formatted_address", "TEXT"),
                ("addresses", "company_id", "INT DEFAULT 1"),
                ("addresses", "is_active", "BOOLEAN DEFAULT TRUE"),
                ("addresses", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
                ("customers", "is_active", "BOOLEAN DEFAULT TRUE")
            ]
            
            for table, column, definition in columns_to_add:
                try:
                    query = f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
                    cursor.execute(query)
                    connection.commit()
                    results.append(f"✅ Agregada columna {column} en {table}")
                except Exception as e:
                    if "Duplicate column name" in str(e):
                        results.append(f"ℹ️ Columna {column} ya existe en {table}")
                    else:
                        results.append(f"❌ Error agregando {column} en {table}: {str(e)}")
            
            return {
                "success": True,
                "message": "Columnas verificadas/agregadas",
                "details": results
            }
            
        except Exception as e:
            logger.error(f"Error agregando columnas: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def fix_customers_schema(self):
        """Recrear tablas customers/addresses para coincidir exactamente con el frontend"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            # 1. Desactivar foreign key checks y eliminar tablas
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("DROP TABLE IF EXISTS addresses")
            cursor.execute("DROP TABLE IF EXISTS customers")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            # 2. Crear tabla customers - exacto al frontend
            customers_sql = """
            CREATE TABLE customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                dni VARCHAR(20),
                phone VARCHAR(20),
                email VARCHAR(255),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            cursor.execute(customers_sql)
            
            # 3. Crear tabla addresses - exacto al frontend
            addresses_sql = """
            CREATE TABLE addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                address_type ENUM('home', 'work', 'other') DEFAULT 'home',
                street_address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state_province VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                is_default BOOLEAN DEFAULT FALSE,
                delivery_instructions TEXT,
                formatted_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
            """
            cursor.execute(addresses_sql)
            
            connection.commit()
            
            return {
                'success': True,
                'message': 'Schema de clientes recreado correctamente',
                'tables_created': ['customers', 'addresses'],
                'relationship': '1 Cliente → N Direcciones'
            }

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def create_addresses_table(self):
        """Crear la tabla addresses que falta en el sistema"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            # 1. Crear tabla addresses
            create_table_query = """
            CREATE TABLE IF NOT EXISTS addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                address_type ENUM('home', 'work', 'other') DEFAULT 'home',
                street_address VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state_province VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100) DEFAULT 'Argentina',
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                is_default BOOLEAN DEFAULT FALSE,
                delivery_instructions TEXT,
                formatted_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                INDEX idx_customer_id (customer_id),
                INDEX idx_address_type (address_type),
                INDEX idx_is_default (is_default)
            )
            """
            
            cursor.execute(create_table_query)
            
            # 2. Migrar datos existentes del campo customers.address
            migrate_query = """
            INSERT IGNORE INTO addresses (customer_id, address_type, street_address, city, is_default, delivery_instructions)
            SELECT 
                id as customer_id,
                'home' as address_type,
                COALESCE(address, 'Dirección no especificada') as street_address,
                'Ciudad no especificada' as city,
                TRUE as is_default,
                CONCAT('Migrado desde: ', address) as delivery_instructions
            FROM customers 
            WHERE address IS NOT NULL AND address != ''
            """
            
            cursor.execute(migrate_query)
            migrated_count = cursor.rowcount
            
            connection.commit()
            
            # 3. Verificar resultado
            cursor.execute("SELECT COUNT(*) FROM addresses")
            total_addresses = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM customers")
            total_customers = cursor.fetchone()[0]
            
            return {
                'success': True,
                'message': 'Tabla addresses creada y datos migrados exitosamente',
                'total_customers': total_customers,
                'total_addresses': total_addresses,
                'migrated_addresses': migrated_count
            }

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def analyze_database_structure(self):
        """Analizar toda la estructura de la base de datos"""
        connection = None
        cursor = None
        try:
            connection = connection_pool.get_connection()
            cursor = connection.cursor()

            # 1. Listar todas las tablas
            cursor.execute("SHOW TABLES")
            tables = [table[0] for table in cursor.fetchall()]
            
            database_info = {
                'database_name': 'gastro',
                'tables': {},
                'total_tables': len(tables),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            # 2. Para cada tabla, obtener su estructura
            for table_name in tables:
                # Obtener columnas
                cursor.execute(f"DESCRIBE {table_name}")
                columns = []
                for col in cursor.fetchall():
                    columns.append({
                        'name': col[0],
                        'type': col[1],
                        'null': col[2],
                        'key': col[3],
                        'default': col[4],
                        'extra': col[5]
                    })
                
                # Obtener conteo de registros
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                
                # Obtener foreign keys
                cursor.execute(f"""
                    SELECT 
                        COLUMN_NAME,
                        REFERENCED_TABLE_NAME,
                        REFERENCED_COLUMN_NAME
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = 'gastro' 
                    AND TABLE_NAME = '{table_name}'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                """)
                foreign_keys = []
                for fk in cursor.fetchall():
                    foreign_keys.append({
                        'column': fk[0],
                        'references_table': fk[1],
                        'references_column': fk[2]
                    })
                
                database_info['tables'][table_name] = {
                    'columns': columns,
                    'row_count': row_count,
                    'foreign_keys': foreign_keys
                }
            
            return database_info

        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def generate_intelligent_recommendations(self, user_message, products_data, thread_id):
        """Generar recomendaciones inteligentes usando IA - variedad vs específico"""
        try:
            import google.generativeai as genai
            
            # Configurar Gemini si no está configurado
            if not hasattr(self, '_genai_configured'):
                genai.configure(api_key='AIzaSyBF7mFZh15EbMLPVQS5zTfY0Yt5XeBnGwM')
                self._genai_configured = True
            
            # Obtener categorías disponibles para análisis inteligente
            categories = list(set([p['category_name'] for p in products_data if p['category_name']]))
            
            # Crear dataset compacto por categoría (solo primeros productos de cada categoría)
            category_products = {}
            for product in products_data:
                cat = product['category_name']
                if cat and cat not in category_products:
                    category_products[cat] = []
                if cat and len(category_products[cat]) < 3:  # Max 3 por categoría
                    category_products[cat].append(product)
            
            # Prompt inteligente para análisis de especificidad
            categories_text = ", ".join(categories)
            products_sample = ""
            for cat, prods in category_products.items():
                products_sample += f"\n{cat}: " + ", ".join([p['name'] for p in prods])
            
            # Obtener configuración del rubro desde la base de datos
            rubro_connection = None
            rubro_cursor = None
            
            try:
                rubro_connection = pool.get_connection()
                rubro_cursor = rubro_connection.cursor(dictionary=True)
                
                # Obtener configuración actual del negocio
                rubro_cursor.execute("""
                    SELECT r.nombre, r.pregunta_principal, r.rol_experto, 
                           r.categorias_principales, r.categorias_secundarias
                    FROM configuracion_negocio cn 
                    JOIN rubro r ON cn.rubro_id = r.id 
                    WHERE cn.is_active = TRUE 
                    LIMIT 1
                """)
                rubro_config = rubro_cursor.fetchone()
                
                if rubro_config:
                    business_type = rubro_config['nombre']
                    main_question = rubro_config['pregunta_principal'] 
                    expert_role = rubro_config['rol_experto']
                    
                    # Obtener categorías principales/secundarias desde BD o generar dinámicamente
                    try:
                        if rubro_config['categorias_principales']:
                            stored_main = json.loads(rubro_config['categorias_principales'])
                            # Filtrar solo las categorías que realmente existen
                            main_categories = [cat for cat in categories if cat in stored_main]
                        else:
                            main_categories = []
                        
                        if rubro_config['categorias_secundarias']:
                            stored_secondary = json.loads(rubro_config['categorias_secundarias'])
                            secondary_categories = [cat for cat in categories if cat in stored_secondary]
                        else:
                            secondary_categories = []
                    except:
                        # Si falla el parsing JSON, generar dinámicamente
                        main_categories = []
                        secondary_categories = []
                    
                    # Si no hay categorías definidas en BD, usar todas las disponibles
                    # La IA decidirá cuáles son relevantes según el contexto
                    if not main_categories:
                        # No hacer suposiciones, dejar que la IA analice
                        main_categories = categories
                        secondary_categories = []
                else:
                    # Fallback si no hay configuración
                    business_type = "negocio"
                    main_question = "¿Qué necesitás?"
                    expert_role = "EXPERTO"
                    main_categories = categories
                    secondary_categories = []
                    
            except Exception as e:
                logger.error(f"[RUBRO_ERROR] Error obteniendo configuración: {str(e)}")
                # Fallback seguro - sin suposiciones
                business_type = "negocio"
                main_question = "¿Qué necesitás?"
                expert_role = "EXPERTO"
                main_categories = categories
                secondary_categories = []
            finally:
                if rubro_cursor:
                    rubro_cursor.close()
                if rubro_connection:
                    rubro_connection.close()
            
            main_categories_text = ", ".join(main_categories)
            import json
            main_categories_json = json.dumps(main_categories, ensure_ascii=False)
            
            prompt = f"""Eres un experto en {business_type}. Analiza el mensaje del cliente y determina qué categorías mostrar.

MENSAJE DEL CLIENTE: "{user_message}"

DATOS DISPONIBLES:
- Tipo de negocio: {business_type}
- Categorías existentes: {categories_text}
- Productos disponibles por categoría:{products_sample}

TU TAREA:
Usando ÚNICAMENTE los datos proporcionados arriba, analiza semánticamente qué está pidiendo el cliente y selecciona las categorías más relevantes.

PROCESO DE ANÁLISIS:
1. Identifica la intención del mensaje (qué busca el cliente)
2. Relaciona esa intención con las categorías disponibles
3. Selecciona hasta 4 categorías que mejor respondan a la consulta
4. NO uses conocimiento externo, solo los datos proporcionados

EJEMPLOS DE ANÁLISIS (genéricos):
- Si el mensaje habla de "ver opciones" → mostrar categorías variadas principales
- Si menciona algo específico → buscar categorías relacionadas con ese concepto
- Si pide una acción (como "tomar", "usar", "comprar") → analizar qué categorías se relacionan con esa acción en el contexto del negocio

RESPONDE EN JSON:
{{{{
  "query_type": "general|specific|action_based",
  "detected_intent": "explicación breve de qué entendiste",
  "target_categories": ["array con las categorías seleccionadas"],
  "confidence": 0-100,
  "response_text": "respuesta natural en español argentino"
}}}}

IMPORTANTE: 
- Analiza el contexto del negocio para entender qué significa cada palabra
- No asumas significados, usa los datos disponibles
- Si no estás seguro, incluye categorías variadas"""
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            logger.info(f"[AI_RECOMMENDATIONS] Raw: {response.text[:200]}...")
            
            # Parsear respuesta JSON
            import json, re
            json_pattern = r'\{.*?\}'
            json_match = re.search(json_pattern, response.text, re.DOTALL)
            
            if json_match:
                try:
                    ai_response = json.loads(json_match.group(0))
                    query_type = ai_response.get('query_type', 'ambiguous')
                    target_categories = ai_response.get('target_categories', [])
                    response_text = ai_response.get('response_text', '¡Acá tenés algunas opciones!')
                    
                    logger.info(f"[AI_RECOMMENDATIONS] Parsed successfully: {query_type}, categories: {target_categories}")
                    
                except json.JSONDecodeError as e:
                    logger.error(f"[AI_RECOMMENDATIONS] JSON Parse Error: {e}")
                    logger.error(f"[AI_RECOMMENDATIONS] Raw JSON: {json_match.group(0)[:500]}...")
                    # Fallback a ambiguous
                    query_type = 'ambiguous'
                    target_categories = []
                    response_text = '¡Acá tenés algunas opciones variadas!'
                
                # Seleccionar productos según el análisis inteligente de la IA
                selected_products = []
                
                # La IA ya determinó qué categorías mostrar basándose en el análisis semántico
                if target_categories:
                    # Usar las categorías que la IA seleccionó
                    allowed_categories = set(target_categories)
                    logger.info(f"[AI_SELECTED] Using AI-selected categories: {target_categories}")
                else:
                    # Fallback: si la IA no pudo determinar, usar categorías variadas
                    allowed_categories = set(categories[:4])  # Primeras 4 categorías disponibles
                    logger.info(f"[FALLBACK] AI couldn't determine, using first 4 categories")
                
                # Recolectar productos de las categorías seleccionadas por la IA
                used_categories = set()
                
                for product in products_data:
                    if len(selected_products) >= 4:
                        break
                    cat = product['category_name']
                    if cat and cat in allowed_categories and cat not in used_categories:
                        selected_products.append(product)
                        used_categories.add(cat)
                        logger.info(f"[AI_BASED] Added {product['name']} from {cat}")
                
                # Si hay categorías específicas pero pocos productos, agregar más de esas categorías
                if len(selected_products) < 4 and target_categories:
                    for product in products_data:
                        if len(selected_products) >= 4:
                            break
                        cat = product['category_name']
                        if cat and cat in allowed_categories:
                            selected_products.append(product)
                            logger.info(f"[ADDITIONAL] Added more from {cat}: {product['name']}")
                            
                else:
                    # FALLBACK: variedad de categorías (como antes)
                    used_categories = set()
                    for product in products_data:
                        if len(selected_products) >= 4:
                            break
                        cat = product['category_name']
                        if cat and cat not in used_categories:
                            selected_products.append(product)
                            used_categories.add(cat)
                            logger.info(f"[FALLBACK] Added {product['name']} from {cat}")
                
                # Organizar productos por categorías para carruseles (MÁXIMO 4 CATEGORÍAS)
                categorized_products = {}
                
                # Agrupar productos por categoría, limitando a 4 categorías
                for product in selected_products:
                    category = product['category_name']
                    
                    # LÍMITE: Solo 4 categorías máximo
                    if len(categorized_products) >= 4 and category not in categorized_products:
                        break
                        
                    if category not in categorized_products:
                        categorized_products[category] = []
                    
                    # Máximo 6 productos por carrusel
                    if len(categorized_products[category]) < 6:
                        categorized_products[category].append({
                            'id': product['id'],
                            'name': product['name'],
                            'description': product['description'],
                            'price': float(product['price']),
                            'category': category,
                            'image_url': product['image_url']
                        })
                
                # Expandir cada categoría con más productos para hacer carruseles completos
                for category in categorized_products:
                    if len(categorized_products[category]) < 4:  # Llenar hasta 4 productos mínimo por carrusel
                        for product in products_data:
                            if len(categorized_products[category]) >= 6:  # Máximo 6 por carrusel
                                break
                            if (product['category_name'] == category and 
                                product['id'] not in [p['id'] for p in categorized_products[category]]):
                                categorized_products[category].append({
                                    'id': product['id'],
                                    'name': product['name'],
                                    'description': product['description'],
                                    'price': float(product['price']),
                                    'category': category,
                                    'image_url': product['image_url']
                                })
                
                # Contar productos totales
                total_products = sum(len(products) for products in categorized_products.values())
                total_categories = len(categorized_products)
                
                logger.info(f"[AI_RECOMMENDATIONS] {query_type.upper()}: {total_products} products across {total_categories} categories: {list(categorized_products.keys())}")
                
                return response_text, categorized_products
                
        except Exception as e:
            logger.error(f"[AI_RECOMMENDATIONS] Error: {e}")
        
        # Fallback: productos variados
        fallback_products = [{
            'id': p['id'],
            'name': p['name'],
            'description': p['description'], 
            'price': float(p['price']),
            'category': p['category_name'],
            'image_url': p['image_url']
        } for p in products_data[:4]]
        
        return "¡Acá tenés algunas opciones deliciosas!", fallback_products

    def log_message(self, format, *args):
        """Override to reduce log noise"""
        if args and len(args) > 0 and isinstance(args[0], str):
            if '/health' not in args[0] and '/api/' in args[0]:
                # Solo loguear llamadas a API (no health checks)
                super().log_message(format, *args)

# Servidor con Threading simple y correcto
class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Servidor TCP con threading para manejar múltiples conexiones simultáneas"""
    allow_reuse_address = True

# Start server simplificado y correcto
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 SERVIDOR DE RESTAURANTE")
    print("=" * 60)
    print(f"📍 Puerto: {PORT}")
    # Obtener IP de WSL
    import subprocess
    try:
        wsl_ip = subprocess.check_output("hostname -I | awk '{print $1}'", shell=True).decode().strip()
    except:
        wsl_ip = "172.29.228.80"  # Fallback
    
    print(f"🔗 URL: http://{wsl_ip}:{PORT}")
    print(f"📊 Base de datos: MySQL con pool de 10 conexiones")
    print(f"🔄 Threading: Habilitado")
    print("=" * 60)
    print("\nEndpoints disponibles:")
    print("  GET  /api/test-db        - Test de conexión BD")
    print("  GET  /api/categories      - Categorías de productos")
    print("  GET  /api/products        - Lista de productos")
    print("  GET  /api/tables          - Mesas del restaurante")
    print("  GET  /api/orders          - Pedidos activos")
    print("  POST /api/auth/login      - Login de usuarios")
    print("  ... y más")
    print("\n✨ Servidor listo para recibir conexiones\n")
    
    # Inicializar pool una vez al inicio
    if not init_pool():
        print("❌ Error: No se pudo conectar a la base de datos")
        exit(1)
    
    # Crear y ejecutar servidor
    try:
        with ThreadedTCPServer(("0.0.0.0", PORT), CompleteServerHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido por usuario")
    except Exception as e:
        print(f"❌ Error: {e}")
        logger.error(f"Error en servidor: {e}\n{traceback.format_exc()}")