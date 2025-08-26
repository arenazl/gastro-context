#!/usr/bin/env python3
"""
Script para actualizar las URLs de imágenes en la base de datos
Cambia las URLs locales por URLs de S3/CDN
"""
import mysql.connector

# Configuración de MySQL
DB_CONFIG = {
    'host': 'mysql-336ad08d-matias-6a16.i.aivencloud.com',
    'port': 16261,
    'database': 'defaultdb',
    'user': 'avnadmin',
    'password': 'AVNS_Lp7V7rN93rHN0_VXHy_',
    'ssl_verify_cert': False
}

# URL base de S3 o CDN donde están las imágenes
# Cambia esto por tu URL real de S3
S3_BASE_URL = "https://gastro-images.s3.amazonaws.com"

def update_image_urls():
    """Actualizar todas las URLs de imágenes en productos"""
    
    connection = mysql.connector.connect(**DB_CONFIG)
    cursor = connection.cursor()
    
    try:
        # Primero, obtener todos los productos con image_url
        cursor.execute("SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL")
        products = cursor.fetchall()
        
        updated_count = 0
        
        for product_id, name, current_url in products:
            if current_url and 'http://172.29.228.80:9002' in current_url:
                # Extraer solo el nombre del archivo
                filename = current_url.split('/')[-1]  # house-burger.jpg
                new_url = f"{S3_BASE_URL}/products/{filename}"
                
                # Actualizar en la base de datos
                cursor.execute(
                    "UPDATE products SET image_url = %s WHERE id = %s",
                    (new_url, product_id)
                )
                
                updated_count += 1
                print(f"✅ Updated: {name} -> {new_url}")
        
        connection.commit()
        print(f"\n✨ Total updated: {updated_count} products")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        connection.rollback()
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    print("🔄 Updating image URLs in database...")
    update_image_urls()
    print("✅ Done!")
