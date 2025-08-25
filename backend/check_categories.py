#!/usr/bin/env python3
"""
Verificar categorías y subcategorías existentes
"""
import mysql.connector

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
cursor = conn.cursor(dictionary=True)

# Ver categorías
print("CATEGORÍAS:")
cursor.execute("SELECT * FROM categories WHERE name LIKE '%bebida%' OR name LIKE '%drink%'")
for cat in cursor.fetchall():
    print(f"  ID: {cat['id']}, Nombre: {cat['name']}")

# Ver subcategorías de bebidas
print("\nSUBCATEGORÍAS DE BEBIDAS:")
cursor.execute("""
    SELECT s.*, c.name as category_name 
    FROM subcategories s
    JOIN categories c ON s.category_id = c.id
    WHERE c.name LIKE '%bebida%' OR s.name LIKE '%sin alcohol%' OR s.name LIKE '%coctel%'
""")
for sub in cursor.fetchall():
    print(f"  ID: {sub['id']}, Nombre: {sub['name']}, Categoría: {sub['category_name']}")

cursor.close()
conn.close()