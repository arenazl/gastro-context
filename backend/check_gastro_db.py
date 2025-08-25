#!/usr/bin/env python3
"""
Check if the original 'gastro' database still exists with restaurant data
"""

import mysql.connector
from mysql.connector import Error

# Database configuration for checking gastro database
GASTRO_DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',  # Back to gastro database
    'charset': 'utf8mb4'
}

def check_gastro_database():
    """Check if gastro database exists and what it contains"""
    
    try:
        # First, try to list all databases
        connection_no_db = mysql.connector.connect(
            host=GASTRO_DB_CONFIG['host'],
            port=GASTRO_DB_CONFIG['port'],
            user=GASTRO_DB_CONFIG['user'],
            password=GASTRO_DB_CONFIG['password'],
            charset='utf8mb4'
        )
        cursor_no_db = connection_no_db.cursor()
        
        print("🔍 CHECKING AVAILABLE DATABASES")
        print("=" * 50)
        
        cursor_no_db.execute("SHOW DATABASES")
        databases = [db[0] for db in cursor_no_db.fetchall()]
        
        print("📊 Available databases:")
        for db in databases:
            print(f"  └─ {db}")
        print()
        
        cursor_no_db.close()
        connection_no_db.close()
        
        if 'gastro' in databases:
            print("✅ GASTRO DATABASE EXISTS - Checking contents...")
            check_gastro_contents()
        else:
            print("❌ GASTRO DATABASE NOT FOUND")
            print("🔄 Need to create restaurant database structure")
        
        if 'coomlook' in databases:
            print("✅ COOMLOOK DATABASE EXISTS (e-commerce structure)")
        
    except Error as e:
        print(f"❌ Error checking databases: {e}")

def check_gastro_contents():
    """Check contents of gastro database"""
    
    try:
        connection = mysql.connector.connect(**GASTRO_DB_CONFIG)
        cursor = connection.cursor()
        
        print("\n🍽️  GASTRO DATABASE CONTENTS")
        print("=" * 50)
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"📊 Tables found: {len(tables)}")
        
        restaurant_tables = [
            'users', 'categories', 'products', 'tables', 'orders', 
            'order_items', 'payments', 'companies', 'roles'
        ]
        
        for table in tables:
            print(f"  └─ {table}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            
            if table in restaurant_tables:
                print(f"      ✅ Restaurant table - {count} rows")
            else:
                print(f"      ℹ️  Other table - {count} rows")
        print()
        
        # Check specific restaurant data
        if 'categories' in tables:
            cursor.execute("SELECT id, name FROM categories WHERE is_active = 1 LIMIT 5")
            categories = cursor.fetchall()
            print("🏷️  Active categories:")
            for cat_id, name in categories:
                print(f"  └─ {cat_id}: {name}")
        
        if 'products' in tables:
            cursor.execute("SELECT COUNT(*) FROM products WHERE is_available = 1")
            active_products = cursor.fetchone()[0]
            print(f"📦 Active products: {active_products}")
        
        if 'orders' in tables:
            cursor.execute("SELECT COUNT(*) FROM orders")
            total_orders = cursor.fetchone()[0]
            print(f"📋 Total orders: {total_orders}")
        
        if 'tables' in tables:
            cursor.execute("SELECT COUNT(*) FROM tables")
            restaurant_tables_count = cursor.fetchone()[0]
            print(f"🪑 Restaurant tables: {restaurant_tables_count}")
        
        print("\n✅ GASTRO database has restaurant structure!")
        
    except Error as e:
        print(f"❌ Error checking gastro database: {e}")
        if "1049" in str(e):  # Database doesn't exist
            print("💡 The 'gastro' database doesn't exist")
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_gastro_database()