import mysql.connector
import json

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Base de datos de ingredientes por tipo de producto
ingredients_db = {
    # Pastas
    'pasta carbonara': ['Spaghetti', 'Panceta', 'Huevos', 'Queso parmesano', 'Pimienta negra', 'Ajo'],
    'fettuccine alfredo': ['Fettuccine', 'Mantequilla', 'Crema de leche', 'Queso parmesano', 'Nuez moscada', 'Perejil'],
    'lasagna': ['Láminas de pasta', 'Carne molida', 'Salsa bechamel', 'Queso mozzarella', 'Tomate', 'Cebolla', 'Ajo'],
    'spaghetti bolognese': ['Spaghetti', 'Carne molida', 'Tomate', 'Cebolla', 'Zanahoria', 'Apio', 'Vino tinto'],
    'ravioli': ['Pasta fresca', 'Ricotta', 'Espinaca', 'Huevo', 'Nuez moscada', 'Salsa de tomate'],
    'linguine': ['Linguine', 'Mariscos mixtos', 'Ajo', 'Vino blanco', 'Perejil', 'Aceite de oliva'],
    'penne': ['Penne', 'Tomate', 'Ajo', 'Chile', 'Aceite de oliva', 'Albahaca'],
    
    # Pizzas
    'pizza margherita': ['Masa de pizza', 'Salsa de tomate', 'Mozzarella fresca', 'Albahaca', 'Aceite de oliva'],
    'pizza pepperoni': ['Masa de pizza', 'Salsa de tomate', 'Mozzarella', 'Pepperoni'],
    'pizza hawaiana': ['Masa de pizza', 'Salsa de tomate', 'Mozzarella', 'Jamón', 'Piña'],
    'pizza napolitana': ['Masa de pizza', 'Salsa de tomate', 'Mozzarella', 'Anchoas', 'Aceitunas', 'Orégano'],
    'pizza cuatro quesos': ['Masa de pizza', 'Mozzarella', 'Gorgonzola', 'Parmesano', 'Provolone'],
    'pizza caprese': ['Masa de pizza', 'Mozzarella', 'Tomate cherry', 'Albahaca', 'Rúcula'],
    
    # Hamburguesas
    'hamburguesa': ['Pan de hamburguesa', 'Carne de res', 'Lechuga', 'Tomate', 'Cebolla', 'Pepinillos'],
    'cheeseburger': ['Pan de hamburguesa', 'Carne de res', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla'],
    'bacon burger': ['Pan de hamburguesa', 'Carne de res', 'Bacon', 'Queso', 'Lechuga', 'Tomate'],
    'beyond burger': ['Pan integral', 'Carne vegetal Beyond', 'Lechuga', 'Tomate', 'Cebolla morada', 'Salsa vegana'],
    
    # Carnes
    'bife de chorizo': ['Bife de chorizo', 'Sal gruesa', 'Pimienta', 'Ajo', 'Chimichurri'],
    'filet mignon': ['Filet mignon', 'Mantequilla', 'Tomillo', 'Ajo', 'Vino tinto'],
    'entrana': ['Entraña', 'Sal gruesa', 'Pimienta', 'Chimichurri', 'Limón'],
    'asado': ['Costillar', 'Vacío', 'Chorizo', 'Morcilla', 'Sal gruesa', 'Chimichurri'],
    'cordero': ['Cordero patagónico', 'Romero', 'Ajo', 'Vino blanco', 'Miel'],
    'osso buco': ['Osobuco', 'Cebolla', 'Zanahoria', 'Apio', 'Vino blanco', 'Caldo de huesos'],
    'pollo': ['Pechuga de pollo', 'Limón', 'Hierbas', 'Ajo', 'Aceite de oliva'],
    'pollo teriyaki': ['Pollo', 'Salsa teriyaki', 'Sésamo', 'Jengibre', 'Cebollín'],
    
    # Pescados
    'salmon': ['Salmón fresco', 'Limón', 'Eneldo', 'Aceite de oliva', 'Sal marina'],
    'atun': ['Atún fresco', 'Sésamo', 'Salsa soja', 'Jengibre', 'Wasabi'],
    'pescado': ['Pescado del día', 'Limón', 'Perejil', 'Ajo', 'Mantequilla'],
    
    # Ensaladas
    'ensalada caesar': ['Lechuga romana', 'Crutones', 'Parmesano', 'Anchoas', 'Salsa Caesar'],
    'ensalada caprese': ['Mozzarella', 'Tomate', 'Albahaca', 'Aceite de oliva', 'Vinagre balsámico'],
    'ensalada griega': ['Lechuga', 'Tomate', 'Pepino', 'Cebolla morada', 'Aceitunas', 'Queso feta'],
    'ensalada mediterránea': ['Mix de hojas', 'Tomate cherry', 'Aceitunas', 'Queso de cabra', 'Nueces'],
    'ensalada thai': ['Repollo', 'Zanahoria', 'Maní', 'Cilantro', 'Salsa thai', 'Lima'],
    'ensalada quinoa': ['Quinoa', 'Palta', 'Tomate', 'Pepino', 'Limón', 'Aceite de oliva'],
    
    # Sopas
    'sopa de cebolla': ['Cebolla', 'Caldo de carne', 'Vino blanco', 'Gruyère', 'Pan tostado'],
    'crema de tomate': ['Tomate', 'Cebolla', 'Ajo', 'Crema', 'Albahaca', 'Caldo vegetal'],
    'crema de calabaza': ['Calabaza', 'Cebolla', 'Jengibre', 'Crema', 'Nuez moscada'],
    'caldo de pollo': ['Pollo', 'Zanahoria', 'Apio', 'Cebolla', 'Fideos', 'Perejil'],
    
    # Postres
    'tiramisu': ['Mascarpone', 'Café espresso', 'Vainillas', 'Cacao', 'Huevos', 'Azúcar'],
    'cheesecake': ['Queso crema', 'Galletas', 'Mantequilla', 'Huevos', 'Azúcar', 'Vainilla'],
    'brownie': ['Chocolate', 'Mantequilla', 'Azúcar', 'Huevos', 'Harina', 'Nueces'],
    'flan': ['Leche', 'Huevos', 'Azúcar', 'Vainilla', 'Caramelo'],
    'chocolate cake': ['Harina', 'Chocolate', 'Mantequilla', 'Huevos', 'Azúcar', 'Cacao'],
    'helado': ['Leche', 'Crema', 'Azúcar', 'Huevos', 'Vainilla natural'],
    
    # Bebidas
    'café': ['Granos de café arábica', 'Agua filtrada'],
    'capuccino': ['Espresso', 'Leche vaporizada', 'Espuma de leche'],
    'latte': ['Espresso', 'Leche', 'Espuma de leche'],
    'smoothie': ['Frutas frescas', 'Yogur', 'Miel', 'Hielo'],
    'jugo naranja': ['Naranjas frescas exprimidas'],
    'mojito': ['Ron blanco', 'Menta', 'Lima', 'Azúcar', 'Agua con gas'],
    
    # Entradas
    'bruschetta': ['Pan tostado', 'Tomate', 'Albahaca', 'Ajo', 'Aceite de oliva'],
    'hummus': ['Garbanzos', 'Tahini', 'Limón', 'Ajo', 'Aceite de oliva', 'Pan pita'],
    'ceviche': ['Pescado blanco', 'Lima', 'Cebolla morada', 'Ají', 'Cilantro', 'Camote'],
    'empanadas': ['Masa', 'Carne', 'Cebolla', 'Huevo duro', 'Aceitunas', 'Comino'],
    'provoleta': ['Queso provolone', 'Orégano', 'Ají molido', 'Aceite de oliva']
}

def get_ingredients_for_product(product_name):
    """Obtener ingredientes basados en el nombre del producto"""
    if not product_name:
        return []
    
    product_lower = product_name.lower()
    
    # Buscar coincidencias exactas primero
    for key, ingredients in ingredients_db.items():
        if key == product_lower:
            return ingredients
    
    # Buscar coincidencias parciales
    for key, ingredients in ingredients_db.items():
        key_words = key.split()
        product_words = product_lower.split()
        
        # Si al menos 2 palabras coinciden o hay una coincidencia muy específica
        matches = sum(1 for word in key_words if word in product_words)
        if matches >= min(2, len(key_words)):
            return ingredients
        
        # Buscar palabras clave específicas
        for word in key_words:
            if word in product_words and len(word) > 3:  # Palabras significativas
                return ingredients
    
    # Ingredientes por defecto según categorías generales
    if any(word in product_lower for word in ['pizza']):
        return ['Masa de pizza', 'Salsa de tomate', 'Mozzarella', 'Orégano']
    elif any(word in product_lower for word in ['pasta', 'spaghetti', 'penne']):
        return ['Pasta', 'Salsa de tomate', 'Ajo', 'Aceite de oliva', 'Parmesano']
    elif any(word in product_lower for word in ['ensalada']):
        return ['Mix de hojas verdes', 'Tomate', 'Aceite de oliva', 'Vinagre']
    elif any(word in product_lower for word in ['pollo']):
        return ['Pollo', 'Hierbas aromáticas', 'Limón', 'Aceite de oliva']
    elif any(word in product_lower for word in ['carne', 'bife']):
        return ['Carne premium', 'Sal gruesa', 'Pimienta', 'Chimichurri']
    elif any(word in product_lower for word in ['pescado', 'salmon']):
        return ['Pescado fresco', 'Limón', 'Hierbas', 'Aceite de oliva']
    
    return ['Ingredientes frescos', 'Preparado con cuidado']

def add_ingredients_column_and_data():
    """Agregar columna de ingredientes y poblar con datos"""
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        # Verificar si la columna ya existe
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'gastro' 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'ingredients'
        """)
        
        column_exists = cursor.fetchone()
        
        if not column_exists:
            # Agregar columna ingredients
            print("Agregando columna 'ingredients' a la tabla products...")
            cursor.execute("""
                ALTER TABLE products 
                ADD COLUMN ingredients JSON NULL
            """)
            connection.commit()
            print("✅ Columna 'ingredients' agregada exitosamente!")
        else:
            print("La columna 'ingredients' ya existe.")
        
        # Obtener todos los productos
        cursor.execute("SELECT id, name FROM products")
        products = cursor.fetchall()
        
        print(f"Actualizando ingredientes para {len(products)} productos...")
        
        updated_count = 0
        for product in products:
            ingredients = get_ingredients_for_product(product['name'])
            
            if ingredients:
                # Convertir lista a JSON
                ingredients_json = json.dumps(ingredients, ensure_ascii=False)
                
                cursor.execute(
                    "UPDATE products SET ingredients = %s WHERE id = %s",
                    (ingredients_json, product['id'])
                )
                updated_count += 1
                
                if updated_count % 50 == 0:
                    print(f"Actualizados {updated_count} productos...")
        
        connection.commit()
        print(f"✅ Ingredientes actualizados para {updated_count} productos!")
        
        # Mostrar algunos ejemplos
        cursor.execute("""
            SELECT name, ingredients 
            FROM products 
            WHERE ingredients IS NOT NULL 
            AND name LIKE '%pasta%' OR name LIKE '%pizza%'
            LIMIT 5
        """)
        examples = cursor.fetchall()
        
        if examples:
            print("\n📋 Ejemplos de productos con ingredientes:")
            for example in examples:
                ingredients_list = json.loads(example['ingredients']) if example['ingredients'] else []
                print(f"  - {example['name']}: {', '.join(ingredients_list[:3])}...")
        
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
    add_ingredients_column_and_data()