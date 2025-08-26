#!/usr/bin/env python3
"""
Script para expandir productos a 1000 items profesionales con ingredientes
"""
import mysql.connector
import random
from datetime import datetime

# Configuración de la base de datos
config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Plantillas de productos profesionales por categoría
PRODUCT_TEMPLATES = {
    'Entradas': [
        ('Carpaccio de Res Black Angus', 'Finas láminas de res Black Angus con rúcula, parmesano y reducción de balsámico', 28.00),
        ('Tartare de Atún Rojo', 'Atún rojo del Mediterráneo con aguacate, sésamo y salsa ponzu', 32.00),
        ('Burrata con Tomates Heritage', 'Burrata cremosa con tomates antiguos y pesto de albahaca', 24.00),
        ('Foie Gras Mi-Cuit', 'Foie gras francés con compota de higos y brioche tostado', 45.00),
        ('Ostras Rockefeller', 'Media docena de ostras gratinadas con espinacas y hollandaise', 38.00),
        ('Ceviche Nikkei', 'Pescado blanco marinado estilo peruano-japonés', 26.00),
        ('Vitello Tonnato Piamontés', 'Ternera con salsa de atún y alcaparras', 28.00),
        ('Tataki de Salmón', 'Salmón sellado con sésamo y salsa teriyaki', 24.00),
        ('Escargots à la Bourguignonne', 'Caracoles en mantequilla de ajo y perejil', 22.00),
        ('Gazpacho Andaluz con Langostinos', 'Sopa fría de tomate con langostinos grillados', 18.00),
    ],
    
    'Sopas': [
        ('Bisque de Langosta', 'Crema de langosta con cognac y crema fraîche', 24.00),
        ('Sopa de Cebolla Gratinada', 'Receta francesa clásica con gruyère fundido', 16.00),
        ('Tom Yum Goong', 'Sopa tailandesa picante con camarones', 18.00),
        ('Vichyssoise', 'Crema fría de puerros y papas', 14.00),
        ('Bouillabaisse Marsellesa', 'Sopa de pescados y mariscos del Mediterráneo', 32.00),
        ('Consomé de Ave Trufado', 'Consomé clarificado con juliana de verduras y trufa', 20.00),
        ('Crema de Bogavante', 'Crema suave de bogavante con brandy', 28.00),
        ('Sopa Wonton', 'Dumplings de cerdo y camarón en caldo aromático', 16.00),
        ('Minestrone Toscano', 'Sopa italiana de verduras con pasta', 14.00),
        ('Chowder de Almejas', 'Crema espesa con almejas y tocino', 18.00),
    ],
    
    'Ensaladas': [
        ('Ensalada Niçoise Tradicional', 'Atún, huevo, anchoas, aceitunas y judías verdes', 22.00),
        ('Caesar con Pollo Orgánico', 'Lechuga romana, crutones, parmesano y pollo grillado', 20.00),
        ('Ensalada Waldorf', 'Manzana, apio, nueces y mayonesa', 18.00),
        ('Ensalada Thai de Papaya Verde', 'Som tam con maní y camarones secos', 16.00),
        ('Caprese con Mozzarella di Bufala', 'Tomate, mozzarella de búfala y albahaca fresca', 20.00),
        ('Ensalada de Quinoa Andina', 'Quinoa tricolor con vegetales asados', 18.00),
        ('Ensalada Griega Tradicional', 'Tomate, pepino, feta, aceitunas kalamata', 16.00),
        ('Poke Bowl de Atún', 'Atún marinado con arroz, aguacate y edamame', 26.00),
        ('Ensalada de Rúcula y Pera', 'Rúcula, pera caramelizada, gorgonzola y nueces', 18.00),
        ('Tabulé Libanés', 'Bulgur, perejil, tomate y menta', 14.00),
    ],
    
    'Pastas': [
        ('Tagliatelle al Tartufo Nero', 'Pasta fresca con trufa negra y parmesano', 42.00),
        ('Linguine alle Vongole', 'Linguine con almejas en vino blanco', 28.00),
        ('Ravioli de Langosta', 'Ravioli rellenos de langosta en salsa de azafrán', 38.00),
        ('Spaghetti Carbonara Tradicional', 'Con guanciale, pecorino y huevo', 24.00),
        ('Penne all\'Arrabbiata', 'Pasta con salsa picante de tomate', 20.00),
        ('Lasagna Bolognese', '8 capas con ragú tradicional y bechamel', 26.00),
        ('Fettuccine Alfredo', 'Pasta fresca con crema y parmesano', 22.00),
        ('Orecchiette con Brócoli', 'Pasta artesanal con brócoli y anchoas', 24.00),
        ('Cacio e Pepe', 'Spaghetti con pecorino romano y pimienta negra', 20.00),
        ('Tortellini en Brodo', 'Tortellini caseros en caldo de capón', 26.00),
    ],
    
    'Pizzas': [
        ('Pizza Margherita DOP', 'San Marzano, mozzarella di bufala, albahaca', 22.00),
        ('Pizza Quattro Formaggi', 'Mozzarella, gorgonzola, parmesano, fontina', 26.00),
        ('Pizza Diavola', 'Salami picante, mozzarella, aceite de chile', 24.00),
        ('Pizza Frutti di Mare', 'Mariscos mixtos sin queso', 30.00),
        ('Pizza Prosciutto e Funghi', 'Jamón y champiñones', 24.00),
        ('Pizza Capricciosa', 'Jamón, champiñones, alcachofas, aceitunas', 26.00),
        ('Pizza Quattro Stagioni', 'Cuatro estaciones con ingredientes variados', 28.00),
        ('Pizza Calzone', 'Pizza cerrada rellena de ricotta y salami', 24.00),
        ('Pizza Bianca', 'Base blanca con ricotta y espinacas', 22.00),
        ('Pizza Napoletana', 'Anchoas, alcaparras y aceitunas', 24.00),
    ],
    
    'Carnes': [
        ('Ribeye Dry Aged 45 días', 'Ribeye madurado con papas trufadas', 85.00),
        ('Rack de Cordero Neozelandés', 'Costillar con costra de hierbas', 68.00),
        ('Ossobuco alla Milanese', 'Jarrete de ternera con risotto', 48.00),
        ('Chateaubriand para Dos', 'Centro de lomo con salsa béarnaise', 120.00),
        ('Pato Confitado', 'Pierna de pato confitada con cassoulet', 42.00),
        ('Tournedos Rossini', 'Medallones de lomo con foie gras', 75.00),
        ('Bife de Chorizo Argentino', '400g de chorizo premium argentino', 55.00),
        ('Costillas BBQ Ahumadas', 'Costillas de cerdo ahumadas 12 horas', 38.00),
        ('Conejo a la Cazadora', 'Conejo estofado con setas y vino', 36.00),
        ('Steak Tartare Clásico', 'Carne cruda condimentada preparada en mesa', 42.00),
    ],
    
    'Aves': [
        ('Pollo de Corral al Limón', 'Pollo orgánico con limones confitados', 32.00),
        ('Pato a la Orange', 'Magret de pato con salsa de naranja', 45.00),
        ('Codorniz Rellena', 'Codorniz con foie gras y trufa', 38.00),
        ('Pollo Tandoori', 'Pollo marinado en especias indias', 28.00),
        ('Pavo Relleno de Castañas', 'Pechuga de pavo con relleno navideño', 34.00),
        ('Pollo Cordon Bleu', 'Relleno de jamón y queso empanizado', 30.00),
        ('Coq au Vin', 'Gallo al vino tinto con verduras', 36.00),
        ('Pollo Kiev', 'Pechuga rellena de mantequilla de ajo', 32.00),
        ('Pato Pekín', 'Pato laqueado con crepes y cebollín', 48.00),
        ('Pollo Tikka Masala', 'Pollo en salsa cremosa de especias', 28.00),
    ],
    
    'Pescados': [
        ('Lubina Salvaje a la Sal', 'Lubina entera en costra de sal marina', 48.00),
        ('Salmón Wellington', 'Salmón en hojaldre con espinacas', 42.00),
        ('Rodaballo con Beurre Blanc', 'Rodaballo salvaje con mantequilla blanca', 55.00),
        ('Bacalao Negro Miso', 'Black cod marinado en miso', 58.00),
        ('Lenguado Meunière', 'Lenguado con mantequilla y limón', 45.00),
        ('Atún Rojo a la Plancha', 'Tataki de atún con wasabi', 52.00),
        ('Rape con Azafrán', 'Medallones de rape en salsa de azafrán', 48.00),
        ('Dorada a la Espalda', 'Dorada abierta con ajo y perejil', 38.00),
        ('Merluza en Salsa Verde', 'Merluza con almejas y espárragos', 36.00),
        ('Corvina con Quinoa', 'Corvina sobre cama de quinoa negra', 40.00),
    ],
    
    'Mariscos': [
        ('Langosta Thermidor', 'Langosta gratinada con cognac y mostaza', 85.00),
        ('Paella de Mariscos', 'Paella valenciana con mariscos selectos', 45.00),
        ('Gambas al Ajillo', 'Langostinos con ajo y guindilla', 32.00),
        ('Vieiras con Panceta', 'Vieiras selladas con panceta crujiente', 42.00),
        ('Pulpo a la Gallega', 'Pulpo con papas y pimentón', 38.00),
        ('Zarzuela de Mariscos', 'Guiso catalán de pescados y mariscos', 48.00),
        ('Cangrejo Real de Alaska', 'Patas de cangrejo con mantequilla', 75.00),
        ('Cigalas a la Plancha', 'Cigalas con aceite de ajo', 55.00),
        ('Mejillones a la Marinera', 'Mejillones en salsa de tomate', 24.00),
        ('Calamares en su Tinta', 'Calamares con arroz negro', 32.00),
    ],
    
    'Postres': [
        ('Soufflé de Chocolate Valrhona', 'Soufflé caliente con helado de vainilla', 18.00),
        ('Crème Brûlée de Vainilla Tahití', 'Crema catalana con vainilla de Tahití', 14.00),
        ('Tiramisú Tradicional', 'Receta clásica italiana con mascarpone', 12.00),
        ('Tarte Tatin', 'Tarta invertida de manzana caramelizada', 14.00),
        ('Profiteroles con Chocolate', 'Choux rellenos con crema y chocolate', 16.00),
        ('Panna Cotta de Frutos Rojos', 'Panna cotta con coulis de berries', 12.00),
        ('Cheesecake de New York', 'Tarta de queso estilo americano', 14.00),
        ('Mille-feuille', 'Milhojas con crema pastelera', 16.00),
        ('Coulant de Chocolate', 'Volcán de chocolate con centro líquido', 14.00),
        ('Pavlova con Frutas', 'Merengue con crema y frutas tropicales', 12.00),
    ],
    
    'Bebidas': [
        ('Agua Fiji', 'Agua mineral premium de Fiji', 8.00),
        ('San Pellegrino', 'Agua con gas italiana', 6.00),
        ('Coca Cola Mexicana', 'Coca Cola de botella con azúcar de caña', 5.00),
        ('Limonada de Lavanda', 'Limonada artesanal con lavanda', 7.00),
        ('Té Matcha Latte', 'Té verde japonés con leche', 8.00),
        ('Café Blue Mountain', 'Café jamaiquino premium', 12.00),
        ('Smoothie Açaí', 'Batido de açaí con frutas', 10.00),
        ('Kombucha Artesanal', 'Té fermentado probiótico', 8.00),
        ('Chocolate Caliente Belga', 'Chocolate belga con marshmallows', 9.00),
        ('Virgin Mojito', 'Mojito sin alcohol con menta fresca', 8.00),
    ]
}

# Métodos de cocción
COOKING_METHODS = ['grilled', 'fried', 'baked', 'steamed', 'raw', 'sauteed', 'roasted', 'braised', 'poached', 'smoked']

# Países de origen
COUNTRIES = ['Italia', 'Francia', 'España', 'Japón', 'México', 'Perú', 'Argentina', 'USA', 'Tailandia', 'India', 'Grecia', 'Marruecos']

# Maridajes de vino
WINE_PAIRINGS = [
    'Malbec Reserva', 'Cabernet Sauvignon', 'Pinot Noir', 'Chardonnay', 
    'Sauvignon Blanc', 'Riesling', 'Tempranillo', 'Syrah', 'Merlot',
    'Prosecco', 'Champagne', 'Rosé Provence'
]

def insert_more_ingredients(conn):
    """Insertar más ingredientes para tener variedad"""
    cursor = conn.cursor()
    
    extra_ingredients = [
        # Más vegetales
        ('Espinaca', 'Spinach', 'vegetable', 'g', 23, 2.9, 3.6, 0.4, False, None, True, True, True, 3.00),
        ('Champiñones', 'Mushrooms', 'vegetable', 'g', 22, 3.1, 3.3, 0.3, False, None, True, True, True, 4.50),
        ('Pimiento', 'Bell pepper', 'vegetable', 'g', 31, 1, 6, 0.3, False, None, True, True, True, 3.50),
        ('Zanahoria', 'Carrot', 'vegetable', 'g', 41, 0.9, 10, 0.2, False, None, True, True, True, 1.80),
        ('Brócoli', 'Broccoli', 'vegetable', 'g', 34, 2.8, 7, 0.4, False, None, True, True, True, 3.20),
        
        # Mariscos
        ('Langosta', 'Lobster', 'seafood', 'g', 89, 19, 0, 0.9, True, 'shellfish', False, False, True, 45.00),
        ('Camarones', 'Shrimp', 'seafood', 'g', 99, 20, 0.2, 0.3, True, 'shellfish', False, False, True, 32.00),
        ('Vieiras', 'Scallops', 'seafood', 'g', 88, 18, 2.4, 0.8, True, 'shellfish', False, False, True, 40.00),
        ('Salmón', 'Salmon', 'seafood', 'g', 208, 20, 0, 13, False, None, False, False, True, 28.00),
        ('Atún', 'Tuna', 'seafood', 'g', 144, 23, 0, 5, False, None, False, False, True, 24.00),
        
        # Más especias
        ('Romero', 'Rosemary', 'spice', 'g', 131, 3.3, 21, 5.9, False, None, True, True, True, 14.00),
        ('Tomillo', 'Thyme', 'spice', 'g', 101, 5.6, 24, 1.7, False, None, True, True, True, 16.00),
        ('Paprika', 'Paprika', 'spice', 'g', 282, 14, 54, 13, False, None, True, True, True, 10.00),
        ('Comino', 'Cumin', 'spice', 'g', 375, 18, 44, 22, False, None, True, True, True, 12.00),
        ('Cilantro', 'Coriander', 'spice', 'g', 23, 2.1, 3.7, 0.5, False, None, True, True, True, 8.00),
        
        # Frutas
        ('Limón', 'Lemon', 'fruit', 'unit', 29, 1.1, 9.3, 0.3, False, None, True, True, True, 1.50),
        ('Naranja', 'Orange', 'fruit', 'unit', 47, 0.9, 12, 0.1, False, None, True, True, True, 1.20),
        ('Manzana', 'Apple', 'fruit', 'unit', 52, 0.3, 14, 0.2, False, None, True, True, True, 2.00),
        
        # Lácteos adicionales
        ('Queso Gruyère', 'Gruyere', 'dairy', 'g', 413, 30, 0.4, 32, True, 'dairy', True, False, True, 22.00),
        ('Queso Gorgonzola', 'Gorgonzola', 'dairy', 'g', 353, 21, 2.3, 29, True, 'dairy', True, False, True, 18.00),
        ('Mascarpone', 'Mascarpone', 'dairy', 'g', 429, 4.6, 4.8, 44, True, 'dairy', True, False, True, 12.00),
        
        # Granos adicionales
        ('Arroz', 'Rice', 'grain', 'g', 130, 2.7, 28, 0.3, False, None, True, True, True, 2.00),
        ('Quinoa', 'Quinoa', 'grain', 'g', 120, 4.4, 21, 1.9, False, None, True, True, True, 8.00),
        
        # Carnes adicionales
        ('Cordero', 'Lamb', 'meat', 'g', 294, 25, 0, 21, False, None, False, False, True, 22.00),
        ('Pato', 'Duck', 'meat', 'g', 337, 19, 0, 28, False, None, False, False, True, 25.00),
        ('Ternera', 'Veal', 'meat', 'g', 172, 24, 0, 8, False, None, False, False, True, 28.00),
        
        # Otros
        ('Vino tinto', 'Red wine', 'other', 'ml', 85, 0.1, 2.6, 0, False, None, True, True, True, 0.05),
        ('Vino blanco', 'White wine', 'other', 'ml', 82, 0.1, 2.6, 0, False, None, True, True, True, 0.05),
        ('Caldo de pollo', 'Chicken stock', 'other', 'ml', 12, 1.2, 0.9, 0.5, False, None, False, False, True, 0.02),
        ('Azúcar', 'Sugar', 'other', 'g', 387, 0, 100, 0, False, None, True, True, True, 1.50),
        ('Miel', 'Honey', 'other', 'ml', 304, 0.3, 82, 0, False, None, True, False, True, 8.00),
        ('Chocolate', 'Chocolate', 'other', 'g', 546, 4.9, 60, 31, True, 'dairy', True, False, True, 12.00),
        ('Vinagre balsámico', 'Balsamic vinegar', 'other', 'ml', 88, 0.5, 17, 0, False, None, True, True, True, 6.00),
        ('Mostaza', 'Mustard', 'other', 'g', 66, 4.4, 6, 3.7, False, None, True, True, True, 3.00),
        ('Mayonesa', 'Mayonnaise', 'other', 'g', 680, 1, 0.6, 75, True, 'egg', True, False, True, 4.00),
        ('Trufa', 'Truffle', 'other', 'g', 284, 9, 73, 0.5, False, None, True, True, True, 200.00),
    ]
    
    insert_query = """
    INSERT IGNORE INTO ingredients (name, name_en, category, unit, calories_per_100g, 
                            protein_per_100g, carbs_per_100g, fat_per_100g, 
                            is_allergen, allergen_type, is_vegetarian, is_vegan, 
                            is_gluten_free, cost_per_unit)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    for ingredient in extra_ingredients:
        cursor.execute(insert_query, ingredient)
    
    conn.commit()
    print(f"✓ Insertados {len(extra_ingredients)} ingredientes adicionales")
    cursor.close()

def generate_products(conn):
    """Generar 1000 productos profesionales"""
    cursor = conn.cursor()
    
    # Obtener categorías existentes
    cursor.execute("SELECT id, name FROM categories")
    categories = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Si no hay categorías, crear las básicas
    if not categories:
        print("Creando categorías básicas...")
        basic_categories = [
            'Entradas', 'Sopas', 'Ensaladas', 'Pastas', 'Pizzas',
            'Carnes', 'Aves', 'Pescados', 'Mariscos', 'Postres', 'Bebidas'
        ]
        for cat in basic_categories:
            cursor.execute("INSERT INTO categories (name, is_active) VALUES (%s, 1)", (cat,))
        conn.commit()
        
        cursor.execute("SELECT id, name FROM categories")
        categories = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Obtener todos los ingredientes
    cursor.execute("SELECT id, name FROM ingredients")
    ingredients = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Limpiar productos existentes si hay muchos duplicados
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] > 500:
        print("Limpiando productos duplicados...")
        cursor.execute("DELETE FROM product_ingredients")
        cursor.execute("DELETE FROM products WHERE id > 236")  # Mantener los primeros productos
        conn.commit()
    
    products_created = 0
    product_id = 237  # Empezar después de los productos existentes
    
    print("\n=== GENERANDO 1000 PRODUCTOS PROFESIONALES ===\n")
    
    for category_name, products in PRODUCT_TEMPLATES.items():
        if category_name not in categories:
            # Crear categoría si no existe
            cursor.execute("INSERT INTO categories (name, is_active) VALUES (%s, 1)", (category_name,))
            conn.commit()
            category_id = cursor.lastrowid
            categories[category_name] = category_id
        else:
            category_id = categories[category_name]
        
        print(f"\n📁 Categoría: {category_name}")
        
        # Generar variaciones de cada producto
        for base_name, base_description, base_price in products:
            # Generar entre 8-12 variaciones por producto base
            variations = random.randint(8, 12)
            
            for i in range(variations):
                # Crear variaciones del nombre
                if i == 0:
                    name = base_name
                    description = base_description
                    price = base_price
                else:
                    # Agregar modificadores
                    modifiers = [
                        'Premium', 'Deluxe', 'Especial', 'Clásico', 'Tradicional',
                        'Gourmet', 'Artesanal', 'De la Casa', 'Chef\'s Special',
                        'Signature', 'Executive', 'Royal'
                    ]
                    modifier = random.choice(modifiers)
                    name = f"{base_name} {modifier}"
                    description = f"{base_description} - Versión {modifier.lower()}"
                    price = base_price * random.uniform(0.8, 1.5)
                
                # Generar datos nutricionales y características
                prep_time = random.randint(10, 60)
                cooking_method = random.choice(COOKING_METHODS)
                spice_level = random.randint(0, 3) if 'picante' not in name.lower() else random.randint(2, 5)
                calories = random.randint(200, 800)
                protein = round(random.uniform(5, 40), 1)
                carbs = round(random.uniform(10, 60), 1)
                fat = round(random.uniform(5, 35), 1)
                is_signature = random.random() < 0.2
                is_seasonal = random.random() < 0.15
                season = random.choice(['spring', 'summer', 'fall', 'winter']) if is_seasonal else None
                wine_pairing = random.choice(WINE_PAIRINGS) if category_name in ['Carnes', 'Pescados', 'Pastas'] else None
                serving_size = f"{random.randint(200, 500)}g"
                origin_country = random.choice(COUNTRIES)
                
                # Determinar características dietéticas basadas en la categoría
                is_vegetarian = category_name in ['Ensaladas', 'Pastas', 'Pizzas', 'Sopas'] and random.random() < 0.3
                is_vegan = is_vegetarian and random.random() < 0.3
                is_gluten_free = category_name not in ['Pastas', 'Pizzas'] and random.random() < 0.2
                
                # Insertar producto
                insert_product = """
                INSERT INTO products (
                    name, description, price, category_id, available,
                    preparation_time, cooking_method, spice_level,
                    calories, protein, carbs, fat,
                    is_signature, is_seasonal, season, wine_pairing,
                    is_vegetarian, is_vegan, is_gluten_free,
                    serving_size, origin_country, created_at
                ) VALUES (
                    %s, %s, %s, %s, 1,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, NOW()
                )
                """
                
                try:
                    cursor.execute(insert_product, (
                        name, description, price, category_id,
                        prep_time, cooking_method, spice_level,
                        calories, protein, carbs, fat,
                        is_signature, is_seasonal, season, wine_pairing,
                        is_vegetarian, is_vegan, is_gluten_free,
                        serving_size, origin_country
                    ))
                    
                    product_id = cursor.lastrowid
                    
                    # Asignar ingredientes al producto
                    assign_ingredients(cursor, product_id, category_name, ingredients, is_vegetarian, is_vegan)
                    
                    products_created += 1
                    
                    if products_created % 50 == 0:
                        conn.commit()
                        print(f"  ✓ {products_created} productos creados...")
                    
                    if products_created >= 1000:
                        break
                        
                except mysql.connector.Error as e:
                    print(f"  ✗ Error insertando {name}: {e}")
            
            if products_created >= 1000:
                break
        
        if products_created >= 1000:
            break
    
    conn.commit()
    cursor.close()
    
    print(f"\n🎉 ¡{products_created} productos profesionales creados exitosamente!")
    return products_created

def assign_ingredients(cursor, product_id, category, ingredients_dict, is_vegetarian, is_vegan):
    """Asignar ingredientes a un producto"""
    
    # Seleccionar ingredientes basados en la categoría
    ingredient_sets = {
        'Entradas': ['Aceite de oliva', 'Sal', 'Pimienta negra', 'Ajo', 'Limón'],
        'Sopas': ['Cebolla', 'Zanahoria', 'Apio', 'Caldo de pollo', 'Sal'],
        'Ensaladas': ['Lechuga', 'Tomate', 'Aceite de oliva', 'Vinagre balsámico', 'Sal'],
        'Pastas': ['Pasta', 'Aceite de oliva', 'Ajo', 'Parmesano', 'Sal'],
        'Pizzas': ['Harina', 'Mozzarella', 'Tomate', 'Aceite de oliva', 'Orégano'],
        'Carnes': ['Carne de res', 'Sal', 'Pimienta negra', 'Aceite de oliva', 'Romero'],
        'Aves': ['Pollo', 'Sal', 'Pimienta negra', 'Aceite de oliva', 'Tomillo'],
        'Pescados': ['Salmón', 'Limón', 'Aceite de oliva', 'Sal', 'Perejil'],
        'Mariscos': ['Camarones', 'Ajo', 'Aceite de oliva', 'Vino blanco', 'Perejil'],
        'Postres': ['Azúcar', 'Huevo', 'Harina', 'Manteca', 'Chocolate'],
        'Bebidas': ['Agua', 'Azúcar', 'Limón']
    }
    
    # Ingredientes vegetarianos/veganos
    if is_vegan:
        base_ingredients = ['Tomate', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Sal']
    elif is_vegetarian:
        base_ingredients = ['Queso', 'Huevo', 'Tomate', 'Cebolla', 'Aceite de oliva']
    else:
        base_ingredients = ingredient_sets.get(category, ['Sal', 'Pimienta negra', 'Aceite de oliva'])
    
    # Asignar entre 3-8 ingredientes por producto
    num_ingredients = random.randint(3, 8)
    selected_ingredients = []
    
    # Agregar ingredientes base
    for ing_name in base_ingredients[:num_ingredients]:
        if ing_name in ingredients_dict:
            selected_ingredients.append(ing_name)
    
    # Agregar ingredientes aleatorios adicionales
    all_ingredients = list(ingredients_dict.keys())
    while len(selected_ingredients) < num_ingredients and len(selected_ingredients) < len(all_ingredients):
        random_ing = random.choice(all_ingredients)
        if random_ing not in selected_ingredients:
            # Verificar restricciones dietéticas
            cursor.execute("SELECT is_vegetarian, is_vegan FROM ingredients WHERE name = %s", (random_ing,))
            ing_data = cursor.fetchone()
            if ing_data:
                ing_is_veg, ing_is_vegan = ing_data
                if (not is_vegan or ing_is_vegan) and (not is_vegetarian or ing_is_veg):
                    selected_ingredients.append(random_ing)
    
    # Insertar relaciones producto-ingrediente
    for ing_name in selected_ingredients:
        if ing_name in ingredients_dict:
            quantity = random.randint(10, 500)  # cantidad en gramos/ml
            
            insert_query = """
            INSERT IGNORE INTO product_ingredients (product_id, ingredient_id, quantity)
            VALUES (%s, %s, %s)
            """
            
            try:
                cursor.execute(insert_query, (product_id, ingredients_dict[ing_name], quantity))
            except:
                pass  # Ignorar errores de duplicados

def main():
    """Función principal"""
    try:
        print("🔗 Conectando a la base de datos...")
        conn = mysql.connector.connect(**config)
        print("✓ Conexión establecida\n")
        
        # Insertar más ingredientes
        insert_more_ingredients(conn)
        
        # Generar 1000 productos
        products_created = generate_products(conn)
        
        # Mostrar estadísticas finales
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 1")
        total_products = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM ingredients")
        total_ingredients = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM product_ingredients")
        total_relations = cursor.fetchone()[0]
        
        print("\n📊 ESTADÍSTICAS FINALES:")
        print(f"  • Total de productos: {total_products}")
        print(f"  • Total de ingredientes: {total_ingredients}")
        print(f"  • Relaciones producto-ingrediente: {total_relations}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 ¡Sistema expandido a 1000 productos profesionales con ingredientes!")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Error de base de datos: {e}")
    except Exception as e:
        print(f"\n❌ Error general: {e}")

if __name__ == "__main__":
    main()