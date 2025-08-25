#!/usr/bin/env python3
"""
Debug del servidor para ver errores específicos
"""
import mysql.connector

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def execute_mysql_query(query, params=None):
    """Debug de la función de conexión"""
    try:
        print(f"🔍 Ejecutando query: {query}")
        print(f"📊 Params: {params}")
        
        connection = mysql.connector.connect(
            host=MYSQL_CONFIG['host'],
            port=MYSQL_CONFIG['port'],
            user=MYSQL_CONFIG['user'],
            password=MYSQL_CONFIG['password'],
            database=MYSQL_CONFIG['database'],
            ssl_disabled=False
        )
        
        print("✅ Conexión exitosa")
        
        cursor = connection.cursor(dictionary=True)
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        result = cursor.fetchall()
        print(f"📋 Resultado: {len(result)} filas")
        
        cursor.close()
        connection.close()
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"❌ Tipo: {type(e)}")
        return None

def test_categories():
    """Probar query de categorías"""
    print("=== PROBANDO CATEGORÍAS ===")
    query = """
    SELECT id, name, icon, color, display_order, is_active
    FROM categories 
    WHERE is_active = 1
    ORDER BY display_order ASC
    """
    
    result = execute_mysql_query(query)
    if result:
        print("🎉 SUCCESS!")
        for cat in result[:3]:
            print(f"  - {cat}")
    else:
        print("💥 FAILED!")

if __name__ == "__main__":
    test_categories()