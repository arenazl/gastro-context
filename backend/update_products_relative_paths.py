#!/usr/bin/env python3
"""
Script para actualizar productos con rutas relativas de imágenes
Solo guardamos la ruta relativa: gastro/products/nombre.jpg
La URL base se construye dinámicamente en el servidor
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

# Mapeo de productos a rutas RELATIVAS (sin dominio)
PRODUCT_IMAGE_MAPPING = {
    # Hamburguesas
    'Hamburguesa Clásica': 'gastro/products/hamburguesa-clasica.jpg',
    'Hamburguesa Doble': 'gastro/products/hamburguesa-doble.jpg',
    'Hamburguesa con Bacon': 'gastro/products/hamburguesa-bacon.jpg',
    'Hamburguesa Vegetariana': 'gastro/products/hamburguesa-vegetariana.jpg',
    
    # Pizzas
    'Pizza Margherita': 'gastro/products/pizza-margherita.jpg',
    'Pizza Pepperoni': 'gastro/products/pizza-pepperoni.jpg',
    'Pizza 4 Quesos': 'gastro/products/pizza-cuatro-quesos.jpg',
    'Pizza Hawaiana': 'gastro/products/pizza-hawaiana.jpg',
    
    # Carnes
    'Bife de Chorizo': 'gastro/products/bife-de-chorizo.jpg',
    'Asado de Tira': 'gastro/products/asado-de-tira.jpg',
    'Pollo al Grill': 'gastro/products/pollo-al-grill.jpg',
    'Salmón Grillado': 'gastro/products/salmon-grillado.jpg',
    'Costillas BBQ': 'gastro/products/costillas-bbq.jpg',
    
    # Pastas
    'Spaghetti Bolognesa': 'gastro/products/spaghetti-bolognesa.jpg',
    'Fettuccine Alfredo': 'gastro/products/fettuccine-alfredo.jpg',
    'Ravioles': 'gastro/products/ravioles.jpg',
    'Lasagna': 'gastro/products/lasagna.jpg',
    'Gnocchi': 'gastro/products/gnocchi.jpg',
    
    # Ensaladas
    'Ensalada Caesar': 'gastro/products/ensalada-caesar.jpg',
    'Ensalada Griega': 'gastro/products/ensalada-griega.jpg',
    'Ensalada Mixta': 'gastro/products/ensalada-mixta.jpg',
    'Ensalada Caprese': 'gastro/products/ensalada-caprese.jpg',
    
    # Postres
    'Tiramisú': 'gastro/products/tiramisu.jpg',
    'Cheesecake': 'gastro/products/cheesecake.jpg',
    'Brownie': 'gastro/products/brownie-chocolate.jpg',
    'Flan': 'gastro/products/flan-casero.jpg',
    'Helado': 'gastro/products/helado-artesanal.jpg',
    
    # Bebidas
    'Coca Cola': 'gastro/products/coca-cola.jpg',
    'Limonada': 'gastro/products/limonada-natural.jpg',
    'Cerveza': 'gastro/products/cerveza-artesanal.jpg',
    'Vino Tinto': 'gastro/products/vino-tinto.jpg',
    'Mojito': 'gastro/products/mojito.jpg',
    'Café': 'gastro/products/cafe-espresso.jpg',
    'Jugo de Naranja': 'gastro/products/jugo-naranja.jpg',
    'Agua Mineral': 'gastro/products/agua-mineral.jpg',
    
    # Entradas
    'Papas Fritas': 'gastro/products/papas-fritas.jpg',
    'Nachos': 'gastro/products/nachos-queso.jpg',
    'Empanadas': 'gastro/products/empanadas.jpg',
    'Provoleta': 'gastro/products/provoleta.jpg',
    'Tabla de Fiambres': 'gastro/products/tabla-fiambres.jpg',
    'Rabas': 'gastro/products/rabas.jpg',
    
    # Desayunos
    'Tostadas Francesas': 'gastro/products/tostadas-francesas.jpg',
    'Huevos Benedict': 'gastro/products/huevos-benedict.jpg',
    'Pancakes': 'gastro/products/pancakes.jpg',
    'Medialunas': 'gastro/products/medialunas.jpg',
    
    # Tacos y comida mexicana
    'Tacos': 'gastro/products/tacos.jpg',
    'Burritos': 'gastro/products/burritos.jpg',
    'Quesadillas': 'gastro/products/quesadillas.jpg',
    
    # Sushi
    'Sushi Mix': 'gastro/products/sushi-mix.jpg',
    'Sashimi': 'gastro/products/sashimi.jpg',
    
    # Sándwiches
    'Sándwich Club': 'gastro/products/sandwich-club.jpg',
    'Sándwich Vegetariano': 'gastro/products/sandwich-vegetariano.jpg',
}

def update_product_images():
    """Actualizar las rutas relativas de imágenes en la BD"""
    print("🔄 Actualizando rutas relativas de productos...")
    print("📝 Formato: gastro/products/nombre.jpg (sin URL base)")
    print("-" * 50)
    
    try:
        # Conectar a la BD
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        updated_count = 0
        not_found = []
        
        # Para cada producto en el mapeo
        for product_name, relative_path in PRODUCT_IMAGE_MAPPING.items():
            try:
                # Actualizar por nombre exacto primero
                query = """
                    UPDATE products 
                    SET image_url = %s 
                    WHERE name = %s
                """
                cursor.execute(query, (relative_path, product_name))
                
                if cursor.rowcount == 0:
                    # Si no encontró, intentar con LIKE
                    query = """
                        UPDATE products 
                        SET image_url = %s 
                        WHERE name LIKE %s
                    """
                    cursor.execute(query, (relative_path, f"%{product_name}%"))
                
                if cursor.rowcount > 0:
                    updated_count += cursor.rowcount
                    print(f"✅ {product_name} → {relative_path}")
                else:
                    not_found.append(product_name)
                    print(f"⚠️ No encontrado: {product_name}")
                    
            except Exception as e:
                print(f"❌ Error actualizando {product_name}: {e}")
        
        # Actualizar productos sin imagen con una ruta genérica
        default_path = 'gastro/products/hamburguesa-clasica.jpg'
        query = """
            UPDATE products 
            SET image_url = %s 
            WHERE image_url IS NULL 
               OR image_url = '' 
               OR image_url LIKE 'http%'
        """
        cursor.execute(query, (default_path,))
        generic_updated = cursor.rowcount
        
        # Commit cambios
        connection.commit()
        
        print("\n" + "=" * 50)
        print("📊 RESUMEN DE ACTUALIZACIÓN")
        print("=" * 50)
        print(f"✅ Productos actualizados: {updated_count}")
        print(f"🔄 Productos con ruta genérica: {generic_updated}")
        print(f"⚠️ Productos no encontrados: {len(not_found)}")
        
        if not_found:
            print("\nProductos no encontrados en BD:")
            for name in not_found[:10]:  # Solo mostrar los primeros 10
                print(f"  - {name}")
        
        # Mostrar algunos productos actualizados
        cursor.execute("SELECT name, image_url FROM products WHERE image_url IS NOT NULL LIMIT 10")
        results = cursor.fetchall()
        
        print("\n📸 Muestra de productos actualizados:")
        for name, url in results:
            print(f"  - {name}: {url}")
        
        print("\n💡 Nota: Las rutas son relativas. El servidor construirá la URL completa.")
        print("   Ejemplo: gastro/products/pizza.jpg → https://tu-cdn.com/gastro/products/pizza.jpg")
        
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