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
from crash_diagnostics import CrashDiagnostics
from mercadopago_config import create_payment_preference, process_webhook

PORT = 9002

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
crash_diagnostics = CrashDiagnostics(LOG_DIR)
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
CACHE_TTL = 60  # segundos

# Pool de conexiones global - Inicializar al arrancar
connection_pool = None
pool_recovery_attempts = 0
MAX_RECOVERY_ATTEMPTS = 3

# Inicializar pool al importar el módulo
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

# Inicializar pool ahora
success = init_pool()
if not success:
    log_detailed('WARN', 'STARTUP', "Pool inicial falló, se usará conexión directa como fallback")

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
            
        # Órdenes de cocina
        elif path == '/api/orders/kitchen':
            orders = self.get_kitchen_orders()
            self.send_json_response(orders)
            
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
            
        else:
            self.send_error(404)
    
    def do_PUT(self):
        """Handle PUT requests"""
        path = urlparse(self.path).path
        
        if path.startswith('/api/tables/'):
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
        
        if path.startswith('/api/products/'):
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
    
    def get_kitchen_orders(self):
        """Get kitchen orders from MySQL database ONLY"""
        query = """
        SELECT o.id, o.table_number, o.status, o.created_at, 
               CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as waiter_name,
               oi.product_name, oi.quantity, oi.status as item_status, oi.notes
        FROM orders o
        LEFT JOIN users u ON o.waiter_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('pending', 'preparing', 'ready')
        ORDER BY o.created_at ASC
        """
        
        result = execute_mysql_query_with_recovery(query)
        if result is not None:
            # Agrupar por orden
            orders = {}
            for row in result:
                order_id = row['id']
                if order_id not in orders:
                    orders[order_id] = {
                        "id": order_id,
                        "table_number": row['table_number'],
                        "status": row['status'],
                        "ordered_at": row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else row['created_at'],
                        "waiter": row['waiter_name'] if row['waiter_name'] else 'Sin asignar',
                        "items": []
                    }
                orders[order_id]["items"].append({
                    "product_name": row['product_name'],
                    "quantity": row['quantity'],
                    "status": row['item_status'],
                    "notes": row['notes']
                })
            return list(orders.values())
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para obtener órdenes de cocina")
    
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
        """Create new order in MySQL database ONLY"""
        # Este método requiere transacciones SQL complejas
        # Por ahora lanzar error si no hay conexión a BD
        query = "INSERT INTO orders (table_id, user_id, status, total_amount) VALUES (%s, %s, %s, %s)"
        # Implementación completa requiere transacciones...
        
        result = execute_mysql_query_with_recovery(query, None)  # Esto fallará intencionalmente
        if result is not None:
            return result
        
        # NO FALLBACK - Si no hay BD, error
        raise Exception("No se puede acceder a la base de datos para crear orden")
    
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
                # Agregar headers CORS
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                self.send_header('Content-Type', mime_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Cache-Control', 'public, max-age=3600')  # Cache por 1 hora
                self.end_headers()
                self.wfile.write(content)
        except Exception as e:
            print(f"Error sirviendo archivo estático: {e}")
            self.send_error(500)
    
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