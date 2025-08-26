#!/usr/bin/env python3
"""
Script rápido para actualizar URLs de productos con S3
Para ejecutar desde Heroku o localmente
"""

import os

# Script SQL para actualizar las URLs
sql_script = """
-- Desactivar safe mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Actualizar productos específicos con sus imágenes de S3
UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-clasica.jpg' 
WHERE name LIKE '%Hamburguesa%Clásica%' OR name LIKE '%Classic%Burger%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-doble.jpg' 
WHERE name LIKE '%Hamburguesa%Doble%' OR name LIKE '%Double%Burger%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-bacon.jpg' 
WHERE name LIKE '%Bacon%' AND name LIKE '%Hamburguesa%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-margherita.jpg' 
WHERE name LIKE '%Margherita%' OR name LIKE '%Margarita%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-pepperoni.jpg' 
WHERE name LIKE '%Pepperoni%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-cuatro-quesos.jpg' 
WHERE name LIKE '%4%Quesos%' OR name LIKE '%Cuatro%Quesos%' OR name LIKE '%Four%Cheese%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/bife-de-chorizo.jpg' 
WHERE name LIKE '%Bife%Chorizo%' OR name LIKE '%Steak%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ensalada-caesar.jpg' 
WHERE name LIKE '%Caesar%' OR name LIKE '%César%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/coca-cola.jpg' 
WHERE name LIKE '%Coca%Cola%' OR name = 'Coca Cola';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/cerveza-artesanal.jpg' 
WHERE name LIKE '%Cerveza%' OR name LIKE '%Beer%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/papas-fritas.jpg' 
WHERE name LIKE '%Papas%Fritas%' OR name LIKE '%French%Fries%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/empanadas.jpg' 
WHERE name LIKE '%Empanada%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/tiramisu.jpg' 
WHERE name LIKE '%Tiramisú%' OR name LIKE '%Tiramisu%';

UPDATE products SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/cheesecake.jpg' 
WHERE name LIKE '%Cheesecake%';

-- Actualizar productos que no tienen imagen con una por defecto
UPDATE products 
SET image_url = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-clasica.jpg'
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'https://sisbarrios%';

-- Reactivar safe mode
SET SQL_SAFE_UPDATES = 1;

-- Verificar resultados
SELECT id, name, image_url FROM products LIMIT 20;
"""

print("📝 Script SQL generado:")
print("=" * 50)
print(sql_script)
print("=" * 50)
print("\n💡 Para ejecutar en Heroku:")
print("   1. heroku pg:psql")
print("   2. Pegar el script SQL")
print("\n💡 O ejecutar con Python si tienes mysql-connector instalado")

# Si quieres ejecutarlo directamente con Python:
try:
    import mysql.connector
    
    # Configuración de base de datos
    DB_CONFIG = {
        'host': os.environ.get('DB_HOST', 'mysql-336ad08d-matias-6a16.i.aivencloud.com'),
        'port': int(os.environ.get('DB_PORT', 16261)),
        'database': os.environ.get('DB_NAME', 'defaultdb'),
        'user': os.environ.get('DB_USER', 'avnadmin'),
        'password': os.environ.get('DB_PASSWORD', 'AVNS_Lp7V7rN93rHN0_VXHy_'),
        'ssl_verify_cert': False
    }
    
    print("\n🔄 Intentando conectar a la base de datos...")
    connection = mysql.connector.connect(**DB_CONFIG)
    cursor = connection.cursor()
    
    # Ejecutar cada statement por separado
    statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]
    
    for statement in statements:
        if statement:
            try:
                cursor.execute(statement)
                print(f"✅ Ejecutado: {statement[:50]}...")
            except Exception as e:
                print(f"⚠️ Error en: {statement[:50]}... - {e}")
    
    connection.commit()
    print("\n✅ URLs actualizadas exitosamente!")
    
    # Mostrar algunos resultados
    cursor.execute("SELECT name, image_url FROM products LIMIT 5")
    results = cursor.fetchall()
    print("\n📸 Muestra de productos actualizados:")
    for name, url in results:
        print(f"  - {name}: {url}")
    
    cursor.close()
    connection.close()
    
except ImportError:
    print("\n⚠️ mysql-connector no está instalado")
    print("   Usa el script SQL manualmente o instala: pip install mysql-connector-python")
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("   Usa el script SQL manualmente")