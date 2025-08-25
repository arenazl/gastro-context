#!/usr/bin/env python3
import mysql.connector
from mysql.connector import pooling

# Crear pool de conexiones
pool = pooling.MySQLConnectionPool(
    pool_name='gastro_pool',
    pool_size=5,
    host='mysql-aiven-arenazl.e.aivencloud.com',
    port=23108,
    user='avnadmin',
    password='AVNS_Lp1GQy5Xrj8V9jk4WGw',
    database='gastro',
    ssl_disabled=False,
    autocommit=True
)

try:
    connection = pool.get_connection()
    cursor = connection.cursor()
    
    # Agregar columna payment_status si no existe
    cursor.execute("""
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS payment_status 
        ENUM('pending', 'paid', 'partial', 'refunded', 'cancelled') 
        DEFAULT 'pending' 
        AFTER status
    """)
    
    print("✅ Columna payment_status agregada exitosamente")
    
except Exception as e:
    print(f"❌ Error: {e}")
    
finally:
    if cursor: cursor.close()
    if connection: connection.close()