#!/usr/bin/env python3
"""
Script para corregir problemas en el esquema de ingredientes
"""

import mysql.connector
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DATABASE'),
    'charset': 'utf8mb4',
    'use_unicode': True,
    'autocommit': False
}

def fix_ingredients_table():
    """Arregla la tabla de ingredientes"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Arreglando tabla ingredients...")
        
        # Verificar si la tabla existe
        cursor.execute("SHOW TABLES LIKE 'ingredients'")
        if not cursor.fetchone():
            print("❌ Tabla ingredients no existe")
            return False
        
        # Verificar estructura actual
        cursor.execute("DESCRIBE ingredients")
        columns = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Agregar columnas faltantes
        missing_columns = []
        
        if 'description' not in columns:
            missing_columns.append("ADD COLUMN description TEXT AFTER name")
        
        if 'calories_per_100g' not in columns:
            missing_columns.append("ADD COLUMN calories_per_100g DECIMAL(6,2) DEFAULT 0.00 AFTER description")
        
        if 'protein_per_100g' not in columns:
            missing_columns.append("ADD COLUMN protein_per_100g DECIMAL(6,2) DEFAULT 0.00 AFTER calories_per_100g")
        
        if 'current_stock' not in columns:
            missing_columns.append("ADD COLUMN current_stock DECIMAL(10,3) DEFAULT 0.000 AFTER unit_id")
        
        if 'minimum_stock' not in columns:
            missing_columns.append("ADD COLUMN minimum_stock DECIMAL(10,3) DEFAULT 0.000 AFTER current_stock")
        
        if missing_columns:
            for column_def in missing_columns:
                try:
                    alter_query = f"ALTER TABLE ingredients {column_def}"
                    cursor.execute(alter_query)
                    connection.commit()
                    print(f"✅ Columna agregada: {column_def.split()[2]}")
                except mysql.connector.Error as e:
                    print(f"⚠️  Error agregando columna: {e}")
        else:
            print("✅ Todas las columnas necesarias ya existen")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error arreglando tabla ingredients: {e}")
        return False

def fix_product_ingredients_table():
    """Arregla la tabla product_ingredients"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Arreglando tabla product_ingredients...")
        
        # Eliminar la columna generada problemática si existe
        try:
            cursor.execute("ALTER TABLE product_ingredients DROP COLUMN cost_contribution")
            connection.commit()
            print("✅ Columna cost_contribution eliminada")
        except mysql.connector.Error:
            print("ℹ️  Columna cost_contribution no existía")
        
        # Agregar columna cost_contribution como columna normal (no generada)
        try:
            cursor.execute("""
                ALTER TABLE product_ingredients 
                ADD COLUMN cost_contribution DECIMAL(10,2) DEFAULT 0.00 
                AFTER preparation_notes
            """)
            connection.commit()
            print("✅ Columna cost_contribution agregada como columna normal")
        except mysql.connector.Error as e:
            print(f"⚠️  Error agregando cost_contribution: {e}")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error arreglando tabla product_ingredients: {e}")
        return False

def create_views():
    """Crea las vistas que fallaron"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Creando vistas...")
        
        # Vista 1: Resumen de ingredientes (simplificada)
        view1_sql = """
        CREATE OR REPLACE VIEW v_ingredients_summary AS
        SELECT 
            i.id,
            i.name,
            COALESCE(i.description, '') as description,
            ic.name as category_name,
            ic.color as category_color,
            ic.icon as category_icon,
            mu.name as unit_name,
            mu.abbreviation as unit_abbr,
            COALESCE(i.cost_per_unit, 0) as cost_per_unit,
            COALESCE(i.current_stock, 0) as current_stock,
            COALESCE(i.minimum_stock, 0) as minimum_stock,
            CASE 
                WHEN COALESCE(i.current_stock, 0) <= COALESCE(i.minimum_stock, 0) THEN 'low'
                WHEN COALESCE(i.current_stock, 0) <= (COALESCE(i.minimum_stock, 0) * 1.5) THEN 'warning'
                ELSE 'good'
            END as stock_status,
            i.is_active,
            i.created_at,
            i.updated_at
        FROM ingredients i
        JOIN ingredient_categories ic ON i.category_id = ic.id
        JOIN measurement_units mu ON i.unit_id = mu.id
        WHERE i.is_active = TRUE
        ORDER BY ic.sort_order, i.name
        """
        
        cursor.execute(view1_sql)
        connection.commit()
        print("✅ Vista v_ingredients_summary creada")
        
        # Vista 2: Ingredientes por producto (simplificada)
        view2_sql = """
        CREATE OR REPLACE VIEW v_product_ingredients_cost AS
        SELECT 
            pi.product_id,
            p.name as product_name,
            COUNT(pi.id) as total_ingredients,
            SUM(COALESCE(pi.cost_contribution, 0)) as total_ingredient_cost,
            AVG(COALESCE(pi.cost_contribution, 0)) as average_ingredient_cost
        FROM product_ingredients pi
        JOIN products p ON pi.product_id = p.id
        WHERE pi.is_active = TRUE
        GROUP BY pi.product_id
        """
        
        cursor.execute(view2_sql)
        connection.commit()
        print("✅ Vista v_product_ingredients_cost creada")
        
        # Vista 3: Stock crítico (simplificada)
        view3_sql = """
        CREATE OR REPLACE VIEW v_critical_stock AS
        SELECT 
            i.id,
            i.name,
            ic.name as category,
            COALESCE(i.current_stock, 0) as current_stock,
            COALESCE(i.minimum_stock, 0) as minimum_stock,
            mu.abbreviation as unit,
            CASE 
                WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out_of_stock'
                WHEN COALESCE(i.current_stock, 0) <= COALESCE(i.minimum_stock, 0) THEN 'critical'
                WHEN COALESCE(i.current_stock, 0) <= (COALESCE(i.minimum_stock, 0) * 1.2) THEN 'low'
                ELSE 'adequate'
            END as urgency_level
        FROM ingredients i
        JOIN ingredient_categories ic ON i.category_id = ic.id
        JOIN measurement_units mu ON i.unit_id = mu.id
        WHERE i.is_active = TRUE 
        AND COALESCE(i.current_stock, 0) <= (COALESCE(i.minimum_stock, 0) * 1.2)
        ORDER BY 
            CASE 
                WHEN COALESCE(i.current_stock, 0) = 0 THEN 1
                WHEN COALESCE(i.current_stock, 0) <= COALESCE(i.minimum_stock, 0) THEN 2
                ELSE 3
            END,
            i.current_stock ASC
        """
        
        cursor.execute(view3_sql)
        connection.commit()
        print("✅ Vista v_critical_stock creada")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error creando vistas: {e}")
        return False

def add_sample_ingredients():
    """Agrega ingredientes de ejemplo"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Agregando ingredientes de ejemplo...")
        
        # Limpiar ingredientes existentes
        cursor.execute("DELETE FROM ingredients WHERE id > 0")
        cursor.execute("ALTER TABLE ingredients AUTO_INCREMENT = 1")
        connection.commit()
        
        sample_ingredients = [
            # Proteínas (category_id: 1)
            ('Pechuga de pollo', 'Pechuga de pollo sin piel, fresca', 1, 2, 850.00, 5.000, 2.000),
            ('Carne molida', 'Carne de res molida, 80/20', 1, 2, 1200.00, 3.000, 1.000),
            ('Salmón', 'Filete de salmón fresco', 1, 2, 2500.00, 2.000, 0.500),
            ('Huevos', 'Huevos frescos de gallina', 1, 13, 25.00, 60.000, 24.000),

            # Lácteos (category_id: 2)
            ('Leche entera', 'Leche entera pasteurizada', 2, 6, 180.00, 10.000, 3.000),
            ('Queso mozzarella', 'Queso mozzarella para pizza', 2, 2, 650.00, 2.000, 0.500),
            ('Mantequilla', 'Mantequilla sin sal', 2, 1, 8.50, 500.000, 200.000),

            # Vegetales (category_id: 3)
            ('Tomate', 'Tomate redondo fresco', 3, 2, 300.00, 5.000, 2.000),
            ('Cebolla', 'Cebolla amarilla', 3, 2, 180.00, 10.000, 3.000),
            ('Ajo', 'Ajo fresco', 3, 1, 2.50, 500.000, 100.000),
            ('Lechuga', 'Lechuga criolla', 3, 15, 120.00, 20.000, 5.000),

            # Condimentos (category_id: 6)
            ('Sal', 'Sal fina de mesa', 6, 2, 80.00, 2.000, 0.500),
            ('Pimienta negra', 'Pimienta negra molida', 6, 1, 1.80, 250.000, 50.000),
            ('Orégano', 'Orégano seco', 6, 1, 0.95, 100.000, 25.000),
            ('Aceite de oliva', 'Aceite de oliva extra virgen', 7, 6, 850.00, 3.000, 1.000)
        ]
        
        insert_sql = """
        INSERT INTO ingredients (name, description, category_id, unit_id, cost_per_unit, current_stock, minimum_stock)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.executemany(insert_sql, sample_ingredients)
        connection.commit()
        
        print(f"✅ {len(sample_ingredients)} ingredientes de ejemplo agregados")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error agregando ingredientes: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 CORRECCIÓN DEL ESQUEMA DE INGREDIENTES")
    print("=" * 60)
    
    success = True
    
    # Arreglar tablas
    if not fix_ingredients_table():
        success = False
    
    if not fix_product_ingredients_table():
        success = False
    
    # Crear vistas
    if not create_views():
        success = False
    
    # Agregar ingredientes de ejemplo
    if not add_sample_ingredients():
        success = False
    
    if success:
        print("\n🎉 ¡Esquema de ingredientes corregido exitosamente!")
        print("\n✅ Las siguientes funcionalidades están listas:")
        print("   • Gestión de ingredientes con categorías")
        print("   • Control de stock y alertas")
        print("   • Sistema de alergenos")
        print("   • Unidades de medida y conversiones")
        print("   • Ingredientes de ejemplo listos para usar")
    else:
        print("\n💥 Algunas correcciones fallaron. Revisa los errores arriba.")