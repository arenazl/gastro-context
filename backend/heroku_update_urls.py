#!/usr/bin/env python3
"""
Script para ejecutar en Heroku y actualizar las URLs de imágenes
"""
import mysql.connector
import os

# Usar las variables de entorno de Heroku
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'mysql-aiven-arenazl.e.aivencloud.com'),
    'port': int(os.environ.get('DB_PORT', 23108)),
    'database': os.environ.get('DB_NAME', 'gastro'),
    'user': os.environ.get('DB_USER', 'avnadmin'),
    'password': os.environ.get('DB_PASSWORD', 'AVNS_Fqe0qsChCHnqSnVsvoi'),
    'ssl_verify_cert': False
}

try:
    print("Conectando a la base de datos...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Desactivar safe mode
    cursor.execute("SET SQL_SAFE_UPDATES = 0")
    
    # Actualizar todas las URLs para usar S3
    updates = [
        ("UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-clasica.jpg' WHERE name LIKE '%Hamburguesa%' AND (name LIKE '%Classic%' OR name LIKE '%Clásica%')", None),
        ("UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-margherita.jpg' WHERE name LIKE '%Margherita%' OR name LIKE '%Margarita%'", None),
        ("UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/bife-de-chorizo.jpg' WHERE name LIKE '%Bife%Chorizo%'", None),
        ("UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ensalada-caesar.jpg' WHERE name LIKE '%Caesar%' OR name LIKE '%César%'", None),
        ("UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/coca-cola.jpg' WHERE name = 'Coca Cola' OR name LIKE '%Coca-Cola%'", None),
        ("UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/cerveza-artesanal.jpg' WHERE name LIKE '%Cerveza%'", None),
    ]
    
    for query, params in updates:
        cursor.execute(query, params)
        print(f"Actualizado: {cursor.rowcount} productos")
    
    # Actualizar todas las URLs que apuntan a localhost
    cursor.execute("""
        UPDATE products 
        SET image_url = REPLACE(image_url, 
            'http://172.29.228.80:9002/static/products/', 
            'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/')
        WHERE image_url LIKE 'http://172.29.228.80%'
    """)
    print(f"URLs locales actualizadas: {cursor.rowcount}")
    
    conn.commit()
    
    # Verificar algunos resultados
    cursor.execute("SELECT name, image_url FROM products LIMIT 5")
    print("\nEjemplos de productos actualizados:")
    for name, url in cursor.fetchall():
        print(f"- {name}: {url}")
    
    cursor.close()
    conn.close()
    print("\n✅ Actualización completada!")
    
except Exception as e:
    print(f"❌ Error: {e}")