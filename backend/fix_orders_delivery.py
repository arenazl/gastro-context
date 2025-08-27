#!/usr/bin/env python3
"""
Actualiza la tabla orders para soportar delivery
"""
import mysql.connector
from mysql.connector import pooling
import traceback

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_PJFAwG88IQs6oGKt0bh',
    'database': 'gastro',
    'autocommit': False,
    'raise_on_warnings': True
}

def fix_orders_table():
    """Actualizar tabla orders para soportar delivery"""
    connection = None
    cursor = None
    
    try:
        print("🔗 Conectando a la base de datos...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 1. Hacer table_number nullable
        print("\n1️⃣ Haciendo table_number nullable...")
        try:
            cursor.execute("ALTER TABLE orders MODIFY COLUMN table_number INT NULL")
            connection.commit()
            print("   ✅ table_number ahora acepta NULL")
        except mysql.connector.Error as e:
            if "already" in str(e).lower() or "duplicate" in str(e).lower():
                print("   ⚠️ Ya estaba configurado como nullable")
            else:
                print(f"   ❌ Error: {e}")
        
        # 2. Agregar columna order_type
        print("\n2️⃣ Agregando columna order_type...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN order_type VARCHAR(20) DEFAULT 'salon' 
                COMMENT 'salon o delivery'
            """)
            connection.commit()
            print("   ✅ Columna order_type agregada")
        except mysql.connector.Error as e:
            if "duplicate" in str(e).lower():
                print("   ⚠️ Columna order_type ya existe")
            else:
                print(f"   ❌ Error: {e}")
        
        # 3. Agregar columna delivery_address_id
        print("\n3️⃣ Agregando columna delivery_address_id...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN delivery_address_id INT NULL
            """)
            connection.commit()
            print("   ✅ Columna delivery_address_id agregada")
        except mysql.connector.Error as e:
            if "duplicate" in str(e).lower():
                print("   ⚠️ Columna delivery_address_id ya existe")
            else:
                print(f"   ❌ Error: {e}")
        
        # 4. Agregar columna number_of_people
        print("\n4️⃣ Agregando columna number_of_people...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN number_of_people INT NULL
            """)
            connection.commit()
            print("   ✅ Columna number_of_people agregada")
        except mysql.connector.Error as e:
            if "duplicate" in str(e).lower():
                print("   ⚠️ Columna number_of_people ya existe")
            else:
                print(f"   ❌ Error: {e}")
        
        # 5. Verificar estructura actualizada
        print("\n5️⃣ Verificando estructura de la tabla...")
        cursor.execute("DESCRIBE orders")
        columns = cursor.fetchall()
        
        print("\n📋 Estructura actual de la tabla orders:")
        print("-" * 60)
        for col in columns:
            field_name = col[0]
            field_type = col[1]
            null_allowed = col[2]
            if field_name in ['table_number', 'order_type', 'delivery_address_id', 'number_of_people']:
                print(f"  {field_name:<25} {field_type:<20} NULL: {null_allowed}")
        
        print("\n✅ Tabla actualizada correctamente para soportar delivery!")
        
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        print(traceback.format_exc())
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
        print("\n🔒 Conexión cerrada")

if __name__ == "__main__":
    fix_orders_table()