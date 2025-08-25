#!/usr/bin/env python3
"""
Verificar estructura real de las tablas
"""
import mysql.connector

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def check_table_structure(table_name):
    """Ver estructura de una tabla"""
    try:
        connection = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(f"DESCRIBE {table_name}")
        columns = cursor.fetchall()
        
        print(f"\n📋 TABLA: {table_name}")
        print("=" * 50)
        for col in columns:
            print(f"  {col['Field']:20} | {col['Type']:15} | NULL: {col['Null']} | Key: {col['Key']}")
        
        cursor.close()
        connection.close()
        
        return columns
        
    except Exception as e:
        print(f"❌ Error con tabla {table_name}: {e}")
        return None

def check_all_tables():
    """Verificar estructura de todas las tablas importantes"""
    tables = ['categories', 'subcategories', 'products', 'tables', 'customers']
    
    for table in tables:
        check_table_structure(table)

if __name__ == "__main__":
    check_all_tables()