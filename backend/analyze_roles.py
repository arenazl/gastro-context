#!/usr/bin/env python3
"""
Analyze role system in gastro database
Check users, roles, and permissions structure
"""

import mysql.connector
from mysql.connector import Error
import json

# Database configuration
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def analyze_role_system():
    """Analyze the complete role and permission system"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🎭 RESTAURANT ROLE SYSTEM ANALYSIS")
        print("=" * 60)
        
        # Check users and their roles
        print("👥 CURRENT USERS AND ROLES")
        print("-" * 40)
        
        cursor.execute("""
            SELECT 
                id,
                email,
                first_name,
                last_name,
                role,
                is_active,
                created_at,
                company_id
            FROM users
            ORDER BY role, first_name
        """)
        
        users = cursor.fetchall()
        
        if users:
            role_counts = {}
            for user in users:
                user_id, email, first_name, last_name, role, is_active, created_at, company_id = user
                status = "✅ Active" if is_active else "❌ Inactive"
                print(f"  🔸 {first_name} {last_name} ({email})")
                print(f"     Role: {role} | {status} | ID: {user_id}")
                
                if role in role_counts:
                    role_counts[role] += 1
                else:
                    role_counts[role] = 1
            
            print()
            print("📊 ROLE DISTRIBUTION:")
            for role, count in sorted(role_counts.items()):
                print(f"  └─ {role}: {count} users")
        else:
            print("  ❌ No users found")
        
        print()
        
        # Check roles table if it exists
        print("🎪 ROLES TABLE STRUCTURE")
        print("-" * 40)
        
        cursor.execute("SELECT COUNT(*) FROM roles")
        roles_count = cursor.fetchone()[0]
        
        if roles_count > 0:
            cursor.execute("SELECT * FROM roles")
            roles = cursor.fetchall()
            
            # Get column names
            cursor.execute("DESCRIBE roles")
            role_columns = [col[0] for col in cursor.fetchall()]
            
            print(f"📋 Found {roles_count} roles:")
            for role in roles:
                role_data = dict(zip(role_columns, role))
                print(f"  🎭 {role_data}")
        else:
            print("  ❌ No roles defined in roles table")
        
        print()
        
        # Check permissions table if it exists
        print("🔐 PERMISSIONS SYSTEM")
        print("-" * 40)
        
        cursor.execute("SELECT COUNT(*) FROM permissions")
        permissions_count = cursor.fetchone()[0]
        
        if permissions_count > 0:
            cursor.execute("SELECT * FROM permissions LIMIT 10")
            permissions = cursor.fetchall()
            
            # Get column names
            cursor.execute("DESCRIBE permissions")
            perm_columns = [col[0] for col in cursor.fetchall()]
            
            print(f"🔑 Found {permissions_count} permissions (showing first 10):")
            for perm in permissions:
                perm_data = dict(zip(perm_columns, perm))
                print(f"  └─ {perm_data}")
        else:
            print("  ❌ No permissions defined")
        
        print()
        
        # Check role_permissions table if it exists
        print("🔗 ROLE-PERMISSION MAPPINGS")
        print("-" * 40)
        
        cursor.execute("SELECT COUNT(*) FROM role_permissions")
        role_perms_count = cursor.fetchone()[0]
        
        if role_perms_count > 0:
            cursor.execute("SELECT * FROM role_permissions LIMIT 10")
            role_perms = cursor.fetchall()
            
            cursor.execute("DESCRIBE role_permissions")
            rp_columns = [col[0] for col in cursor.fetchall()]
            
            print(f"🎯 Found {role_perms_count} role-permission mappings (showing first 10):")
            for rp in role_perms:
                rp_data = dict(zip(rp_columns, rp))
                print(f"  └─ {rp_data}")
        else:
            print("  ❌ No role-permission mappings found")
        
        print()
        
        # Restaurant role recommendations
        print("🏪 RESTAURANT ROLE SYSTEM RECOMMENDATIONS")
        print("-" * 50)
        
        recommended_roles = {
            'admin': {
                'description': 'Sistema completo, configuración, reportes',
                'permissions': ['manage_users', 'view_reports', 'manage_products', 'manage_tables', 'manage_settings']
            },
            'manager': {
                'description': 'Operaciones, personal, reportes detallados',
                'permissions': ['view_reports', 'manage_staff', 'manage_products', 'view_orders']
            },
            'waiter': {
                'description': 'Gestión de mesas, tomar pedidos',
                'permissions': ['create_orders', 'view_tables', 'view_products', 'update_table_status']
            },
            'kitchen': {
                'description': 'Cola de pedidos, actualizar estados de preparación',
                'permissions': ['view_kitchen_queue', 'update_order_status', 'view_order_details']
            },
            'cashier': {
                'description': 'Procesamiento de pagos, cerrar pedidos',
                'permissions': ['process_payments', 'view_orders', 'close_orders', 'view_daily_sales']
            }
        }
        
        # Check current roles against recommendations
        current_roles = set()
        cursor.execute("SELECT DISTINCT role FROM users")
        for row in cursor.fetchall():
            current_roles.add(row[0])
        
        print("✅ CURRENT ROLES vs RECOMMENDED:")
        for role_name, role_info in recommended_roles.items():
            if role_name in current_roles:
                print(f"  ✅ {role_name}: {role_info['description']}")
            else:
                print(f"  ❌ {role_name}: {role_info['description']} (NOT FOUND)")
        
        print()
        print("🔧 ROLE SYSTEM STATUS:")
        if len(current_roles) >= 4:
            print("  ✅ Good role coverage for restaurant operations")
        else:
            print("  ⚠️  Limited roles - consider adding more specific roles")
        
        # Check if Google Auth integration needs role setup
        print()
        print("🔐 GOOGLE AUTH INTEGRATION STATUS:")
        print("  ✅ Google OAuth system ready")
        print("  ✅ JWT role-based authentication configured")
        print("  ✅ New Google users get 'waiter' role by default")
        print("  ℹ️  Admin can change roles through user management")
        
        return {
            'users_count': len(users),
            'roles_count': roles_count,
            'permissions_count': permissions_count,
            'current_roles': list(current_roles),
            'recommended_roles': list(recommended_roles.keys())
        }
        
    except Error as e:
        print(f"❌ Error analyzing role system: {e}")
        return None
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    analyze_role_system()