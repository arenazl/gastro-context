"""
Configuración automática para detectar y usar la base de datos de Heroku
Compatible con ClearDB, JawsDB y Aiven
"""

import os
from urllib.parse import urlparse

def get_database_config():
    """
    Detecta y parsea automáticamente la configuración de la base de datos
    desde las variables de entorno de Heroku
    """
    
    # Intentar obtener URLs de diferentes addons
    cleardb_url = os.environ.get('CLEARDB_DATABASE_URL')
    jawsdb_url = os.environ.get('JAWSDB_URL')
    database_url = os.environ.get('DATABASE_URL')
    
    # Si hay variables individuales configuradas, usarlas
    if os.environ.get('MYSQL_HOST'):
        return {
            'host': os.environ.get('MYSQL_HOST'),
            'port': int(os.environ.get('MYSQL_PORT', 3306)),
            'user': os.environ.get('MYSQL_USER'),
            'password': os.environ.get('MYSQL_PASSWORD'),
            'database': os.environ.get('MYSQL_DATABASE'),
            'type': 'mysql'
        }
    
    # Parsear URL de ClearDB
    if cleardb_url:
        return parse_mysql_url(cleardb_url)
    
    # Parsear URL de JawsDB
    if jawsdb_url:
        return parse_mysql_url(jawsdb_url)
    
    # Parsear DATABASE_URL genérica
    if database_url:
        if database_url.startswith('mysql://'):
            return parse_mysql_url(database_url)
        elif database_url.startswith('postgres://'):
            print("⚠️ PostgreSQL detectado - necesitas modificar el código para usar psycopg2")
            return parse_postgres_url(database_url)
    
    # Configuración por defecto (Aiven)
    return {
        'host': 'mysql-aiven-arenazl.e.aivencloud.com',
        'port': 23108,
        'user': 'avnadmin',
        'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
        'database': 'gastro',
        'type': 'mysql'
    }

def parse_mysql_url(url):
    """Parsea una URL de MySQL"""
    # mysql://usuario:password@host:puerto/database?params
    
    # Remover parámetros de query si existen
    if '?' in url:
        url = url.split('?')[0]
    
    parsed = urlparse(url)
    
    return {
        'host': parsed.hostname,
        'port': parsed.port or 3306,
        'user': parsed.username,
        'password': parsed.password,
        'database': parsed.path.lstrip('/'),
        'type': 'mysql'
    }

def parse_postgres_url(url):
    """Parsea una URL de PostgreSQL"""
    parsed = urlparse(url)
    
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'user': parsed.username,
        'password': parsed.password,
        'database': parsed.path.lstrip('/'),
        'type': 'postgres'
    }

# Obtener configuración automáticamente
DB_CONFIG = get_database_config()

# Exportar variables para uso en el servidor
MYSQL_HOST = DB_CONFIG['host']
MYSQL_PORT = DB_CONFIG['port']
MYSQL_USER = DB_CONFIG['user']
MYSQL_PASSWORD = DB_CONFIG['password']
MYSQL_DATABASE = DB_CONFIG['database']
DB_TYPE = DB_CONFIG['type']

# Mostrar configuración detectada (sin password)
print(f"🔧 Base de datos configurada:")
print(f"   Tipo: {DB_TYPE}")
print(f"   Host: {MYSQL_HOST}")
print(f"   Puerto: {MYSQL_PORT}")
print(f"   Database: {MYSQL_DATABASE}")
print(f"   Usuario: {MYSQL_USER}")