#!/usr/bin/env python3
"""
Corregir URLs de mocktails - solo nombre de archivo
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
cursor = conn.cursor()

print("🔧 Corrigiendo URLs de mocktails...")

# Actualizar para que solo quede el nombre del archivo
cursor.execute("""
    UPDATE products 
    SET image_url = SUBSTRING_INDEX(image_url, '/', -1)
    WHERE category_id = 11 
    AND subcategory_id = 48
    AND image_url LIKE '%/%'
""")

affected = cursor.rowcount
conn.commit()

print(f"✅ {affected} URLs corregidas")

# Verificar algunos ejemplos
cursor.execute("""
    SELECT id, name, image_url 
    FROM products 
    WHERE category_id = 11 AND subcategory_id = 48 
    LIMIT 5
""")

print("\n📊 Ejemplos de URLs corregidas:")
for row in cursor.fetchall():
    print(f"   {row[1]}: {row[2]}")

cursor.close()
conn.close()