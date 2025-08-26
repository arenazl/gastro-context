#!/usr/bin/env python3
"""
Script para crear pedidos de prueba en la base de datos
"""
import mysql.connector
from datetime import datetime, timedelta
import random

# Conexión a la base de datos
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
    # Primero, obtener algunos productos existentes
    cursor.execute("SELECT id, name, price FROM products WHERE available = 1 LIMIT 10")
    products = cursor.fetchall()
    
    if not products:
        print("No hay productos disponibles. Creando algunos productos de prueba...")
        
        # Crear algunos productos de prueba
        test_products = [
            ('Hamburguesa Classic', 12.50, 1, 1),
            ('Pizza Margherita', 18.00, 1, 1),
            ('Ensalada César', 9.50, 2, 1),
            ('Pasta Carbonara', 15.00, 3, 1),
            ('Milanesa con Papas', 16.50, 1, 1),
            ('Salmón Grillado', 25.00, 3, 1),
            ('Coca Cola', 4.50, 4, 1),
            ('Agua Mineral', 3.00, 4, 1),
            ('Cerveza Artesanal', 7.50, 4, 1),
            ('Helado Artesanal', 8.00, 5, 1)
        ]
        
        for name, price, cat_id, subcat_id in test_products:
            cursor.execute("""
                INSERT INTO products (name, price, category_id, subcategory_id, available, description)
                VALUES (%s, %s, %s, %s, 1, %s)
            """, (name, price, cat_id, subcat_id, f"Delicioso {name.lower()}"))
        
        # Obtener los productos recién creados
        cursor.execute("SELECT id, name, price FROM products WHERE available = 1")
        products = cursor.fetchall()
    
    print(f"Productos disponibles: {len(products)}")
    
    # Crear pedidos de prueba con diferentes estados
    orders_data = [
        {
            'table_number': 5,
            'status': 'pending',
            'notes': 'Sin cebolla en la hamburguesa',
            'time_offset': 5  # Hace 5 minutos
        },
        {
            'table_number': 3,
            'status': 'preparing',
            'notes': 'Cliente alérgico a los frutos secos',
            'time_offset': 15  # Hace 15 minutos
        },
        {
            'table_number': 8,
            'status': 'preparing',
            'notes': 'Apurar por favor',
            'time_offset': 10  # Hace 10 minutos
        },
        {
            'table_number': 2,
            'status': 'ready',
            'notes': 'Agregar extra queso',
            'time_offset': 25  # Hace 25 minutos
        },
        {
            'table_number': 12,
            'status': 'pending',
            'notes': None,
            'time_offset': 2  # Hace 2 minutos
        }
    ]
    
    for order_data in orders_data:
        # Calcular el tiempo de creación
        created_at = datetime.now() - timedelta(minutes=order_data['time_offset'])
        
        # Insertar el pedido
        cursor.execute("""
            INSERT INTO orders (table_number, waiter_id, status, notes, created_at, subtotal, tax, total)
            VALUES (%s, %s, %s, %s, %s, 0, 0, 0)
        """, (
            order_data['table_number'],
            1,  # waiter_id = 1 (admin)
            order_data['status'],
            order_data['notes'],
            created_at
        ))
        
        order_id = cursor.lastrowid
        
        # Agregar items al pedido (2-4 productos aleatorios)
        num_items = random.randint(2, 4)
        selected_products = random.sample(products, min(num_items, len(products)))
        
        total = 0
        for product_id, product_name, product_price in selected_products:
            quantity = random.randint(1, 3)
            subtotal = float(product_price) * quantity
            total += subtotal
            
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                order_id,
                product_id,
                quantity,
                product_price,
                subtotal,
                f"Item: {product_name}"
            ))
        
        # Actualizar el total del pedido
        tax = total * 0.21  # 21% IVA
        grand_total = total + tax
        
        cursor.execute("""
            UPDATE orders 
            SET subtotal = %s, tax = %s, total = %s 
            WHERE id = %s
        """, (total, tax, grand_total, order_id))
        
        print(f"✅ Pedido #{order_id} creado - Mesa {order_data['table_number']} - Estado: {order_data['status']} - Total: ${grand_total:.2f}")
    
    print("\n🎉 Pedidos de prueba creados exitosamente!")
    print("Puedes ver los pedidos en: http://172.29.228.80:5173/kitchen")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()