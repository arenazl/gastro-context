import mysql.connector
from typing import Dict, List, Tuple

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def analyze_categories():
    """Analizar categorías vacías y productos sin subcategorías"""
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        print("🔍 ANÁLISIS DE CATEGORÍAS Y PRODUCTOS\n")
        print("=" * 60)
        
        # 1. Obtener todas las categorías
        cursor.execute("SELECT id, name FROM categories WHERE is_active = 1")
        categories = cursor.fetchall()
        
        empty_categories = []
        categories_with_data = {}
        
        for category in categories:
            cat_id = category['id']
            cat_name = category['name']
            
            # Contar subcategorías
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM subcategories 
                WHERE category_id = %s AND is_active = 1
            """, (cat_id,))
            subcat_count = cursor.fetchone()['count']
            
            # Contar productos
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM products 
                WHERE category_id = %s
            """, (cat_id,))
            product_count = cursor.fetchone()['count']
            
            categories_with_data[cat_id] = {
                'name': cat_name,
                'subcategories': subcat_count,
                'products': product_count
            }
            
            if subcat_count == 0 and product_count == 0:
                empty_categories.append(category)
                print(f"❌ Categoría VACÍA: {cat_name} (ID: {cat_id})")
            else:
                print(f"✅ Categoría: {cat_name} - {subcat_count} subcategorías, {product_count} productos")
        
        print("\n" + "=" * 60)
        
        # 2. Buscar productos sin subcategoría
        cursor.execute("""
            SELECT p.id, p.name, p.category_id, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.subcategory_id IS NULL OR p.subcategory_id = 0
        """)
        products_without_subcat = cursor.fetchall()
        
        if products_without_subcat:
            print(f"\n⚠️ PRODUCTOS SIN SUBCATEGORÍA: {len(products_without_subcat)}")
            for prod in products_without_subcat[:10]:  # Mostrar solo los primeros 10
                print(f"  - {prod['name']} (Categoría: {prod['category_name']})")
            if len(products_without_subcat) > 10:
                print(f"  ... y {len(products_without_subcat) - 10} más")
        
        return empty_categories, products_without_subcat, categories_with_data
        
    except mysql.connector.Error as err:
        print(f"❌ Error de MySQL: {err}")
        return [], [], {}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def clean_empty_categories(empty_categories):
    """Eliminar categorías vacías"""
    if not empty_categories:
        print("\n✅ No hay categorías vacías para eliminar")
        return
    
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print(f"\n🗑️ Eliminando {len(empty_categories)} categorías vacías...")
        
        for category in empty_categories:
            cursor.execute("""
                UPDATE categories 
                SET is_active = 0 
                WHERE id = %s
            """, (category['id'],))
            print(f"  ✓ Desactivada: {category['name']}")
        
        connection.commit()
        print(f"\n✅ {len(empty_categories)} categorías desactivadas")
        
    except mysql.connector.Error as err:
        print(f"❌ Error al eliminar categorías: {err}")
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def assign_default_subcategories(products_without_subcat):
    """Asignar subcategorías por defecto a productos sin subcategoría"""
    if not products_without_subcat:
        print("\n✅ Todos los productos tienen subcategoría")
        return
    
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        print(f"\n🔧 Asignando subcategorías a {len(products_without_subcat)} productos...")
        
        # Agrupar productos por categoría
        products_by_category = {}
        for product in products_without_subcat:
            cat_id = product['category_id']
            if cat_id not in products_by_category:
                products_by_category[cat_id] = []
            products_by_category[cat_id].append(product)
        
        for cat_id, products in products_by_category.items():
            # Buscar subcategorías existentes para esta categoría
            cursor.execute("""
                SELECT id, name 
                FROM subcategories 
                WHERE category_id = %s AND is_active = 1
                ORDER BY id
                LIMIT 1
            """, (cat_id,))
            existing_subcat = cursor.fetchone()
            
            if existing_subcat:
                # Usar subcategoría existente
                subcat_id = existing_subcat['id']
                subcat_name = existing_subcat['name']
            else:
                # Crear subcategoría "General" para esta categoría
                cat_name = products[0]['category_name']
                cursor.execute("""
                    INSERT INTO subcategories (category_id, name, is_active)
                    VALUES (%s, %s, 1)
                """, (cat_id, 'General'))
                subcat_id = cursor.lastrowid
                subcat_name = 'General'
                print(f"  📁 Creada subcategoría 'General' para {cat_name}")
            
            # Actualizar productos
            product_ids = [p['id'] for p in products]
            format_strings = ','.join(['%s'] * len(product_ids))
            cursor.execute(f"""
                UPDATE products 
                SET subcategory_id = %s
                WHERE id IN ({format_strings})
            """, [subcat_id] + product_ids)
            
            print(f"  ✓ {len(products)} productos asignados a '{subcat_name}' en {products[0]['category_name']}")
        
        connection.commit()
        print(f"\n✅ Subcategorías asignadas correctamente")
        
    except mysql.connector.Error as err:
        print(f"❌ Error al asignar subcategorías: {err}")
        if connection:
            connection.rollback()
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def main():
    print("🚀 LIMPIEZA DE CATEGORÍAS Y PRODUCTOS")
    print("=" * 60)
    
    # Analizar situación actual
    empty_categories, products_without_subcat, categories_data = analyze_categories()
    
    if empty_categories or products_without_subcat:
        print("\n" + "=" * 60)
        print("📋 ACCIONES A REALIZAR:")
        
        if empty_categories:
            print(f"  1. Desactivar {len(empty_categories)} categorías vacías")
        if products_without_subcat:
            print(f"  2. Asignar subcategorías a {len(products_without_subcat)} productos")
        
        # Proceder automáticamente con la limpieza
        print("\n🚀 Procediendo con la limpieza...")
        
        if True:
            # Primero asignar subcategorías (por si algún producto está en categorías vacías)
            if products_without_subcat:
                assign_default_subcategories(products_without_subcat)
            
            # Luego limpiar categorías vacías
            if empty_categories:
                clean_empty_categories(empty_categories)
            
            print("\n✨ Limpieza completada!")
        else:
            print("\n❌ Limpieza cancelada")
    else:
        print("\n✨ La base de datos está limpia!")

if __name__ == "__main__":
    main()