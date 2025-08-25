"""
Sistema de Cache Inteligente con Invalidación Automática
"""
import time
import json
import hashlib
from typing import Any, Optional, Dict, List, Callable
from datetime import datetime
from enum import Enum

class CacheStrategy(Enum):
    """Estrategias de invalidación de cache"""
    TIME_BASED = "time"          # Se invalida por tiempo (TTL)
    EVENT_BASED = "event"         # Se invalida por eventos (INSERT, UPDATE, DELETE)
    HYBRID = "hybrid"             # Combina tiempo + eventos
    MANUAL = "manual"             # Solo invalidación manual

class SmartCache:
    """
    Cache inteligente con múltiples estrategias de invalidación
    """
    
    def __init__(self):
        self.cache = {}
        self.dependencies = {}  # Qué keys dependen de qué tablas
        self.stats = {
            'hits': 0,
            'misses': 0,
            'invalidations': 0
        }
        
        # Configuración de TTL por tipo de dato
        self.ttl_config = {
            'products': 300,        # 5 minutos
            'categories': 600,      # 10 minutos
            'hot_products': 60,     # 1 minuto (productos más vendidos)
            'tables': 30,           # 30 segundos (cambian frecuente)
            'users': 300,           # 5 minutos
            'orders': 10,           # 10 segundos (muy dinámico)
        }
        
        # Registro de dependencias tabla -> cache_keys
        self.table_dependencies = {
            'products': set(),
            'categories': set(),
            'subcategories': set(),
            'orders': set(),
            'tables': set(),
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Obtener valor del cache"""
        if key in self.cache:
            entry = self.cache[key]
            
            # Verificar si expiró por tiempo
            if time.time() - entry['timestamp'] < entry['ttl']:
                self.stats['hits'] += 1
                return entry['data']
            else:
                # Expiró, eliminar
                del self.cache[key]
                self._remove_dependencies(key)
        
        self.stats['misses'] += 1
        return None
    
    def set(self, key: str, data: Any, cache_type: str = 'default', 
            depends_on: List[str] = None):
        """
        Guardar en cache con dependencias
        
        Args:
            key: Clave del cache
            data: Datos a cachear
            cache_type: Tipo para determinar TTL
            depends_on: Lista de tablas de las que depende este cache
        """
        ttl = self.ttl_config.get(cache_type, 60)
        
        self.cache[key] = {
            'data': data,
            'timestamp': time.time(),
            'ttl': ttl,
            'type': cache_type,
            'depends_on': depends_on or []
        }
        
        # Registrar dependencias
        if depends_on:
            for table in depends_on:
                if table in self.table_dependencies:
                    self.table_dependencies[table].add(key)
    
    def invalidate_table(self, table_name: str):
        """
        Invalidar todo el cache relacionado con una tabla
        Esto se llama cuando hay INSERT, UPDATE o DELETE en esa tabla
        """
        if table_name in self.table_dependencies:
            keys_to_invalidate = list(self.table_dependencies[table_name])
            
            for key in keys_to_invalidate:
                if key in self.cache:
                    del self.cache[key]
                    self.stats['invalidations'] += 1
            
            # Limpiar las dependencias
            self.table_dependencies[table_name].clear()
            
            print(f"🗑️ Invalidado cache de {len(keys_to_invalidate)} items por cambio en tabla '{table_name}'")
    
    def invalidate_pattern(self, pattern: str):
        """Invalidar por patrón (ej: 'products_*')"""
        keys_to_delete = [k for k in self.cache.keys() if pattern in k]
        
        for key in keys_to_delete:
            del self.cache[key]
            self._remove_dependencies(key)
            self.stats['invalidations'] += 1
        
        return len(keys_to_delete)
    
    def _remove_dependencies(self, key: str):
        """Remover key de todas las dependencias"""
        for table_keys in self.table_dependencies.values():
            table_keys.discard(key)
    
    def get_stats(self) -> Dict:
        """Obtener estadísticas del cache"""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'total_items': len(self.cache),
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'hit_rate': f"{hit_rate:.1f}%",
            'invalidations': self.stats['invalidations'],
            'memory_items': len(self.cache)
        }

# ============================================================
# DECORADORES PARA CACHE AUTOMÁTICO
# ============================================================

cache_instance = SmartCache()

def cached(cache_type: str = 'default', depends_on: List[str] = None):
    """
    Decorador para cachear resultados de funciones automáticamente
    
    Uso:
    @cached(cache_type='products', depends_on=['products', 'categories'])
    def get_products_by_category(category_id):
        return db.query("SELECT * FROM products WHERE category_id = ?", category_id)
    """
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Generar key única basada en función y argumentos
            cache_key = f"{func.__name__}_{str(args)}_{str(kwargs)}"
            
            # Intentar obtener del cache
            cached_result = cache_instance.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # No está en cache, ejecutar función
            result = func(*args, **kwargs)
            
            # Guardar en cache
            cache_instance.set(cache_key, result, cache_type, depends_on)
            
            return result
        
        return wrapper
    return decorator

# ============================================================
# ESTRATEGIAS DE INVALIDACIÓN
# ============================================================

class CacheInvalidator:
    """
    Maneja las diferentes estrategias de invalidación
    """
    
    @staticmethod
    def on_insert(table: str, record: Dict):
        """Llamar cuando se inserta un registro"""
        # Invalidar cache relacionado con esta tabla
        cache_instance.invalidate_table(table)
        
        # Lógica específica por tabla
        if table == 'products':
            # También invalidar categorías si cambia el conteo
            cache_instance.invalidate_pattern('categories_with_count')
        
        elif table == 'orders':
            # Invalidar productos hot (más vendidos)
            cache_instance.invalidate_pattern('hot_products')
    
    @staticmethod
    def on_update(table: str, record_id: Any, changes: Dict):
        """Llamar cuando se actualiza un registro"""
        # Invalidar cache relacionado
        cache_instance.invalidate_table(table)
        
        # Invalidación más específica
        if table == 'products':
            # Solo invalidar el producto específico y su categoría
            cache_instance.invalidate_pattern(f'product_{record_id}')
            cache_instance.invalidate_pattern(f'products_category_{changes.get("category_id")}')
    
    @staticmethod
    def on_delete(table: str, record_id: Any):
        """Llamar cuando se elimina un registro"""
        cache_instance.invalidate_table(table)
        
        # Limpiar referencias específicas
        cache_instance.invalidate_pattern(f'{table}_{record_id}')

# ============================================================
# EJEMPLO DE USO EN ENDPOINTS
# ============================================================

class ProductService:
    """
    Ejemplo de servicio con cache integrado
    """
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.cache = cache_instance
        self.invalidator = CacheInvalidator()
    
    @cached(cache_type='products', depends_on=['products', 'categories'])
    def get_products_by_category(self, category_id: int):
        """
        Obtener productos por categoría (con cache automático)
        """
        with self.db.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT p.*, c.name as category_name
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.category_id = %s AND p.available = TRUE
                ORDER BY p.name
            """, (category_id,))
            return cursor.fetchall()
    
    def create_product(self, product_data: Dict):
        """
        Crear producto e invalidar cache automáticamente
        """
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Insertar producto
            cursor.execute("""
                INSERT INTO products (name, category_id, price, available)
                VALUES (%s, %s, %s, %s)
            """, (
                product_data['name'],
                product_data['category_id'],
                product_data['price'],
                product_data.get('available', True)
            ))
            
            conn.commit()
            product_id = cursor.lastrowid
            
            # IMPORTANTE: Invalidar cache después de insertar
            self.invalidator.on_insert('products', product_data)
            
            return {'id': product_id, 'message': 'Producto creado'}
    
    def update_product(self, product_id: int, updates: Dict):
        """
        Actualizar producto e invalidar cache selectivamente
        """
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Construir query dinámico
            set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
            values = list(updates.values()) + [product_id]
            
            cursor.execute(f"""
                UPDATE products 
                SET {set_clause}
                WHERE id = %s
            """, values)
            
            conn.commit()
            
            # Invalidación inteligente
            self.invalidator.on_update('products', product_id, updates)
            
            return {'message': 'Producto actualizado'}
    
    def get_hot_products(self):
        """
        Productos más vendidos (cache agresivo de 1 minuto)
        """
        cache_key = 'hot_products_top10'
        
        # Intentar cache primero
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        # Si no hay cache, consultar
        with self.db.get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT p.*, COUNT(oi.id) as order_count
                FROM products p
                JOIN order_items oi ON p.id = oi.product_id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY p.id
                ORDER BY order_count DESC
                LIMIT 10
            """)
            
            result = cursor.fetchall()
            
            # Cachear con TTL corto (1 minuto) porque es info muy dinámica
            self.cache.set(cache_key, result, 'hot_products', depends_on=['products', 'orders'])
            
            return result

# ============================================================
# MONITOREO Y MÉTRICAS
# ============================================================

def get_cache_report():
    """
    Generar reporte del estado del cache
    """
    stats = cache_instance.get_stats()
    
    report = f"""
    ╔══════════════════════════════════════╗
    ║       REPORTE DE CACHE               ║
    ╠══════════════════════════════════════╣
    ║ Items en cache: {stats['total_items']:>20} ║
    ║ Hits:           {stats['hits']:>20} ║
    ║ Misses:         {stats['misses']:>20} ║
    ║ Hit Rate:       {stats['hit_rate']:>20} ║
    ║ Invalidaciones: {stats['invalidations']:>20} ║
    ╚══════════════════════════════════════╝
    """
    
    return report