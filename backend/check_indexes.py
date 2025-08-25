#!/usr/bin/env python3
"""
Script para analizar índices y performance de la base de datos
"""
import mysql.connector
from tabulate import tabulate

# Configuración MySQL
MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def get_connection():
    return mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)

def check_table_indexes():
    """Verificar todos los índices de las tablas principales"""
    conn = get_connection()
    cursor = conn.cursor()
    
    tables = ['products', 'categories', 'subcategories', 'orders', 'order_items', 'tables', 'users', 'customers']
    
    print("=" * 80)
    print("📊 ANÁLISIS DE ÍNDICES EN LA BASE DE DATOS")
    print("=" * 80)
    
    for table in tables:
        try:
            # Obtener índices de la tabla
            cursor.execute(f"SHOW INDEX FROM {table}")
            indexes = cursor.fetchall()
            
            if indexes:
                print(f"\n📁 Tabla: {table}")
                print("-" * 40)
                
                index_info = []
                for idx in indexes:
                    index_info.append([
                        idx[2],  # Key_name
                        idx[4],  # Column_name
                        idx[1],  # Non_unique
                        idx[10] if len(idx) > 10 else 'BTREE'  # Index_type
                    ])
                
                print(tabulate(index_info, 
                             headers=['Índice', 'Columna', 'No Único', 'Tipo'],
                             tablefmt='grid'))
        except Exception as e:
            print(f"❌ Error con tabla {table}: {e}")
    
    cursor.close()
    conn.close()

def analyze_slow_queries():
    """Analizar queries comunes y ver si usan índices"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("\n" + "=" * 80)
    print("🔍 ANÁLISIS DE QUERIES CRÍTICOS")
    print("=" * 80)
    
    critical_queries = [
        ("Productos por categoría", 
         "SELECT * FROM products WHERE category_id = 1"),
        
        ("Productos por subcategoría",
         "SELECT * FROM products WHERE subcategory_id = 1"),
        
        ("Productos disponibles",
         "SELECT * FROM products WHERE available = TRUE"),
        
        ("Búsqueda de productos",
         "SELECT * FROM products WHERE name LIKE '%pizza%'"),
        
        ("Productos con JOIN categorías",
         """SELECT p.*, c.name as category_name 
            FROM products p 
            JOIN categories c ON p.category_id = c.id 
            WHERE p.category_id = 1"""),
        
        ("Órdenes por mesa",
         "SELECT * FROM orders WHERE table_id = 1 AND status = 'pending'"),
        
        ("Items de orden",
         "SELECT * FROM order_items WHERE order_id = 1"),
        
        ("Productos más vendidos",
         """SELECT product_id, COUNT(*) as total 
            FROM order_items 
            GROUP BY product_id 
            ORDER BY total DESC LIMIT 10""")
    ]
    
    for query_name, query in critical_queries:
        try:
            cursor.execute(f"EXPLAIN {query}")
            explain = cursor.fetchall()
            
            print(f"\n📌 {query_name}")
            print(f"Query: {query[:100]}...")
            print("-" * 40)
            
            for row in explain:
                table = row[0] if row[0] else 'N/A'
                type_ = row[3] if row[3] else 'N/A'
                key = row[5] if row[5] else 'NO INDEX'
                rows = row[8] if row[8] else 'N/A'
                extra = row[9] if row[9] else ''
                
                # Análisis
                if key == 'NO INDEX':
                    status = "⚠️ SIN ÍNDICE"
                elif type_ == 'ALL':
                    status = "❌ FULL SCAN"
                elif type_ in ['ref', 'eq_ref', 'const']:
                    status = "✅ ÓPTIMO"
                else:
                    status = "⚡ ACEPTABLE"
                
                print(f"  Tabla: {table}")
                print(f"  Tipo: {type_} | Índice: {key} | Filas: {rows}")
                print(f"  Estado: {status}")
                if extra:
                    print(f"  Extra: {extra}")
                    
        except Exception as e:
            print(f"❌ Error analizando query: {e}")
    
    cursor.close()
    conn.close()

def suggest_missing_indexes():
    """Sugerir índices que faltan"""
    print("\n" + "=" * 80)
    print("💡 RECOMENDACIONES DE ÍNDICES")
    print("=" * 80)
    
    suggestions = []
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verificar índices existentes
    cursor.execute("""
        SELECT TABLE_NAME, COLUMN_NAME, INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = 'gastro'
    """)
    existing = cursor.fetchall()
    existing_indexes = {(row[0], row[1]) for row in existing}
    
    # Sugerencias basadas en queries comunes
    needed_indexes = [
        ('products', 'category_id', 'Filtrar productos por categoría'),
        ('products', 'subcategory_id', 'Filtrar productos por subcategoría'),
        ('products', 'available', 'Filtrar solo productos disponibles'),
        ('products', 'name', 'Búsqueda por nombre'),
        ('orders', 'table_id', 'Órdenes por mesa'),
        ('orders', 'status', 'Filtrar por estado'),
        ('orders', 'created_at', 'Ordenar por fecha'),
        ('order_items', 'order_id', 'Items de una orden'),
        ('order_items', 'product_id', 'Estadísticas de productos'),
        ('customers', 'email', 'Login de clientes'),
        ('users', 'email', 'Login de usuarios'),
    ]
    
    print("\n🔧 Índices recomendados:")
    for table, column, reason in needed_indexes:
        if (table, column) not in existing_indexes:
            suggestions.append(f"CREATE INDEX idx_{table}_{column} ON {table}({column});")
            print(f"  ❌ FALTA: {table}.{column} - {reason}")
        else:
            print(f"  ✅ EXISTE: {table}.{column}")
    
    if suggestions:
        print("\n📝 Script SQL para crear índices faltantes:")
        print("-" * 40)
        for sql in suggestions:
            print(sql)
    else:
        print("\n✅ Todos los índices importantes están creados")
    
    cursor.close()
    conn.close()

def check_table_stats():
    """Ver estadísticas de las tablas"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("\n" + "=" * 80)
    print("📈 ESTADÍSTICAS DE TABLAS")
    print("=" * 80)
    
    cursor.execute("""
        SELECT 
            TABLE_NAME,
            TABLE_ROWS,
            ROUND(DATA_LENGTH/1024/1024, 2) as 'Data_MB',
            ROUND(INDEX_LENGTH/1024/1024, 2) as 'Index_MB'
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = 'gastro'
        ORDER BY TABLE_ROWS DESC
    """)
    
    stats = cursor.fetchall()
    
    print(tabulate(stats, 
                   headers=['Tabla', 'Filas', 'Datos (MB)', 'Índices (MB)'],
                   tablefmt='grid'))
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    try:
        # 1. Ver índices actuales
        check_table_indexes()
        
        # 2. Analizar queries críticos
        analyze_slow_queries()
        
        # 3. Sugerir índices faltantes
        suggest_missing_indexes()
        
        # 4. Estadísticas de tablas
        check_table_stats()
        
        print("\n" + "=" * 80)
        print("✅ ANÁLISIS COMPLETADO")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error general: {e}")