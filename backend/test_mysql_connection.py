#!/usr/bin/env python3
"""
Probar conexión real a MySQL Aiven
"""
import mysql.connector

def test_mysql_aiven():
    """Probar conexión completa a MySQL Aiven"""
    config = {
        'host': 'mysql-aiven-arenazl.e.aivencloud.com',
        'port': 23108,
        'user': 'avnadmin',
        'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
        'database': 'gastro'
    }
    
    try:
        print("🔌 Conectando a MySQL Aiven...")
        connection = mysql.connector.connect(**config)
        
        print("✅ Conexión exitosa!")
        
        # Probar consulta simple
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"📊 Tablas encontradas ({len(tables)}):")
        for table in tables:
            print(f"  - {table}")
            
        # Probar consulta de categorías
        cursor.execute("SELECT COUNT(*) as count FROM categories")
        result = cursor.fetchone()
        print(f"🏷️  Categorías en BD: {result['count']}")
        
        # Probar consulta con filtro is_active
        cursor.execute("SELECT id, name, is_active FROM categories LIMIT 5")
        categories = cursor.fetchall()
        print(f"📋 Primeras 5 categorías:")
        for cat in categories:
            print(f"  - {cat['id']}: {cat['name']} (Active: {cat['is_active']})")
            
        cursor.close()
        connection.close()
        
        print("🎉 CONEXIÓN EXITOSA - Base de datos funcionando!")
        return True
        
    except mysql.connector.Error as e:
        print(f"❌ Error MySQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    success = test_mysql_aiven()
    exit(0 if success else 1)