#!/usr/bin/env python3
"""
Inspect current database content to understand existing structure
"""

import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'coomlook',
    'charset': 'utf8mb4'
}

def inspect_database():
    """Inspect current database structure and content"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔍 CURRENT DATABASE INSPECTION")
        print("=" * 50)
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"📊 Tables found: {len(tables)}")
        for table in tables:
            print(f"  └─ {table}")
        print()
        
        # Inspect each table
        for table_name in tables:
            print(f"🔍 TABLE: {table_name}")
            print("-" * 40)
            
            # Get structure
            cursor.execute(f"DESCRIBE {table_name}")
            columns = cursor.fetchall()
            
            print("📋 Columns:")
            for col in columns:
                print(f"  ├─ {col[0]} ({col[1]}) {col[3]} {col[5]}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"📊 Rows: {count}")
            
            # Show sample data if available
            if count > 0 and count <= 10:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
                sample_data = cursor.fetchall()
                print("📝 Sample data:")
                for row in sample_data:
                    print(f"  └─ {row}")
            elif count > 10:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                sample_data = cursor.fetchall()
                print("📝 Sample data (first 3 rows):")
                for row in sample_data:
                    print(f"  └─ {row}")
            
            print()
        
        # Check if this looks like an e-commerce database
        if 'products' in tables and 'categories' in tables and 'carts' in tables:
            print("🛍️  DETECTED: E-commerce/Shopping database structure")
            print("🍽️  NEEDED: Restaurant management structure")
            print()
            print("RECOMMENDATION: This appears to be an e-commerce database.")
            print("For a restaurant management system, we need additional tables:")
            print("  ├─ orders (restaurant orders, not e-commerce orders)")
            print("  ├─ order_items")  
            print("  ├─ tables (restaurant tables)")
            print("  ├─ payments")
            print("  ├─ ingredients")
            print("  └─ product_variants")
        
    except Error as e:
        print(f"❌ Error inspecting database: {e}")
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    inspect_database()