#!/usr/bin/env python3
"""
Inspect the actual structure of gastro database
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

def inspect_gastro_structure():
    """Inspect actual structure of gastro database"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔍 GASTRO DATABASE STRUCTURE INSPECTION")
        print("=" * 60)
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"📊 Total tables: {len(tables)}")
        print()
        
        # Focus on key restaurant tables
        key_tables = ['categories', 'products', 'tables', 'orders', 'order_items', 'users']
        
        for table_name in key_tables:
            if table_name in tables:
                print(f"🔍 TABLE: {table_name}")
                print("-" * 40)
                
                # Get detailed structure
                cursor.execute(f"DESCRIBE {table_name}")
                columns = cursor.fetchall()
                
                print("📋 Columns:")
                for col in columns:
                    field_name = col[0]
                    field_type = col[1]
                    null_allowed = col[2]
                    key_type = col[3]
                    default = col[4] if col[4] is not None else 'NULL'
                    extra = col[5] if col[5] else ''
                    
                    key_indicator = ""
                    if key_type == 'PRI':
                        key_indicator = "🔑"
                    elif key_type == 'UNI':
                        key_indicator = "🗝️"
                    elif key_type == 'MUL':
                        key_indicator = "🔗"
                    
                    print(f"  {key_indicator} {field_name} ({field_type}) - {null_allowed} - {default} {extra}")
                
                # Get indexes
                cursor.execute(f"SHOW INDEX FROM {table_name}")
                indexes = cursor.fetchall()
                
                index_info = {}
                for idx in indexes:
                    index_name = idx[2]
                    column_name = idx[4]
                    
                    if index_name not in index_info:
                        index_info[index_name] = []
                    index_info[index_name].append(column_name)
                
                print("📍 Indexes:")
                for idx_name, columns in index_info.items():
                    print(f"  └─ {idx_name}: {', '.join(columns)}")
                
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                print(f"📊 Row count: {row_count}")
                
                # Show sample data for small tables
                if row_count > 0 and row_count <= 20:
                    print("📝 Sample data:")
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                    sample_rows = cursor.fetchall()
                    
                    # Get column names for display
                    column_names = [col[0] for col in columns]
                    
                    for row in sample_rows:
                        row_data = dict(zip(column_names, row))
                        print(f"  └─ ID {row_data.get('id', '?')}: {row_data}")
                
                print()
        
        # Check if tables exist but weren't analyzed
        missing_tables = [t for t in key_tables if t not in tables]
        if missing_tables:
            print("❌ MISSING RESTAURANT TABLES:")
            for table in missing_tables:
                print(f"  └─ {table} - NEEDS TO BE CREATED")
        
        # Additional tables found
        additional_tables = [t for t in tables if t not in key_tables]
        if additional_tables:
            print("ℹ️  ADDITIONAL TABLES:")
            for table in additional_tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  └─ {table}: {count} rows")
        
    except Error as e:
        print(f"❌ Error inspecting database: {e}")
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    inspect_gastro_structure()