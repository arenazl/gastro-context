import mysql.connector
import json

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_hzX3Kbnej41VE7bSXlb',
    'database': 'gastro'
}

# URLs de imágenes reales de comida organizadas por categoría
image_urls = {
    'default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop',
    
    # Bebidas
    'agua': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=500&fit=crop',
    'jugo': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&h=500&fit=crop',
    'gaseosa': 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=500&h=500&fit=crop',
    'café': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&fit=crop',
    'cerveza': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500&h=500&fit=crop',
    'vino': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&h=500&fit=crop',
    'coctel': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&h=500&fit=crop',
    'smoothie': 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=500&h=500&fit=crop',
    'té': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500&h=500&fit=crop',
    
    # Entradas
    'ensalada': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop',
    'sopa': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=500&fit=crop',
    'ceviche': 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=500&h=500&fit=crop',
    'carpaccio': 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=500&h=500&fit=crop',
    'bruschetta': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&h=500&fit=crop',
    'hummus': 'https://images.unsplash.com/photo-1573641287741-60f13c05b44f?w=500&h=500&fit=crop',
    'antipasto': 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=500&h=500&fit=crop',
    'empanada': 'https://images.unsplash.com/photo-1601476230054-04e60f018c12?w=500&h=500&fit=crop',
    'taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&fit=crop',
    'quesadilla': 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=500&h=500&fit=crop',
    
    # Platos principales
    'hamburguesa': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop',
    'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&h=500&fit=crop',
    'spaghetti': 'https://images.unsplash.com/photo-1548247661-3d7905940716?w=500&h=500&fit=crop',
    'lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&h=500&fit=crop',
    'ravioli': 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=500&h=500&fit=crop',
    'fettuccine': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&h=500&fit=crop',
    'linguine': 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=500&h=500&fit=crop',
    'risotto': 'https://images.unsplash.com/photo-1633964913295-ceb43826a07b?w=500&h=500&fit=crop',
    
    # Carnes
    'bife': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=500&fit=crop',
    'steak': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=500&fit=crop',
    'asado': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop',
    'pollo': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop',
    'milanesa': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&h=500&fit=crop',
    'costilla': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=500&fit=crop',
    'cordero': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=500&h=500&fit=crop',
    'cerdo': 'https://images.unsplash.com/photo-1623047437095-27418540c288?w=500&h=500&fit=crop',
    
    # Pescados y Mariscos
    'pescado': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=500&h=500&fit=crop',
    'salmon': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&h=500&fit=crop',
    'atún': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=500&h=500&fit=crop',
    'camarón': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&h=500&fit=crop',
    'langostino': 'https://images.unsplash.com/photo-1612850534204-323fb8bf8b3f?w=500&h=500&fit=crop',
    'pulpo': 'https://images.unsplash.com/photo-1566476485066-2961afa02011?w=500&h=500&fit=crop',
    'marisco': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=500&h=500&fit=crop',
    
    # Postres
    'helado': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&h=500&fit=crop',
    'torta': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop',
    'cheesecake': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=500&h=500&fit=crop',
    'brownie': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&h=500&fit=crop',
    'flan': 'https://images.unsplash.com/photo-1625941551006-09db8d28ae79?w=500&h=500&fit=crop',
    'tiramisú': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=500&fit=crop',
    'chocolate': 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=500&h=500&fit=crop',
    'postre': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&h=500&fit=crop',
    'dulce': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&h=500&fit=crop',
    
    # Asiática
    'sushi': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=500&fit=crop',
    'ramen': 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=500&h=500&fit=crop',
    'wok': 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=500&h=500&fit=crop',
    'roll': 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500&h=500&fit=crop',
    
    # Sandwiches
    'sandwich': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=500&h=500&fit=crop',
    'wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&h=500&fit=crop',
    'panini': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&h=500&fit=crop',
    
    # Otros
    'nachos': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=500&h=500&fit=crop',
    'papas': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&h=500&fit=crop',
    'arroz': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&h=500&fit=crop',
    'paella': 'https://images.unsplash.com/photo-1630175860333-5131bda75071?w=500&h=500&fit=crop',
}

def get_image_url_for_product(product_name):
    """Obtener URL de imagen basada en el nombre del producto"""
    if not product_name:
        return image_urls['default']
    
    product_lower = product_name.lower()
    
    # Buscar coincidencias en el nombre del producto
    for keyword, url in image_urls.items():
        if keyword in product_lower:
            return url
    
    # Si no hay coincidencia, usar imagen por defecto
    return image_urls['default']

def update_product_images():
    """Actualizar todas las imágenes de productos en la base de datos"""
    connection = None
    cursor = None
    
    try:
        # Conectar a la base de datos
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        # Obtener todos los productos
        cursor.execute("SELECT id, name, image_url FROM products")
        products = cursor.fetchall()
        
        print(f"Actualizando {len(products)} productos...")
        
        updated_count = 0
        for product in products:
            # Obtener URL de imagen apropiada
            new_image_url = get_image_url_for_product(product['name'])
            
            # Actualizar en la base de datos
            cursor.execute(
                "UPDATE products SET image_url = %s WHERE id = %s",
                (new_image_url, product['id'])
            )
            
            updated_count += 1
            if updated_count % 10 == 0:
                print(f"Actualizados {updated_count} productos...")
        
        # Confirmar cambios
        connection.commit()
        print(f"✅ Actualizadas las imágenes de {updated_count} productos exitosamente!")
        
    except mysql.connector.Error as err:
        print(f"❌ Error de MySQL: {err}")
        if connection:
            connection.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    update_product_images()