import mysql.connector

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def explore_database():
    """Explorar completamente la estructura de la base de datos"""
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        # Obtener todas las tablas
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print("=== TABLAS EN LA BASE DE DATOS ===")
        table_names = []
        for table in tables:
            table_name = list(table.values())[0]  # El nombre está en el primer valor
            table_names.append(table_name)
            print(f"- {table_name}")
        
        print(f"\nTotal: {len(table_names)} tablas\n")
        
        # Describir tablas relacionadas con productos e ingredientes
        relevant_tables = [t for t in table_names if any(keyword in t.lower() 
                          for keyword in ['product', 'ingredient', 'categor'])]
        
        print("=== ESTRUCTURA DE TABLAS RELEVANTES ===")
        for table_name in relevant_tables:
            print(f"\n📋 TABLA: {table_name}")
            print("-" * 50)
            
            cursor.execute(f"DESCRIBE {table_name}")
            columns = cursor.fetchall()
            
            for col in columns:
                print(f"  {col['Field']:20} {col['Type']:15} {col['Null']:5} {col['Key']:5} {col.get('Default', 'NULL')}")
            
            # Mostrar algunos registros de ejemplo
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
            sample_data = cursor.fetchall()
            
            if sample_data:
                print(f"\n  Ejemplo de datos:")
                for row in sample_data:
                    print(f"    {dict(row)}")
        
        # Buscar relaciones entre tablas
        print("\n=== RELACIONES FOREIGN KEYS ===")
        cursor.execute("""
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = 'gastro'
                AND REFERENCED_TABLE_NAME IS NOT NULL
        """)
        
        foreign_keys = cursor.fetchall()
        for fk in foreign_keys:
            print(f"  {fk['TABLE_NAME']}.{fk['COLUMN_NAME']} -> {fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}")
        
    except mysql.connector.Error as err:
        print(f"❌ Error de MySQL: {err}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    explore_database()