#!/usr/bin/env python3
"""
Script para modificar la tabla orders y permitir NULL en table_number
"""
import mysql.connector
from mysql.connector import pooling

# Configuración tomada del complete_server.py
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_PJFAwG88IQs6oGKt0bh',
    'database': 'gastro',
    'ssl_ca': '/mnt/c/Code/gastro-context/backend/ca.pem',
    'ssl_verify_cert': True,
    'ssl_verify_identity': False,
    'connection_timeout': 10,
    'autocommit': True
}

def execute_alter_table():
    """Ejecutar los cambios en la tabla orders"""
    connection = None
    cursor = None
    
    try:
        print("🔗 Conectando a la base de datos MySQL Aiven...")
        
        # Crear pool de conexiones
        pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="alter_pool",
            pool_size=1,
            **DB_CONFIG
        )
        
        connection = pool.get_connection()
        cursor = connection.cursor()
        
        print("✅ Conectado exitosamente")
        
        # 1. Hacer que table_number acepte NULL
        print("\n📝 Modificando campo table_number para permitir NULL...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                MODIFY COLUMN table_number INT NULL
            """)
            print("   ✅ Campo table_number ahora permite NULL")
        except mysql.connector.Error as e:
            print(f"   ⚠️ {e}")
        
        # 2. Agregar columna order_type si no existe
        print("\n📝 Agregando columna order_type...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN order_type VARCHAR(20) DEFAULT 'salon' 
                COMMENT 'Tipo: salon o delivery'
            """)
            print("   ✅ Columna order_type agregada")
        except mysql.connector.Error as e:
            if "Duplicate column" in str(e):
                print("   ⚠️ Columna order_type ya existe")
            else:
                print(f"   ❌ Error: {e}")
        
        # 3. Agregar columna delivery_address_id
        print("\n📝 Agregando columna delivery_address_id...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN delivery_address_id INT NULL
                COMMENT 'ID de la dirección de delivery'
            """)
            print("   ✅ Columna delivery_address_id agregada")
        except mysql.connector.Error as e:
            if "Duplicate column" in str(e):
                print("   ⚠️ Columna delivery_address_id ya existe")
            else:
                print(f"   ❌ Error: {e}")
        
        # 4. Agregar columna number_of_people
        print("\n📝 Agregando columna number_of_people...")
        try:
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN number_of_people INT NULL
                COMMENT 'Cantidad de personas en la mesa'
            """)
            print("   ✅ Columna number_of_people agregada")
        except mysql.connector.Error as e:
            if "Duplicate column" in str(e):
                print("   ⚠️ Columna number_of_people ya existe")
            else:
                print(f"   ❌ Error: {e}")
        
        # 5. Verificar la estructura actual
        print("\n🔍 Verificando estructura actual de la tabla orders...")
        cursor.execute("DESCRIBE orders")
        columns = cursor.fetchall()
        
        print("\n📊 Campos relevantes de la tabla orders:")
        print("-" * 70)
        print(f"{'Campo':<25} {'Tipo':<20} {'NULL':<10} {'Default'}")
        print("-" * 70)
        
        for col in columns:
            field_name = col[0]
            field_type = col[1]
            null_allowed = col[2]
            default_val = col[4] if col[4] else ''
            
            # Mostrar solo campos relevantes
            if field_name in ['id', 'table_number', 'order_type', 'delivery_address_id', 
                             'number_of_people', 'customer_id', 'status']:
                null_str = "✅ SÍ" if null_allowed == "YES" else "❌ NO"
                print(f"{field_name:<25} {field_type:<20} {null_str:<10} {default_val}")
        
        print("\n✅ ¡Cambios aplicados exitosamente!")
        print("   La tabla orders ahora soporta órdenes de delivery sin mesa")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
        print("\n🔒 Conexión cerrada")

if __name__ == "__main__":
    print("=" * 70)
    print("SCRIPT DE ACTUALIZACIÓN DE TABLA ORDERS")
    print("=" * 70)
    execute_alter_table()