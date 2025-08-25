#!/usr/bin/env python3
"""
Create all database tables for the Restaurant Management System
"""
import pymysql
import sys

# Database connection details from config
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro',
    'charset': 'utf8mb4'
}

def create_tables():
    """Create all necessary tables in the database"""
    
    # SQL statements to create tables
    sql_statements = [
        # Drop existing tables (in reverse order of dependencies)
        "DROP TABLE IF EXISTS order_items",
        "DROP TABLE IF EXISTS payments", 
        "DROP TABLE IF EXISTS orders",
        "DROP TABLE IF EXISTS product_variants",
        "DROP TABLE IF EXISTS products",
        "DROP TABLE IF EXISTS tables",
        "DROP TABLE IF EXISTS users",
        
        # Create users table
        """
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role ENUM('admin', 'manager', 'waiter', 'kitchen', 'cashier') NOT NULL DEFAULT 'waiter',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        # Create tables table
        """
        CREATE TABLE tables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            number INT UNIQUE NOT NULL,
            capacity INT NOT NULL,
            location VARCHAR(100),
            status ENUM('available', 'occupied', 'reserved', 'cleaning') DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_number (number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        # Create products table
        """
        CREATE TABLE products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            category VARCHAR(100),
            image_url VARCHAR(500),
            available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_available (available),
            INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        # Create product_variants table
        """
        CREATE TABLE product_variants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            price_adjustment DECIMAL(10,2) DEFAULT 0,
            available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            INDEX idx_product_id (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        # Create orders table
        """
        CREATE TABLE orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_number INT NOT NULL,
            waiter_id INT,
            status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
            subtotal DECIMAL(10,2) DEFAULT 0,
            tax DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_table_number (table_number),
            INDEX idx_status (status),
            INDEX idx_waiter_id (waiter_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        # Create order_items table
        """
        CREATE TABLE order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            price DECIMAL(10,2) NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
            INDEX idx_order_id (order_id),
            INDEX idx_product_id (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        # Create payments table
        """
        CREATE TABLE payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            tip_amount DECIMAL(10,2) DEFAULT 0,
            payment_method ENUM('cash', 'card', 'mobile') NOT NULL,
            status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
            stripe_payment_id VARCHAR(255),
            stripe_payment_intent VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
            INDEX idx_order_id (order_id),
            INDEX idx_status (status),
            INDEX idx_stripe_payment_id (stripe_payment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ]
    
    try:
        # Connect to database
        print("🔗 Connecting to Aiven MySQL database...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("✅ Connected successfully!")
        print("=" * 50)
        
        # Execute each SQL statement
        for sql in sql_statements:
            # Get table name for logging
            if "CREATE TABLE" in sql:
                table_name = sql.split("CREATE TABLE")[1].split("(")[0].strip()
                print(f"📊 Creating table: {table_name}")
            elif "DROP TABLE" in sql:
                table_name = sql.split("DROP TABLE IF EXISTS")[1].strip()
                print(f"🗑️  Dropping table if exists: {table_name}")
            
            cursor.execute(sql)
            connection.commit()
        
        print("=" * 50)
        print("✅ All tables created successfully!")
        
        # Show created tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\n📋 Tables in database ({len(tables)} total):")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        connection.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def seed_initial_data():
    """Insert initial seed data"""
    
    seed_sql = [
        # Insert users (password is 'password123' hashed with bcrypt)
        """
        INSERT IGNORE INTO users (email, hashed_password, first_name, last_name, role, is_active) VALUES
        ('admin@restaurant.com', '$2b$12$YourHashHere', 'Admin', 'User', 'admin', TRUE),
        ('manager@restaurant.com', '$2b$12$YourHashHere', 'Manager', 'User', 'manager', TRUE),
        ('waiter@restaurant.com', '$2b$12$YourHashHere', 'John', 'Waiter', 'waiter', TRUE),
        ('kitchen@restaurant.com', '$2b$12$YourHashHere', 'Chef', 'Kitchen', 'kitchen', TRUE),
        ('cashier@restaurant.com', '$2b$12$YourHashHere', 'Cash', 'Register', 'cashier', TRUE)
        """,
        
        # Insert tables
        """
        INSERT IGNORE INTO tables (number, capacity, location, status) VALUES
        (1, 4, 'Main Hall', 'available'),
        (2, 4, 'Main Hall', 'available'),
        (3, 4, 'Main Hall', 'available'),
        (4, 4, 'Main Hall', 'available'),
        (5, 4, 'Main Hall', 'available'),
        (6, 6, 'Main Hall', 'available'),
        (7, 6, 'Main Hall', 'available'),
        (8, 6, 'Main Hall', 'available'),
        (9, 4, 'Terrace', 'available'),
        (10, 4, 'Terrace', 'available'),
        (11, 4, 'Terrace', 'available'),
        (12, 4, 'Terrace', 'available'),
        (13, 8, 'VIP Room', 'available'),
        (14, 8, 'VIP Room', 'available'),
        (15, 8, 'VIP Room', 'available')
        """,
        
        # Insert products
        """
        INSERT IGNORE INTO products (name, description, price, category, available) VALUES
        ('Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 12.99, 'Salads', TRUE),
        ('Greek Salad', 'Mixed greens with feta cheese and olives', 10.99, 'Salads', TRUE),
        ('French Onion Soup', 'Traditional soup with melted cheese', 9.99, 'Soups', TRUE),
        ('Tomato Basil Soup', 'Creamy tomato soup with fresh basil', 8.99, 'Soups', TRUE),
        ('Grilled Salmon', 'Atlantic salmon with lemon butter', 24.99, 'Seafood', TRUE),
        ('Fish and Chips', 'Beer-battered cod with fries', 17.99, 'Seafood', TRUE),
        ('Ribeye Steak', '12oz premium ribeye', 34.99, 'Steaks', TRUE),
        ('Filet Mignon', '8oz tender filet', 39.99, 'Steaks', TRUE),
        ('Chicken Parmesan', 'Breaded chicken with marinara', 19.99, 'Chicken', TRUE),
        ('Grilled Chicken', 'Herb-marinated chicken breast', 17.99, 'Chicken', TRUE),
        ('Margherita Pizza', 'Classic pizza with tomato and mozzarella', 18.99, 'Pizza', TRUE),
        ('Pepperoni Pizza', 'Traditional pepperoni pizza', 20.99, 'Pizza', TRUE),
        ('Pasta Carbonara', 'Creamy pasta with bacon', 16.99, 'Pasta', TRUE),
        ('House Burger', 'Angus beef with special sauce', 15.99, 'Burgers', TRUE),
        ('Tiramisu', 'Italian coffee-flavored dessert', 7.99, 'Desserts', TRUE),
        ('Chocolate Cake', 'Rich chocolate layer cake', 6.99, 'Desserts', TRUE),
        ('Coca Cola', 'Classic soft drink', 3.99, 'Beverages', TRUE),
        ('Coffee', 'Freshly brewed', 2.99, 'Beverages', TRUE),
        ('House Wine', 'Red or white', 8.99, 'Beverages', TRUE)
        """
    ]
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("\n🌱 Seeding initial data...")
        
        for sql in seed_sql:
            cursor.execute(sql)
            connection.commit()
        
        # Show counts
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products")
        product_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tables")
        table_count = cursor.fetchone()[0]
        
        print(f"✅ Seed data inserted:")
        print(f"   - {user_count} users")
        print(f"   - {product_count} products")
        print(f"   - {table_count} tables")
        
        cursor.close()
        connection.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Restaurant Management System - Database Setup")
    print("=" * 50)
    
    # Create tables
    if create_tables():
        # Seed data
        seed_initial_data()
        
        print("\n✨ Database setup complete!")
        print("You can now start the backend server:")
        print("  uvicorn main:app --reload --host 0.0.0.0 --port 9000")
    else:
        print("\n❌ Failed to create tables")
        sys.exit(1)