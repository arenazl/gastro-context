#!/usr/bin/env python3
"""
Script para asignar imágenes apropiadas a los productos
"""
import mysql.connector

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Mapeo de imágenes por tipo de producto
IMAGES = {
    # ENSALADAS
    'Caesar Salad': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Greek Salad': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Caprese': 'https://images.pexels.com/photos/2814828/pexels-photo-2814828.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Waldorf': 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada de Quinoa': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Thai': 'https://images.pexels.com/photos/2862154/pexels-photo-2862154.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada de Rúcula': 'https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada de Espinaca': 'https://images.pexels.com/photos/169743/pexels-photo-169743.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Mediterránea': 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Niçoise': 'https://images.pexels.com/photos/1833337/pexels-photo-1833337.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # CARNES
    'Bife de Chorizo': 'https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ribeye Steak': 'https://images.pexels.com/photos/1268549/pexels-photo-1268549.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Filet Mignon': 'https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Entraña Grillada': 'https://images.pexels.com/photos/7218637/pexels-photo-7218637.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Cordero Patagónico': 'https://images.pexels.com/photos/10897949/pexels-photo-10897949.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Rack de Cordero': 'https://images.pexels.com/photos/10897949/pexels-photo-10897949.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Lomo Wellington': 'https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Lomo al Malbec': 'https://images.pexels.com/photos/2491273/pexels-photo-2491273.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Osso Buco': 'https://images.pexels.com/photos/5718025/pexels-photo-5718025.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Costillas BBQ': 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Parrillada Mixta': 'https://images.pexels.com/photos/3535389/pexels-photo-3535389.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # HAMBURGUESAS
    'House Burger': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Bacon Cheeseburger': 'https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Hamburguesa Beyond': 'https://images.pexels.com/photos/6896379/pexels-photo-6896379.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # POLLO
    'Pollo Grillado': 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo al Limón': 'https://images.pexels.com/photos/5737377/pexels-photo-5737377.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Teriyaki': 'https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Frito Crujiente': 'https://images.pexels.com/photos/1352296/pexels-photo-1352296.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Brochetas de Pollo': 'https://images.pexels.com/photos/3297882/pexels-photo-3297882.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Chicken Parmesan': 'https://images.pexels.com/photos/7474252/pexels-photo-7474252.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Relleno': 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Thai': 'https://images.pexels.com/photos/3434523/pexels-photo-3434523.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Suprema Maryland': 'https://images.pexels.com/photos/1860208/pexels-photo-1860208.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pato Confitado': 'https://images.pexels.com/photos/5916537/pexels-photo-5916537.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # PASTAS
    'Spaghetti Carbonara': 'https://images.pexels.com/photos/769969/pexels-photo-769969.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pasta Carbonara': 'https://images.pexels.com/photos/769969/pexels-photo-769969.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Fettuccine Alfredo': 'https://images.pexels.com/photos/11220209/pexels-photo-11220209.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Linguine Frutti di Mare': 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Spaghetti Bolognese': 'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Penne Arrabbiata': 'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Rigatoni Amatriciana': 'https://images.pexels.com/photos/803963/pexels-photo-803963.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ravioli de Ricotta': 'https://images.pexels.com/photos/3214161/pexels-photo-3214161.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Lasagna Tradicional': 'https://images.pexels.com/photos/4079520/pexels-photo-4079520.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Risotto ai Funghi': 'https://images.pexels.com/photos/6419720/pexels-photo-6419720.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Risotto alla Milanese': 'https://images.pexels.com/photos/7218650/pexels-photo-7218650.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # PIZZAS
    'Margherita': 'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Margherita Pizza': 'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pepperoni': 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pepperoni Pizza': 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Napolitana': 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Cuatro Quesos': 'https://images.pexels.com/photos/4394612/pexels-photo-4394612.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Hawaiana': 'https://images.pexels.com/photos/3682837/pexels-photo-3682837.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pizza Trufa': 'https://images.pexels.com/photos/2260201/pexels-photo-2260201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pizza Caprese': 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
}

connection = mysql.connector.connect(**MYSQL_CONFIG)
cursor = connection.cursor()

print('ACTUALIZANDO IMÁGENES DE PRODUCTOS...')
print('=' * 60)

actualizados = 0
for product_name, image_url in IMAGES.items():
    cursor.execute('''
        UPDATE products 
        SET image_url = %s
        WHERE name = %s
    ''', (image_url, product_name))
    
    if cursor.rowcount > 0:
        actualizados += cursor.rowcount
        print(f'  ✓ {product_name}')

connection.commit()

print(f'\n✅ Total productos actualizados: {actualizados}')

cursor.close()
connection.close()