import mysql.connector
import os

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Directorio de imágenes
IMAGES_DIR = '/mnt/c/Code/gastro-context/backend/static/products'
BASE_URL = 'http://172.29.228.80:9002/static/products/'

def normalize_filename(name):
    """Normalizar nombre de producto para buscar archivo de imagen"""
    # Convertir a minúsculas y reemplazar espacios con guiones
    normalized = name.lower().replace(' ', '-')
    # Eliminar caracteres especiales
    normalized = ''.join(c if c.isalnum() or c == '-' else '' for c in normalized)
    return normalized

def find_best_image_match(product_name, available_images):
    """Encontrar la mejor coincidencia de imagen para un producto"""
    normalized_name = normalize_filename(product_name)
    
    # Buscar coincidencia exacta
    if f"{normalized_name}.jpg" in available_images:
        return f"{normalized_name}.jpg"
    
    # Buscar coincidencias parciales
    product_words = normalized_name.split('-')
    best_match = None
    best_score = 0
    
    for img in available_images:
        if img.endswith('.jpg') or img.endswith('.png'):
            img_name = img.rsplit('.', 1)[0]
            
            # Contar palabras coincidentes
            score = sum(1 for word in product_words if word in img_name)
            
            if score > best_score:
                best_score = score
                best_match = img
    
    return best_match

def get_category_default_image(category_name):
    """Obtener imagen por defecto basada en la categoría"""
    category_defaults = {
        'bebidas': 'agua-mineral.jpg',
        'entradas': 'ensalada-caprese.jpg',
        'ensaladas': 'caesar-salad.jpg',
        'sopas': 'french-onion-soup.jpg',
        'pastas': 'pasta-carbonara.jpg',
        'pizzas': 'margherita-pizza.jpg',
        'carnes': 'bife-de-chorizo.jpg',
        'pescados': 'grilled-salmon.jpg',
        'postres': 'tiramisu.jpg',
        'hamburguesas': 'house-burger.jpg',
        'sandwiches': 'house-burger.jpg',
        'vegetariano': 'buddha-bowl.jpg',
        'pollo': 'grilled-chicken.jpg'
    }
    
    if category_name:
        category_lower = category_name.lower()
        for key, default_img in category_defaults.items():
            if key in category_lower:
                return default_img
    
    return 'house-burger.jpg'  # Imagen por defecto general

def update_product_images():
    """Actualizar todas las imágenes de productos en la base de datos"""
    connection = None
    cursor = None
    
    try:
        # Conectar a la base de datos
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        # Obtener lista de imágenes disponibles
        available_images = []
        for file in os.listdir(IMAGES_DIR):
            if file.endswith(('.jpg', '.png')):
                available_images.append(file)
        
        # También incluir imágenes de mocktails
        mocktails_dir = os.path.join(IMAGES_DIR, 'mocktails')
        if os.path.exists(mocktails_dir):
            for file in os.listdir(mocktails_dir):
                if file.endswith(('.jpg', '.png')):
                    available_images.append(f"mocktails/{file}")
        
        print(f"Encontradas {len(available_images)} imágenes disponibles")
        
        # Obtener todos los productos con sus categorías
        cursor.execute("""
            SELECT p.id, p.name, p.image_url, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        """)
        products = cursor.fetchall()
        
        print(f"Actualizando {len(products)} productos...")
        
        updated_count = 0
        missing_images = []
        
        for product in products:
            product_name = product['name']
            category_name = product['category_name']
            
            # Buscar mejor coincidencia de imagen
            matched_image = find_best_image_match(product_name, available_images)
            
            # Si no hay coincidencia, usar imagen por defecto de categoría
            if not matched_image:
                matched_image = get_category_default_image(category_name)
                missing_images.append(f"{product_name} -> {matched_image} (default)")
            
            # Construir URL completa
            new_image_url = BASE_URL + matched_image
            
            # Actualizar en la base de datos
            cursor.execute(
                "UPDATE products SET image_url = %s WHERE id = %s",
                (new_image_url, product['id'])
            )
            
            updated_count += 1
            if updated_count % 50 == 0:
                print(f"Actualizados {updated_count} productos...")
        
        # Confirmar cambios
        connection.commit()
        
        print(f"\n✅ Actualizadas las imágenes de {updated_count} productos exitosamente!")
        
        if missing_images:
            print(f"\n⚠️ {len(missing_images)} productos usando imagen por defecto:")
            for missing in missing_images[:10]:  # Mostrar solo los primeros 10
                print(f"  - {missing}")
            if len(missing_images) > 10:
                print(f"  ... y {len(missing_images) - 10} más")
        
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
    update_product_images()