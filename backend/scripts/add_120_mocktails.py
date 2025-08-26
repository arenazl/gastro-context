#!/usr/bin/env python3
"""
Script para agregar 120 cócteles sin alcohol y estresar el sistema
"""
import mysql.connector
import random

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Lista de bases para mocktails
bases = ['Frutilla', 'Mango', 'Maracuyá', 'Piña', 'Naranja', 'Limón', 'Lima', 'Sandía', 
         'Melón', 'Kiwi', 'Durazno', 'Frambuesa', 'Arándanos', 'Cereza', 'Pomelo',
         'Coco', 'Banana', 'Manzana Verde', 'Pera', 'Uva']

# Tipos de mocktails
tipos = ['Mojito', 'Colada', 'Daiquiri', 'Margarita', 'Fizz', 'Punch', 'Smoothie', 
         'Cooler', 'Spritz', 'Julep', 'Sour', 'Smash', 'Collins', 'Refresher', 'Breeze']

# Extras
extras = ['con Menta', 'con Jengibre', 'con Albahaca', 'con Romero', 'con Hierbabuena',
          'Frozen', 'con Chía', 'con Espuma', 'Premium', 'Deluxe', 'Especial', 
          'Tropical', 'del Chef', 'Garden', 'Sunset']

# Descripciones base
desc_templates = [
    "Refrescante combinación de {0} con un toque {1}",
    "Bebida sin alcohol a base de {0}, perfecta para cualquier momento",
    "Delicioso mocktail de {0} con ingredientes naturales",
    "Explosión de sabor con {0} fresco y {1}",
    "Cóctel sin alcohol premium con {0} seleccionado",
    "Bebida artesanal de {0} con receta especial de la casa",
    "Fusión tropical de {0} con notas {1}",
    "Mocktail signature con {0} y decoración especial",
    "Bebida energizante de {0} con superfoods",
    "Creación única de {0} con técnica molecular"
]

def generate_mocktails():
    """Generar 120 mocktails únicos"""
    mocktails = []
    used_names = set()
    
    # Generar combinaciones únicas
    for base in bases:
        for tipo in tipos:
            if len(mocktails) >= 120:
                break
                
            # Nombre básico
            name = f"{tipo} de {base}"
            if name not in used_names:
                mocktails.append({
                    'name': name,
                    'base': base.lower(),
                    'tipo': tipo.lower()
                })
                used_names.add(name)
            
            # Con extra
            if len(mocktails) < 120:
                extra = random.choice(extras)
                name_extra = f"{tipo} de {base} {extra}"
                if name_extra not in used_names:
                    mocktails.append({
                        'name': name_extra,
                        'base': base.lower(),
                        'tipo': tipo.lower()
                    })
                    used_names.add(name_extra)
        
        if len(mocktails) >= 120:
            break
    
    return mocktails[:120]

def insert_mocktails():
    """Insertar mocktails en la base de datos"""
    conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
    cursor = conn.cursor()
    
    mocktails = generate_mocktails()
    
    print("=" * 60)
    print("🍹 AGREGANDO 120 CÓCTELES SIN ALCOHOL")
    print("=" * 60)
    
    inserted = 0
    errors = 0
    
    for i, mocktail in enumerate(mocktails, 1):
        try:
            # Generar descripción
            desc_template = random.choice(desc_templates)
            description = desc_template.format(
                mocktail['base'],
                random.choice(['cítrico', 'dulce', 'refrescante', 'tropical', 'especiado'])
            )
            
            # Precio aleatorio entre 4.50 y 12.99
            price = round(random.uniform(4.50, 12.99), 2)
            
            # Imagen genérica (usaremos una imagen de mojito para todos por ahora)
            image_url = f"/static/products/mojito-virgin.jpg"
            
            # Query de inserción (solo columnas que existen)
            query = """
                INSERT INTO products 
                (name, description, price, category_id, subcategory_id, 
                 image_url, available)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                mocktail['name'],
                description,
                price,
                11,  # Categoría: Bebidas
                48,  # Subcategoría: Cócteles Sin Alcohol
                image_url,
                True  # available
            )
            
            cursor.execute(query, values)
            inserted += 1
            
            if i % 10 == 0:
                print(f"  ✅ {i}/120 mocktails agregados...")
                conn.commit()  # Commit cada 10 registros
                
        except mysql.connector.Error as e:
            errors += 1
            print(f"  ❌ Error con '{mocktail['name']}': {e}")
    
    # Commit final
    conn.commit()
    
    print("\n" + "=" * 60)
    print(f"✅ RESULTADO FINAL:")
    print(f"   • Mocktails agregados: {inserted}")
    print(f"   • Errores: {errors}")
    print("=" * 60)
    
    # Verificar el total
    cursor.execute("""
        SELECT COUNT(*) as total 
        FROM products 
        WHERE category_id = 11 AND subcategory_id = 48
    """)
    result = cursor.fetchone()
    print(f"\n📊 Total de Cócteles Sin Alcohol en la BD: {result[0]}")
    
    # Ver algunos ejemplos
    cursor.execute("""
        SELECT name, price 
        FROM products 
        WHERE category_id = 11 AND subcategory_id = 48 
        ORDER BY id DESC 
        LIMIT 5
    """)
    
    print("\n🍹 Últimos 5 agregados:")
    for row in cursor.fetchall():
        print(f"   • {row[0]} - ${row[1]}")
    
    cursor.close()
    conn.close()
    
    print("\n🚀 ¡Listo para estresar el sistema con 120+ productos!")

if __name__ == "__main__":
    insert_mocktails()