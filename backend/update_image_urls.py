#!/usr/bin/env python3
"""
Script para actualizar las URLs de imágenes en la BD 
Solo guardar nombres de archivo en lugar de URLs completas
"""
import mysql.connector
import re

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def extract_filename_from_url(url):
    """Extrae el nombre de archivo de una URL de Pexels"""
    if not url:
        return None
    
    # Si ya es solo un nombre de archivo, devolverlo
    if not url.startswith('http'):
        return url
    
    # Para URLs de Pexels, extraer el ID y generar nombre basado en él
    if 'pexels.com' in url:
        # Extraer el ID de la imagen
        match = re.search(r'pexels-photo-(\d+)', url)
        if match:
            return f"pexels-{match.group(1)}.jpg"
    
    # Para otras URLs, usar el último segmento
    return url.split('/')[-1].split('?')[0]

connection = mysql.connector.connect(**MYSQL_CONFIG)
cursor = connection.cursor(dictionary=True)

print('🔄 ACTUALIZANDO URLs DE IMÁGENES A NOMBRES DE ARCHIVO...')
print('=' * 60)

# Obtener todos los productos con URLs de imagen
cursor.execute('''
    SELECT id, name, image_url 
    FROM products 
    WHERE image_url IS NOT NULL 
    AND image_url != ''
    AND image_url LIKE 'http%'
''')

products = cursor.fetchall()
print(f'📊 Productos con URLs completas: {len(products)}')

# Mapeo de nombres de productos a archivos locales ya descargados
PRODUCT_TO_FILE = {
    'Caesar Salad': 'caesar-salad.jpg',
    'Greek Salad': 'greek-salad.jpg',
    'Ensalada Caprese': 'ensalada-caprese.jpg',
    'Ensalada Waldorf': 'ensalada-waldorf.jpg',
    'Ensalada de Quinoa': 'ensalada-de-quinoa.jpg',
    'Ensalada Thai': 'ensalada-thai.jpg',
    'Ensalada de Rúcula': 'ensalada-de-rucula.jpg',
    'Ensalada de Espinaca': 'ensalada-de-espinaca.jpg',
    'Ensalada Mediterránea': 'ensalada-mediterranea.jpg',
    'Ensalada Niçoise': 'ensalada-nicoise.jpg',
    'Bife de Chorizo': 'bife-de-chorizo.jpg',
    'Ribeye Steak': 'ribeye-steak.jpg',
    'Filet Mignon': 'filet-mignon.jpg',
    'Entraña Grillada': 'entrana-grillada.jpg',
    'Cordero Patagónico': 'cordero-patagonico.jpg',
    'Rack de Cordero': 'rack-de-cordero.jpg',
    'Lomo Wellington': 'lomo-wellington.jpg',
    'Lomo al Malbec': 'lomo-al-malbec.jpg',
    'Osso Buco': 'osso-buco.jpg',
    'Costillas BBQ': 'costillas-bbq.jpg',
    'Parrillada Mixta': 'parrillada-mixta.jpg',
    'House Burger': 'house-burger.jpg',
    'Bacon Cheeseburger': 'bacon-cheeseburger.jpg',
    'Hamburguesa Beyond': 'hamburguesa-beyond.jpg',
    'Grilled Salmon': 'grilled-salmon.jpg',
    'Fish and Chips': 'fish-and-chips.jpg',
    'Grilled Chicken': 'grilled-chicken.jpg',
    'Chicken Parmesan': 'chicken-parmesan.jpg',
    'Pollo Grillado': 'pollo-grillado.jpg',
    'Pollo al Limón': 'pollo-al-limon.jpg',
    'Pollo Teriyaki': 'pollo-teriyaki.jpg',
    'Pollo Frito Crujiente': 'pollo-frito-crujiente.jpg',
    'Brochetas de Pollo': 'brochetas-de-pollo.jpg',
    'Pollo Relleno': 'pollo-relleno.jpg',
    'Pollo Thai': 'pollo-thai.jpg',
    'Suprema Maryland': 'suprema-maryland.jpg',
    'Pato Confitado': 'pato-confitado.jpg',
    'Pollo Tikka Masala': 'pollo-tikka-masala.jpg',
    'Spaghetti Carbonara': 'spaghetti-carbonara.jpg',
    'Pasta Carbonara': 'pasta-carbonara.jpg',
    'Fettuccine Alfredo': 'fettuccine-alfredo.jpg',
    'Linguine Frutti di Mare': 'linguine-frutti-di-mare.jpg',
    'Spaghetti Bolognese': 'spaghetti-bolognese.jpg',
    'Penne Arrabbiata': 'penne-arrabbiata.jpg',
    'Rigatoni Amatriciana': 'rigatoni-amatriciana.jpg',
    'Ravioli de Ricotta': 'ravioli-de-ricotta.jpg',
    'Lasagna Tradicional': 'lasagna-tradicional.jpg',
    'Risotto ai Funghi': 'risotto-ai-funghi.jpg',
    'Risotto alla Milanese': 'risotto-alla-milanese.jpg',
    'Margherita': 'margherita.jpg',
    'Margherita Pizza': 'margherita-pizza.jpg',
    'Pepperoni': 'pepperoni.jpg',
    'Pepperoni Pizza': 'pepperoni-pizza.jpg',
    'Napolitana': 'napolitana.jpg',
    'Cuatro Quesos': 'cuatro-quesos.jpg',
    'Hawaiana': 'hawaiana.jpg',
    'Pizza Trufa': 'pizza-trufa.jpg',
    'Pizza Caprese': 'pizza-caprese.jpg',
    'Parrillada de Verduras': 'parrillada-de-verduras.jpg',
    'Buddha Bowl': 'buddha-bowl.jpg',
    'Falafel con Hummus': 'falafel-con-hummus.jpg',
    'Tiramisu': 'tiramisu.jpg',
    'Tiramisú': 'tiramisu-2.jpg',
    'Chocolate Cake': 'chocolate-cake.jpg',
    'Cheesecake': 'cheesecake.jpg',
    'Flan con Dulce': 'flan-con-dulce.jpg',
    'Copa Helada': 'copa-helada.jpg',
    'Volcán de Chocolate': 'volcan-de-chocolate.jpg',
    'Coca Cola': 'coca-cola.jpg',
    'Fresh Orange Juice': 'fresh-orange-juice.jpg',
    'Jugo de Naranja': 'jugo-de-naranja.jpg',
    'Agua Mineral': 'agua-mineral.jpg',
    'Coffee': 'coffee.jpg',
    'Café Espresso': 'cafe-espresso.jpg',
    'Mojito Virgin': 'mojito-virgin.jpg',
    'Malbec Reserva': 'malbec-reserva.jpg',
    'Torrontés': 'torrontes.jpg',
    'Rosé Pinot Noir': 'rose-pinot-noir.jpg',
    'Champagne Brut': 'champagne-brut.jpg',
    'Vino de la Casa': 'vino-de-la-casa.jpg',
    'House Wine': 'house-wine.jpg',
    # Agregar el resto de productos...
    'Carpaccio de Res': 'carpaccio-de-res.jpg',
    'Tabla de Quesos': 'tabla-de-quesos.jpg',
    'Salmón Marinado': 'salmon-marinado.jpg',
    'Vitello Tonnato': 'vitello-tonnato.jpg',
    'Empanadas Criollas': 'empanadas-criollas.jpg',
    'Provoleta a la Parrilla': 'provoleta-a-la-parrilla.jpg',
    'Hongos Rellenos': 'hongos-rellenos.jpg',
    'Calamares Fritos': 'calamares-fritos.jpg',
    'Croquetas de Jamón': 'croquetas-de-jamon.jpg',
    'Hummus con Pita': 'hummus-con-pita.jpg',
    'Bruschetta Mixta': 'bruschetta-mixta.jpg',
    'Baba Ganoush': 'baba-ganoush.jpg',
    'Antipasto Veggie': 'antipasto-veggie.jpg',
    'Tarta de Verduras': 'tarta-de-verduras.jpg',
    'Consomé de Pollo': 'consome-de-pollo.jpg',
    'Caldo de Pescado': 'caldo-de-pescado.jpg',
    'Sopa Miso': 'sopa-miso.jpg',
    'Caldo Verde': 'caldo-verde.jpg',
    'Sopa de Cebolla': 'sopa-de-cebolla.jpg',
    'French Onion Soup': 'french-onion-soup.jpg',
    'Crema de Calabaza': 'crema-de-calabaza.jpg',
    'Crema de Espárragos': 'crema-de-esparragos.jpg',
    'Crema de Champiñones': 'crema-de-champinones.jpg',
    'Crema de Tomate': 'crema-de-tomate.jpg',
    'Crema de Brócoli': 'crema-de-brocoli.jpg',
    'Tomato Basil Soup': 'tomato-basil-soup.jpg',
}

updated = 0
for product in products:
    product_id = product['id']
    product_name = product['name']
    
    # Buscar el nombre de archivo para este producto
    filename = PRODUCT_TO_FILE.get(product_name)
    
    if not filename:
        # Si no está en el mapeo, generar nombre desde el producto
        filename = re.sub(r'[^a-z0-9]+', '-', product_name.lower()).strip('-') + '.jpg'
    
    # Actualizar en la BD
    cursor.execute('''
        UPDATE products 
        SET image_url = %s
        WHERE id = %s
    ''', (filename, product_id))
    
    if cursor.rowcount > 0:
        updated += 1
        print(f'  ✓ {product_name} → {filename}')

connection.commit()

print(f'\n✅ Total productos actualizados: {updated}')
print('🎯 Las imágenes ahora se sirven desde: http://172.29.228.80:9001/static/products/')

cursor.close()
connection.close()