#!/usr/bin/env python3
"""
Script completo para asignar imágenes únicas a TODOS los productos
"""
import mysql.connector

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Mapeo COMPLETO de imágenes para TODOS los productos
IMAGES = {
    # ENTRADAS - Frías
    'Carpaccio de Res': 'https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Tabla de Quesos': 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Salmón Marinado': 'https://images.pexels.com/photos/8697543/pexels-photo-8697543.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Vitello Tonnato': 'https://images.pexels.com/photos/6287344/pexels-photo-6287344.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Caprese': 'https://images.pexels.com/photos/2814828/pexels-photo-2814828.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # ENTRADAS - Calientes
    'Empanadas Criollas': 'https://images.pexels.com/photos/9210964/pexels-photo-9210964.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Provoleta a la Parrilla': 'https://images.pexels.com/photos/4109464/pexels-photo-4109464.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Hongos Rellenos': 'https://images.pexels.com/photos/6419711/pexels-photo-6419711.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Calamares Fritos': 'https://images.pexels.com/photos/7613568/pexels-photo-7613568.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Croquetas de Jamón': 'https://images.pexels.com/photos/5903328/pexels-photo-5903328.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # ENTRADAS - Vegetarianas
    'Hummus con Pita': 'https://images.pexels.com/photos/6419730/pexels-photo-6419730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Bruschetta Mixta': 'https://images.pexels.com/photos/5639391/pexels-photo-5639391.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Baba Ganoush': 'https://images.pexels.com/photos/6152370/pexels-photo-6152370.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Antipasto Veggie': 'https://images.pexels.com/photos/1391487/pexels-photo-1391487.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Tarta de Verduras': 'https://images.pexels.com/photos/5848119/pexels-photo-5848119.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # SOPAS - Caldos
    'Consomé de Pollo': 'https://images.pexels.com/photos/6252720/pexels-photo-6252720.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Caldo de Pescado': 'https://images.pexels.com/photos/6294362/pexels-photo-6294362.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Sopa Miso': 'https://images.pexels.com/photos/6607330/pexels-photo-6607330.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Caldo Verde': 'https://images.pexels.com/photos/6252763/pexels-photo-6252763.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Sopa de Cebolla': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'French Onion Soup': 'https://images.pexels.com/photos/12737663/pexels-photo-12737663.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # SOPAS - Cremas
    'Crema de Calabaza': 'https://images.pexels.com/photos/8601412/pexels-photo-8601412.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Crema de Espárragos': 'https://images.pexels.com/photos/6294361/pexels-photo-6294361.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Crema de Champiñones': 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Crema de Tomate': 'https://images.pexels.com/photos/2403391/pexels-photo-2403391.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Crema de Brócoli': 'https://images.pexels.com/photos/6542789/pexels-photo-6542789.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Tomato Basil Soup': 'https://images.pexels.com/photos/1731535/pexels-photo-1731535.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # ENSALADAS
    'Caesar Salad': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Greek Salad': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Waldorf': 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Niçoise': 'https://images.pexels.com/photos/1833337/pexels-photo-1833337.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada de Quinoa': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Thai': 'https://images.pexels.com/photos/2862154/pexels-photo-2862154.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada de Rúcula': 'https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada de Espinaca': 'https://images.pexels.com/photos/169743/pexels-photo-169743.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ensalada Mediterránea': 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # CARNES
    'Bife de Chorizo': 'https://images.pexels.com/photos/361184/pexels-photo-361184.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ribeye Steak': 'https://images.pexels.com/photos/1268549/pexels-photo-1268549.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Filet Mignon': 'https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Entraña Grillada': 'https://images.pexels.com/photos/7218637/pexels-photo-7218637.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Cordero Patagónico': 'https://images.pexels.com/photos/10897949/pexels-photo-10897949.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Rack de Cordero': 'https://images.pexels.com/photos/8753672/pexels-photo-8753672.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Lomo Wellington': 'https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Lomo al Malbec': 'https://images.pexels.com/photos/2491273/pexels-photo-2491273.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Osso Buco': 'https://images.pexels.com/photos/5718025/pexels-photo-5718025.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Costillas BBQ': 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Parrillada Mixta': 'https://images.pexels.com/photos/3535389/pexels-photo-3535389.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # HAMBURGUESAS
    'House Burger': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Bacon Cheeseburger': 'https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Hamburguesa Beyond': 'https://images.pexels.com/photos/6896379/pexels-photo-6896379.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # PESCADOS Y MARISCOS
    'Grilled Salmon': 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Fish and Chips': 'https://images.pexels.com/photos/3850652/pexels-photo-3850652.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Atún Sellado': 'https://images.pexels.com/photos/2374946/pexels-photo-2374946.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Lenguado Meuniere': 'https://images.pexels.com/photos/8352773/pexels-photo-8352773.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Paella de Mariscos': 'https://images.pexels.com/photos/11281652/pexels-photo-11281652.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Ceviche Peruano': 'https://images.pexels.com/photos/1764280/pexels-photo-1764280.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Langostinos al Ajillo': 'https://images.pexels.com/photos/3843224/pexels-photo-3843224.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # POLLO
    'Grilled Chicken': 'https://images.pexels.com/photos/2994900/pexels-photo-2994900.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Chicken Parmesan': 'https://images.pexels.com/photos/7474252/pexels-photo-7474252.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Grillado': 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo al Limón': 'https://images.pexels.com/photos/5737377/pexels-photo-5737377.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Teriyaki': 'https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Frito Crujiente': 'https://images.pexels.com/photos/1352296/pexels-photo-1352296.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Brochetas de Pollo': 'https://images.pexels.com/photos/3297882/pexels-photo-3297882.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Relleno': 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Thai': 'https://images.pexels.com/photos/3434523/pexels-photo-3434523.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Suprema Maryland': 'https://images.pexels.com/photos/1860208/pexels-photo-1860208.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pato Confitado': 'https://images.pexels.com/photos/5916537/pexels-photo-5916537.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pollo Tikka Masala': 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # PASTAS
    'Spaghetti Carbonara': 'https://images.pexels.com/photos/769969/pexels-photo-769969.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pasta Carbonara': 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
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
    'Margherita Pizza': 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pepperoni': 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pepperoni Pizza': 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Napolitana': 'https://images.pexels.com/photos/5792329/pexels-photo-5792329.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Cuatro Quesos': 'https://images.pexels.com/photos/4394612/pexels-photo-4394612.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Hawaiana': 'https://images.pexels.com/photos/3682837/pexels-photo-3682837.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pizza Trufa': 'https://images.pexels.com/photos/2260201/pexels-photo-2260201.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Pizza Caprese': 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # VEGETARIANOS
    'Hamburguesa Beyond': 'https://images.pexels.com/photos/6896379/pexels-photo-6896379.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Parrillada de Verduras': 'https://images.pexels.com/photos/1143754/pexels-photo-1143754.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Buddha Bowl': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Falafel con Hummus': 'https://images.pexels.com/photos/6275170/pexels-photo-6275170.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # POSTRES
    'Tiramisu': 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Tiramisú': 'https://images.pexels.com/photos/5848123/pexels-photo-5848123.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Chocolate Cake': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Cheesecake': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Flan con Dulce': 'https://images.pexels.com/photos/9844237/pexels-photo-9844237.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Copa Helada': 'https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Volcán de Chocolate': 'https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # BEBIDAS
    'Coca Cola': 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Fresh Orange Juice': 'https://images.pexels.com/photos/158053/fresh-orange-juice-squeezed-refreshing-citrus-158053.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Jugo de Naranja': 'https://images.pexels.com/photos/3323682/pexels-photo-3323682.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Agua Mineral': 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Coffee': 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Café Espresso': 'https://images.pexels.com/photos/685527/pexels-photo-685527.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Mojito Virgin': 'https://images.pexels.com/photos/5947016/pexels-photo-5947016.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    
    # VINOS
    'Malbec Reserva': 'https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Torrontés': 'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Rosé Pinot Noir': 'https://images.pexels.com/photos/3171770/pexels-photo-3171770.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Champagne Brut': 'https://images.pexels.com/photos/1545529/pexels-photo-1545529.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'Vino de la Casa': 'https://images.pexels.com/photos/51313/wine-red-wine-glass-drink-51313.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
    'House Wine': 'https://images.pexels.com/photos/1123260/pexels-photo-1123260.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
}

connection = mysql.connector.connect(**MYSQL_CONFIG)
cursor = connection.cursor()

print('ACTUALIZANDO TODAS LAS IMÁGENES DE PRODUCTOS...')
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