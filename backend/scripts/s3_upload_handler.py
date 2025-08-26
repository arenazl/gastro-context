#!/usr/bin/env python3
"""
Manejador de uploads a S3 para integrar en complete_server.py
"""
import boto3
import os
import json
import hashlib
from datetime import datetime
from botocore.exceptions import ClientError
import base64
import io
from PIL import Image

# Configuración AWS
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', 'AKIATI3QXLJ4VE3LBKFN')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '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')
AWS_REGION = os.environ.get('AWS_REGION', 'sa-east-1')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'sisbarrios')
S3_BASE_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"

class S3ImageHandler:
    def __init__(self):
        """Inicializar el cliente S3"""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
    def upload_product_image(self, image_data, product_name, content_type='image/jpeg'):
        """
        Subir imagen de producto a S3
        
        Args:
            image_data: bytes de la imagen o base64 string
            product_name: nombre del producto para generar el filename
            content_type: tipo MIME de la imagen
            
        Returns:
            dict con url y metadata de la imagen subida
        """
        try:
            # Si viene en base64, decodificar
            if isinstance(image_data, str):
                # Remover el prefijo data:image/xxx;base64, si existe
                if 'base64,' in image_data:
                    image_data = image_data.split('base64,')[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Generar nombre único para el archivo
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_name = product_name.lower().replace(' ', '-').replace('/', '-')
            hash_suffix = hashlib.md5(image_bytes).hexdigest()[:8]
            
            # Determinar extensión
            extension = '.jpg'
            if 'png' in content_type:
                extension = '.png'
            elif 'webp' in content_type:
                extension = '.webp'
            
            # Path en S3 con subcarpeta gastro
            s3_key = f"gastro/products/{safe_name}_{timestamp}_{hash_suffix}{extension}"
            
            # Optimizar imagen antes de subir (opcional)
            optimized_bytes = self.optimize_image(image_bytes, content_type)
            
            # Subir a S3
            self.s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=optimized_bytes,
                ContentType=content_type,
                CacheControl='public, max-age=31536000',  # Cache por 1 año
                Metadata={
                    'product-name': product_name,
                    'uploaded-date': datetime.now().isoformat(),
                    'original-size': str(len(image_bytes)),
                    'optimized-size': str(len(optimized_bytes))
                }
            )
            
            # Generar URL pública
            image_url = f"{S3_BASE_URL}/{s3_key}"
            
            return {
                'success': True,
                'url': image_url,
                's3_key': s3_key,
                'size': len(optimized_bytes),
                'timestamp': timestamp
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def optimize_image(self, image_bytes, content_type, max_width=1200, quality=85):
        """
        Optimizar imagen para web (redimensionar y comprimir)
        """
        try:
            # Abrir imagen con PIL
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convertir RGBA a RGB si es necesario
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Redimensionar si es muy grande
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Guardar optimizada
            output = io.BytesIO()
            format_save = 'JPEG'
            if 'png' in content_type:
                format_save = 'PNG'
                img.save(output, format=format_save, optimize=True)
            else:
                img.save(output, format=format_save, quality=quality, optimize=True)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Error optimizando imagen: {e}")
            # Si falla la optimización, devolver la imagen original
            return image_bytes
    
    def delete_product_image(self, s3_key):
        """
        Eliminar imagen de S3
        """
        try:
            self.s3_client.delete_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key
            )
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def list_product_images(self, prefix='gastro/products/'):
        """
        Listar todas las imágenes de productos en S3
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=S3_BUCKET_NAME,
                Prefix=prefix
            )
            
            images = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    images.append({
                        'key': obj['Key'],
                        'url': f"{S3_BASE_URL}/{obj['Key']}",
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat()
                    })
            
            return {
                'success': True,
                'images': images,
                'count': len(images)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Instancia global para usar en complete_server.py
s3_handler = S3ImageHandler()