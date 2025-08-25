#!/usr/bin/env python3
"""
Script para descargar las imágenes faltantes
"""
import mysql.connector
import os
import requests
import time

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

IMAGES_DIR = '/mnt/c/Code/gastro-context/backend/static/products'

# Imágenes genéricas por categoría (como fallback)
CATEGORY_DEFAULTS = {
    1: 'https://images.pexels.com/photos/604969/pexels-photo-604969.jpeg?auto=compress&cs=tinysrgb&w=400',  # Entradas
    2: 'https://images.pexels.com/photos/1707270/pexels-photo-1707270.jpeg?auto=compress&cs=tinysrgb&w=400', # Sopas
    3: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', # Ensaladas
    4: 'https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=400',  # Carnes
    5: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=400',  # Pescados
    6: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400', # Pastas
    7: 'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=400',  # Pizzas
    8: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400', # Pollo
    9: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400', # Vegetarianos
    10: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=400', # Postres
    11: 'https://images.pexels.com/photos/109275/pexels-photo-109275.jpeg?auto=compress&cs=tinysrgb&w=400', # Bebidas
    12: 'https://images.pexels.com/photos/1123260/pexels-photo-1123260.jpeg?auto=compress&cs=tinysrgb&w=400', # Vinos
}

connection = mysql.connector.connect(**MYSQL_CONFIG)
cursor = connection.cursor(dictionary=True)

# Obtener todos los productos
cursor.execute('''
    SELECT id, name, image_url, category_id 
    FROM products 
    WHERE available = 1
''')

products = cursor.fetchall()

print(f'📥 DESCARGANDO IMÁGENES FALTANTES')
print('=' * 60)

missing = 0
downloaded = 0

for product in products:
    if product['image_url'] and not product['image_url'].startswith('http'):
        # Es un nombre de archivo local
        filepath = os.path.join(IMAGES_DIR, product['image_url'])
        
        if not os.path.exists(filepath):
            missing += 1
            print(f'  ❌ Falta: {product["image_url"]} para {product["name"]}')
            
            # Descargar imagen genérica de la categoría
            try:
                default_url = CATEGORY_DEFAULTS.get(product['category_id'], CATEGORY_DEFAULTS[1])
                print(f'     ⬇️  Descargando imagen genérica...', end='')
                
                response = requests.get(default_url, timeout=10)
                response.raise_for_status()
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                print(' ✓')
                downloaded += 1
                time.sleep(0.5)
                
            except Exception as e:
                print(f' ✗ Error: {str(e)[:50]}')

print(f'\n📊 RESUMEN:')
print(f'  • Faltantes detectados: {missing}')
print(f'  • Descargados: {downloaded}')

cursor.close()
connection.close()