#!/usr/bin/env python3
import requests
import os
import mysql.connector
from urllib.parse import urlparse

# Conectar a BD
conn = mysql.connector.connect(
    host='mysql-aiven-arenazl.e.aivencloud.com',
    port=23108,
    user='avnadmin',
    password='AVNS_Fqe0qsChCHnqSnVsvoi',
    database='gastro'
)

cursor = conn.cursor()
cursor.execute("SELECT id, name, image_url FROM products WHERE image_url LIKE '%s3.amazonaws%' LIMIT 10")
products = cursor.fetchall()

print(f"Descargando {len(products)} imágenes...")

for pid, name, url in products:
    try:
        filename = url.split('/')[-1]
        filepath = f"backend/static/products/{filename}"
        
        # Intenta descargar
        response = requests.get(url)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"✅ {filename}")
            
            # Actualizar BD con URL local
            new_url = f"http://172.29.228.80:9002/static/products/{filename}"
            cursor.execute("UPDATE products SET image_url = %s WHERE id = %s", (new_url, pid))
        else:
            print(f"❌ {filename} - Error {response.status_code}")
    except Exception as e:
        print(f"❌ {name}: {e}")

conn.commit()
conn.close()
print("✅ Listo!")
