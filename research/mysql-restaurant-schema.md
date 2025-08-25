# MySQL Schema Design for Restaurant Management System

## Database Configuration

### Connection Setup with Aiven MySQL
```python
# Using provided credentials
DATABASE_URL = "mysql+aiomysql://avnadmin:AVNS_Fqe0qsChCHnqSnVsvoi@mysql-aiven-arenazl.e.aivencloud.com:23108/gastro?charset=utf8mb4"

# SQLAlchemy engine configuration
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # Base connection pool
    max_overflow=30,       # Additional connections when needed
    pool_timeout=30,       # Wait time for connection
    pool_recycle=3600,     # Recycle connections after 1 hour
    pool_pre_ping=True,    # Test connections before use
    echo=False             # Set True for debugging
)
```

## Core Schema Design

### Users and Authentication
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'waiter', 'kitchen', 'cashier') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    hire_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Product Categories
```sql
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    icon VARCHAR(50),
    color VARCHAR(7),  -- Hex color
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_categories_display_order (display_order),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Products (Menu Items)
```sql
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    preparation_time INT NOT NULL COMMENT 'Minutes',
    is_available BOOLEAN DEFAULT TRUE,
    requires_kitchen BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    allergens JSON,  -- ["gluten", "lactose", "nuts"]
    nutritional_info JSON,  -- {"calories": 850, "protein": 25}
    calories INT,
    slug VARCHAR(250) UNIQUE,
    tags JSON,  -- ["vegetarian", "spicy", "gluten-free"]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_products_name (name),
    INDEX idx_products_category_available (category_id, is_available),
    INDEX idx_products_featured (is_featured),
    INDEX idx_products_price_range (base_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Product Variants
```sql
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,  -- "Large", "Medium", "Cold", "Hot"
    type ENUM('size', 'temperature', 'style', 'other') NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variants_product_type (product_id, type),
    INDEX idx_variants_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Ingredients (Inventory)
```sql
CREATE TABLE ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    unit_type ENUM('kg', 'liters', 'units', 'grams', 'ml') NOT NULL,
    cost_per_unit DECIMAL(10,4) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock_alert DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2),
    supplier VARCHAR(200),
    supplier_code VARCHAR(100),
    expiry_date DATE,
    days_until_expiry_alert INT DEFAULT 7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ingredients_name (name),
    INDEX idx_ingredients_stock_alert (current_stock, min_stock_alert),
    INDEX idx_ingredients_supplier (supplier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Product-Ingredient Relationship
```sql
CREATE TABLE product_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity_needed DECIMAL(10,4) NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    UNIQUE KEY unique_product_ingredient (product_id, ingredient_id),
    INDEX idx_product_ingredients_product (product_id),
    INDEX idx_product_ingredients_ingredient (ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tables (Restaurant Layout)
```sql
CREATE TABLE tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    capacity INT NOT NULL,
    location VARCHAR(100),  -- "Terrace", "Main Hall", etc.
    is_active BOOLEAN DEFAULT TRUE,
    position_x INT,  -- For visual layout
    position_y INT,
    width INT,
    height INT,
    current_status ENUM('available', 'occupied', 'reserved', 'cleaning') DEFAULT 'available',
    current_order_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tables_number (number),
    INDEX idx_tables_location_active (location, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Orders (Core Business Entity)
```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL,
    waiter_id INT NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled', 'paid') DEFAULT 'pending',
    
    -- Financial
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    kitchen_notified_at DATETIME,
    preparation_started_at DATETIME,
    ready_at DATETIME,
    delivered_at DATETIME,
    paid_at DATETIME,
    
    -- Customer info
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Notes
    customer_notes TEXT,
    kitchen_notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    order_type ENUM('dine_in', 'takeout', 'delivery') DEFAULT 'dine_in',
    priority_level INT DEFAULT 0,  -- 0=normal, 1=high, 2=urgent
    estimated_ready_time DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (table_number) REFERENCES tables(number),
    FOREIGN KEY (waiter_id) REFERENCES users(id),
    INDEX idx_orders_table_status (table_number, status),
    INDEX idx_orders_status_created (status, created_at),
    INDEX idx_orders_waiter_date (waiter_id, created_at),
    INDEX idx_orders_daily_reports (ordered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Order Items
```sql
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    variant_id INT,
    modifications JSON,  -- {"no_onion": true, "extra_cheese": true}
    special_notes TEXT,
    status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    kitchen_notes TEXT,
    started_preparing_at DATETIME,
    ready_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    INDEX idx_order_items_order_status (order_id, status),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Payments
```sql
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('cash', 'card', 'transfer', 'digital_wallet') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Stripe integration
    stripe_payment_intent_id VARCHAR(200),
    stripe_charge_id VARCHAR(200),
    stripe_customer_id VARCHAR(200),
    
    tip_amount DECIMAL(10,2) DEFAULT 0,
    cashier_id INT,
    reference_number VARCHAR(100),
    paid_at DATETIME,
    refunded_at DATETIME,
    
    -- Invoicing
    invoice_number VARCHAR(100),
    tax_info JSON,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_status_method (status, method),
    INDEX idx_payments_date_reports (paid_at),
    INDEX idx_payments_stripe_intent (stripe_payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Performance Optimization Indexes

```sql
-- Critical performance indexes for restaurant operations
CREATE INDEX idx_orders_kitchen_workflow ON orders(status, ordered_at, table_number);
CREATE INDEX idx_order_items_kitchen_prep ON order_items(status, created_at);
CREATE INDEX idx_payments_daily_sales ON payments(paid_at, method, status);
CREATE INDEX idx_products_menu_display ON products(category_id, is_available, display_order);

-- Full-text search for products
ALTER TABLE products ADD FULLTEXT(name, description);

-- JSON indexing for MySQL 8.0+
ALTER TABLE products ADD INDEX idx_products_tags ((CAST(tags AS CHAR(255) ARRAY)));
ALTER TABLE order_items ADD INDEX idx_modifications ((CAST(modifications AS CHAR(255) ARRAY)));
```

## Triggers for Business Logic

```sql
DELIMITER $$

-- Update order totals when items are added/modified
CREATE TRIGGER update_order_totals 
AFTER INSERT ON order_items 
FOR EACH ROW 
BEGIN
    UPDATE orders 
    SET subtotal = (
        SELECT COALESCE(SUM(unit_price * quantity), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    ),
    total_amount = subtotal + tax_amount + tip_amount - discount_amount
    WHERE id = NEW.order_id;
END$$

-- Auto-update inventory when order is delivered
CREATE TRIGGER update_inventory_on_delivery
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE ingredients i
        INNER JOIN product_ingredients pi ON i.id = pi.ingredient_id
        INNER JOIN order_items oi ON pi.product_id = oi.product_id
        SET i.current_stock = i.current_stock - (pi.quantity_needed * oi.quantity)
        WHERE oi.order_id = NEW.id;
    END IF;
END$$

-- Alert on low stock
CREATE TRIGGER check_low_stock
AFTER UPDATE ON ingredients
FOR EACH ROW
BEGIN
    IF NEW.current_stock <= NEW.min_stock_alert THEN
        INSERT INTO stock_alerts (ingredient_id, current_stock, alert_type, created_at)
        VALUES (NEW.id, NEW.current_stock, 'low_stock', NOW());
    END IF;
END$$

DELIMITER ;
```

## Views for Reporting

```sql
-- Daily sales summary
CREATE VIEW daily_sales_summary AS
SELECT 
    DATE(paid_at) as sale_date,
    COUNT(DISTINCT order_id) as total_orders,
    SUM(amount) as total_revenue,
    AVG(amount) as average_order_value,
    SUM(tip_amount) as total_tips,
    method as payment_method
FROM payments
WHERE status = 'completed'
GROUP BY DATE(paid_at), method;

-- Popular products view
CREATE VIEW popular_products AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.unit_price * oi.quantity) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('delivered', 'paid')
GROUP BY p.id, p.name, p.category_id
ORDER BY times_ordered DESC;

-- Table turnover analysis
CREATE VIEW table_turnover AS
SELECT 
    t.number as table_number,
    t.capacity,
    COUNT(o.id) as total_orders,
    AVG(TIMESTAMPDIFF(MINUTE, o.ordered_at, o.paid_at)) as avg_duration_minutes,
    SUM(o.total_amount) as total_revenue
FROM tables t
LEFT JOIN orders o ON t.number = o.table_number
WHERE o.status = 'paid'
GROUP BY t.number, t.capacity;
```

## Partitioning Strategy for Large Tables

```sql
-- Partition orders table by month for better performance
ALTER TABLE orders 
PARTITION BY RANGE (YEAR(ordered_at) * 100 + MONTH(ordered_at)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    -- Add more partitions as needed
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Partition order_items similarly
ALTER TABLE order_items
PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p0 VALUES LESS THAN (TO_DAYS('2024-01-01')),
    PARTITION p1 VALUES LESS THAN (TO_DAYS('2024-02-01')),
    -- Continue pattern
);
```

## Security Considerations

```sql
-- Create specific users with limited permissions
CREATE USER 'app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE ON gastro.* TO 'app_user'@'%';

CREATE USER 'readonly_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT ON gastro.* TO 'readonly_user'@'%';

-- Enable audit logging
SET GLOBAL audit_log_policy = 'ALL';

-- Encrypt sensitive columns (requires MySQL Enterprise or custom implementation)
-- ALTER TABLE users MODIFY COLUMN hashed_password VARBINARY(255) ENCRYPTED;
```

## Maintenance Queries

```sql
-- Clean up old cancelled orders
DELETE FROM orders 
WHERE status = 'cancelled' 
AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Archive old completed orders
INSERT INTO orders_archive 
SELECT * FROM orders 
WHERE status = 'paid' 
AND paid_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Optimize tables regularly
OPTIMIZE TABLE orders, order_items, payments;

-- Check for unused indexes
SELECT 
    t.TABLE_NAME,
    s.INDEX_NAME,
    s.COLUMN_NAME,
    s.CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS s
LEFT JOIN INFORMATION_SCHEMA.TABLES t 
    ON s.TABLE_SCHEMA = t.TABLE_SCHEMA 
    AND s.TABLE_NAME = t.TABLE_NAME
WHERE t.TABLE_SCHEMA = 'gastro'
AND s.CARDINALITY = 0;
```