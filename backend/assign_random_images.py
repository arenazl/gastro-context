import mysql.connector
import random
import os

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def get_available_images():
    """Obtener lista de imágenes disponibles en static/products"""
    static_dir = '/mnt/c/Code/gastro-context/backend/static/products/'
    images = []
    for file in os.listdir(static_dir):
        if file.endswith(('.jpg', '.jpeg', '.png', '.gif')):
            images.append(file)
    return images

def assign_random_images():
    """Asignar imágenes random a productos sin imagen"""
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        # Obtener todas las imágenes disponibles
        available_images = get_available_images()
        print(f"🖼️ Imágenes disponibles: {len(available_images)}")
        
        # Primero, obtener productos que YA tienen imagen por categoría
        cursor.execute("""
            SELECT DISTINCT c.name as category_name, p.image_url
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.image_url IS NOT NULL 
            AND p.image_url != ''
            AND p.image_url NOT LIKE '%placeholder%'
        """)
        
        category_images = {}
        for row in cursor.fetchall():
            cat = row['category_name']
            if cat not in category_images:
                category_images[cat] = []
            # Extraer solo el nombre del archivo de la URL
            if row['image_url']:
                filename = row['image_url'].split('/')[-1]
                if filename and filename in available_images:
                    category_images[cat].append(filename)
        
        print(f"📁 Categorías con imágenes: {list(category_images.keys())}")
        
        # Obtener productos SIN imagen
        cursor.execute("""
            SELECT p.id, p.name, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE (p.image_url IS NULL 
            OR p.image_url = '' 
            OR p.image_url LIKE '%placeholder%')
        """)
        
        products_without_images = cursor.fetchall()
        print(f"🔍 Productos sin imagen: {len(products_without_images)}")
        
        updated_count = 0
        
        for product in products_without_images:
            product_id = product['id']
            product_name = product['name']
            category = product['category_name']
            
            # Intentar obtener imagen de la misma categoría
            selected_image = None
            
            if category in category_images and category_images[category]:
                # Usar imagen de la misma categoría
                selected_image = random.choice(category_images[category])
            else:
                # Si no hay imágenes en esa categoría, buscar por palabras clave
                product_lower = product_name.lower()
                
                # Mapeo inteligente por palabras clave
                if 'pizza' in product_lower:
                    pizza_images = [img for img in available_images if 'pizza' in img.lower()]
                    selected_image = random.choice(pizza_images) if pizza_images else None
                elif 'pasta' in product_lower or 'spaghetti' in product_lower or 'linguine' in product_lower:
                    pasta_images = [img for img in available_images if any(x in img.lower() for x in ['pasta', 'spaghetti', 'linguine', 'fettuccine', 'penne', 'ravioli', 'rigatoni'])]
                    selected_image = random.choice(pasta_images) if pasta_images else None
                elif 'pollo' in product_lower or 'chicken' in product_lower:
                    chicken_images = [img for img in available_images if 'pollo' in img.lower() or 'chicken' in img.lower()]
                    selected_image = random.choice(chicken_images) if chicken_images else None
                elif 'carne' in product_lower or 'beef' in product_lower or 'bife' in product_lower:
                    meat_images = [img for img in available_images if any(x in img.lower() for x in ['beef', 'bife', 'carne', 'steak', 'meat', 'filet'])]
                    selected_image = random.choice(meat_images) if meat_images else None
                elif 'ensalada' in product_lower or 'salad' in product_lower:
                    salad_images = [img for img in available_images if 'ensalada' in img.lower() or 'salad' in img.lower()]
                    selected_image = random.choice(salad_images) if salad_images else None
                elif 'vino' in product_lower or 'wine' in product_lower:
                    wine_images = [img for img in available_images if 'vino' in img.lower() or 'wine' in img.lower() or 'malbec' in img.lower()]
                    selected_image = random.choice(wine_images) if wine_images else None
                elif 'agua' in product_lower:
                    water_images = [img for img in available_images if 'agua' in img.lower()]
                    selected_image = random.choice(water_images) if water_images else None
                elif 'postre' in product_lower or 'dessert' in product_lower or 'torta' in product_lower or 'helado' in product_lower:
                    dessert_images = [img for img in available_images if any(x in img.lower() for x in ['tiramisu', 'brownie', 'cheesecake', 'flan', 'chocolate', 'volcan', 'panacotta', 'copa'])]
                    selected_image = random.choice(dessert_images) if dessert_images else None
                elif 'sopa' in product_lower or 'soup' in product_lower or 'crema' in product_lower:
                    soup_images = [img for img in available_images if 'sopa' in img.lower() or 'soup' in img.lower() or 'crema' in img.lower() or 'caldo' in img.lower()]
                    selected_image = random.choice(soup_images) if soup_images else None
                
                # Si aún no hay imagen, usar una random general
                if not selected_image:
                    selected_image = random.choice(available_images)
            
            if selected_image:
                # Construir la URL completa
                image_url = f"http://172.29.228.80:9002/static/products/{selected_image}"
                
                # Actualizar en la base de datos
                cursor.execute("""
                    UPDATE products 
                    SET image_url = %s
                    WHERE id = %s
                """, (image_url, product_id))
                
                updated_count += 1
                print(f"✅ {product_name} ({category}) → {selected_image}")
        
        connection.commit()
        print(f"\n🎉 Total productos actualizados: {updated_count}")
        
    except mysql.connector.Error as err:
        print(f"❌ Error de MySQL: {err}")
        if connection:
            connection.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    print("🚀 Asignando imágenes random a productos sin imagen...")
    assign_random_images()
    print("✨ Proceso completado!")