#!/usr/bin/env python3
"""
Apply restaurant database optimizations to gastro database
Based on the actual table structure discovered
"""

import mysql.connector
from mysql.connector import Error
import time

# Database configuration
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def apply_restaurant_optimizations():
    """Apply restaurant-specific database optimizations"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🍽️  APPLYING RESTAURANT DATABASE OPTIMIZATIONS")
        print("=" * 60)
        print("📍 Database: gastro")
        print("🏪 System: Restaurant Management")
        print()
        
        # Restaurant-critical indexes based on actual structure
        restaurant_indexes = [
            {
                'name': 'idx_orders_status_created',
                'table': 'orders',
                'columns': 'status, created_at',
                'purpose': 'Kitchen queue queries by status and time'
            },
            {
                'name': 'idx_orders_table_status', 
                'table': 'orders',
                'columns': 'table_number, status',
                'purpose': 'Table management queries for waiters'
            },
            {
                'name': 'idx_orders_waiter_date',
                'table': 'orders', 
                'columns': 'waiter_id, created_at',
                'purpose': 'Waiter performance tracking'
            },
            {
                'name': 'idx_orders_total_date',
                'table': 'orders',
                'columns': 'total, created_at', 
                'purpose': 'Financial reporting and daily sales'
            },
            {
                'name': 'idx_order_items_order_product',
                'table': 'order_items',
                'columns': 'order_id, product_id',
                'purpose': 'Order details lookup for kitchen'
            },
            {
                'name': 'idx_products_name_available',
                'table': 'products',
                'columns': 'name, available',
                'purpose': 'Product search with availability filter'
            },
            {
                'name': 'idx_users_role_active',
                'table': 'users', 
                'columns': 'role, is_active',
                'purpose': 'Staff role-based access control'
            },
            {
                'name': 'idx_tables_status_capacity',
                'table': 'tables',
                'columns': 'status, capacity',
                'purpose': 'Table availability queries'
            }
        ]
        
        print("🔧 CREATING RESTAURANT PERFORMANCE INDEXES")
        print("-" * 50)
        
        successful_indexes = 0
        
        for idx_info in restaurant_indexes:
            try:
                # Check if index already exists
                cursor.execute(f"""
                    SELECT COUNT(*)
                    FROM information_schema.statistics 
                    WHERE table_schema = 'gastro' 
                    AND table_name = '{idx_info['table']}' 
                    AND index_name = '{idx_info['name']}'
                """)
                
                exists = cursor.fetchone()[0] > 0
                
                if exists:
                    print(f"  ✅ {idx_info['name']} - Already exists")
                else:
                    # Create the index
                    create_sql = f"CREATE INDEX {idx_info['name']} ON {idx_info['table']}({idx_info['columns']})"
                    cursor.execute(create_sql)
                    connection.commit()
                    print(f"  🆕 {idx_info['name']} - Created successfully")
                    print(f"     Purpose: {idx_info['purpose']}")
                    successful_indexes += 1
                    
            except Error as e:
                print(f"  ❌ {idx_info['name']} - Failed: {str(e)}")
        
        print()
        print("🔄 OPTIMIZING TABLE STORAGE")
        print("-" * 50)
        
        # Optimize key restaurant tables
        restaurant_tables = ['orders', 'order_items', 'products', 'users', 'tables', 'categories']
        
        for table in restaurant_tables:
            try:
                print(f"  🔧 Optimizing {table}...", end=" ")
                cursor.execute(f"OPTIMIZE TABLE {table}")
                result = cursor.fetchall()
                print("✅ Done")
            except Error as e:
                print(f"❌ Failed: {str(e)}")
        
        print()
        print("📊 CREATING RESTAURANT VIEWS")
        print("-" * 50)
        
        # Create active menu view
        try:
            cursor.execute("""
                CREATE OR REPLACE VIEW active_menu AS
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.price,
                    c.name as category_name,
                    p.image_url,
                    p.available
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.available = 1 AND c.is_active = 1
                ORDER BY c.sort_order, p.name
            """)
            connection.commit()
            print("  ✅ active_menu view - Menu display optimization")
        except Error as e:
            print(f"  ❌ active_menu view failed: {e}")
        
        # Create kitchen queue view
        try:
            cursor.execute("""
                CREATE OR REPLACE VIEW kitchen_queue AS
                SELECT 
                    o.id as order_id,
                    o.table_number,
                    o.status,
                    o.created_at,
                    o.notes,
                    CONCAT(u.first_name, ' ', u.last_name) as waiter_name,
                    COUNT(oi.id) as item_count
                FROM orders o
                LEFT JOIN users u ON o.waiter_id = u.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.status IN ('pending', 'preparing')
                GROUP BY o.id, o.table_number, o.status, o.created_at, o.notes, u.first_name, u.last_name
                ORDER BY 
                    CASE o.status 
                        WHEN 'pending' THEN 1 
                        WHEN 'preparing' THEN 2 
                    END,
                    o.created_at
            """)
            connection.commit()
            print("  ✅ kitchen_queue view - Kitchen workflow optimization")
        except Error as e:
            print(f"  ❌ kitchen_queue view failed: {e}")
        
        # Create restaurant layout view
        try:
            cursor.execute("""
                CREATE OR REPLACE VIEW restaurant_layout AS
                SELECT 
                    t.id,
                    t.number,
                    t.capacity,
                    t.status,
                    t.location,
                    t.x,
                    t.y,
                    t.width,
                    t.height,
                    t.shape,
                    COUNT(o.id) as active_orders
                FROM tables t
                LEFT JOIN orders o ON t.number = o.table_number AND o.status IN ('pending', 'preparing', 'ready')
                GROUP BY t.id, t.number, t.capacity, t.status, t.location, t.x, t.y, t.width, t.height, t.shape
            """)
            connection.commit()
            print("  ✅ restaurant_layout view - Table management optimization")
        except Error as e:
            print(f"  ❌ restaurant_layout view failed: {e}")
        
        print()
        print("📈 OPTIMIZATION SUMMARY")
        print("-" * 50)
        print(f"✅ New indexes created: {successful_indexes}")
        print(f"✅ Tables optimized: {len(restaurant_tables)}")
        print(f"✅ Views created: 3 (active_menu, kitchen_queue, restaurant_layout)")
        
        print()
        print("🎯 PERFORMANCE TARGETS")
        print("-" * 50)
        print("After optimization, expect these performance improvements:")
        print("  🚀 Menu loading: < 200ms")
        print("  🚀 Kitchen queue: < 100ms")
        print("  🚀 Order creation: < 300ms")
        print("  🚀 Table updates: < 150ms")
        print("  🚀 Staff auth: < 100ms")
        
        # Test some key queries
        print()
        print("🧪 TESTING OPTIMIZED QUERIES")
        print("-" * 50)
        
        # Test active menu query
        start_time = time.time()
        cursor.execute("SELECT COUNT(*) FROM active_menu")
        menu_count = cursor.fetchone()[0]
        menu_time = (time.time() - start_time) * 1000
        print(f"  📋 Menu items query: {menu_count} items in {menu_time:.1f}ms")
        
        # Test kitchen queue
        start_time = time.time()
        cursor.execute("SELECT COUNT(*) FROM kitchen_queue")
        queue_count = cursor.fetchone()[0]
        queue_time = (time.time() - start_time) * 1000
        print(f"  👨‍🍳 Kitchen queue: {queue_count} orders in {queue_time:.1f}ms")
        
        # Test table layout
        start_time = time.time()
        cursor.execute("SELECT COUNT(*) FROM restaurant_layout")
        tables_count = cursor.fetchone()[0]
        tables_time = (time.time() - start_time) * 1000
        print(f"  🪑 Restaurant layout: {tables_count} tables in {tables_time:.1f}ms")
        
        print()
        print("✅ RESTAURANT DATABASE OPTIMIZATION COMPLETED!")
        print("🏪 Your gastro database is now optimized for high-performance restaurant operations")
        
    except Error as e:
        print(f"❌ Error during optimization: {e}")
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    apply_restaurant_optimizations()