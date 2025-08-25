#!/usr/bin/env python3
"""
Database structure analyzer for restaurant management system.
Checks current schema, indexes, and provides optimization recommendations.
"""

import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'coomlook',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

def analyze_database_structure():
    """Analyze current database structure and provide recommendations"""
    
    try:
        print("🔍 Analyzing Database Structure...")
        print(f"📍 Database: {DB_CONFIG['database']}")
        print("-" * 60)
        
        # Connect to database
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"📊 Total Tables: {len(tables)}")
        print()
        
        analysis_result = {
            'database': DB_CONFIG['database'],
            'total_tables': len(tables),
            'tables': {},
            'indexes': {},
            'recommendations': [],
            'analyzed_at': datetime.now().isoformat()
        }
        
        # Analyze each table
        for table_name in tables:
            print(f"🔍 Analyzing table: {table_name}")
            table_info = analyze_table(cursor, table_name)
            analysis_result['tables'][table_name] = table_info
            
            # Check indexes
            index_info = get_table_indexes(cursor, table_name)
            analysis_result['indexes'][table_name] = index_info
            
            print(f"  ├─ Columns: {table_info['column_count']}")
            print(f"  ├─ Indexes: {len(index_info)}")
            print(f"  └─ Engine: {table_info.get('engine', 'Unknown')}")
            print()
        
        # Generate recommendations
        recommendations = generate_recommendations(analysis_result)
        analysis_result['recommendations'] = recommendations
        
        print("🎯 OPTIMIZATION RECOMMENDATIONS:")
        print("=" * 60)
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec['type']}: {rec['description']}")
            if rec.get('sql'):
                print(f"   SQL: {rec['sql']}")
            print()
        
        # Save detailed analysis
        with open('database_analysis.json', 'w') as f:
            json.dump(analysis_result, f, indent=2, default=str)
        
        print("💾 Detailed analysis saved to: database_analysis.json")
        
        return analysis_result
        
    except Error as e:
        print(f"❌ Error analyzing database: {e}")
        return None
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def analyze_table(cursor, table_name):
    """Analyze a specific table structure"""
    
    # Get table structure
    cursor.execute(f"DESCRIBE {table_name}")
    columns = cursor.fetchall()
    
    # Get table status
    cursor.execute(f"SHOW TABLE STATUS LIKE '{table_name}'")
    status = cursor.fetchone()
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    row_count = cursor.fetchone()[0]
    
    column_info = []
    for col in columns:
        column_info.append({
            'name': col[0],
            'type': col[1],
            'null': col[2] == 'YES',
            'key': col[3],
            'default': col[4],
            'extra': col[5]
        })
    
    return {
        'column_count': len(columns),
        'columns': column_info,
        'row_count': row_count,
        'engine': status[1] if status else None,
        'charset': status[14] if status else None,
        'collation': status[15] if status else None,
        'auto_increment': status[10] if status else None
    }

def get_table_indexes(cursor, table_name):
    """Get all indexes for a table"""
    
    cursor.execute(f"SHOW INDEX FROM {table_name}")
    indexes = cursor.fetchall()
    
    index_info = {}
    for idx in indexes:
        index_name = idx[2]
        if index_name not in index_info:
            index_info[index_name] = {
                'columns': [],
                'unique': not bool(idx[1]),
                'type': idx[10] if idx[10] else 'BTREE'
            }
        index_info[index_name]['columns'].append(idx[4])
    
    return index_info

def generate_recommendations(analysis):
    """Generate optimization recommendations based on analysis"""
    
    recommendations = []
    
    # Check for missing restaurant-critical indexes
    restaurant_indexes = {
        'orders': [
            {'columns': ['status', 'created_at'], 'name': 'idx_orders_status_created'},
            {'columns': ['table_number', 'status'], 'name': 'idx_orders_table_status'},
            {'columns': ['waiter_id', 'created_at'], 'name': 'idx_orders_waiter_date'}
        ],
        'order_items': [
            {'columns': ['order_id', 'status'], 'name': 'idx_order_items_order_status'},
            {'columns': ['product_id'], 'name': 'idx_order_items_product'}
        ],
        'products': [
            {'columns': ['category_id', 'is_available'], 'name': 'idx_products_category_available'},
            {'columns': ['is_available'], 'name': 'idx_products_available'}
        ],
        'users': [
            {'columns': ['role', 'is_active'], 'name': 'idx_users_role_active'},
            {'columns': ['email'], 'name': 'idx_users_email'}
        ]
    }
    
    for table_name, expected_indexes in restaurant_indexes.items():
        if table_name in analysis['tables']:
            existing_indexes = analysis['indexes'].get(table_name, {})
            
            for expected_idx in expected_indexes:
                # Check if this index exists
                found = False
                for existing_name, existing_info in existing_indexes.items():
                    if set(existing_info['columns']) == set(expected_idx['columns']):
                        found = True
                        break
                
                if not found:
                    recommendations.append({
                        'type': 'MISSING_INDEX',
                        'table': table_name,
                        'description': f"Add index on {table_name}({', '.join(expected_idx['columns'])})",
                        'sql': f"CREATE INDEX {expected_idx['name']} ON {table_name}({', '.join(expected_idx['columns'])})",
                        'priority': 'HIGH'
                    })
    
    # Check table engines
    for table_name, table_info in analysis['tables'].items():
        if table_info.get('engine') != 'InnoDB':
            recommendations.append({
                'type': 'ENGINE_OPTIMIZATION',
                'table': table_name,
                'description': f"Convert {table_name} to InnoDB engine for ACID transactions",
                'sql': f"ALTER TABLE {table_name} ENGINE=InnoDB",
                'priority': 'MEDIUM'
            })
    
    # Check charset/collation
    for table_name, table_info in analysis['tables'].items():
        if table_info.get('collation') != 'utf8mb4_unicode_ci':
            recommendations.append({
                'type': 'CHARSET_OPTIMIZATION',
                'table': table_name,
                'description': f"Update {table_name} to utf8mb4_unicode_ci collation",
                'sql': f"ALTER TABLE {table_name} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
                'priority': 'LOW'
            })
    
    # Check for large tables without proper indexes
    for table_name, table_info in analysis['tables'].items():
        if table_info['row_count'] > 1000:
            indexes = analysis['indexes'].get(table_name, {})
            if len(indexes) < 2:  # Only primary key
                recommendations.append({
                    'type': 'PERFORMANCE_WARNING',
                    'table': table_name,
                    'description': f"Table {table_name} has {table_info['row_count']} rows but limited indexes",
                    'priority': 'MEDIUM'
                })
    
    return recommendations

def check_restaurant_data_integrity():
    """Check data integrity specific to restaurant operations"""
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("\n🔍 RESTAURANT DATA INTEGRITY CHECK:")
        print("=" * 50)
        
        integrity_checks = []
        
        # Check orders without order_items
        cursor.execute("""
            SELECT COUNT(*) FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id 
            WHERE oi.order_id IS NULL
        """)
        orphan_orders = cursor.fetchone()[0]
        if orphan_orders > 0:
            integrity_checks.append(f"⚠️  {orphan_orders} orders without items")
        
        # Check products without categories
        cursor.execute("""
            SELECT COUNT(*) FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE c.id IS NULL
        """)
        orphan_products = cursor.fetchone()[0]
        if orphan_products > 0:
            integrity_checks.append(f"⚠️  {orphan_products} products without valid category")
        
        # Check active products count
        cursor.execute("SELECT COUNT(*) FROM products WHERE is_available = 1")
        active_products = cursor.fetchone()[0]
        integrity_checks.append(f"✅ {active_products} active products")
        
        # Check order statuses distribution
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status 
            ORDER BY count DESC
        """)
        order_statuses = cursor.fetchall()
        
        print("📊 ORDER STATUS DISTRIBUTION:")
        for status, count in order_statuses:
            print(f"  ├─ {status}: {count}")
        
        print("\n🎯 INTEGRITY RESULTS:")
        for check in integrity_checks:
            print(f"  {check}")
        
        return True
        
    except Error as e:
        print(f"❌ Error checking data integrity: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("🏪 RESTAURANT DATABASE ANALYSIS")
    print("=" * 60)
    print(f"📅 Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Analyze database structure
    analysis = analyze_database_structure()
    
    if analysis:
        # Check data integrity
        check_restaurant_data_integrity()
        
        print("\n✅ Database analysis complete!")
        print("📁 Check database_analysis.json for detailed results")
    else:
        print("❌ Database analysis failed!")