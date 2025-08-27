#!/usr/bin/env python3
"""
Script para configurar el módulo de ingredientes inteligente en la base de datos
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

def execute_sql_file(file_path):
    """Ejecuta un archivo SQL completo"""
    try:
        # Leer el archivo SQL
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Dividir en statements individuales
        statements = sql_content.split(';')
        statements = [stmt.strip() for stmt in statements if stmt.strip()]
        
        # Conectar a la base de datos
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        success_count = 0
        error_count = 0
        
        print(f"🧪 Ejecutando {len(statements)} statements SQL...")
        
        for i, statement in enumerate(statements, 1):
            try:
                # Ejecutar todos los statements válidos
                cursor.execute(statement)
                connection.commit()
                success_count += 1
                print(f"✅ Statement {i}: Ejecutado exitosamente")
                if statement.upper().startswith('CREATE TABLE'):
                    table_name = statement.split()[5].strip('`')
                    print(f"   → Tabla creada: {table_name}")
                elif statement.upper().startswith('INSERT'):
                    print(f"   → Datos insertados")
                elif statement.upper().startswith('CREATE OR REPLACE VIEW'):
                    view_name = statement.split()[4].strip('`')
                    print(f"   → Vista creada: {view_name}")
                
            except mysql.connector.Error as e:
                error_count += 1
                print(f"❌ Error en statement {i}: {e}")
                # Para algunos errores como "tabla ya existe", continuamos
                if "already exists" not in str(e).lower():
                    print(f"   SQL: {statement[:100]}...")
        
        cursor.close()
        connection.close()
        
        print(f"\n📊 Resumen de ejecución:")
        print(f"   ✅ Exitosos: {success_count}")
        print(f"   ❌ Errores: {error_count}")
        
        if error_count == 0:
            print(f"🎉 ¡Módulo de ingredientes configurado exitosamente!")
        else:
            print(f"⚠️  Configurado con algunos errores (posiblemente normales)")
            
        return True
        
    except Exception as e:
        print(f"💥 Error fatal ejecutando SQL: {e}")
        return False

def verify_tables():
    """Verifica que las tablas se crearon correctamente"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        expected_tables = [
            'ingredient_categories', 
            'measurement_units', 
            'allergens', 
            'ingredients',
            'ingredient_allergens',
            'product_ingredients',
            'ai_ingredient_suggestions',
            'ingredient_stock_movements'
        ]
        
        print(f"\n🔍 Verificando creación de tablas...")
        
        for table in expected_tables:
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            result = cursor.fetchone()
            if result:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"✅ {table}: Creada ✓ ({count} registros)")
            else:
                print(f"❌ {table}: No encontrada")
        
        # Verificar vistas
        print(f"\n🔍 Verificando vistas...")
        views = [
            'v_ingredients_summary', 
            'v_product_ingredients_cost', 
            'v_critical_stock'
        ]
        
        for view in views:
            cursor.execute(f"SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_{DB_CONFIG['database']} = '{view}'")
            result = cursor.fetchone()
            if result:
                print(f"✅ Vista {view}: Creada ✓")
            else:
                print(f"❌ Vista {view}: No encontrada")
        
        cursor.close()
        connection.close()
        
        return True
        
    except Exception as e:
        print(f"💥 Error verificando tablas: {e}")
        return False

def check_gemini_integration():
    """Verifica que Gemini esté configurado para sugerencias de IA"""
    try:
        gemini_key = os.getenv('GEMINI_API_KEY')
        if gemini_key and len(gemini_key) > 20:
            print(f"✅ Gemini API Key configurada: {gemini_key[:20]}...")
            return True
        else:
            print(f"⚠️  Gemini API Key no configurada - Las sugerencias de IA no funcionarán")
            return False
    except Exception as e:
        print(f"❌ Error verificando Gemini: {e}")
        return False

def show_next_steps():
    """Muestra los próximos pasos para completar el módulo"""
    print(f"\n🎯 Próximos pasos:")
    print(f"   1. 🔌 Implementar endpoints API para ingredientes")
    print(f"   2. 🤖 Crear integración con Gemini para sugerencias")
    print(f"   3. 🎨 Crear interfaz expandible en gestión de productos")
    print(f"   4. 📊 Implementar gestión de stock e inventario")
    print(f"   5. 🧮 Calcular costos automáticos por ingredientes")
    
    print(f"\n💡 Funcionalidades disponibles:")
    print(f"   • Sistema de categorías y alergenos")
    print(f"   • Control de stock con alertas críticas")
    print(f"   • Historial de sugerencias de IA para aprendizaje")
    print(f"   • Cálculo automático de costos por producto")
    print(f"   • Gestión de unidades de medida y conversiones")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 CONFIGURACIÓN DEL MÓDULO DE INGREDIENTES INTELIGENTE")
    print("=" * 60)
    
    # Verificar archivo SQL
    sql_file = 'sql/ingredients_module.sql'
    if not os.path.exists(sql_file):
        print(f"❌ No se encuentra el archivo SQL: {sql_file}")
        exit(1)
    
    # Ejecutar SQL
    success = execute_sql_file(sql_file)
    
    if success:
        # Verificar que todo se creó correctamente
        verify_tables()
        
        # Verificar integración con Gemini
        check_gemini_integration()
        
        # Mostrar próximos pasos
        show_next_steps()
        
    else:
        print(f"\n💥 La configuración falló. Revisa los errores arriba.")
        exit(1)