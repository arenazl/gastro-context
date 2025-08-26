#!/usr/bin/env python3
"""
Script para completar datos faltantes en productos
"""
import mysql.connector
import random

config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def main():
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(buffered=True)
        print("🔗 Conexión establecida\n")
        
        # 1. ARREGLAR PRODUCTOS SIN IMAGEN
        print("=== AGREGANDO IMÁGENES FALTANTES ===")
        cursor.execute("""
            SELECT id, name, category 
            FROM products 
            WHERE (image_url IS NULL OR image_url = '') 
            AND available = 1
        """)
        products_no_img = cursor.fetchall()
        
        for prod_id, name, category in products_no_img:
            # Generar URL de imagen basada en el nombre del producto
            keywords = name.lower().replace(' ', ',').replace('de', '').replace('con', '')
            image_url = f"https://source.unsplash.com/600x400/?food,{keywords}"
            
            cursor.execute("""
                UPDATE products 
                SET image_url = %s 
                WHERE id = %s
            """, (image_url, prod_id))
        
        print(f"✓ Actualizadas {len(products_no_img)} imágenes\n")
        
        # 2. AGREGAR INGREDIENTES A PRODUCTOS SIN INGREDIENTES
        print("=== AGREGANDO INGREDIENTES FALTANTES ===")
        
        # Obtener ingredientes disponibles
        cursor.execute("SELECT id, name FROM ingredients")
        ingredients = {row[1]: row[0] for row in cursor.fetchall()}
        ingredient_ids = list(ingredients.values())
        
        # Obtener productos sin ingredientes
        cursor.execute("""
            SELECT p.id, p.name, c.name as category
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.available = 1
            AND p.id NOT IN (
                SELECT DISTINCT product_id FROM product_ingredients
            )
        """)
        products_no_ingredients = cursor.fetchall()
        
        # Mapeo de categorías a ingredientes típicos
        category_ingredients = {
            'Carnes': ['Carne de res', 'Sal', 'Pimienta negra', 'Ajo', 'Aceite de oliva'],
            'Pescados y Mariscos': ['Aceite de oliva', 'Ajo', 'Sal', 'Pimienta negra', 'Tomate'],
            'Aves': ['Pollo', 'Sal', 'Pimienta negra', 'Aceite de oliva', 'Ajo'],
            'Pastas': ['Pasta', 'Tomate', 'Ajo', 'Aceite de oliva', 'Parmesano'],
            'Pizzas': ['Pan', 'Mozzarella', 'Tomate', 'Orégano', 'Aceite de oliva'],
            'Ensaladas': ['Lechuga', 'Tomate', 'Cebolla', 'Aceite de oliva', 'Sal'],
            'Sopas': ['Cebolla', 'Ajo', 'Sal', 'Aceite de oliva', 'Pimienta negra'],
            'Vegetarianos': ['Tomate', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Sal'],
            'Entradas': ['Aceite de oliva', 'Sal', 'Pimienta negra', 'Ajo', 'Tomate'],
            'Postres': ['Manteca', 'Huevo', 'Crema de leche'],
            'Bebidas': [],  # Las bebidas no necesitan ingredientes
            'Vinos': [],    # Los vinos tampoco
            'Pollo': ['Pollo', 'Sal', 'Pimienta negra', 'Aceite de oliva', 'Ajo']
        }
        
        added_count = 0
        for prod_id, prod_name, category in products_no_ingredients:
            # Skip bebidas y vinos
            if category in ['Bebidas', 'Vinos']:
                continue
                
            # Obtener ingredientes típicos de la categoría
            typical_ingredients = category_ingredients.get(category, 
                ['Sal', 'Pimienta negra', 'Aceite de oliva', 'Ajo'])
            
            # Agregar 3-5 ingredientes
            num_ingredients = random.randint(3, min(5, len(typical_ingredients)))
            
            for ing_name in typical_ingredients[:num_ingredients]:
                if ing_name in ingredients:
                    quantity = random.randint(50, 200)
                    try:
                        cursor.execute("""
                            INSERT INTO product_ingredients 
                            (product_id, ingredient_id, quantity)
                            VALUES (%s, %s, %s)
                        """, (prod_id, ingredients[ing_name], quantity))
                        added_count += 1
                    except:
                        pass  # Si ya existe, ignorar
            
            # Agregar algunos ingredientes aleatorios adicionales
            if len(ingredient_ids) > 5:
                extra_ingredients = random.sample(ingredient_ids, random.randint(1, 2))
                for ing_id in extra_ingredients:
                    quantity = random.randint(30, 150)
                    try:
                        cursor.execute("""
                            INSERT INTO product_ingredients 
                            (product_id, ingredient_id, quantity)
                            VALUES (%s, %s, %s)
                        """, (prod_id, ing_id, quantity))
                        added_count += 1
                    except:
                        pass
        
        conn.commit()
        print(f"✓ Agregadas {added_count} relaciones producto-ingrediente\n")
        
        # VERIFICACIÓN FINAL
        print("=== VERIFICACIÓN FINAL ===")
        
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 1")
        total = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM products 
            WHERE (image_url IS NULL OR image_url = '') 
            AND available = 1
        """)
        no_img = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(DISTINCT p.id) 
            FROM products p 
            JOIN product_ingredients pi ON p.id = pi.product_id 
            WHERE p.available = 1
        """)
        with_ingredients = cursor.fetchone()[0]
        
        print(f"✓ Total productos: {total}")
        print(f"✓ Productos con imagen: {total - no_img} ({100*(total-no_img)/total:.1f}%)")
        print(f"✓ Productos con ingredientes: {with_ingredients} ({100*with_ingredients/total:.1f}%)")
        
        cursor.close()
        conn.close()
        print("\n🎉 ¡Datos completados exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()