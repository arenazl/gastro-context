#!/usr/bin/env python3
"""
Generar imágenes únicas para cada mocktail usando Pillow
"""
import mysql.connector
from PIL import Image, ImageDraw, ImageFont
import os
import random

MYSQL_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

# Colores por fruta
FRUIT_COLORS = {
    'frutilla': (255, 99, 132),    # Rosa/Rojo
    'mango': (255, 159, 64),        # Naranja
    'maracuyá': (255, 206, 86),     # Amarillo
    'piña': (255, 205, 86),         # Amarillo dorado
    'naranja': (255, 140, 0),       # Naranja fuerte
    'limón': (201, 203, 87),        # Verde limón
    'lima': (139, 195, 74),         # Verde
    'sandía': (244, 67, 54),        # Rojo sandía
    'melón': (255, 235, 59),        # Amarillo melón
    'kiwi': (124, 179, 66),         # Verde kiwi
    'durazno': (255, 183, 77),      # Durazno
    'frambuesa': (233, 30, 99),     # Rosa frambuesa
    'arándanos': (63, 81, 181),     # Azul
    'cereza': (183, 28, 28),        # Rojo cereza
    'pomelo': (255, 138, 101),      # Rosa pomelo
    'coco': (245, 245, 245),        # Blanco
    'banana': (255, 235, 59),       # Amarillo
    'manzana verde': (139, 195, 74), # Verde manzana
    'pera': (205, 220, 57),         # Verde amarillento
    'uva': (156, 39, 176),          # Púrpura
}

# Crear directorio para las imágenes si no existe
IMAGES_DIR = '/mnt/c/Code/gastro-context/backend/static/products/mocktails'
os.makedirs(IMAGES_DIR, exist_ok=True)

def create_mocktail_image(name, base_fruit, filename):
    """Crear una imagen de mocktail con colores basados en la fruta"""
    
    # Tamaño de la imagen
    width, height = 400, 400
    
    # Obtener color base de la fruta
    base_color = FRUIT_COLORS.get(base_fruit.lower(), (100, 200, 100))
    
    # Crear imagen con fondo gradiente
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Dibujar fondo gradiente
    for y in range(height):
        # Gradiente de blanco a color pastel
        factor = y / height
        r = int(255 - (255 - base_color[0]) * factor * 0.3)
        g = int(255 - (255 - base_color[1]) * factor * 0.3)
        b = int(255 - (255 - base_color[2]) * factor * 0.3)
        draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))
    
    # Dibujar vaso (silueta simple)
    glass_color = (240, 240, 240)
    glass_outline = (200, 200, 200)
    
    # Vaso principal
    glass_points = [
        (width//2 - 80, height//2 - 100),  # Top left
        (width//2 + 80, height//2 - 100),  # Top right
        (width//2 + 60, height//2 + 100),  # Bottom right
        (width//2 - 60, height//2 + 100),  # Bottom left
    ]
    draw.polygon(glass_points, fill=glass_color, outline=glass_outline, width=2)
    
    # Líquido dentro del vaso
    liquid_points = [
        (width//2 - 75, height//2 - 80),
        (width//2 + 75, height//2 - 80),
        (width//2 + 58, height//2 + 80),
        (width//2 - 58, height//2 + 80),
    ]
    # Color del líquido con transparencia simulada
    liquid_color = tuple(int(c * 0.8) for c in base_color)
    draw.polygon(liquid_points, fill=liquid_color)
    
    # Decoración (pajita)
    straw_color = (100, 100, 100)
    draw.rectangle([
        (width//2 + 20, height//2 - 120),
        (width//2 + 30, height//2 + 20)
    ], fill=straw_color)
    
    # Rayas en la pajita
    for y in range(height//2 - 120, height//2 + 20, 10):
        draw.rectangle([
            (width//2 + 20, y),
            (width//2 + 30, y + 5)
        ], fill=(255, 0, 0))
    
    # Decoración de fruta (círculo simple)
    fruit_x = width//2 + 70
    fruit_y = height//2 - 90
    draw.ellipse([
        (fruit_x - 15, fruit_y - 15),
        (fruit_x + 15, fruit_y + 15)
    ], fill=base_color, outline=(255, 255, 255), width=2)
    
    # Hielo (cubitos)
    ice_positions = [
        (width//2 - 30, height//2 - 40),
        (width//2 + 10, height//2 - 50),
        (width//2 - 10, height//2 - 20),
    ]
    for x, y in ice_positions:
        draw.rectangle([
            (x, y), (x + 20, y + 20)
        ], fill=(230, 240, 255), outline=(200, 220, 240), width=1)
    
    # Burbujas
    for _ in range(8):
        bx = random.randint(width//2 - 50, width//2 + 50)
        by = random.randint(height//2 - 60, height//2 + 60)
        size = random.randint(3, 8)
        draw.ellipse([
            (bx - size, by - size),
            (bx + size, by + size)
        ], fill=(255, 255, 255, 128))
    
    # Guardar imagen
    img.save(os.path.join(IMAGES_DIR, filename))
    return f"products/mocktails/{filename}"  # Sin /static/

def generate_all_mocktail_images():
    """Generar imágenes para todos los mocktails en la BD"""
    
    conn = mysql.connector.connect(**MYSQL_CONFIG, ssl_disabled=False)
    cursor = conn.cursor(dictionary=True)
    
    print("=" * 60)
    print("🎨 GENERANDO IMÁGENES PARA MOCKTAILS")
    print("=" * 60)
    
    # Obtener todos los mocktails
    cursor.execute("""
        SELECT id, name 
        FROM products 
        WHERE category_id = 11 AND subcategory_id = 48
        ORDER BY id
    """)
    
    mocktails = cursor.fetchall()
    print(f"📊 Total de mocktails encontrados: {len(mocktails)}")
    
    updated = 0
    
    for i, mocktail in enumerate(mocktails, 1):
        try:
            # Extraer la fruta base del nombre
            name = mocktail['name']
            base_fruit = 'lima'  # Default
            
            # Buscar la fruta en el nombre
            for fruit in FRUIT_COLORS.keys():
                if fruit.lower() in name.lower():
                    base_fruit = fruit
                    break
            
            # Generar nombre de archivo único
            filename = f"mocktail_{mocktail['id']}.png"
            
            # Crear imagen
            image_url = create_mocktail_image(name, base_fruit, filename)
            
            # Actualizar en la BD
            cursor.execute("""
                UPDATE products 
                SET image_url = %s 
                WHERE id = %s
            """, (image_url, mocktail['id']))
            
            updated += 1
            
            if i % 10 == 0:
                print(f"  ✅ {i}/{len(mocktails)} imágenes generadas...")
                conn.commit()
                
        except Exception as e:
            print(f"  ❌ Error con '{mocktail['name']}': {e}")
    
    # Commit final
    conn.commit()
    
    print("\n" + "=" * 60)
    print(f"✅ RESULTADO:")
    print(f"   • Imágenes generadas: {updated}")
    print(f"   • Ubicación: {IMAGES_DIR}")
    print("=" * 60)
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    # Verificar si Pillow está instalado
    try:
        from PIL import Image
        generate_all_mocktail_images()
    except ImportError:
        print("❌ Necesitas instalar Pillow: pip install Pillow")
        print("   Instalando...")
        import subprocess
        subprocess.run(["pip3", "install", "--break-system-packages", "Pillow"])
        print("   Intentando de nuevo...")
        generate_all_mocktail_images()