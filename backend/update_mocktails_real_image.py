#!/usr/bin/env python3
"""
Actualizar todos los mocktails para usar una imagen REAL que existe
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

print("🔧 Actualizando mocktails con imagen REAL...")

# La imagen que SÍ existe
IMAGEN_REAL = "mojito-virgin.jpg"

# Actualizar TODOS los mocktails con esta imagen real
cursor.execute("""
    UPDATE products 
    SET image_url = %s
    WHERE category_id = 11 
    AND subcategory_id = 48
""", (IMAGEN_REAL,))

affected = cursor.rowcount
conn.commit()

print(f"✅ {affected} mocktails actualizados con imagen REAL: {IMAGEN_REAL}")

# Verificar
cursor.execute("""
    SELECT id, name, image_url 
    FROM products 
    WHERE category_id = 11 AND subcategory_id = 48 
    LIMIT 5
""")

print("\n📊 Verificación:")
for row in cursor.fetchall():
    print(f"   {row[1]}: {row[2]}")

print(f"\n✅ Todos los mocktails ahora usan una imagen que SÍ existe en el servidor")

cursor.close()
conn.close()