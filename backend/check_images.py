#!/usr/bin/env python3
"""
Script para revisar las imágenes asignadas a los productos
"""
import mysql.connector

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

connection = mysql.connector.connect(**MYSQL_CONFIG)
cursor = connection.cursor(dictionary=True)

# Ver productos con sus imágenes
cursor.execute('''
    SELECT 
        p.id,
        p.name,
        c.name as categoria,
        p.image_url
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.available = 1
    ORDER BY c.id, p.name
    LIMIT 40
''')

print('PRODUCTOS Y SUS IMÁGENES:')
print('=' * 80)

productos = cursor.fetchall()
current_cat = None

for p in productos:
    new_cat = p['categoria']
    if current_cat != new_cat:
        current_cat = new_cat
        print(f'\n{current_cat.upper()}:')
        print('-' * 40)
    
    # Extraer parte clave de la URL de imagen
    img = p['image_url'] if p['image_url'] else 'SIN IMAGEN'
    if 'pexels' in str(img):
        # Extraer el ID de la imagen de Pexels
        parts = img.split('/')
        if 'pexels-photo-' in img:
            img_id = img.split('pexels-photo-')[1].split('.')[0]
            img_short = f'Pexels #{img_id}'
        else:
            img_short = 'Pexels (generic)'
    else:
        img_short = img[:40] + '...' if len(str(img)) > 40 else img
    
    print(f'{p["id"]:3} | {p["name"]:30} | {img_short}')

# Ver cuántas imágenes únicas hay
cursor.execute('''
    SELECT 
        image_url,
        COUNT(*) as veces_usada
    FROM products
    WHERE image_url IS NOT NULL
    GROUP BY image_url
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 15
''')

print('\n\nIMÁGENES MÁS REPETIDAS:')
print('=' * 80)

for row in cursor.fetchall():
    url = row['image_url']
    if 'pexels' in url and 'pexels-photo-' in url:
        img_id = url.split('pexels-photo-')[1].split('.')[0]
        print(f'  • Pexels #{img_id} → Usada {row["veces_usada"]} veces')
    else:
        print(f'  • {url[:50]}... → Usada {row["veces_usada"]} veces')

# Productos sin imagen
cursor.execute('''
    SELECT COUNT(*) as total
    FROM products
    WHERE image_url IS NULL OR image_url = ''
''')
sin_imagen = cursor.fetchone()['total']

print(f'\n📊 RESUMEN:')
print(f'  • Productos sin imagen: {sin_imagen}')
print(f'  • Total productos revisados: {len(productos)}')

cursor.close()
connection.close()