#!/usr/bin/env python3
"""
Corregir URLs de imágenes - quitar /static/ del principio
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

print("🔧 Corrigiendo URLs de imágenes...")

# Primero ver cuántas tienen /static/
cursor.execute("SELECT COUNT(*) FROM products WHERE image_url LIKE '/static/%'")
count = cursor.fetchone()[0]
print(f"   URLs con /static/: {count}")

# Actualizar quitando /static/ del principio
cursor.execute("""
    UPDATE products 
    SET image_url = REPLACE(image_url, '/static/products/', 'products/')
    WHERE image_url LIKE '/static/products/%'
""")

affected = cursor.rowcount
conn.commit()

print(f"✅ {affected} URLs corregidas")

# Verificar
cursor.execute("SELECT id, name, image_url FROM products WHERE category_id = 11 LIMIT 3")
for row in cursor.fetchall():
    print(f"   ID {row[0]}: {row[2]}")

cursor.close()
conn.close()