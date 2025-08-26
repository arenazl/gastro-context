#!/usr/bin/env python3
"""
Script para agregar todas las tablas adicionales del sistema multi-tenant
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

def execute_sql(cursor, sql, description):
    """Ejecuta una sentencia SQL con manejo de errores"""
    try:
        cursor.execute(sql)
        print(f"   ✓ {description}")
        return True
    except pymysql.Error as e:
        if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
            print(f"   ⚠ {description} - ya existe")
        else:
            print(f"   ✗ {description} - Error: {str(e)[:100]}")
        return False

def main():
    """Ejecuta las mejoras del sistema multi-tenant"""
    print("=" * 60)
    print("MEJORANDO SISTEMA MULTI-TENANT")
    print("=" * 60)
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print(f"✓ Conectado a la base de datos: {DB_CONFIG['database']}\n")
        
        # 1. Crear tabla de sucursales
        print("1. Creando tabla de sucursales...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS company_branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE,
                address VARCHAR(500),
                phone VARCHAR(50),
                email VARCHAR(255),
                manager_user_id INT,
                is_main BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                opening_time TIME,
                closing_time TIME,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                INDEX idx_branch_company (company_id),
                INDEX idx_branch_active (is_active)
            )
        """, "Tabla company_branches creada")
        connection.commit()
        
        # 2. Crear tabla de permisos
        print("\n2. Creando tabla de permisos...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                module VARCHAR(50) NOT NULL,
                action VARCHAR(50) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_permission_module (module),
                UNIQUE KEY unique_permission (module, action)
            )
        """, "Tabla permissions creada")
        connection.commit()
        
        # 3. Crear tabla role_permissions
        print("\n3. Creando tabla role_permissions...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                permission_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                UNIQUE KEY unique_role_permission (role_id, permission_id),
                INDEX idx_role_permission (role_id)
            )
        """, "Tabla role_permissions creada")
        connection.commit()
        
        # 4. Crear tabla company_users (relación muchos a muchos)
        print("\n4. Creando tabla company_users...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS company_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                user_id INT NOT NULL,
                role_id INT NOT NULL,
                branch_id INT DEFAULT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                left_at TIMESTAMP NULL DEFAULT NULL,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id),
                FOREIGN KEY (branch_id) REFERENCES company_branches(id) ON DELETE SET NULL,
                UNIQUE KEY unique_company_user (company_id, user_id),
                INDEX idx_company_user_active (company_id, is_active),
                INDEX idx_user_companies (user_id)
            )
        """, "Tabla company_users creada")
        connection.commit()
        
        # 5. Crear tabla de planes de suscripción
        print("\n5. Creando tabla de planes de suscripción...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100),
                description TEXT,
                price_monthly DECIMAL(10,2),
                price_yearly DECIMAL(10,2),
                max_users INT DEFAULT 5,
                max_branches INT DEFAULT 1,
                max_products INT DEFAULT 100,
                max_orders_per_month INT DEFAULT 1000,
                storage_limit_mb INT DEFAULT 1000,
                features JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """, "Tabla subscription_plans creada")
        connection.commit()
        
        # 6. Crear tabla de logs de actividad
        print("\n6. Creando tabla de logs de actividad...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS activity_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                user_id INT,
                action VARCHAR(100) NOT NULL,
                module VARCHAR(50),
                record_id INT,
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                user_agent VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_activity_company (company_id, created_at),
                INDEX idx_activity_user (user_id, created_at),
                INDEX idx_activity_module (module, action)
            )
        """, "Tabla activity_logs creada")
        connection.commit()
        
        # 7. Crear tabla de invitaciones
        print("\n7. Creando tabla de invitaciones...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS company_invitations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                role_id INT NOT NULL,
                branch_id INT,
                token VARCHAR(255) UNIQUE NOT NULL,
                invited_by_user_id INT,
                accepted_at TIMESTAMP NULL DEFAULT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id),
                FOREIGN KEY (branch_id) REFERENCES company_branches(id) ON DELETE SET NULL,
                FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_invitation_token (token),
                INDEX idx_invitation_email (email),
                INDEX idx_invitation_expires (expires_at)
            )
        """, "Tabla company_invitations creada")
        connection.commit()
        
        # 8. Crear tabla de notificaciones
        print("\n8. Creando tabla de notificaciones...")
        execute_sql(cursor, """
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id INT NOT NULL,
                user_id INT,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                data JSON,
                is_read BOOLEAN DEFAULT FALSE,
                read_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_notification_user (user_id, is_read),
                INDEX idx_notification_company (company_id, created_at)
            )
        """, "Tabla notifications creada")
        connection.commit()
        
        # 9. Insertar planes de suscripción
        print("\n9. Insertando planes de suscripción...")
        plans = [
            ('basic', 'Plan Básico', 'Ideal para restaurantes pequeños', 99.00, 990.00, 5, 1, 100, 1000, 1000, 
             '["pos", "kitchen", "basic_reports"]'),
            ('pro', 'Plan Profesional', 'Para restaurantes en crecimiento', 199.00, 1990.00, 15, 3, 500, 5000, 5000,
             '["pos", "kitchen", "advanced_reports", "inventory", "delivery", "customer_management"]'),
            ('enterprise', 'Plan Enterprise', 'Solución completa para cadenas', 499.00, 4990.00, 999, 999, 9999, 99999, 50000,
             '["all_features", "api_access", "custom_integrations", "priority_support"]')
        ]
        
        for plan in plans:
            try:
                cursor.execute("""
                    INSERT INTO subscription_plans 
                    (name, display_name, description, price_monthly, price_yearly, 
                     max_users, max_branches, max_products, max_orders_per_month, 
                     storage_limit_mb, features)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE price_monthly = VALUES(price_monthly)
                """, plan)
                print(f"   ✓ Plan '{plan[0]}' insertado")
            except Exception as e:
                print(f"   ⚠ Plan '{plan[0]}': {e}")
        connection.commit()
        
        # 10. Insertar permisos básicos
        print("\n10. Insertando permisos básicos...")
        permissions = [
            ('products', 'create', 'products.create', 'Crear productos'),
            ('products', 'read', 'products.read', 'Ver productos'),
            ('products', 'update', 'products.update', 'Editar productos'),
            ('products', 'delete', 'products.delete', 'Eliminar productos'),
            ('orders', 'create', 'orders.create', 'Crear órdenes'),
            ('orders', 'read', 'orders.read', 'Ver órdenes'),
            ('orders', 'update', 'orders.update', 'Actualizar órdenes'),
            ('orders', 'cancel', 'orders.cancel', 'Cancelar órdenes'),
            ('tables', 'read', 'tables.read', 'Ver mesas'),
            ('tables', 'update', 'tables.update', 'Actualizar estado de mesas'),
            ('reports', 'view', 'reports.view', 'Ver reportes'),
            ('reports', 'export', 'reports.export', 'Exportar reportes'),
            ('settings', 'read', 'settings.read', 'Ver configuración'),
            ('settings', 'update', 'settings.update', 'Modificar configuración'),
        ]
        
        for perm in permissions:
            try:
                cursor.execute("""
                    INSERT INTO permissions (module, action, name, description)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE description = VALUES(description)
                """, perm)
            except:
                pass
        connection.commit()
        print("   ✓ Permisos insertados")
        
        # 11. Crear sucursal principal para empresa existente
        print("\n11. Creando sucursal principal...")
        cursor.execute("""
            INSERT INTO company_branches (company_id, name, code, is_main, is_active)
            SELECT id, CONCAT(name, ' - Principal'), CONCAT('MAIN-', id), TRUE, TRUE
            FROM companies
            WHERE NOT EXISTS (
                SELECT 1 FROM company_branches 
                WHERE company_id = companies.id AND is_main = TRUE
            )
        """)
        connection.commit()
        print("   ✓ Sucursal principal creada")
        
        # 12. Migrar usuarios existentes a company_users
        print("\n12. Migrando usuarios a company_users...")
        cursor.execute("""
            INSERT IGNORE INTO company_users (company_id, user_id, role_id, is_active)
            SELECT u.company_id, u.id, u.role_id, u.is_active
            FROM users u
            WHERE u.company_id IS NOT NULL AND u.role_id IS NOT NULL
        """)
        connection.commit()
        print("   ✓ Usuarios migrados")
        
        # Verificación final
        print("\n" + "=" * 60)
        print("VERIFICACIÓN FINAL")
        print("=" * 60)
        
        tables = [
            'company_branches',
            'permissions',
            'role_permissions',
            'company_users',
            'subscription_plans',
            'activity_logs',
            'company_invitations',
            'notifications'
        ]
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"✓ {table}: {count} registros")
        
        print("\n" + "=" * 60)
        print("✅ SISTEMA MULTI-TENANT MEJORADO EXITOSAMENTE")
        print("=" * 60)
        
    except pymysql.Error as e:
        print(f"\n❌ Error: {e}")
        return 1
    finally:
        if 'connection' in locals():
            connection.close()
    
    return 0

if __name__ == "__main__":
    exit(main())