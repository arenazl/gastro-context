#!/usr/bin/env python3
"""
Analyze gastro database for restaurant optimization opportunities
"""

import mysql.connector
from mysql.connector import Error

# Database configuration - now correctly pointing to gastro
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def analyze_gastro_database():
    """Complete analysis of gastro database for restaurant optimization"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🍽️  GASTRO DATABASE ANALYSIS")
        print("=" * 60)
        
        # Core restaurant tables analysis
        restaurant_core_tables = ['categories', 'products', 'tables', 'orders', 'order_items', 'users', 'payments']
        
        for table in restaurant_core_tables:
            print(f"\n🔍 Analyzing {table.upper()}")
            print("-" * 40)
            
            # Get table structure
            cursor.execute(f"SHOW CREATE TABLE {table}")
            create_table = cursor.fetchone()[1]
            
            # Get row count and sample data
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            print(f"📊 Rows: {row_count}")
            
            # Show indexes
            cursor.execute(f"SHOW INDEX FROM {table}")
            indexes = cursor.fetchall()
            print(f"📍 Indexes: {len(indexes)} total")
            
            index_names = set()
            for idx in indexes:
                if idx[2] != 'PRIMARY':
                    index_names.add(idx[2])
            
            if index_names:
                print("  Indexes:")
                for idx_name in sorted(index_names):
                    print(f"    └─ {idx_name}")
            
            # Table-specific analysis
            if table == 'products':
                analyze_products_table(cursor)
            elif table == 'orders':
                analyze_orders_table(cursor)
            elif table == 'categories':
                analyze_categories_table(cursor)
            elif table == 'tables':
                analyze_tables_table(cursor)
            elif table == 'users':
                analyze_users_table(cursor)
        
        # Generate optimization recommendations
        print("\n🎯 RESTAURANT DATABASE OPTIMIZATION RECOMMENDATIONS")
        print("=" * 60)
        generate_restaurant_optimizations(cursor)
        
    except Error as e:
        print(f"❌ Error analyzing database: {e}")
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def analyze_products_table(cursor):
    """Analyze products table for restaurant menu optimization"""
    
    # Check available products
    cursor.execute("SELECT COUNT(*) FROM products WHERE is_available = 1")
    available_products = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE is_available = 0")
    unavailable_products = cursor.fetchone()[0]
    
    print(f"  ✅ Available: {available_products}")
    print(f"  ❌ Unavailable: {unavailable_products}")
    
    # Check products by category
    cursor.execute("""
        SELECT c.name, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_available = 1
        GROUP BY c.id, c.name
        ORDER BY product_count DESC
    """)
    
    category_distribution = cursor.fetchall()
    print("  📋 Products per category:")
    for cat_name, count in category_distribution:
        print(f"    └─ {cat_name}: {count} products")

def analyze_orders_table(cursor):
    """Analyze orders table for restaurant operations"""
    
    cursor.execute("SELECT COUNT(*) FROM orders")
    total_orders = cursor.fetchone()[0]
    
    if total_orders > 0:
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM orders
            GROUP BY status
            ORDER BY count DESC
        """)
        status_distribution = cursor.fetchall()
        print("  📈 Order status distribution:")
        for status, count in status_distribution:
            print(f"    └─ {status}: {count}")
    else:
        print("  📝 No orders in database yet")

def analyze_categories_table(cursor):
    """Analyze categories for restaurant menu structure"""
    
    cursor.execute("SELECT name, is_active FROM categories ORDER BY display_order")
    categories = cursor.fetchall()
    
    print("  🏷️  Restaurant categories:")
    active_count = 0
    for name, is_active in categories:
        status = "✅" if is_active else "❌"
        print(f"    {status} {name}")
        if is_active:
            active_count += 1
    
    print(f"  📊 Active categories: {active_count}/{len(categories)}")

def analyze_tables_table(cursor):
    """Analyze restaurant tables configuration"""
    
    cursor.execute("SELECT COUNT(*) FROM tables")
    total_tables = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(capacity) FROM tables")
    total_capacity = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT capacity, COUNT(*) FROM tables GROUP BY capacity ORDER BY capacity")
    capacity_distribution = cursor.fetchall()
    
    print(f"  🪑 Total tables: {total_tables}")
    print(f"  👥 Total capacity: {total_capacity} people")
    print("  📊 Table sizes:")
    for capacity, count in capacity_distribution:
        print(f"    └─ {capacity}-person tables: {count}")

def analyze_users_table(cursor):
    """Analyze restaurant staff users"""
    
    cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY COUNT(*) DESC")
    role_distribution = cursor.fetchall()
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = 1")
    active_users = cursor.fetchone()[0]
    
    print(f"  👥 Active users: {active_users}")
    print("  🎭 Staff roles:")
    for role, count in role_distribution:
        print(f"    └─ {role}: {count}")

def generate_restaurant_optimizations(cursor):
    """Generate specific optimizations for restaurant operations"""
    
    recommendations = []
    
    # Check for missing restaurant-critical indexes
    restaurant_indexes_needed = [
        {
            'table': 'orders',
            'index': 'idx_orders_status_created',
            'columns': 'status, created_at',
            'reason': 'Kitchen queue queries by status and time'
        },
        {
            'table': 'orders', 
            'index': 'idx_orders_table_status',
            'columns': 'table_number, status',
            'reason': 'Table management queries'
        },
        {
            'table': 'order_items',
            'index': 'idx_order_items_order_status',
            'columns': 'order_id, status',
            'reason': 'Order detail queries with status filtering'
        },
        {
            'table': 'products',
            'index': 'idx_products_category_available',
            'columns': 'category_id, is_available',
            'reason': 'Menu display by category and availability'
        },
        {
            'table': 'users',
            'index': 'idx_users_role_active',
            'columns': 'role, is_active',
            'reason': 'Staff role-based access control'
        }
    ]
    
    for idx_info in restaurant_indexes_needed:
        # Check if index exists
        cursor.execute(f"SHOW INDEX FROM {idx_info['table']} WHERE Key_name = '{idx_info['index']}'")
        existing = cursor.fetchall()
        
        if not existing:
            recommendations.append({
                'type': 'MISSING_CRITICAL_INDEX',
                'priority': 'HIGH',
                'table': idx_info['table'],
                'sql': f"CREATE INDEX {idx_info['index']} ON {idx_info['table']}({idx_info['columns']})",
                'reason': idx_info['reason']
            })
    
    # Check for performance issues
    cursor.execute("SELECT COUNT(*) FROM products WHERE is_available = 1")
    active_products = cursor.fetchone()[0]
    
    if active_products > 100:
        recommendations.append({
            'type': 'PERFORMANCE_OPTIMIZATION',
            'priority': 'MEDIUM',
            'table': 'products',
            'sql': 'OPTIMIZE TABLE products',
            'reason': f'Large product catalog ({active_products} items) needs optimization'
        })
    
    # Print recommendations
    high_priority = [r for r in recommendations if r['priority'] == 'HIGH']
    medium_priority = [r for r in recommendations if r['priority'] == 'MEDIUM']
    
    if high_priority:
        print("🔥 HIGH PRIORITY OPTIMIZATIONS:")
        for i, rec in enumerate(high_priority, 1):
            print(f"{i}. {rec['type']}: {rec['table']}")
            print(f"   Reason: {rec['reason']}")
            print(f"   SQL: {rec['sql']}")
            print()
    
    if medium_priority:
        print("⚡ MEDIUM PRIORITY OPTIMIZATIONS:")
        for i, rec in enumerate(medium_priority, 1):
            print(f"{i}. {rec['type']}: {rec['table']}")
            print(f"   Reason: {rec['reason']}")
            print(f"   SQL: {rec['sql']}")
            print()
    
    if not recommendations:
        print("✅ Database is well-optimized for restaurant operations!")
    
    return recommendations

if __name__ == "__main__":
    analyze_gastro_database()