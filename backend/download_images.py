#!/usr/bin/env python3
"""
Script para descargar todas las imágenes de productos desde Pexels
y guardarlas localmente para preparar migración a S3
"""
import mysql.connector
import requests
import os
import time
from urllib.parse import urlparse
import re

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Carpeta donde guardaremos las imágenes
IMAGES_DIR = '/mnt/c/Code/gastro-context/backend/static/products'

def sanitize_filename(name):
    """Convierte nombre de producto a nombre de archivo válido"""
    # Remover caracteres especiales y espacios
    name = name.lower()
    name = re.sub(r'[áàäâ]', 'a', name)
    name = re.sub(r'[éèëê]', 'e', name)
    name = re.sub(r'[íìïî]', 'i', name)
    name = re.sub(r'[óòöô]', 'o', name)
    name = re.sub(r'[úùüû]', 'u', name)
    name = re.sub(r'[ñ]', 'n', name)
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = name.strip('-')
    return name

# Crear directorio si no existe
os.makedirs(IMAGES_DIR, exist_ok=True)

connection = mysql.connector.connect(**MYSQL_CONFIG)
cursor = connection.cursor(dictionary=True)

# Obtener todos los productos con sus URLs de imagen
cursor.execute('''
    SELECT id, name, image_url 
    FROM products 
    WHERE image_url IS NOT NULL 
    AND image_url != ''
    AND available = 1
''')

products = cursor.fetchall()
print(f'📥 DESCARGANDO {len(products)} IMÁGENES DE PRODUCTOS')
print('=' * 60)

downloaded = 0
failed = 0
updates = []

for product in products:
    product_id = product['id']
    product_name = product['name']
    image_url = product['image_url']
    
    # Generar nombre de archivo basado en el nombre del producto
    filename = f"{sanitize_filename(product_name)}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)
    
    # Si ya existe, no descargar de nuevo
    if os.path.exists(filepath):
        print(f'  ⏭️  {product_name} → {filename} (ya existe)')
        updates.append((filename, product_id))
        continue
    
    try:
        # Descargar imagen
        print(f'  ⬇️  {product_name} → {filename}', end='')
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Guardar imagen
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        print(' ✓')
        downloaded += 1
        updates.append((filename, product_id))
        
        # Pequeña pausa para no saturar
        time.sleep(0.5)
        
    except Exception as e:
        print(f' ✗ Error: {str(e)[:50]}')
        failed += 1

print(f'\n📊 RESUMEN:')
print(f'  • Descargadas: {downloaded}')
print(f'  • Ya existían: {len(updates) - downloaded}')
print(f'  • Fallidas: {failed}')

# Actualizar base de datos con nombres de archivo locales
print(f'\n🔄 ACTUALIZANDO BASE DE DATOS...')
for filename, product_id in updates:
    cursor.execute('''
        UPDATE products 
        SET image_url = %s
        WHERE id = %s
    ''', (filename, product_id))

connection.commit()
print(f'✅ {len(updates)} productos actualizados con rutas locales')

cursor.close()
connection.close()

print(f'\n📁 Imágenes guardadas en: {IMAGES_DIR}')
print('🎯 Próximo paso: Configurar adaptador de imágenes en el backend')