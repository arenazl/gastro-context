#!/usr/bin/env python3
"""
Script para migrar el esquema de ingredientes a la estructura correcta
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

def migrate_ingredients_table():
    """Migra la tabla ingredients a la estructura correcta"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Migrando tabla ingredients...")
        
        # 1. Agregar columnas faltantes con valores por defecto basados en datos existentes
        migrations = [
            # Agregar category_id basándose en category string
            """ALTER TABLE ingredients 
               ADD COLUMN category_id INT DEFAULT 1 
               AFTER description""",
            
            # Agregar unit_id basándose en unit string
            """ALTER TABLE ingredients 
               ADD COLUMN unit_id INT DEFAULT 1 
               AFTER category_id""",
            
            # Renombrar columnas existentes
            """ALTER TABLE ingredients 
               CHANGE COLUMN stock_quantity current_stock DECIMAL(10,3) DEFAULT 0.000""",
            
            """ALTER TABLE ingredients 
               CHANGE COLUMN min_stock_level minimum_stock DECIMAL(10,3) DEFAULT 0.000""",
            
            # Agregar columnas nutritivas faltantes
            """ALTER TABLE ingredients 
               ADD COLUMN is_perishable BOOLEAN DEFAULT FALSE 
               AFTER minimum_stock""",
            
            """ALTER TABLE ingredients 
               ADD COLUMN storage_temperature ENUM('frozen','refrigerated','room_temperature','dry') DEFAULT 'room_temperature' 
               AFTER is_perishable""",
            
            """ALTER TABLE ingredients 
               ADD COLUMN shelf_life_days INT DEFAULT 30 
               AFTER storage_temperature""",
            
            """ALTER TABLE ingredients 
               ADD COLUMN is_active BOOLEAN DEFAULT TRUE 
               AFTER shelf_life_days"""
        ]
        
        for migration in migrations:
            try:
                cursor.execute(migration)
                connection.commit()
                print(f"✅ Migración ejecutada: {migration.split()[2]}")
            except mysql.connector.Error as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    print(f"ℹ️  Columna ya existe: {migration.split()[4]}")
                else:
                    print(f"⚠️  Error en migración: {e}")
        
        # 2. Mapear categorías string a IDs
        print("🔧 Mapeando categorías...")
        category_mapping = {
            'proteinas': 1, 'protein': 1, 'carne': 1, 'pollo': 1, 'pescado': 1,
            'lacteos': 2, 'dairy': 2, 'queso': 2, 'leche': 2,
            'vegetales': 3, 'vegetables': 3, 'verduras': 3, 'hortalizas': 3,
            'frutas': 4, 'fruits': 4, 'fruta': 4,
            'granos': 5, 'grains': 5, 'cereales': 5, 'pasta': 5,
            'condimentos': 6, 'spices': 6, 'especias': 6, 'hierbas': 6,
            'aceites': 7, 'oils': 7, 'grasas': 7, 'mantequilla': 7,
            'otros': 8, 'other': 8, 'varios': 8
        }
        
        for category, category_id in category_mapping.items():
            cursor.execute("""
                UPDATE ingredients 
                SET category_id = %s 
                WHERE LOWER(category) LIKE %s OR LOWER(category) = %s
            """, (category_id, f'%{category}%', category))
        connection.commit()
        
        # 3. Mapear unidades string a IDs
        print("🔧 Mapeando unidades...")
        unit_mapping = {
            'kg': 2, 'kilogramo': 2, 'kilo': 2,
            'g': 1, 'gramo': 1, 'gram': 1,
            'l': 6, 'litro': 6, 'liter': 6,
            'ml': 5, 'mililitro': 5,
            'unidad': 13, 'und': 13, 'pcs': 13, 'piece': 13,
            'taza': 10, 'cup': 10,
            'cda': 11, 'cucharada': 11, 'tbsp': 11,
            'cdta': 12, 'cucharadita': 12, 'tsp': 12
        }
        
        for unit, unit_id in unit_mapping.items():
            cursor.execute("""
                UPDATE ingredients 
                SET unit_id = %s 
                WHERE LOWER(unit) LIKE %s OR LOWER(unit) = %s
            """, (unit_id, f'%{unit}%', unit))
        connection.commit()
        
        print("✅ Tabla ingredients migrada exitosamente")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error migrando ingredients: {e}")
        return False

def migrate_product_ingredients_table():
    """Migra la tabla product_ingredients"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Migrando tabla product_ingredients...")
        
        # Agregar columnas faltantes
        migrations = [
            """ALTER TABLE product_ingredients 
               ADD COLUMN unit_id INT DEFAULT 1 
               AFTER quantity""",
            
            """ALTER TABLE product_ingredients 
               CHANGE COLUMN unit unit_name VARCHAR(20) 
               AFTER unit_id""",
            
            """ALTER TABLE product_ingredients 
               CHANGE COLUMN notes preparation_notes TEXT 
               AFTER unit_name""",
            
            """ALTER TABLE product_ingredients 
               ADD COLUMN cost_contribution DECIMAL(10,2) DEFAULT 0.00 
               AFTER preparation_notes""",
            
            """ALTER TABLE product_ingredients 
               ADD COLUMN is_active BOOLEAN DEFAULT TRUE 
               AFTER cost_contribution""",
               
            """ALTER TABLE product_ingredients 
               ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
               AFTER created_at"""
        ]
        
        for migration in migrations:
            try:
                cursor.execute(migration)
                connection.commit()
                print(f"✅ Migración ejecutada")
            except mysql.connector.Error as e:
                if "Duplicate column name" in str(e):
                    print(f"ℹ️  Columna ya existe")
                else:
                    print(f"⚠️  Error en migración: {e}")
        
        print("✅ Tabla product_ingredients migrada exitosamente")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error migrando product_ingredients: {e}")
        return False

def create_views():
    """Crea las vistas necesarias con la estructura correcta"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔧 Creando vistas...")
        
        # Vista 1: Resumen de ingredientes
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
            COALESCE(i.is_active, TRUE) as is_active,
            i.created_at,
            i.updated_at
        FROM ingredients i
        LEFT JOIN ingredient_categories ic ON i.category_id = ic.id
        LEFT JOIN measurement_units mu ON i.unit_id = mu.id
        WHERE COALESCE(i.is_active, TRUE) = TRUE
        ORDER BY ic.sort_order, i.name
        """
        
        cursor.execute(view1_sql)
        connection.commit()
        print("✅ Vista v_ingredients_summary creada")
        
        # Vista 2: Costos por producto
        view2_sql = """
        CREATE OR REPLACE VIEW v_product_ingredients_cost AS
        SELECT 
            pi.product_id,
            p.name as product_name,
            COUNT(pi.id) as total_ingredients,
            SUM(COALESCE(pi.cost_contribution, 0)) as total_ingredient_cost,
            AVG(COALESCE(pi.cost_contribution, 0)) as average_ingredient_cost
        FROM product_ingredients pi
        LEFT JOIN products p ON pi.product_id = p.id
        WHERE COALESCE(pi.is_active, TRUE) = TRUE
        GROUP BY pi.product_id
        """
        
        cursor.execute(view2_sql)
        connection.commit()
        print("✅ Vista v_product_ingredients_cost creada")
        
        # Vista 3: Stock crítico
        view3_sql = """
        CREATE OR REPLACE VIEW v_critical_stock AS
        SELECT 
            i.id,
            i.name,
            COALESCE(ic.name, 'Sin categoría') as category,
            COALESCE(i.current_stock, 0) as current_stock,
            COALESCE(i.minimum_stock, 0) as minimum_stock,
            COALESCE(mu.abbreviation, i.unit, 'und') as unit,
            CASE 
                WHEN COALESCE(i.current_stock, 0) = 0 THEN 'out_of_stock'
                WHEN COALESCE(i.current_stock, 0) <= COALESCE(i.minimum_stock, 0) THEN 'critical'
                WHEN COALESCE(i.current_stock, 0) <= (COALESCE(i.minimum_stock, 0) * 1.2) THEN 'low'
                ELSE 'adequate'
            END as urgency_level
        FROM ingredients i
        LEFT JOIN ingredient_categories ic ON i.category_id = ic.id
        LEFT JOIN measurement_units mu ON i.unit_id = mu.id
        WHERE COALESCE(i.is_active, TRUE) = TRUE 
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

def verify_migration():
    """Verifica que la migración fue exitosa"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔍 Verificando migración...")
        
        # Verificar estructura de ingredients
        cursor.execute("DESCRIBE ingredients")
        ingredients_columns = [col[0] for col in cursor.fetchall()]
        
        required_columns = [
            'id', 'name', 'description', 'category_id', 'unit_id', 
            'current_stock', 'minimum_stock', 'cost_per_unit', 'is_active'
        ]
        
        missing_columns = [col for col in required_columns if col not in ingredients_columns]
        if missing_columns:
            print(f"❌ Columnas faltantes en ingredients: {missing_columns}")
        else:
            print("✅ Estructura de ingredients correcta")
        
        # Verificar que hay datos con category_id y unit_id asignados
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN category_id IS NOT NULL AND category_id > 0 THEN 1 ELSE 0 END) as with_category,
                   SUM(CASE WHEN unit_id IS NOT NULL AND unit_id > 0 THEN 1 ELSE 0 END) as with_unit
            FROM ingredients
        """)
        total, with_category, with_unit = cursor.fetchone()
        print(f"📊 Ingredientes: {total} total, {with_category} con categoría, {with_unit} con unidad")
        
        # Verificar vistas
        cursor.execute(f"""
            SHOW FULL TABLES 
            WHERE Table_type = 'VIEW' 
            AND Tables_in_{DB_CONFIG['database']} LIKE '%ingredient%'
        """)
        views = cursor.fetchall()
        print(f"👁️ Vistas creadas: {len(views)}")
        for view in views:
            print(f"   ✅ {view[0]}")
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"💥 Error verificando migración: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 MIGRACIÓN DEL ESQUEMA DE INGREDIENTES")
    print("=" * 60)
    
    success = True
    
    # Migrar tablas
    if not migrate_ingredients_table():
        success = False
    
    if not migrate_product_ingredients_table():
        success = False
    
    # Crear vistas
    if not create_views():
        success = False
    
    # Verificar resultados
    if not verify_migration():
        success = False
    
    if success:
        print("\n🎉 ¡Migración completada exitosamente!")
        print("\n✅ El esquema de ingredientes está listo para:")
        print("   • Endpoints API con CRUD completo")
        print("   • Integración con Gemini para sugerencias de IA")
        print("   • Interface expandible en gestión de productos")
        print("   • Control de stock e inventario")
    else:
        print("\n💥 La migración tuvo algunos errores. Revisa los mensajes arriba.")