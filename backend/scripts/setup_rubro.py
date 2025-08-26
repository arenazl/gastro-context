import mysql.connector
import json

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def setup_rubro_tables():
    """Crear tablas de rubro y configuración"""
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print("🔄 Creando tabla 'rubro'...")
        
        # Leer y ejecutar el archivo SQL
        with open('create_rubro_table.sql', 'r', encoding='utf-8') as file:
            sql_content = file.read()
            
        # Ejecutar cada statement separadamente
        statements = sql_content.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement:
                print(f"📄 Ejecutando: {statement[:50]}...")
                cursor.execute(statement)
        
        connection.commit()
        print("✅ Tablas de rubro creadas exitosamente!")
        
        # Verificar datos insertados
        cursor.execute("SELECT * FROM rubro")
        rubros = cursor.fetchall()
        
        print(f"\n📊 Rubros disponibles ({len(rubros)}):")
        for rubro in rubros:
            print(f"  - ID: {rubro[0]}, Nombre: {rubro[1]}, Pregunta: {rubro[3]}")
            
        # Verificar configuración actual
        cursor.execute("""
            SELECT cn.*, r.nombre as rubro_nombre 
            FROM configuracion_negocio cn 
            JOIN rubro r ON cn.rubro_id = r.id 
            WHERE cn.is_active = TRUE
        """)
        config = cursor.fetchone()
        
        if config:
            print(f"\n🎯 Configuración actual:")
            print(f"  - Negocio: {config[2]}")
            print(f"  - Rubro: {config[5]}")
        
    except mysql.connector.Error as err:
        print(f"❌ Error de MySQL: {err}")
        if connection:
            connection.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    setup_rubro_tables()