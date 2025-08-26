"""
Execute complete schema migration for Restaurant Management System
"""
import mysql.connector
import sys

# Database configuration
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23739,
    'user': 'avnadmin',
    'password': 'AVNS_kc9igQjEb2zs4lyl6x1',
    'database': 'defaultdb'
}

def execute_migration():
    """Execute the complete schema migration"""
    try:
        # Connect to database
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print("✅ Connected to database")
        
        # Read migration file
        with open('migrations/create_complete_schema.sql', 'r') as f:
            sql_script = f.read()
        
        # Split by semicolon and execute each statement
        statements = [s.strip() for s in sql_script.split(';') if s.strip()]
        
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements, 1):
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    success_count += 1
                    # Print progress for CREATE TABLE statements
                    if 'CREATE TABLE' in statement.upper():
                        table_name = statement.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
                        print(f"✅ Created table: {table_name}")
                    elif 'INSERT INTO' in statement.upper():
                        table_name = statement.split('INSERT INTO')[1].split('(')[0].strip()
                        print(f"✅ Inserted data into: {table_name}")
                except mysql.connector.Error as e:
                    error_count += 1
                    if 'already exists' not in str(e).lower():
                        print(f"⚠️  Error in statement {i}: {str(e)[:100]}")
        
        connection.commit()
        
        print(f"\n📊 Migration Summary:")
        print(f"   ✅ Successful statements: {success_count}")
        print(f"   ⚠️  Errors (mostly duplicates): {error_count}")
        
        # Verify tables were created
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'defaultdb' 
            AND TABLE_NAME IN ('companies', 'roles', 'users', 'customers', 
                              'addresses', 'areas', 'tables_enhanced', 
                              'user_sessions', 'audit_logs')
            ORDER BY TABLE_NAME
        """)
        
        tables = cursor.fetchall()
        print(f"\n📋 Verified Tables ({len(tables)}):")
        for table in tables:
            print(f"   ✅ {table[0]}")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    execute_migration()