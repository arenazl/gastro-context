import mysql.connector

# Configuración de la base de datos
db_config = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def verify():
    connection = None
    cursor = None
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        print("✅ VERIFICACIÓN POST-LIMPIEZA")
        print("=" * 50)
        
        # Verificar productos sin subcategoría
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM products 
            WHERE subcategory_id IS NULL OR subcategory_id = 0
        """)
        products_without_subcat = cursor.fetchone()['count']
        
        # Verificar categorías vacías activas
        cursor.execute("""
            SELECT c.id, c.name
            FROM categories c
            WHERE c.is_active = 1
            AND NOT EXISTS (
                SELECT 1 FROM products p WHERE p.category_id = c.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM subcategories s 
                WHERE s.category_id = c.id AND s.is_active = 1
            )
        """)
        empty_categories = cursor.fetchall()
        
        # Mostrar resumen
        print(f"📊 Productos sin subcategoría: {products_without_subcat}")
        print(f"📊 Categorías vacías activas: {len(empty_categories)}")
        
        if empty_categories:
            print("\nCategorías vacías encontradas:")
            for cat in empty_categories:
                print(f"  - {cat['name']} (ID: {cat['id']})")
        
        # Mostrar categorías con datos
        print("\n📁 CATEGORÍAS ACTIVAS CON CONTENIDO:")
        cursor.execute("""
            SELECT c.id, c.name,
                (SELECT COUNT(*) FROM subcategories s WHERE s.category_id = c.id AND s.is_active = 1) as subcats,
                (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as prods
            FROM categories c
            WHERE c.is_active = 1
            ORDER BY c.name
        """)
        
        for cat in cursor.fetchall():
            if cat['subcats'] > 0 or cat['prods'] > 0:
                print(f"  ✓ {cat['name']}: {cat['subcats']} subcategorías, {cat['prods']} productos")
        
        print("\n✨ Verificación completada!")
        
    except mysql.connector.Error as err:
        print(f"❌ Error: {err}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    verify()