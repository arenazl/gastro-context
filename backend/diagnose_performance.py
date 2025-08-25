#!/usr/bin/env python3
"""
Script de diagnóstico de performance para identificar por qué tarda 5 segundos
"""
import time
import mysql.connector
from decimal import Decimal

# Configuración MySQL
MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def measure_time(func):
    """Decorador para medir tiempo"""
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"⏱️  {func.__name__}: {elapsed:.3f} segundos")
        return result
    return wrapper

@measure_time
def test_connection():
    """Medir tiempo de conexión"""
    conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
    conn.close()
    return True

@measure_time
def test_simple_query():
    """Query simple para medir latencia base"""
    conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    cursor.fetchall()
    cursor.close()
    conn.close()

@measure_time
def test_products_query():
    """Query real de productos"""
    conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, c.name as category_name, s.name as subcategory_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories s ON p.subcategory_id = s.id
        WHERE p.category_id = 1
        LIMIT 6
    """)
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return len(result)

@measure_time
def test_with_pool():
    """Test con pool de conexiones"""
    import mysql.connector.pooling
    
    pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="test_pool",
        pool_size=3,
        **MYSQL_CONFIG,
        ssl_disabled=False
    )
    
    times = []
    for i in range(5):
        start = time.time()
        conn = pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products WHERE category_id = 1 LIMIT 6")
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        elapsed = time.time() - start
        times.append(elapsed)
        print(f"  Query {i+1}: {elapsed:.3f}s")
    
    print(f"  Promedio: {sum(times)/len(times):.3f}s")
    return True

@measure_time
def check_indexes():
    """Verificar índices en la tabla products"""
    conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
    cursor = conn.cursor()
    
    # Ver índices
    cursor.execute("SHOW INDEX FROM products")
    indexes = cursor.fetchall()
    print("\n📊 Índices en tabla products:")
    for idx in indexes:
        print(f"  - {idx[2]} en columna {idx[4]}")
    
    # Ver plan de ejecución
    cursor.execute("EXPLAIN SELECT * FROM products WHERE category_id = 1")
    plan = cursor.fetchall()
    print("\n🔍 Plan de ejecución del query:")
    for row in plan:
        print(f"  - Type: {row[3]}, Rows: {row[8]}, Extra: {row[9]}")
    
    cursor.close()
    conn.close()

print("=" * 60)
print("🔬 DIAGNÓSTICO DE PERFORMANCE - GASTRO SYSTEM")
print("=" * 60)

# 1. Test de conexión
print("\n1️⃣ TIEMPO DE CONEXIÓN:")
test_connection()

# 2. Query simple
print("\n2️⃣ QUERY SIMPLE (SELECT 1):")
test_simple_query()

# 3. Query real de productos
print("\n3️⃣ QUERY DE PRODUCTOS (6 registros):")
count = test_products_query()
print(f"  Registros obtenidos: {count}")

# 4. Test con pool
print("\n4️⃣ TEST CON POOL DE CONEXIONES (5 queries):")
test_with_pool()

# 5. Verificar índices
print("\n5️⃣ VERIFICACIÓN DE ÍNDICES:")
check_indexes()

print("\n" + "=" * 60)
print("📈 ANÁLISIS COMPLETO")
print("=" * 60)

# Diagnóstico final
print("""
🎯 DIAGNÓSTICO:
- Si la conexión tarda > 1 segundo: Problema de red/latencia
- Si SELECT 1 tarda > 0.1 segundos: Alta latencia con servidor
- Si products query tarda > 0.5 segundos: Falta índice o query mal optimizado
- Si el pool es mucho más rápido: El problema es crear conexiones nuevas
""")