#!/usr/bin/env python3
"""
Analizar estructura completa de categorías, subcategorías y productos
"""
import mysql.connector
import json

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

def get_complete_structure():
    """Obtener estructura completa de la BD"""
    try:
        connection = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = connection.cursor(dictionary=True)
        
        # 1. Obtener todas las categorías
        cursor.execute("""
            SELECT id, name, icon, color, is_active, sort_order
            FROM categories 
            WHERE is_active = 1
            ORDER BY sort_order ASC
        """)
        categories = cursor.fetchall()
        
        structure = []
        
        for category in categories:
            cat_data = {
                "id": category['id'],
                "name": category['name'],
                "icon": category['icon'],
                "color": category['color'],
                "subcategories": [],
                "products_count": 0
            }
            
            # 2. Obtener subcategorías de esta categoría
            cursor.execute("""
                SELECT id, name, icon, is_active
                FROM subcategories 
                WHERE category_id = %s AND is_active = 1
                ORDER BY sort_order ASC, name ASC
            """, (category['id'],))
            subcategories = cursor.fetchall()
            
            for subcat in subcategories:
                subcat_data = {
                    "id": subcat['id'],
                    "name": subcat['name'],
                    "icon": subcat['icon'],
                    "products": []
                }
                
                # 3. Obtener productos de esta subcategoría
                cursor.execute("""
                    SELECT id, name, price
                    FROM products 
                    WHERE category_id = %s AND subcategory_id = %s AND available = 1
                    ORDER BY name ASC
                    LIMIT 5
                """, (category['id'], subcat['id']))
                products = cursor.fetchall()
                
                for product in products:
                    subcat_data['products'].append({
                        "id": product['id'],
                        "name": product['name'],
                        "price": float(product['price'])
                    })
                
                cat_data['subcategories'].append(subcat_data)
            
            # 4. Contar total de productos en la categoría
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM products 
                WHERE category_id = %s AND available = 1
            """, (category['id'],))
            result = cursor.fetchone()
            cat_data['products_count'] = result['count']
            
            structure.append(cat_data)
        
        cursor.close()
        connection.close()
        
        return structure
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def analyze_problems(structure):
    """Analizar problemas en la estructura"""
    problems = []
    
    for cat in structure:
        # Verificar categorías sin subcategorías
        if len(cat['subcategories']) == 0:
            problems.append(f"❌ {cat['name']} - SIN SUBCATEGORÍAS")
        elif len(cat['subcategories']) < 3:
            problems.append(f"⚠️  {cat['name']} - Solo {len(cat['subcategories'])} subcategorías")
        
        # Verificar subcategorías incoherentes
        for subcat in cat['subcategories']:
            # Detectar incoherencias obvias
            if cat['name'] == 'Pastas' and 'Alcohólicas' in subcat['name']:
                problems.append(f"🔴 INCOHERENTE: {cat['name']} → {subcat['name']}")
            elif cat['name'] == 'Bebidas' and any(word in subcat['name'] for word in ['Cremas', 'Caldos']):
                problems.append(f"🔴 INCOHERENTE: {cat['name']} → {subcat['name']}")
            elif cat['name'] == 'Sopas' and 'Alcohólicas' in subcat['name']:
                problems.append(f"🔴 INCOHERENTE: {cat['name']} → {subcat['name']}")
            
            # Verificar subcategorías sin productos
            if len(subcat['products']) == 0:
                problems.append(f"⚠️  {cat['name']} → {subcat['name']} - SIN PRODUCTOS")
    
    return problems

def main():
    print("🔍 ANALIZANDO ESTRUCTURA DE LA BASE DE DATOS")
    print("=" * 60)
    
    structure = get_complete_structure()
    
    if structure:
        # Guardar JSON completo
        with open('/mnt/c/Code/gastro-context/output/db_structure.json', 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2, ensure_ascii=False)
        
        print("\n📊 RESUMEN:")
        print(f"Total categorías: {len(structure)}")
        
        print("\n📋 ESTRUCTURA:")
        for cat in structure:
            print(f"\n{cat['name']} (ID: {cat['id']}) - {cat['products_count']} productos")
            if cat['subcategories']:
                for subcat in cat['subcategories']:
                    products_info = f"{len(subcat['products'])} productos" if subcat['products'] else "SIN PRODUCTOS"
                    print(f"  └─ {subcat['name']} ({products_info})")
                    for prod in subcat['products'][:2]:  # Mostrar solo 2 productos de ejemplo
                        print(f"      • {prod['name']} - ${prod['price']}")
            else:
                print(f"  ❌ SIN SUBCATEGORÍAS")
        
        # Analizar problemas
        problems = analyze_problems(structure)
        
        if problems:
            print("\n⚠️  PROBLEMAS DETECTADOS:")
            for problem in problems:
                print(f"  {problem}")
        
        print("\n✅ Estructura guardada en: /mnt/c/Code/gastro-context/output/db_structure.json")
        
    else:
        print("❌ Error obteniendo estructura")

if __name__ == "__main__":
    main()