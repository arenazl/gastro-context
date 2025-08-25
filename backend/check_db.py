#!/usr/bin/env python3
"""
Quick database check script
"""

try:
    import mysql.connector
    connection = mysql.connector.connect(
        host='mysql-aiven-arenazl.e.aivencloud.com',
        port=23108,
        user='avnadmin',
        password='AVNS_Fqe0qsChCHnqSnVsvoi',
        database='gastro'
    )
    
    cursor = connection.cursor()
    
    # Check what tables exist
    cursor.execute('SHOW TABLES')
    tables = cursor.fetchall()
    print('📊 Existing tables in database:')
    for table in tables:
        print(f'  - {table[0]}')
    
    # Check if there's any data
    if tables:
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        print(f'\n👥 Users in database: {user_count}')
        
        if user_count > 0:
            cursor.execute('SELECT email, role FROM users LIMIT 5')
            users = cursor.fetchall()
            print('Sample users:')
            for user in users:
                print(f'  - {user[0]} ({user[1]})')
        
        cursor.execute('SELECT COUNT(*) FROM products')
        product_count = cursor.fetchone()[0]
        print(f'📦 Products in database: {product_count}')
        
        cursor.execute('SELECT COUNT(*) FROM tables')
        table_count = cursor.fetchone()[0]
        print(f'🪑 Tables in database: {table_count}')
        
        print('\n✅ Database connection successful!')
    else:
        print('\n⚠️ No tables found in database')
    
    cursor.close()
    connection.close()
    
except ImportError:
    print("❌ mysql.connector not available, trying with minimal connection test")
    import socket
    
    try:
        # Test basic connectivity
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('mysql-aiven-arenazl.e.aivencloud.com', 23108))
        if result == 0:
            print("✅ Database host is reachable on port 23108")
        else:
            print("❌ Cannot reach database host")
        sock.close()
    except Exception as e:
        print(f"❌ Connection test failed: {e}")

except Exception as e:
    print(f"❌ Database connection failed: {e}")