#!/usr/bin/env python3
"""
Script para diagnosticar el estado actual del esquema de ingredientes
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

def diagnose_tables():
    """Diagnostica el estado de las tablas de ingredientes"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("=== DIAGNÓSTICO DE ESQUEMA DE INGREDIENTES ===\n")
        
        # Obtener todas las tablas relacionadas
        tables_to_check = [
            'ingredient_categories', 'measurement_units', 'allergens',
            'ingredients', 'ingredient_allergens', 'product_ingredients',
            'ai_ingredient_suggestions', 'ingredient_stock_movements'
        ]
        
        for table in tables_to_check:
            print(f"🔍 Tabla: {table}")
            
            # Verificar si existe
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            if not cursor.fetchone():
                print(f"   ❌ No existe\n")
                continue
                
            # Mostrar estructura
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            
            print(f"   ✅ Existe - {len(columns)} columnas:")
            for col in columns:
                field, type_info, null, key, default, extra = col
                key_info = f" [{key}]" if key else ""
                print(f"     • {field}: {type_info}{key_info}")
            
            # Contar registros
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   📊 Registros: {count}")
            
            print()
        
        # Verificar constraints de foreign key
        print("🔗 FOREIGN KEY CONSTRAINTS:")
        cursor.execute("""
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = %s
            AND TABLE_NAME LIKE '%ingredient%'
            ORDER BY TABLE_NAME, CONSTRAINT_NAME
        """, (DB_CONFIG['database'],))
        
        constraints = cursor.fetchall()
        for constraint in constraints:
            constraint_name, table_name, column_name, ref_table, ref_column = constraint
            print(f"   {table_name}.{column_name} -> {ref_table}.{ref_column} ({constraint_name})")
        
        print()
        
        # Verificar vistas
        print("👁️ VISTAS:")
        cursor.execute(f"""
            SHOW FULL TABLES 
            WHERE Table_type = 'VIEW' 
            AND Tables_in_{DB_CONFIG['database']} LIKE '%ingredient%'
        """)
        views = cursor.fetchall()
        for view in views:
            print(f"   ✅ {view[0]}")
        
        if not views:
            print("   ❌ No hay vistas relacionadas con ingredientes")
        
        cursor.close()
        connection.close()
        
        return True
        
    except Exception as e:
        print(f"💥 Error diagnosticando esquema: {e}")
        return False

if __name__ == "__main__":
    diagnose_tables()