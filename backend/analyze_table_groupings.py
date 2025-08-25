#!/usr/bin/env python3
"""
Analyze all tables in gastro database and propose logical groupings for admin interface
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

def analyze_table_groupings():
    """Analyze all tables and propose logical groupings for admin interface"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("📊 ANÁLISIS DE TABLAS PARA AGRUPACIÓN ABM")
        print("=" * 60)
        
        # Get all tables with row counts and basic info
        cursor.execute("SHOW TABLES")
        all_tables = [table[0] for table in cursor.fetchall()]
        
        table_info = {}
        
        for table in all_tables:
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            
            # Get column count
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            column_count = len(columns)
            
            # Get some key columns
            key_columns = []
            for col in columns[:5]:  # First 5 columns
                key_columns.append(f"{col[0]} ({col[1]})")
            
            table_info[table] = {
                'rows': row_count,
                'columns': column_count,
                'key_columns': key_columns
            }
        
        print("📋 TODAS LAS TABLAS:")
        print("-" * 40)
        for table, info in sorted(table_info.items()):
            print(f"🔹 {table}")
            print(f"   Filas: {info['rows']} | Columnas: {info['columns']}")
            print(f"   Campos: {', '.join(info['key_columns'][:3])}...")
            print()
        
        # Propose logical groupings
        proposed_groupings = {
            "👥 Gestión de Personal": {
                "main_table": "users",
                "tabs": [
                    {"name": "Usuarios", "table": "users", "description": "Gestión de empleados del restaurante"},
                    {"name": "Roles", "table": "roles", "description": "Roles del sistema (admin, waiter, kitchen, etc.)"},
                    {"name": "Permisos", "table": "permissions", "description": "Permisos granulares del sistema"},
                    {"name": "Asignaciones", "table": "role_permissions", "description": "Mapeo roles-permisos"}
                ],
                "primary_use": "Administrar todo el personal y sus permisos",
                "main_users": ["admin", "manager"]
            },
            
            "🏢 Gestión de Empresa": {
                "main_table": "companies",
                "tabs": [
                    {"name": "Empresa", "table": "companies", "description": "Datos de la empresa/restaurante"},
                    {"name": "Sucursales", "table": "company_branches", "description": "Múltiples ubicaciones"},
                    {"name": "Configuración", "table": "company_settings", "description": "Configuraciones específicas"},
                    {"name": "Empleados", "table": "company_users", "description": "Relación empresa-usuarios"},
                    {"name": "Invitaciones", "table": "company_invitations", "description": "Invitaciones pendientes"}
                ],
                "primary_use": "Configuración general del negocio",
                "main_users": ["admin"]
            },
            
            "🍽️ Gestión de Menú": {
                "main_table": "products",
                "tabs": [
                    {"name": "Productos", "table": "products", "description": "Platos y bebidas del menú"},
                    {"name": "Categorías", "table": "categories", "description": "Organización del menú (entrantes, principales, etc.)"},
                    {"name": "Subcategorías", "table": "subcategories", "description": "Clasificación detallada"},
                    {"name": "Variantes", "table": "product_variants", "description": "Tamaños, temperaturas, etc."}
                ],
                "primary_use": "Administrar el menú completo del restaurante",
                "main_users": ["admin", "manager"]
            },
            
            "🪑 Gestión de Salón": {
                "main_table": "tables",
                "tabs": [
                    {"name": "Mesas", "table": "tables", "description": "Layout y configuración de mesas"},
                    {"name": "Clientes", "table": "customers", "description": "Base de datos de clientes regulares"}
                ],
                "primary_use": "Administrar el espacio físico y clientes",
                "main_users": ["admin", "manager", "waiter"]
            },
            
            "📋 Gestión de Pedidos": {
                "main_table": "orders",
                "tabs": [
                    {"name": "Pedidos", "table": "orders", "description": "Historial y gestión de órdenes"},
                    {"name": "Detalles", "table": "order_items", "description": "Items individuales de cada pedido"}
                ],
                "primary_use": "Ver y gestionar todos los pedidos",
                "main_users": ["admin", "manager", "waiter", "kitchen"]
            },
            
            "💰 Gestión Financiera": {
                "main_table": "payments",
                "tabs": [
                    {"name": "Pagos", "table": "payments", "description": "Procesamiento y historial de pagos"},
                    {"name": "Planes", "table": "subscription_plans", "description": "Planes de suscripción si aplica"}
                ],
                "primary_use": "Administrar pagos y finanzas",
                "main_users": ["admin", "manager", "cashier"]
            },
            
            "🔔 Sistema de Comunicación": {
                "main_table": "notifications",
                "tabs": [
                    {"name": "Notificaciones", "table": "notifications", "description": "Alertas y mensajes del sistema"},
                    {"name": "Logs", "table": "activity_logs", "description": "Registro de actividades del sistema"}
                ],
                "primary_use": "Monitoreo y comunicación interna",
                "main_users": ["admin", "manager"]
            }
        }
        
        print("\n🎯 PROPUESTA DE AGRUPACIÓN DE PANTALLAS ABM")
        print("=" * 60)
        
        screen_count = 0
        total_tables = len(all_tables)
        
        for group_name, group_info in proposed_groupings.items():
            screen_count += 1
            print(f"\n{screen_count}. {group_name}")
            print("-" * 50)
            print(f"📱 Pantalla principal: {group_info['main_table']}")
            print(f"🎯 Propósito: {group_info['primary_use']}")
            print(f"👤 Usuarios principales: {', '.join(group_info['main_users'])}")
            print("📑 Tabs:")
            
            for tab in group_info['tabs']:
                table_data = table_info.get(tab['table'], {'rows': 0, 'columns': 0})
                print(f"   └─ {tab['name']}: {tab['description']} ({table_data['rows']} registros)")
        
        print(f"\n📊 RESUMEN:")
        print(f"  🗂️  Total de pantallas ABM: {screen_count}")
        print(f"  📋 Total de tablas: {total_tables}")
        print(f"  📱 Reducción: {total_tables} tablas → {screen_count} pantallas")
        print(f"  ⚡ Eficiencia: {((total_tables - screen_count) / total_tables * 100):.1f}% menos pantallas")
        
        print(f"\n✅ BENEFICIOS DE ESTA AGRUPACIÓN:")
        print("  🎯 Contexto relacionado en una sola pantalla")
        print("  🚀 Navegación más rápida y eficiente")  
        print("  👥 Roles específicos pueden acceder a sus pantallas relevantes")
        print("  📱 Interfaz más limpia para tablets")
        print("  🔄 Menos cambios de pantalla para tareas relacionadas")
        
        # Priority recommendations
        print(f"\n🚨 PRIORIDADES DE IMPLEMENTACIÓN:")
        print("1. 🍽️  Gestión de Menú - Más usada por staff")
        print("2. 📋 Gestión de Pedidos - Critical para operaciones")
        print("3. 🪑 Gestión de Salón - Para meseros")
        print("4. 👥 Gestión de Personal - Para administración")
        print("5. 💰 Gestión Financiera - Para reportes")
        print("6. 🏢 Gestión de Empresa - Para configuración")
        print("7. 🔔 Sistema de Comunicación - Para monitoreo")
        
        return proposed_groupings
        
    except Error as e:
        print(f"❌ Error analyzing tables: {e}")
        return None
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    analyze_table_groupings()