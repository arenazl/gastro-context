#!/usr/bin/env python3
"""
Script para ejecutar las migraciones de base de datos
"""

import pymysql
import os
from pathlib import Path

# Configuración de conexión - Aiven MySQL
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def execute_sql_file(connection, file_path):
    """Ejecuta un archivo SQL completo"""
    print(f"Ejecutando: {file_path}")
    
    with open(file_path, 'r', encoding='utf8') as file:
        sql_content = file.read()
    
    # Dividir por declaraciones
    statements = []
    current_statement = ""
    delimiter = ";"
    in_delimiter_declaration = False
    
    for line in sql_content.split('\n'):
        line = line.strip()
        
        # Detectar cambio de delimiter
        if line.upper().startswith('DELIMITER'):
            parts = line.split()
            if len(parts) > 1:
                new_delimiter = parts[1]
                if new_delimiter != delimiter:
                    delimiter = new_delimiter
                    in_delimiter_declaration = True
                    continue
        
        # Agregar línea al statement actual
        if line and not line.startswith('--'):
            current_statement += line + " "
            
            # Si encontramos el delimiter, es el fin del statement
            if current_statement.rstrip().endswith(delimiter):
                # Remover el delimiter del final
                statement = current_statement.rstrip()[:-len(delimiter)].strip()
                if statement:
                    statements.append(statement)
                current_statement = ""
    
    # Ejecutar cada statement
    with connection.cursor() as cursor:
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements, 1):
            try:
                # Saltar declaraciones de DELIMITER
                if statement.upper().startswith('DELIMITER'):
                    continue
                    
                cursor.execute(statement)
                connection.commit()
                success_count += 1
                
                # Mostrar progreso para statements importantes
                if 'CREATE TABLE' in statement.upper():
                    table_name = statement.split('CREATE TABLE')[1].split('(')[0].strip()
                    print(f"  ✓ Tabla creada: {table_name}")
                elif 'ALTER TABLE' in statement.upper():
                    table_name = statement.split('ALTER TABLE')[1].split()[0].strip()
                    print(f"  ✓ Tabla modificada: {table_name}")
                elif 'INSERT INTO' in statement.upper():
                    table_name = statement.split('INSERT INTO')[1].split('(')[0].strip()
                    print(f"  ✓ Datos insertados en: {table_name}")
                elif 'CREATE PROCEDURE' in statement.upper():
                    proc_name = statement.split('CREATE PROCEDURE')[1].split('(')[0].strip()
                    print(f"  ✓ Procedimiento creado: {proc_name}")
                elif 'CREATE VIEW' in statement.upper() or 'CREATE OR REPLACE VIEW' in statement.upper():
                    view_name = statement.split('VIEW')[1].split('AS')[0].strip()
                    print(f"  ✓ Vista creada: {view_name}")
                    
            except pymysql.Error as e:
                error_count += 1
                # Solo mostrar errores que no sean de "ya existe"
                error_msg = str(e)
                if 'already exists' not in error_msg.lower() and 'duplicate' not in error_msg.lower():
                    print(f"  ⚠ Error en statement {i}: {error_msg[:100]}")
        
        print(f"  Completado: {success_count} exitosos, {error_count} errores/ignorados")
        return success_count, error_count

def main():
    """Ejecuta todas las migraciones"""
    print("=" * 60)
    print("EJECUTANDO MIGRACIONES DE BASE DE DATOS")
    print("=" * 60)
    
    try:
        # Conectar a la base de datos
        connection = pymysql.connect(**DB_CONFIG)
        print(f"✓ Conectado a la base de datos: {DB_CONFIG['database']}")
        print()
        
        # Directorio de scripts SQL
        sql_dir = Path(__file__).parent / 'sql'
        
        # Archivos a ejecutar en orden
        migration_files = [
            'multi_tenant_migration.sql',
            'company_settings_table.sql'
        ]
        
        total_success = 0
        total_errors = 0
        
        for file_name in migration_files:
            file_path = sql_dir / file_name
            if file_path.exists():
                print(f"\n📄 {file_name}")
                print("-" * 40)
                success, errors = execute_sql_file(connection, file_path)
                total_success += success
                total_errors += errors
            else:
                print(f"\n⚠ Archivo no encontrado: {file_path}")
        
        # Verificar cambios
        print("\n" + "=" * 60)
        print("VERIFICANDO CAMBIOS APLICADOS")
        print("=" * 60)
        
        with connection.cursor() as cursor:
            # Verificar que las tablas tienen company_id
            tables_to_check = ['categories', 'subcategories', 'products', 'tables', 'orders', 'customers', 'users']
            
            for table in tables_to_check:
                cursor.execute(f"""
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = '{DB_CONFIG['database']}' 
                    AND TABLE_NAME = '{table}' 
                    AND COLUMN_NAME = 'company_id'
                """)
                
                if cursor.fetchone():
                    print(f"✓ {table}: tiene company_id")
                else:
                    print(f"✗ {table}: NO tiene company_id")
            
            # Verificar nuevas tablas
            new_tables = ['companies', 'roles', 'company_settings']
            for table in new_tables:
                cursor.execute(f"""
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = '{DB_CONFIG['database']}' 
                    AND TABLE_NAME = '{table}'
                """)
                
                if cursor.fetchone():
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"✓ {table}: existe con {count} registros")
                else:
                    print(f"✗ {table}: NO existe")
        
        print("\n" + "=" * 60)
        print(f"MIGRACIÓN COMPLETADA")
        print(f"Total: {total_success} statements exitosos, {total_errors} errores/ignorados")
        print("=" * 60)
        
    except pymysql.Error as e:
        print(f"\n❌ Error de conexión: {e}")
        return 1
    finally:
        if 'connection' in locals():
            connection.close()
    
    return 0

if __name__ == "__main__":
    exit(main())