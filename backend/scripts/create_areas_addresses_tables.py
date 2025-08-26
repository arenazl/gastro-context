#!/usr/bin/env python3
"""
Create missing tables for Restaurant Management System: areas and addresses
"""
import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def create_areas_table():
    """Create areas table"""
    return """
    CREATE TABLE IF NOT EXISTS areas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        capacity INT DEFAULT 0,
        outdoor BOOLEAN DEFAULT FALSE,
        smoking_allowed BOOLEAN DEFAULT FALSE,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50) DEFAULT 'square',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_areas_company (company_id),
        INDEX idx_areas_active (is_active),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """

def create_addresses_table():
    """Create addresses table"""
    return """
    CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        company_id INT NOT NULL,
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
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_addresses_customer (customer_id),
        INDEX idx_addresses_company (company_id),
        INDEX idx_addresses_active (is_active),
        INDEX idx_addresses_location (latitude, longitude),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """

def add_area_id_to_tables():
    """Add area_id column to tables table"""
    return """
    ALTER TABLE tables 
    ADD COLUMN area_id INT NULL,
    ADD INDEX idx_tables_area (area_id),
    ADD FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;
    """

def create_sample_data():
    """Create sample areas and addresses for testing"""
    
    areas_data = """
    INSERT IGNORE INTO areas (company_id, name, description, capacity, outdoor, smoking_allowed, color, icon) VALUES
    (1, 'Salón Principal', 'Área principal del restaurante con vista a la calle', 80, FALSE, FALSE, '#3B82F6', 'home'),
    (1, 'Terraza', 'Área al aire libre con vista panorámica', 40, TRUE, TRUE, '#10B981', 'sun'),
    (1, 'Salón Privado', 'Área reservada para eventos y celebraciones', 20, FALSE, FALSE, '#8B5CF6', 'users'),
    (1, 'Bar', 'Área de bar y cócteles', 16, FALSE, FALSE, '#F59E0B', 'glass'),
    (1, 'VIP', 'Área exclusiva para clientes VIP', 12, FALSE, FALSE, '#EF4444', 'star');
    """
    
    return areas_data

def main():
    """Main execution function"""
    
    try:
        print("🏪 CREANDO TABLAS FALTANTES PARA ABM")
        print("=" * 50)
        
        # Connect to database
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("📋 Creando tabla AREAS...")
        cursor.execute(create_areas_table())
        connection.commit()
        print("✅ Tabla areas creada")
        
        print("📋 Creando tabla ADDRESSES...")  
        cursor.execute(create_addresses_table())
        connection.commit()
        print("✅ Tabla addresses creada")
        
        print("📋 Agregando area_id a tabla TABLES...")
        try:
            cursor.execute(add_area_id_to_tables())
            connection.commit()
            print("✅ Columna area_id agregada a tables")
        except mysql.connector.Error as e:
            if "Duplicate column name" in str(e):
                print("⚠️  Columna area_id ya existe en tables")
            else:
                print(f"❌ Error agregando area_id: {e}")
        
        print("📋 Creando datos de ejemplo...")
        cursor.execute(create_sample_data())
        connection.commit()
        print("✅ Datos de ejemplo creados")
        
        print("\n🎯 VERIFICANDO TABLAS CREADAS:")
        print("-" * 30)
        
        # Verify areas table
        cursor.execute("SELECT COUNT(*) FROM areas")
        areas_count = cursor.fetchone()[0]
        print(f"📍 Áreas: {areas_count} registros")
        
        # Verify addresses table  
        cursor.execute("SELECT COUNT(*) FROM addresses")
        addresses_count = cursor.fetchone()[0]
        print(f"🏠 Direcciones: {addresses_count} registros")
        
        # Show areas created
        cursor.execute("SELECT id, name, description, capacity, outdoor FROM areas WHERE company_id = 1")
        areas = cursor.fetchall()
        print(f"\n🏢 ÁREAS CREADAS:")
        for area in areas:
            outdoor_text = " (Exterior)" if area[4] else ""
            print(f"  {area[0]}. {area[1]} - Cap: {area[3]}{outdoor_text}")
        
        print(f"\n✅ TABLAS CREADAS EXITOSAMENTE!")
        print("🔧 Ahora puedes usar los ABM completos")
        
    except Error as e:
        print(f"❌ Error creando tablas: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
    
    return True

if __name__ == "__main__":
    main()