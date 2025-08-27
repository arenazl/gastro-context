#!/usr/bin/env python3
"""
Script para curar/generar imágenes de productos automáticamente
Usa Unsplash API para buscar imágenes relevantes basándose en el nombre del producto
"""

import os
import sys
import time
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import requests
import json
from typing import Optional, Dict, List
import re

# Cargar variables de entorno
load_dotenv()

# Configuración de Unsplash API (necesitas crear una cuenta gratuita en unsplash.com/developers)
UNSPLASH_ACCESS_KEY = "YOUR_UNSPLASH_ACCESS_KEY"  # Reemplazar con tu key
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"

# Configuración de base de datos
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DATABASE'),
}

# Mapeo de categorías a términos de búsqueda en inglés
CATEGORY_MAPPINGS = {
    'Bebidas': 'beverage drink',
    'Entradas': 'appetizer food',
    'Pastas': 'pasta italian food',
    'Vegetarianos': 'vegetarian food healthy',
    'Carnes': 'meat steak beef',
    'Aves': 'chicken poultry food',
    'Pizzas': 'pizza italian',
    'Vinos': 'wine glass bottle',
    'Sopas': 'soup bowl',
    'Postres': 'dessert sweet cake',
    'Ensaladas': 'salad fresh vegetables',
    'Pescados y Mariscos': 'seafood fish',
    'Pollo': 'chicken dish food'
}

# Traducciones comunes español -> inglés para búsqueda
TRANSLATIONS = {
    'con': 'with',
    'sin': 'without',
    'pollo': 'chicken',
    'carne': 'meat beef',
    'pescado': 'fish',
    'camarones': 'shrimp',
    'langostinos': 'prawns',
    'pasta': 'pasta',
    'ensalada': 'salad',
    'sopa': 'soup',
    'cerveza': 'beer',
    'vino': 'wine',
    'agua': 'water',
    'jugo': 'juice',
    'café': 'coffee',
    'té': 'tea',
    'helado': 'ice cream',
    'torta': 'cake',
    'tarta': 'pie tart',
    'flan': 'custard',
    'arroz': 'rice',
    'papa': 'potato',
    'papas fritas': 'french fries',
    'hamburguesa': 'burger hamburger',
    'sandwich': 'sandwich',
    'pizza': 'pizza',
    'queso': 'cheese',
    'tomate': 'tomato',
    'lechuga': 'lettuce',
    'cebolla': 'onion',
    'ajo': 'garlic',
    'aceite': 'oil',
    'vinagre': 'vinegar',
    'sal': 'salt',
    'pimienta': 'pepper',
    'crema': 'cream',
    'leche': 'milk',
    'huevo': 'egg',
    'pan': 'bread',
    'manteca': 'butter',
    'azúcar': 'sugar',
    'miel': 'honey',
    'limón': 'lemon',
    'naranja': 'orange',
    'manzana': 'apple',
    'banana': 'banana',
    'frutilla': 'strawberry',
    'chocolate': 'chocolate',
    'vainilla': 'vanilla',
    'caramelo': 'caramel',
    'dulce': 'sweet',
    'salado': 'salty savory',
    'picante': 'spicy hot',
    'frío': 'cold',
    'caliente': 'hot',
    'asado': 'grilled roasted',
    'frito': 'fried',
    'hervido': 'boiled',
    'al horno': 'baked oven',
    'a la parrilla': 'grilled barbecue',
    'milanesa': 'breaded cutlet schnitzel',
    'empanada': 'empanada pastry',
    'chorizo': 'sausage chorizo',
    'morcilla': 'blood sausage',
    'provoleta': 'grilled provolone cheese',
    'buddha bowl': 'buddha bowl healthy salad',
    'quinoa': 'quinoa grain',
    'palta': 'avocado',
    'aguacate': 'avocado',
    'espinaca': 'spinach',
    'rúcula': 'arugula rocket',
    'albahaca': 'basil',
    'orégano': 'oregano',
    'romero': 'rosemary',
    'tomillo': 'thyme',
    'perejil': 'parsley',
    'cilantro': 'cilantro coriander',
    'jengibre': 'ginger',
    'curry': 'curry',
    'salmón': 'salmon',
    'atún': 'tuna',
    'trucha': 'trout',
    'merluza': 'hake fish',
    'rabas': 'calamari squid rings',
    'pulpo': 'octopus',
    'mejillones': 'mussels',
    'almejas': 'clams',
    'ostras': 'oysters',
    'langosta': 'lobster',
    'cangrejo': 'crab',
    'paella': 'paella spanish rice',
    'risotto': 'risotto',
    'gnocchi': 'gnocchi',
    'ravioles': 'ravioli',
    'sorrentinos': 'stuffed pasta',
    'tallarines': 'noodles pasta',
    'fideos': 'noodles pasta',
    'lasagna': 'lasagna',
    'canelones': 'cannelloni',
    'tiramisú': 'tiramisu',
    'panna cotta': 'panna cotta',
    'brownie': 'brownie chocolate',
    'cheesecake': 'cheesecake',
    'crème brûlée': 'creme brulee',
    'profiteroles': 'profiteroles',
    'churros': 'churros',
    'medialunas': 'croissant',
    'tostadas': 'toast',
    'waffles': 'waffles',
    'pancakes': 'pancakes',
    'omelette': 'omelette',
    'revuelto': 'scrambled eggs',
    'pochado': 'poached egg',
}

def translate_to_english(text: str) -> str:
    """Traduce términos comunes del español al inglés para mejor búsqueda"""
    text_lower = text.lower()
    
    # Reemplazar términos conocidos
    for spanish, english in TRANSLATIONS.items():
        text_lower = text_lower.replace(spanish, english)
    
    return text_lower

def get_search_query(product_name: str, category_name: str = None) -> str:
    """Genera una query de búsqueda optimizada para Unsplash"""
    # Traducir el nombre del producto
    translated = translate_to_english(product_name)
    
    # Agregar contexto de categoría si existe
    if category_name and category_name in CATEGORY_MAPPINGS:
        category_context = CATEGORY_MAPPINGS[category_name]
        # Evitar redundancia
        if not any(word in translated for word in category_context.split()):
            translated = f"{translated} {category_context}"
    
    # Agregar contexto de "restaurant food" si no tiene suficiente contexto
    if len(translated.split()) < 3:
        translated = f"{translated} restaurant food"
    
    # Limpiar y limitar la longitud
    words = translated.split()[:5]  # Máximo 5 palabras para mejor precisión
    return ' '.join(words)

def search_unsplash_image(query: str, per_page: int = 1) -> Optional[str]:
    """Busca una imagen en Unsplash y retorna la URL"""
    
    # Si no hay API key configurada, usar una imagen de placeholder
    if UNSPLASH_ACCESS_KEY == "YOUR_UNSPLASH_ACCESS_KEY":
        # Usar un servicio de placeholder con el query como texto
        encoded_query = query.replace(' ', '+')
        return f"https://source.unsplash.com/400x300/?{encoded_query}"
    
    headers = {
        'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'
    }
    
    params = {
        'query': query,
        'per_page': per_page,
        'orientation': 'landscape',
        'content_filter': 'high'  # Filtrar contenido apropiado
    }
    
    try:
        response = requests.get(UNSPLASH_API_URL, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('results') and len(data['results']) > 0:
            # Obtener la primera imagen
            photo = data['results'][0]
            # Usar la URL de tamaño regular (no la full para no sobrecargar)
            return photo['urls'].get('regular', photo['urls'].get('small'))
        
    except Exception as e:
        print(f"Error buscando imagen para '{query}': {e}")
    
    return None

def get_products_to_update(connection) -> List[Dict]:
    """Obtiene productos sin imagen o con imágenes genéricas"""
    cursor = connection.cursor(dictionary=True)
    
    query = """
    SELECT 
        p.id, 
        p.name, 
        p.description,
        p.image_url,
        c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        p.image_url LIKE '%dicebear%'  -- SOLO procesar DiceBear
    ORDER BY p.category_id, p.id
    -- Sin OFFSET para procesar todos los que queden
    """
    
    cursor.execute(query)
    products = cursor.fetchall()
    cursor.close()
    
    return products

def update_product_image(connection, product_id: int, image_url: str) -> bool:
    """Actualiza la URL de imagen de un producto"""
    cursor = connection.cursor()
    
    try:
        query = "UPDATE products SET image_url = %s, updated_at = NOW() WHERE id = %s"
        cursor.execute(query, (image_url, product_id))
        connection.commit()
        return True
    except Exception as e:
        print(f"Error actualizando producto {product_id}: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def main():
    """Proceso principal para curar imágenes"""
    
    print("🖼️  CURACIÓN AUTOMÁTICA DE IMÁGENES DE PRODUCTOS")
    print("=" * 50)
    
    # Conectar a la base de datos
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ Conectado a la base de datos")
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        sys.exit(1)
    
    # Obtener productos sin imagen
    products = get_products_to_update(connection)
    print(f"📦 Encontrados {len(products)} productos sin imagen válida")
    
    if not products:
        print("✨ Todos los productos tienen imágenes!")
        connection.close()
        return
    
    # Procesar cada producto
    updated = 0
    failed = 0
    
    for i, product in enumerate(products, 1):
        print(f"\n[{i}/{len(products)}] Procesando: {product['name']}")
        
        # Generar query de búsqueda
        search_query = get_search_query(product['name'], product.get('category_name'))
        print(f"   🔍 Búsqueda: '{search_query}'")
        
        # Buscar imagen
        image_url = search_unsplash_image(search_query)
        
        if image_url:
            print(f"   ✅ Imagen encontrada: {image_url[:50]}...")
            
            # Actualizar en la base de datos
            if update_product_image(connection, product['id'], image_url):
                updated += 1
                print(f"   💾 Actualizado en BD")
            else:
                failed += 1
                print(f"   ❌ Error actualizando BD")
        else:
            print(f"   ⚠️  No se encontró imagen")
            failed += 1
        
        # Pausa para no exceder límites de API (Unsplash free: 50 requests/hour)
        if i % 10 == 0:
            print("\n⏸️  Pausa de 5 segundos para respetar límites de API...")
            time.sleep(5)
    
    # Resumen final
    print("\n" + "=" * 50)
    print(f"📊 RESUMEN:")
    print(f"   ✅ Actualizados: {updated}")
    print(f"   ❌ Fallidos: {failed}")
    print(f"   📦 Total procesados: {len(products)}")
    
    connection.close()
    print("\n✨ Proceso completado!")

if __name__ == "__main__":
    main()