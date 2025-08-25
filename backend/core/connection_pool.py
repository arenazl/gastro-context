"""
Pool de conexiones optimizado para MySQL con mejores prácticas
"""
import mysql.connector.pooling
from mysql.connector import Error
import threading
import time
import logging
from contextlib import contextmanager
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class OptimizedConnectionPool:
    """
    Pool de conexiones MySQL optimizado con:
    - Singleton pattern
    - Context managers para auto-liberación
    - Health checks automáticos
    - Métricas de uso
    - Circuit breaker pattern
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.pool = None
            self.config = None
            self.metrics = {
                'connections_created': 0,
                'connections_reused': 0,
                'connections_failed': 0,
                'active_connections': 0,
                'wait_time_total': 0,
                'queries_executed': 0
            }
            self.circuit_breaker = {
                'failures': 0,
                'last_failure': None,
                'is_open': False,
                'threshold': 5,
                'timeout': 60
            }
            self.initialized = True
    
    def initialize(self, config: Dict[str, Any]):
        """
        Inicializar el pool con configuración optimizada
        """
        self.config = config
        
        # Configuración óptima para restaurante
        pool_config = {
            'pool_name': 'gastro_optimized_pool',
            'pool_size': config.get('pool_size', 10),  # Inicio con 10 conexiones
            'pool_reset_session': True,  # Limpiar sesión entre usos
            'host': config['host'],
            'port': config['port'],
            'user': config['user'],
            'password': config['password'],
            'database': config['database'],
            'ssl_disabled': config.get('ssl_disabled', False),
            'autocommit': True,
            'use_pure': False,  # Usar implementación en C (más rápida)
            'raise_on_warnings': False,
            'connection_timeout': 10,
            'buffered': True,  # Buffer results para mejor performance
            'get_warnings': False,
            'sql_mode': 'TRADITIONAL',
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        
        try:
            self.pool = mysql.connector.pooling.MySQLConnectionPool(**pool_config)
            logger.info(f"✅ Pool inicializado con {pool_config['pool_size']} conexiones")
            return True
        except Error as e:
            logger.error(f"❌ Error creando pool: {e}")
            self._handle_circuit_breaker()
            return False
    
    def _handle_circuit_breaker(self):
        """
        Implementar circuit breaker para fallar rápido
        """
        self.circuit_breaker['failures'] += 1
        self.circuit_breaker['last_failure'] = time.time()
        
        if self.circuit_breaker['failures'] >= self.circuit_breaker['threshold']:
            self.circuit_breaker['is_open'] = True
            logger.warning("⚠️ Circuit breaker ABIERTO - BD no disponible")
    
    def _check_circuit_breaker(self) -> bool:
        """
        Verificar si el circuit breaker permite intentar conexión
        """
        if not self.circuit_breaker['is_open']:
            return True
        
        # Ver si pasó el timeout para reintentar
        if time.time() - self.circuit_breaker['last_failure'] > self.circuit_breaker['timeout']:
            self.circuit_breaker['is_open'] = False
            self.circuit_breaker['failures'] = 0
            logger.info("🔄 Circuit breaker CERRADO - Reintentando conexiones")
            return True
        
        return False
    
    @contextmanager
    def get_connection(self):
        """
        Context manager para obtener y liberar conexiones automáticamente
        
        Uso:
        with pool.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query)
            result = cursor.fetchall()
        """
        if not self._check_circuit_breaker():
            raise Exception("Circuit breaker abierto - BD no disponible")
        
        connection = None
        start_time = time.time()
        
        try:
            # Obtener conexión del pool
            connection = self.pool.get_connection()
            wait_time = time.time() - start_time
            
            # Actualizar métricas
            self.metrics['connections_reused'] += 1
            self.metrics['wait_time_total'] += wait_time
            self.metrics['active_connections'] += 1
            
            # Health check - verificar que la conexión esté viva
            if not connection.is_connected():
                connection.reconnect(attempts=3, delay=1)
            
            yield connection
            
        except Error as e:
            self.metrics['connections_failed'] += 1
            self._handle_circuit_breaker()
            logger.error(f"Error obteniendo conexión: {e}")
            raise
            
        finally:
            if connection and connection.is_connected():
                # Importante: cerrar cursores antes de devolver al pool
                for cursor in connection._cursors:
                    cursor.close()
                connection.close()  # Devuelve al pool, no cierra realmente
                self.metrics['active_connections'] -= 1
    
    @contextmanager
    def execute_query(self, query: str, params: Optional[tuple] = None, dictionary: bool = True):
        """
        Ejecutar query directamente con manejo automático
        
        Uso:
        with pool.execute_query("SELECT * FROM products WHERE id = %s", (1,)) as result:
            for row in result:
                print(row)
        """
        with self.get_connection() as connection:
            cursor = connection.cursor(dictionary=dictionary)
            try:
                cursor.execute(query, params) if params else cursor.execute(query)
                result = cursor.fetchall()
                self.metrics['queries_executed'] += 1
                yield result
            finally:
                cursor.close()
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Obtener métricas del pool para monitoreo
        """
        avg_wait = 0
        if self.metrics['connections_reused'] > 0:
            avg_wait = self.metrics['wait_time_total'] / self.metrics['connections_reused']
        
        return {
            'connections_created': self.metrics['connections_created'],
            'connections_reused': self.metrics['connections_reused'],
            'connections_failed': self.metrics['connections_failed'],
            'active_connections': self.metrics['active_connections'],
            'queries_executed': self.metrics['queries_executed'],
            'average_wait_time': round(avg_wait, 3),
            'circuit_breaker_open': self.circuit_breaker['is_open'],
            'pool_size': self.pool.pool_size if self.pool else 0
        }
    
    def health_check(self) -> bool:
        """
        Verificar salud del pool
        """
        try:
            with self.execute_query("SELECT 1") as result:
                return len(result) > 0
        except:
            return False
    
    def close(self):
        """
        Cerrar todas las conexiones del pool
        """
        if self.pool:
            # Cerrar todas las conexiones activas
            for conn_id in list(self.pool._cnx_pool.keys()):
                try:
                    conn = self.pool._cnx_pool[conn_id]
                    if conn and conn.is_connected():
                        conn.close()
                except:
                    pass
            logger.info("🔒 Pool de conexiones cerrado")

# Singleton global
connection_pool = OptimizedConnectionPool()

# Función helper para usar en el código existente
def get_pool():
    """Obtener instancia del pool singleton"""
    return connection_pool