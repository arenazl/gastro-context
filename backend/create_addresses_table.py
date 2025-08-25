#!/usr/bin/env python3
"""
Script para crear la tabla addresses que falta en el sistema
Corrige la inconsistencia entre frontend (múltiples direcciones) y backend (campo único)
"""

import mysql.connector
from mysql.connector import pooling
import logging

# Configuración de BD
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'arenazl',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

def create_addresses_table():
    connection = None
    cursor = None
    
    try:
        print("🔧 Conectando a MySQL...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 1. Crear tabla addresses
        print("📋 Creando tabla addresses...")
        create_table_query = """
        CREATE TABLE IF NOT EXISTS addresses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            address_type ENUM('home', 'work', 'other') DEFAULT 'home',
            street_address VARCHAR(255) NOT NULL,
            city VARCHAR(100) NOT NULL,
            state_province VARCHAR(100),
            postal_code VARCHAR(20),
            country VARCHAR(100) DEFAULT 'Argentina',
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            is_default BOOLEAN DEFAULT FALSE,
            delivery_instructions TEXT,
            formatted_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            INDEX idx_customer_id (customer_id),
            INDEX idx_address_type (address_type),
            INDEX idx_is_default (is_default)
        )
        """
        
        cursor.execute(create_table_query)
        print("✅ Tabla addresses creada exitosamente")
        
        # 2. Migrar datos existentes del campo customers.address
        print("📦 Migrando direcciones existentes...")
        migrate_query = """
        INSERT INTO addresses (customer_id, address_type, street_address, city, is_default, formatted_address, created_at)
        SELECT 
            id as customer_id,
            'home' as address_type,
            COALESCE(address, 'Dirección no especificada') as street_address,
            'Ciudad no especificada' as city,
            TRUE as is_default,
            address as formatted_address,
            COALESCE(created_at, NOW()) as created_at
        FROM customers 
        WHERE address IS NOT NULL 
          AND address != ''
          AND id NOT IN (SELECT DISTINCT customer_id FROM addresses)
        """
        
        cursor.execute(migrate_query)
        migrated_count = cursor.rowcount
        
        connection.commit()
        print(f"✅ {migrated_count} direcciones migradas exitosamente")
        
        # 3. Verificar resultado
        cursor.execute("SELECT COUNT(*) FROM addresses")
        total_addresses = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM customers")
        total_customers = cursor.fetchone()[0]
        
        print(f"\n📊 Resumen:")
        print(f"   👥 Clientes totales: {total_customers}")
        print(f"   🏠 Direcciones totales: {total_addresses}")
        
        # 4. Mostrar algunas direcciones de ejemplo
        cursor.execute("""
            SELECT c.first_name, c.last_name, a.address_type, a.street_address, a.city
            FROM customers c 
            JOIN addresses a ON c.id = a.customer_id 
            LIMIT 3
        """)
        
        print(f"\n📋 Ejemplos de direcciones:")
        for row in cursor.fetchall():
            print(f"   {row[0]} {row[1]} - {row[2]}: {row[3]}, {row[4]}")
            
        print(f"\n🎉 ¡Sistema de direcciones múltiples listo!")
        
    except mysql.connector.Error as e:
        print(f"❌ Error MySQL: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    create_addresses_table()