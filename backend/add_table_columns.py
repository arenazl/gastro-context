#!/usr/bin/env python3
import mysql.connector
import logging

# Configuración de conexión
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'ssl_disabled': False,
    'raise_on_warnings': True
}

def add_table_columns():
    try:
        # Conectar a la base de datos
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Primero verificar qué columnas ya existen
        cursor.execute("SHOW COLUMNS FROM tables")
        existing_columns = [column[0] for column in cursor.fetchall()]
        print(f"Columnas existentes: {existing_columns}")
        
        # Lista de columnas a agregar
        columns_to_add = [
            ('x', 'INT DEFAULT 100'),
            ('y', 'INT DEFAULT 100'),
            ('width', 'INT DEFAULT 80'),
            ('height', 'INT DEFAULT 80'),
            ('rotation', 'INT DEFAULT 0'),
            ('shape', "VARCHAR(20) DEFAULT 'square'")
        ]
        
        # Agregar columnas que no existen
        for col_name, col_def in columns_to_add:
            if col_name not in existing_columns:
                query = f"ALTER TABLE tables ADD COLUMN {col_name} {col_def}"
                cursor.execute(query)
                print(f"✅ Columna '{col_name}' agregada")
            else:
                print(f"ℹ️ Columna '{col_name}' ya existe")
        
        connection.commit()
        
        # Actualizar posiciones iniciales para mesas existentes
        cursor.execute("""
            UPDATE tables 
            SET x = 100 + ((id - 1) % 5) * 150,
                y = 100 + FLOOR((id - 1) / 5) * 150
            WHERE x IS NULL OR x = 0
        """)
        connection.commit()
        
        print("✅ Columnas de posicionamiento agregadas correctamente")
        
        # Verificar estructura final
        cursor.execute("SHOW COLUMNS FROM tables")
        print("\nEstructura final de la tabla:")
        for column in cursor.fetchall():
            print(f"  - {column[0]}: {column[1]}")
        
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Error MySQL: {err}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    add_table_columns()