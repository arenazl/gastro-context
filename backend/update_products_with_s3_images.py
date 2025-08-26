#!/usr/bin/env python3
"""
Script para actualizar productos en la BD con las URLs de S3
"""
import mysql.connector
import json
import os

# MySQL Configuration
DB_CONFIG = {
    'host': 'mysql-336ad08d-matias-6a16.i.aivencloud.com',
    'port': 16261,
    'database': 'defaultdb',
    'user': 'avnadmin',
    'password': 'AVNS_Lp7V7rN93rHN0_VXHy_',
    'ssl_verify_cert': False
}

# Mapeo de productos a imágenes S3
PRODUCT_IMAGE_MAPPING = {
    # Hamburguesas
    'Hamburguesa Clásica': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-clasica.jpg',
    'Hamburguesa Doble': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-doble.jpg',
    'Hamburguesa con Bacon': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-bacon.jpg',
    'Hamburguesa Vegetariana': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-vegetariana.jpg',
    
    # Pizzas
    'Pizza Margherita': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-margherita.jpg',
    'Pizza Pepperoni': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-pepperoni.jpg',
    'Pizza 4 Quesos': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-cuatro-quesos.jpg',
    'Pizza Hawaiana': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-hawaiana.jpg',
    
    # Carnes
    'Bife de Chorizo': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/bife-de-chorizo.jpg',
    'Asado de Tira': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/asado-de-tira.jpg',
    'Pollo al Grill': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pollo-al-grill.jpg',
    'Salmón Grillado': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/salmon-grillado.jpg',
    'Costillas BBQ': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/costillas-bbq.jpg',
    
    # Pastas
    'Spaghetti Bolognesa': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/spaghetti-bolognesa.jpg',
    'Fettuccine Alfredo': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/fettuccine-alfredo.jpg',
    'Ravioles': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ravioles.jpg',
    'Lasagna': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/lasagna.jpg',
    'Gnocchi': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/gnocchi.jpg',
    
    # Ensaladas
    'Ensalada Caesar': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ensalada-caesar.jpg',
    'Ensalada Griega': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ensalada-griega.jpg',
    'Ensalada Mixta': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ensalada-mixta.jpg',
    'Ensalada Caprese': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/ensalada-caprese.jpg',
    
    # Postres
    'Tiramisú': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/tiramisu.jpg',
    'Cheesecake': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/cheesecake.jpg',
    'Brownie': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/brownie-chocolate.jpg',
    'Flan': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/flan-casero.jpg',
    'Helado': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/helado-artesanal.jpg',
    
    # Bebidas
    'Coca Cola': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/coca-cola.jpg',
    'Limonada': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/limonada-natural.jpg',
    'Cerveza': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/cerveza-artesanal.jpg',
    'Vino Tinto': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/vino-tinto.jpg',
    'Mojito': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/mojito.jpg',
    'Café': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/cafe-espresso.jpg',
    'Jugo de Naranja': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/jugo-naranja.jpg',
    'Agua Mineral': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/agua-mineral.jpg',
    
    # Entradas
    'Papas Fritas': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/papas-fritas.jpg',
    'Nachos': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/nachos-queso.jpg',
    'Empanadas': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/empanadas.jpg',
    'Provoleta': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/provoleta.jpg',
    'Tabla de Fiambres': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/tabla-fiambres.jpg',
    'Rabas': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/rabas.jpg',
    
    # Desayunos
    'Tostadas Francesas': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/tostadas-francesas.jpg',
    'Huevos Benedict': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/huevos-benedict.jpg',
    'Pancakes': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pancakes.jpg',
    'Medialunas': 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/medialunas.jpg',
}

def update_product_images():
    """Actualizar las URLs de imágenes de productos en la BD"""
    print("🔄 Actualizando URLs de productos en la base de datos...")
    
    try:
        # Conectar a la BD
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        updated_count = 0
        not_found = []
        
        # Para cada producto en el mapeo
        for product_name, s3_url in PRODUCT_IMAGE_MAPPING.items():
            try:
                # Actualizar por nombre exacto primero
                query = """
                    UPDATE products 
                    SET image_url = %s 
                    WHERE name = %s
                """
                cursor.execute(query, (s3_url, product_name))
                
                if cursor.rowcount == 0:
                    # Si no encontró, intentar con LIKE
                    query = """
                        UPDATE products 
                        SET image_url = %s 
                        WHERE name LIKE %s
                    """
                    cursor.execute(query, (s3_url, f"%{product_name}%"))
                
                if cursor.rowcount > 0:
                    updated_count += cursor.rowcount
                    print(f"✅ Actualizado: {product_name} → {cursor.rowcount} producto(s)")
                else:
                    not_found.append(product_name)
                    print(f"⚠️ No encontrado: {product_name}")
                    
            except Exception as e:
                print(f"❌ Error actualizando {product_name}: {e}")
        
        # Actualizar productos sin imagen con una imagen genérica
        default_image = 'https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-clasica.jpg'
        query = """
            UPDATE products 
            SET image_url = %s 
            WHERE image_url IS NULL 
               OR image_url = '' 
               OR image_url LIKE '%pexels%'
               OR image_url LIKE '%unsplash%'
               OR image_url NOT LIKE 'https://sisbarrios%'
        """
        cursor.execute(query, (default_image,))
        generic_updated = cursor.rowcount
        
        # Commit cambios
        connection.commit()
        
        print("\n" + "=" * 50)
        print("📊 RESUMEN DE ACTUALIZACIÓN")
        print("=" * 50)
        print(f"✅ Productos actualizados: {updated_count}")
        print(f"🔄 Productos con imagen genérica: {generic_updated}")
        print(f"⚠️ Productos no encontrados: {len(not_found)}")
        
        if not_found:
            print("\nProductos no encontrados:")
            for name in not_found:
                print(f"  - {name}")
        
        # Mostrar algunos productos actualizados
        cursor.execute("SELECT name, image_url FROM products LIMIT 10")
        results = cursor.fetchall()
        
        print("\n📸 Muestra de productos actualizados:")
        for name, url in results:
            print(f"  - {name}: {url}")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
    
    print("\n✅ Proceso completado!")

if __name__ == "__main__":
    update_product_images()