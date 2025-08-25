#!/usr/bin/env python3
"""
Script simplificado para agregar company_id a todas las tablas
"""

import pymysql

# Configuración de conexión - Aiven MySQL
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def main():
    """Agrega company_id a todas las tablas"""
    print("=" * 60)
    print("AGREGANDO COMPANY_ID A TODAS LAS TABLAS")
    print("=" * 60)
    
    try:
        # Conectar a la base de datos
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print(f"✓ Conectado a la base de datos: {DB_CONFIG['database']}\n")
        
        # 1. Crear tabla companies si no existe
        print("1. Creando tabla companies...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                logo_url VARCHAR(500),
                address VARCHAR(500),
                phone VARCHAR(50),
                email VARCHAR(255),
                tax_id VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        connection.commit()
        print("   ✓ Tabla companies creada/verificada")
        
        # 2. Insertar empresa por defecto
        print("\n2. Insertando empresa por defecto...")
        cursor.execute("""
            INSERT IGNORE INTO companies (id, name, email, is_active) 
            VALUES (1, 'Gastro Premium', 'admin@gastropremium.com', TRUE)
        """)
        connection.commit()
        print("   ✓ Empresa Gastro Premium creada/verificada")
        
        # 3. Crear tabla roles
        print("\n3. Creando tabla roles...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description VARCHAR(255),
                permissions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()
        print("   ✓ Tabla roles creada/verificada")
        
        # 4. Insertar roles básicos
        print("\n4. Insertando roles básicos...")
        roles = [
            ('admin', 'Administrador del sistema', '{"all": true}'),
            ('kitchen', 'Personal de cocina', '{"orders": ["view", "update"], "products": ["view"]}'),
            ('waiter', 'Mesero/Mozo', '{"orders": ["view", "create", "update"], "tables": ["view", "update"]}')
        ]
        
        for role_name, role_desc, role_perms in roles:
            cursor.execute("""
                INSERT IGNORE INTO roles (name, description, permissions) 
                VALUES (%s, %s, %s)
            """, (role_name, role_desc, role_perms))
        connection.commit()
        print("   ✓ Roles básicos creados/verificados")
        
        # 5. Agregar company_id a cada tabla
        tables_to_update = [
            'users',
            'categories', 
            'subcategories',
            'products',
            'tables',
            'orders',
            'order_items',
            'customers'
        ]
        
        print("\n5. Agregando company_id a las tablas...")
        for table in tables_to_update:
            try:
                # Verificar si la columna ya existe
                cursor.execute("""
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = %s 
                    AND TABLE_NAME = %s 
                    AND COLUMN_NAME = 'company_id'
                """, (DB_CONFIG['database'], table))
                
                if cursor.fetchone():
                    print(f"   ⚠ {table}: ya tiene company_id")
                else:
                    # Agregar la columna
                    cursor.execute(f"""
                        ALTER TABLE {table} 
                        ADD COLUMN company_id INT DEFAULT 1
                    """)
                    connection.commit()
                    print(f"   ✓ {table}: company_id agregado")
                    
                    # Actualizar registros existentes
                    cursor.execute(f"""
                        UPDATE {table} 
                        SET company_id = 1 
                        WHERE company_id IS NULL
                    """)
                    connection.commit()
                    
            except pymysql.Error as e:
                print(f"   ✗ {table}: Error - {e}")
        
        # 6. Agregar role_id a users si no existe
        print("\n6. Agregando role_id a tabla users...")
        try:
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'role_id'
            """, (DB_CONFIG['database'],))
            
            if cursor.fetchone():
                print("   ⚠ users: ya tiene role_id")
            else:
                cursor.execute("""
                    ALTER TABLE users 
                    ADD COLUMN role_id INT DEFAULT 1
                """)
                connection.commit()
                print("   ✓ users: role_id agregado")
                
                # Asignar rol admin a usuarios existentes
                cursor.execute("""
                    UPDATE users 
                    SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
                    WHERE role_id IS NULL OR role_id = 1
                """)
                connection.commit()
                
        except pymysql.Error as e:
            print(f"   ✗ users role_id: Error - {e}")
        
        # 7. Crear tabla company_settings
        print("\n7. Creando tabla company_settings...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS company_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL UNIQUE,
                currency_symbol VARCHAR(10) DEFAULT '$',
                currency_position ENUM('before', 'after') DEFAULT 'before',
                decimal_places INT DEFAULT 2,
                tax_enabled BOOLEAN DEFAULT TRUE,
                tax_percentage DECIMAL(5,2) DEFAULT 21.00,
                tax_name VARCHAR(50) DEFAULT 'IVA',
                tax_included_in_price BOOLEAN DEFAULT FALSE,
                order_prefix VARCHAR(10) DEFAULT 'ORD',
                order_number_length INT DEFAULT 6,
                auto_print_kitchen BOOLEAN DEFAULT TRUE,
                auto_print_receipt BOOLEAN DEFAULT FALSE,
                require_table_selection BOOLEAN DEFAULT TRUE,
                require_customer_info BOOLEAN DEFAULT FALSE,
                show_product_images BOOLEAN DEFAULT TRUE,
                allow_out_of_stock_orders BOOLEAN DEFAULT FALSE,
                track_inventory BOOLEAN DEFAULT TRUE,
                theme VARCHAR(20) DEFAULT 'light',
                primary_color VARCHAR(7) DEFAULT '#3B82F6',
                timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
                language VARCHAR(5) DEFAULT 'es',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        """)
        connection.commit()
        print("   ✓ Tabla company_settings creada/verificada")
        
        # Insertar configuración por defecto
        cursor.execute("""
            INSERT IGNORE INTO company_settings (company_id) VALUES (1)
        """)
        connection.commit()
        print("   ✓ Configuración por defecto creada")
        
        # 8. Verificación final
        print("\n" + "=" * 60)
        print("VERIFICACIÓN FINAL")
        print("=" * 60)
        
        for table in tables_to_update:
            cursor.execute("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = %s 
                AND COLUMN_NAME = 'company_id'
            """, (DB_CONFIG['database'], table))
            
            if cursor.fetchone():
                # Contar registros con company_id = 1
                cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE company_id = 1")
                count = cursor.fetchone()[0]
                print(f"✓ {table}: tiene company_id (con {count} registros en empresa 1)")
            else:
                print(f"✗ {table}: NO tiene company_id")
        
        print("\n" + "=" * 60)
        print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
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