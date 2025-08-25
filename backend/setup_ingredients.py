#!/usr/bin/env python3
"""
Script para crear sistema profesional de ingredientes y expandir productos
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

def execute_sql_file(cursor, filepath):
    """Ejecutar un archivo SQL"""
    with open(filepath, 'r', encoding='utf-8') as file:
        sql_script = file.read()
        
    # Dividir por statements
    statements = sql_script.split(';')
    
    for statement in statements:
        statement = statement.strip()
        if statement and not statement.startswith('--'):
            try:
                # Skip DELIMITER commands for Python
                if 'DELIMITER' in statement or statement.startswith('CREATE PROCEDURE'):
                    continue
                cursor.execute(statement)
                print(f"✓ Ejecutado: {statement[:50]}...")
            except mysql.connector.Error as e:
                if 'already exists' in str(e).lower():
                    print(f"⚠ Ya existe: {statement[:50]}...")
                else:
                    print(f"✗ Error: {e}")

def create_ingredients_system(conn):
    """Crear el sistema de ingredientes"""
    cursor = conn.cursor()
    
    print("=== CREANDO SISTEMA DE INGREDIENTES ===")
    
    # 1. Crear tabla de ingredientes
    print("\n1. Creando tabla de ingredientes...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        category VARCHAR(50),
        unit VARCHAR(20) DEFAULT 'g',
        calories_per_100g DECIMAL(10,2),
        protein_per_100g DECIMAL(10,2),
        carbs_per_100g DECIMAL(10,2),
        fat_per_100g DECIMAL(10,2),
        fiber_per_100g DECIMAL(10,2),
        is_allergen BOOLEAN DEFAULT FALSE,
        allergen_type VARCHAR(50),
        is_vegetarian BOOLEAN DEFAULT TRUE,
        is_vegan BOOLEAN DEFAULT FALSE,
        is_gluten_free BOOLEAN DEFAULT TRUE,
        cost_per_unit DECIMAL(10,2),
        supplier VARCHAR(100),
        stock_quantity DECIMAL(10,2) DEFAULT 0,
        min_stock_level DECIMAL(10,2) DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_allergen (is_allergen, allergen_type),
        INDEX idx_dietary (is_vegetarian, is_vegan, is_gluten_free)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✓ Tabla ingredients creada")
    
    # 2. Crear tabla de relación
    print("\n2. Creando tabla product_ingredients...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20),
        is_optional BOOLEAN DEFAULT FALSE,
        notes VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
        UNIQUE KEY unique_product_ingredient (product_id, ingredient_id),
        INDEX idx_product (product_id),
        INDEX idx_ingredient (ingredient_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✓ Tabla product_ingredients creada")
    
    # 3. Agregar columnas a productos
    print("\n3. Agregando columnas profesionales a productos...")
    columns_to_add = [
        ("preparation_time", "INT DEFAULT 15"),
        ("cooking_method", "VARCHAR(50)"),
        ("spice_level", "INT DEFAULT 0"),
        ("calories", "INT"),
        ("protein", "DECIMAL(10,2)"),
        ("carbs", "DECIMAL(10,2)"),
        ("fat", "DECIMAL(10,2)"),
        ("is_signature", "BOOLEAN DEFAULT FALSE"),
        ("is_seasonal", "BOOLEAN DEFAULT FALSE"),
        ("season", "VARCHAR(20)"),
        ("wine_pairing", "VARCHAR(100)"),
        ("is_vegetarian", "BOOLEAN DEFAULT FALSE"),
        ("is_vegan", "BOOLEAN DEFAULT FALSE"),
        ("is_gluten_free", "BOOLEAN DEFAULT FALSE"),
        ("is_dairy_free", "BOOLEAN DEFAULT FALSE"),
        ("is_nut_free", "BOOLEAN DEFAULT TRUE"),
        ("serving_size", "VARCHAR(50)"),
        ("origin_country", "VARCHAR(50)")
    ]
    
    for col_name, col_def in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_def}")
            print(f"  ✓ Agregada columna {col_name}")
        except mysql.connector.Error as e:
            if 'duplicate column' in str(e).lower():
                print(f"  ⚠ Columna {col_name} ya existe")
            else:
                print(f"  ✗ Error agregando {col_name}: {e}")
    
    conn.commit()
    cursor.close()
    return True

def insert_base_ingredients(conn):
    """Insertar ingredientes base"""
    cursor = conn.cursor()
    
    print("\n=== INSERTANDO INGREDIENTES BASE ===")
    
    ingredients = [
        # Lácteos
        ('Mozzarella', 'Mozzarella', 'dairy', 'g', 280, 22, 2.2, 22, True, 'dairy', True, False, True, 8.50),
        ('Parmesano', 'Parmesan', 'dairy', 'g', 431, 38, 4.1, 29, True, 'dairy', True, False, True, 15.00),
        ('Crema de leche', 'Heavy cream', 'dairy', 'ml', 340, 2.8, 2.8, 36, True, 'dairy', True, False, True, 4.50),
        ('Manteca', 'Butter', 'dairy', 'g', 717, 0.9, 0.1, 81, True, 'dairy', True, False, True, 6.00),
        ('Ricotta', 'Ricotta', 'dairy', 'g', 174, 11, 3, 13, True, 'dairy', True, False, True, 5.50),
        
        # Carnes
        ('Carne de res', 'Beef', 'meat', 'g', 250, 26, 0, 15, False, None, False, False, True, 18.00),
        ('Pollo', 'Chicken', 'meat', 'g', 165, 31, 0, 3.6, False, None, False, False, True, 8.00),
        ('Cerdo', 'Pork', 'meat', 'g', 242, 27, 0, 14, False, None, False, False, True, 12.00),
        ('Panceta', 'Bacon', 'meat', 'g', 541, 37, 1.4, 42, False, None, False, False, True, 14.00),
        
        # Vegetales básicos
        ('Tomate', 'Tomato', 'vegetable', 'g', 18, 0.9, 3.9, 0.2, False, None, True, True, True, 2.50),
        ('Lechuga', 'Lettuce', 'vegetable', 'g', 15, 1.4, 2.9, 0.2, False, None, True, True, True, 2.00),
        ('Cebolla', 'Onion', 'vegetable', 'g', 40, 1.1, 9.3, 0.1, False, None, True, True, True, 1.50),
        ('Ajo', 'Garlic', 'vegetable', 'g', 149, 6.4, 33, 0.5, False, None, True, True, True, 3.00),
        
        # Especias básicas
        ('Sal', 'Salt', 'spice', 'g', 0, 0, 0, 0, False, None, True, True, True, 0.50),
        ('Pimienta negra', 'Black pepper', 'spice', 'g', 251, 10, 64, 3.3, False, None, True, True, True, 15.00),
        ('Orégano', 'Oregano', 'spice', 'g', 265, 9, 69, 4.3, False, None, True, True, True, 12.00),
        ('Albahaca', 'Basil', 'spice', 'g', 23, 3.2, 2.7, 0.6, False, None, True, True, True, 18.00),
        
        # Aceites
        ('Aceite de oliva', 'Olive oil', 'oil', 'ml', 884, 0, 0, 100, False, None, True, True, True, 8.00),
        
        # Granos
        ('Pasta', 'Pasta', 'grain', 'g', 131, 5, 25, 1.1, True, 'gluten', True, True, False, 2.50),
        ('Pan', 'Bread', 'grain', 'g', 265, 9, 49, 3.2, True, 'gluten', True, True, False, 1.50),
        
        # Otros
        ('Huevo', 'Egg', 'other', 'unit', 155, 13, 1.1, 11, True, 'egg', True, False, True, 0.80),
    ]
    
    insert_query = """
    INSERT INTO ingredients (name, name_en, category, unit, calories_per_100g, 
                            protein_per_100g, carbs_per_100g, fat_per_100g, 
                            is_allergen, allergen_type, is_vegetarian, is_vegan, 
                            is_gluten_free, cost_per_unit)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE name=VALUES(name)
    """
    
    for ingredient in ingredients:
        try:
            cursor.execute(insert_query, ingredient)
            print(f"  ✓ Insertado: {ingredient[0]}")
        except Exception as e:
            print(f"  ✗ Error insertando {ingredient[0]}: {e}")
    
    conn.commit()
    cursor.close()
    print(f"\n✓ Insertados {len(ingredients)} ingredientes base")
    return True

def main():
    """Función principal"""
    try:
        print("🔗 Conectando a la base de datos...")
        conn = mysql.connector.connect(**config)
        print("✓ Conexión establecida\n")
        
        # Crear sistema de ingredientes
        if create_ingredients_system(conn):
            print("\n✓ Sistema de ingredientes creado exitosamente")
        
        # Insertar ingredientes base
        if insert_base_ingredients(conn):
            print("\n✓ Ingredientes base insertados")
        
        # Actualizar tareas
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM ingredients")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total de ingredientes en la BD: {count}")
        
        cursor.close()
        conn.close()
        print("\n🎉 ¡Sistema de ingredientes configurado exitosamente!")
        
    except mysql.connector.Error as e:
        print(f"\n❌ Error de base de datos: {e}")
    except Exception as e:
        print(f"\n❌ Error general: {e}")

if __name__ == "__main__":
    main()