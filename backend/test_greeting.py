#!/usr/bin/env python3
"""
Test del endpoint de chat para verificar saludos
"""
import requests
import json

# URLs a probar
urls = [
    "http://172.29.228.80:9002/api/chat/menu-ai",  # Local
    "https://gastro-ec0530e03436.herokuapp.com/api/chat/menu-ai"  # Heroku
]

# Mensajes de prueba
test_messages = [
    "hola",
    "hola como estas",
    "buenos dias",
    "que tal",
    "buenas tardes"
]

for url in urls:
    print(f"\n{'='*50}")
    print(f"Testing: {url}")
    print('='*50)
    
    for msg in test_messages:
        try:
            response = requests.post(url, 
                json={"message": msg, "threadId": "test123"},
                timeout=5
            )
            data = response.json()
            
            print(f"\nMensaje: '{msg}'")
            print(f"Tipo detectado: {data.get('query_type', 'NO TYPE')}")
            print(f"Respuesta: {data.get('response', 'NO RESPONSE')[:100]}...")
            
            # Verificar si devuelve productos cuando no debería
            if data.get('query_type') == 'greeting':
                products = data.get('recommendedProducts', []) or data.get('categorizedProducts', [])
                if products:
                    print(f"⚠️ ERROR: Devuelve {len(products)} productos en un saludo!")
                else:
                    print("✅ OK: No devuelve productos en saludo")
            
        except Exception as e:
            print(f"Error: {e}")