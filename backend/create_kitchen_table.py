#!/usr/bin/env python3
import mysql.connector

# Conectar a la base de datos
conn = mysql.connector.connect(
    host='mysql-aiven-arenazl.e.aivencloud.com',
    port=23108,
    user='avnadmin',
    password='AVNS_Lp1GQy5Xrj8V9jk4WGw',
    database='gastro',
    ssl_disabled=False,
    autocommit=True
)

cursor = conn.cursor()

try:
    # Crear tabla kitchen_queue_items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kitchen_queue_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        order_item_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        
        -- Estación de cocina
        station ENUM('grill', 'salads', 'desserts', 'drinks', 'fryer', 'general') DEFAULT 'general',
        
        -- Estados específicos de cocina
        status ENUM('new', 'viewed', 'preparing', 'delayed', 'ready', 'delivered', 'cancelled') DEFAULT 'new',
        
        -- Prioridad
        priority ENUM('normal', 'rush', 'vip') DEFAULT 'normal',
        
        -- Asignación y tiempos
        assigned_chef_id INT,
        started_at TIMESTAMP NULL,
        ready_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        
        -- Tiempos estimados vs reales
        estimated_minutes INT DEFAULT 10,
        actual_minutes INT,
        
        -- Información adicional
        delay_reason TEXT,
        special_instructions TEXT,
        table_number INT NOT NULL,
        waiter_name VARCHAR(100),
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Índices para búsquedas rápidas
        INDEX idx_order (order_id),
        INDEX idx_status (status),
        INDEX idx_station (station),
        INDEX idx_priority (priority),
        INDEX idx_created (created_at)
    )
    """)
    
    print("✅ Tabla kitchen_queue_items creada exitosamente")
    
    # Verificar que la tabla existe
    cursor.execute("SHOW TABLES LIKE 'kitchen_queue_items'")
    if cursor.fetchone():
        print("✅ Tabla verificada correctamente")
    
except Exception as e:
    print(f"❌ Error: {e}")
    
finally:
    cursor.close()
    conn.close()