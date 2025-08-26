#!/usr/bin/env python3
"""
Script para agregar los productos faltantes para llegar a 500
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

# Productos premium finales mapeados a categorías existentes
FINAL_PRODUCTS = [
    # CARNES (15 productos)
    ("Tomahawk Premium", "Corte de 1.2kg con hueso, madurado 45 días", 180.00, "Carnes"),
    ("Wagyu A5 Japonés", "200g de la mejor carne del mundo", 250.00, "Carnes"),
    ("Ribeye Black Angus", "400g certificado USDA Prime", 95.00, "Carnes"),
    ("Porterhouse", "600g para verdaderos carnívoros", 110.00, "Carnes"),
    ("Bife de Chorizo Madurado", "400g dry aged 30 días", 85.00, "Carnes"),
    ("T-Bone Premium", "500g con perfecto marmoleado", 98.00, "Carnes"),
    ("Picanha Brasileña", "Con farofa y vinagreta tradicional", 75.00, "Carnes"),
    ("Asado de Tira", "500g estilo argentino", 72.00, "Carnes"),
    ("Chateaubriand", "Para dos personas con salsas", 165.00, "Carnes"),
    ("Kobe Beef", "150g auténtico de Japón", 220.00, "Carnes"),
    ("Cordero Patagónico", "Rack con hierbas mediterráneas", 92.00, "Carnes"),
    ("Lechón Confitado", "Con batatas glaseadas y miel", 68.00, "Carnes"),
    ("Cabrito al Asador", "Estilo norteño con guarniciones", 78.00, "Carnes"),
    ("Costillar BBQ Premium", "800g con salsa Jack Daniel's", 85.00, "Carnes"),
    ("Mixed Grill Deluxe", "Selección de 5 cortes premium", 195.00, "Carnes"),
    
    # PESCADOS Y MARISCOS (15 productos)
    ("Langosta Thermidor", "Entera gratinada con coñac", 145.00, "Pescados y Mariscos"),
    ("King Crab Alaska", "Patas con mantequilla clarificada", 180.00, "Pescados y Mariscos"),
    ("Atún Rojo Sashimi", "200g calidad sushi grade", 95.00, "Pescados y Mariscos"),
    ("Robalo Salvaje", "Entero a la sal con hierbas", 88.00, "Pescados y Mariscos"),
    ("Dorado a la Parrilla", "Con salsa de maracuyá", 75.00, "Pescados y Mariscos"),
    ("Lenguado Meunière", "Con mantequilla de alcaparras", 82.00, "Pescados y Mariscos"),
    ("Camarones Tigre", "Jumbo a la plancha (6 unidades)", 92.00, "Pescados y Mariscos"),
    ("Ostras Kumamoto", "Docena premium de Japón", 120.00, "Pescados y Mariscos"),
    ("Vieiras Hokkaido", "Con puré de coliflor y caviar", 98.00, "Pescados y Mariscos"),
    ("Pulpo Español", "A la brasa con papas confitadas", 85.00, "Pescados y Mariscos"),
    ("Centolla Patagónica", "500g con mayonesa de lima", 110.00, "Pescados y Mariscos"),
    ("Mejillones Negros", "De Nueva Zelanda al vino blanco", 65.00, "Pescados y Mariscos"),
    ("Calamar de Potera", "Relleno de mariscos", 72.00, "Pescados y Mariscos"),
    ("Corvina REX", "En costra de sal de Maras", 78.00, "Pescados y Mariscos"),
    ("Plateau Royal", "Selección de mariscos crudos", 245.00, "Pescados y Mariscos"),
    
    # AVES ESPECIALES (8 productos)
    ("Pato Pekín", "Laqueado con crepes y hoisin", 88.00, "Aves"),
    ("Codorniz Rellena", "Con foie gras y trufas", 72.00, "Aves"),
    ("Poularde de Bresse", "Pollo francés premium", 95.00, "Aves"),
    ("Faisán al Oporto", "Con frutas del bosque", 110.00, "Aves"),
    ("Pavo Orgánico", "Relleno de castañas y manzanas", 85.00, "Aves"),
    ("Gallina de Guinea", "Con salsa de mostaza antigua", 78.00, "Aves"),
    ("Pichón Real", "Con reducción de vino tinto", 92.00, "Aves"),
    ("Pollo de Corral", "Asado con hierbas provenzales", 58.00, "Aves"),
    
    # VEGETARIANOS GOURMET (10 productos)
    ("Wellington Vegetariano", "De setas y espinacas en hojaldre", 65.00, "Vegetarianos"),
    ("Risotto de Trufas", "Con trufa negra del Périgord", 85.00, "Vegetarianos"),
    ("Lasaña de Berenjena", "Con bechamel de almendras", 58.00, "Vegetarianos"),
    ("Buddha Bowl Premium", "Con quinoa, aguacate y tahini", 48.00, "Vegetarianos"),
    ("Curry Verde Thai", "Con tofu orgánico y vegetales", 52.00, "Vegetarianos"),
    ("Moussaka Vegana", "Con bechamel de anacardos", 55.00, "Vegetarianos"),
    ("Pad Thai Vegetariano", "Con tofu y cacahuetes", 45.00, "Vegetarianos"),
    ("Ratatouille Confitada", "Vegetales provenzales asados", 42.00, "Vegetarianos"),
    ("Tajine de Verduras", "Con cuscús y frutos secos", 48.00, "Vegetarianos"),
    ("Parrillada de Setas", "Variedad de hongos silvestres", 68.00, "Vegetarianos"),
]

def main():
    try:
        print("🔗 Conectando a la base de datos...")
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor(buffered=True)
        print("✓ Conexión establecida\n")
        
        # Obtener categorías
        cursor.execute("SELECT name, id FROM categories")
        categories = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Obtener ingredientes
        cursor.execute("SELECT id, name FROM ingredients")
        ingredients = {row[1]: row[0] for row in cursor.fetchall()}
        
        # Verificar productos actuales
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 1")
        current_count = cursor.fetchone()[0]
        print(f"📊 Productos actuales: {current_count}")
        print(f"📊 Objetivo: 500 productos")
        print(f"📊 Faltan: {500 - current_count} productos\n")
        
        print("=== AGREGANDO PRODUCTOS PREMIUM FINALES ===\n")
        
        inserted = 0
        cooking_methods = ['grilled', 'baked', 'steamed', 'roasted', 'sauteed', 'braised']
        countries = ['Francia', 'Italia', 'España', 'Japón', 'Argentina', 'Perú', 'México']
        
        for name, description, price, category in FINAL_PRODUCTS:
            if category not in categories:
                print(f"⚠ Categoría '{category}' no existe")
                continue
            
            # Verificar si ya existe
            cursor.execute("SELECT id FROM products WHERE name = %s", (name,))
            if cursor.fetchone():
                print(f"⚠ Ya existe: {name}")
                continue
            
            # Generar imagen relevante
            keywords = {
                'Carnes': 'steak,meat,beef,grill',
                'Pescados y Mariscos': 'seafood,fish,lobster,salmon',
                'Aves': 'chicken,duck,poultry,roasted',
                'Vegetarianos': 'vegetarian,vegetables,salad,healthy'
            }
            
            keyword = keywords.get(category, 'gourmet,food,restaurant')
            image_url = f"https://source.unsplash.com/600x400/?{keyword}"
            
            # Insertar producto
            cursor.execute("""
                INSERT INTO products (
                    name, description, price, category_id, category,
                    image_url, available, preparation_time, cooking_method,
                    spice_level, calories, protein, carbs, fat,
                    is_vegetarian, is_vegan, is_gluten_free, is_dairy_free, is_nut_free,
                    is_signature, serving_size, origin_country, company_id,
                    created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                name, description, price, categories[category], category,
                image_url, 1,
                random.randint(25, 60),  # preparation_time (platos premium tardan más)
                random.choice(cooking_methods),
                random.randint(0, 2),  # spice_level
                random.randint(350, 800),  # calories (más alto para premium)
                round(random.uniform(25, 50), 2),  # protein
                round(random.uniform(15, 40), 2),  # carbs
                round(random.uniform(15, 35), 2),  # fat
                1 if category == "Vegetarianos" else 0,  # is_vegetarian
                1 if category == "Vegetarianos" and random.random() < 0.5 else 0,  # is_vegan
                1 if random.random() < 0.3 else 0,  # is_gluten_free
                1 if category == "Vegetarianos" and random.random() < 0.4 else 0,  # is_dairy_free
                1 if random.random() < 0.8 else 0,  # is_nut_free
                1,  # is_signature (todos son premium signature dishes)
                f"{random.randint(250, 600)}g",  # serving_size
                random.choice(countries),  # origin_country
                1  # company_id
            ))
            
            product_id = cursor.lastrowid
            
            # Asignar 4-6 ingredientes (platos premium tienen más ingredientes)
            if ingredients:
                num_ingredients = random.randint(4, min(6, len(ingredients)))
                selected_ingredients = random.sample(list(ingredients.keys()), num_ingredients)
                
                for ing_name in selected_ingredients:
                    quantity = random.randint(50, 250)
                    try:
                        cursor.execute("""
                            INSERT INTO product_ingredients 
                            (product_id, ingredient_id, quantity)
                            VALUES (%s, %s, %s)
                        """, (product_id, ingredients[ing_name], quantity))
                    except:
                        pass  # Ignorar si ya existe
            
            inserted += 1
            print(f"✓ {inserted}. {name} - ${price} ({category})")
            
            if inserted % 10 == 0:
                conn.commit()
        
        conn.commit()
        
        # Verificar total final
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 1")
        final_count = cursor.fetchone()[0]
        
        print(f"\n🎉 COMPLETADO!")
        print(f"✓ Productos agregados: {inserted}")
        print(f"✓ Total final en BD: {final_count} productos")
        
        if final_count >= 500:
            print(f"🎯 ¡META ALCANZADA! Tenemos {final_count} productos únicos sin duplicados")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ Error de base de datos: {e}")
    except Exception as e:
        print(f"\n❌ Error general: {e}")

if __name__ == "__main__":
    main()