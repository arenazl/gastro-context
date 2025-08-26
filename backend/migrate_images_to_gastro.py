#!/usr/bin/env python3
"""
Script para migrar/subir imágenes gastronómicas de Pexels/Unsplash a S3 en carpeta gastro
"""
import os
import boto3
import requests
from datetime import datetime
import json
import time

# Configuración AWS
AWS_ACCESS_KEY_ID = 'AKIATI3QXLJ4VE3LBKFN'
AWS_SECRET_ACCESS_KEY = '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'
AWS_REGION = 'sa-east-1'
S3_BUCKET_NAME = 'sisbarrios'
S3_BASE_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"

# URLs de imágenes gastronómicas de alta calidad de Pexels/Unsplash
GASTRO_IMAGES = {
    # 🍔 Hamburguesas
    'hamburguesa-clasica': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=1200',
    'hamburguesa-doble': 'https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg?w=1200',
    'hamburguesa-bacon': 'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?w=1200',
    'hamburguesa-vegetariana': 'https://images.pexels.com/photos/6896379/pexels-photo-6896379.jpeg?w=1200',
    
    # 🍕 Pizzas
    'pizza-margherita': 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?w=1200',
    'pizza-pepperoni': 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?w=1200',
    'pizza-cuatro-quesos': 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?w=1200',
    'pizza-hawaiana': 'https://images.pexels.com/photos/3682837/pexels-photo-3682837.jpeg?w=1200',
    
    # 🥩 Carnes
    'bife-de-chorizo': 'https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?w=1200',
    'asado-de-tira': 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?w=1200',
    'pollo-al-grill': 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?w=1200',
    'salmon-grillado': 'https://images.pexels.com/photos/3763847/pexels-photo-3763847.jpeg?w=1200',
    'costillas-bbq': 'https://images.pexels.com/photos/4113471/pexels-photo-4113471.jpeg?w=1200',
    
    # 🍝 Pastas
    'spaghetti-bolognesa': 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?w=1200',
    'fettuccine-alfredo': 'https://images.pexels.com/photos/4079520/pexels-photo-4079520.jpeg?w=1200',
    'ravioles': 'https://images.pexels.com/photos/3214161/pexels-photo-3214161.jpeg?w=1200',
    'lasagna': 'https://images.pexels.com/photos/4079524/pexels-photo-4079524.jpeg?w=1200',
    'gnocchi': 'https://images.pexels.com/photos/3590401/pexels-photo-3590401.jpeg?w=1200',
    
    # 🥗 Ensaladas
    'ensalada-caesar': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?w=1200',
    'ensalada-griega': 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?w=1200',
    'ensalada-mixta': 'https://images.pexels.com/photos/1143754/pexels-photo-1143754.jpeg?w=1200',
    'ensalada-caprese': 'https://images.pexels.com/photos/5677744/pexels-photo-5677744.jpeg?w=1200',
    
    # 🍰 Postres
    'tiramisu': 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?w=1200',
    'cheesecake': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?w=1200',
    'brownie-chocolate': 'https://images.pexels.com/photos/887853/pexels-photo-887853.jpeg?w=1200',
    'flan-casero': 'https://images.pexels.com/photos/9472331/pexels-photo-9472331.jpeg?w=1200',
    'helado-artesanal': 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?w=1200',
    'tarta-frutas': 'https://images.pexels.com/photos/827513/pexels-photo-827513.jpeg?w=1200',
    
    # 🥤 Bebidas
    'coca-cola': 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?w=1200',
    'limonada-natural': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?w=1200',
    'cerveza-artesanal': 'https://images.pexels.com/photos/1267682/pexels-photo-1267682.jpeg?w=1200',
    'vino-tinto': 'https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg?w=1200',
    'mojito': 'https://images.pexels.com/photos/4021983/pexels-photo-4021983.jpeg?w=1200',
    'cafe-espresso': 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=1200',
    'jugo-naranja': 'https://images.pexels.com/photos/158053/fresh-orange-juice-squeezed-refreshing-citrus-158053.jpeg?w=1200',
    'agua-mineral': 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?w=1200',
    
    # 🍟 Entradas/Aperitivos
    'papas-fritas': 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?w=1200',
    'nachos-queso': 'https://images.pexels.com/photos/5737254/pexels-photo-5737254.jpeg?w=1200',
    'empanadas': 'https://images.pexels.com/photos/7613568/pexels-photo-7613568.jpeg?w=1200',
    'provoleta': 'https://images.pexels.com/photos/4109385/pexels-photo-4109385.jpeg?w=1200',
    'tabla-fiambres': 'https://images.pexels.com/photos/1927383/pexels-photo-1927383.jpeg?w=1200',
    'rabas': 'https://images.pexels.com/photos/3843224/pexels-photo-3843224.jpeg?w=1200',
    
    # 🍳 Desayunos
    'tostadas-francesas': 'https://images.pexels.com/photos/2113556/pexels-photo-2113556.jpeg?w=1200',
    'huevos-benedict': 'https://images.pexels.com/photos/793785/pexels-photo-793785.jpeg?w=1200',
    'pancakes': 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?w=1200',
    'medialunas': 'https://images.pexels.com/photos/3724/food-morning-breakfast-orange-juice.jpg?w=1200',
    
    # 🍜 Sopas
    'sopa-verduras': 'https://images.pexels.com/photos/1731535/pexels-photo-1731535.jpeg?w=1200',
    'crema-calabaza': 'https://images.pexels.com/photos/6120503/pexels-photo-6120503.jpeg?w=1200',
    
    # 🌮 Comida Mexicana
    'tacos': 'https://images.pexels.com/photos/7613555/pexels-photo-7613555.jpeg?w=1200',
    'burritos': 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?w=1200',
    'quesadillas': 'https://images.pexels.com/photos/4955256/pexels-photo-4955256.jpeg?w=1200',
    
    # 🍣 Sushi
    'sushi-mix': 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?w=1200',
    'sashimi': 'https://images.pexels.com/photos/3823489/pexels-photo-3823489.jpeg?w=1200',
    
    # 🥪 Sándwiches
    'sandwich-club': 'https://images.pexels.com/photos/1603898/pexels-photo-1603898.jpeg?w=1200',
    'sandwich-vegetariano': 'https://images.pexels.com/photos/1209029/pexels-photo-1209029.jpeg?w=1200',
    
    # 🍲 Platos especiales
    'paella': 'https://images.pexels.com/photos/16743486/pexels-photo-16743486.jpeg?w=1200',
    'risotto': 'https://images.pexels.com/photos/6210876/pexels-photo-6210876.jpeg?w=1200',
}

def upload_gastro_images():
    """Subir todas las imágenes gastronómicas a S3"""
    print("🚀 Iniciando migración de imágenes gastronómicas a S3...")
    print(f"📦 Bucket: {S3_BUCKET_NAME}")
    print(f"📁 Carpeta: gastro/products/")
    print(f"🖼️  Total de imágenes: {len(GASTRO_IMAGES)}")
    print("-" * 50)
    
    # Inicializar cliente S3
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    uploaded = 0
    failed = 0
    image_mapping = {}
    
    for name, url in GASTRO_IMAGES.items():
        try:
            print(f"\n📥 Descargando: {name}")
            
            # Descargar imagen
            response = requests.get(url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            response.raise_for_status()
            
            # Determinar content type y extensión
            content_type = response.headers.get('content-type', 'image/jpeg')
            extension = '.jpg'
            if 'png' in content_type:
                extension = '.png'
            elif 'webp' in content_type:
                extension = '.webp'
            
            # Generar nombre en S3
            s3_key = f"gastro/products/{name}{extension}"
            
            # Subir a S3
            print(f"☁️  Subiendo a S3: {s3_key}")
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=response.content,
                ContentType=content_type,
                CacheControl='public, max-age=31536000',
                Metadata={
                    'source': 'pexels-unsplash',
                    'product-name': name.replace('-', ' ').title(),
                    'uploaded-date': datetime.now().isoformat()
                }
            )
            
            # Generar URL pública
            public_url = f"{S3_BASE_URL}/{s3_key}"
            image_mapping[name] = public_url
            
            uploaded += 1
            print(f"✅ Subido exitosamente: {public_url}")
            
            # Pequeña pausa para no saturar
            time.sleep(0.5)
            
        except Exception as e:
            failed += 1
            print(f"❌ Error con {name}: {str(e)}")
    
    # Guardar mapeo de imágenes
    mapping_file = 'gastro_images_mapping.json'
    with open(mapping_file, 'w') as f:
        json.dump(image_mapping, f, indent=2)
    
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE MIGRACIÓN")
    print("=" * 50)
    print(f"✅ Exitosas: {uploaded}")
    print(f"❌ Fallidas: {failed}")
    print(f"📁 Total: {len(GASTRO_IMAGES)}")
    print(f"💾 Mapeo guardado en: {mapping_file}")
    print(f"🌐 URL base: {S3_BASE_URL}/gastro/products/")
    
    return image_mapping

if __name__ == "__main__":
    # Ejecutar migración
    mapping = upload_gastro_images()
    
    print("\n🎉 Migración completada!")
    print("\nEjemplos de URLs generadas:")
    for i, (name, url) in enumerate(list(mapping.items())[:5]):
        print(f"  - {name}: {url}")
    
    print("\n💡 Usa estas URLs en tu base de datos para los productos.")