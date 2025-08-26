#!/usr/bin/env python3
"""
Script para subir imágenes a AWS S3 y actualizar URLs en la base de datos
"""
import os
import boto3
from botocore.exceptions import ClientError
import mysql.connector
from urllib.parse import urlparse
import requests
from pathlib import Path
import hashlib
import json
from datetime import datetime

# ==================== CONFIGURACIÓN ====================
# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_REGION = os.environ.get('AWS_REGION', 'sa-east-1')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'sisbarrios')
S3_BASE_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"

# MySQL Configuration (desde complete_server.py)
DB_CONFIG = {
    'host': 'mysql-336ad08d-matias-6a16.i.aivencloud.com',
    'port': 16261,
    'database': 'defaultdb',
    'user': 'avnadmin',
    'password': 'AVNS_Lp7V7rN93rHN0_VXHy_',
    'ssl_ca': '/path/to/ca.pem',  # Actualizar si es necesario
    'ssl_verify_cert': False
}

# URLs de imágenes de ejemplo (de Unsplash para productos gastronómicos)
SAMPLE_IMAGES = {
    # Hamburguesas
    'house-burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    'classic-burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    'cheese-burger': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
    'bacon-burger': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800',
    
    # Pizzas
    'margherita-pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    'pepperoni-pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'veggie-pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    
    # Carnes
    'bife-chorizo': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
    'asado-tira': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    'pollo-grillado': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800',
    
    # Pastas
    'ravioles': 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=800',
    'spaghetti': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
    'lasagna': 'https://images.unsplash.com/photo-1565299715199-866c917206bb?w=800',
    
    # Ensaladas
    'caesar-salad': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800',
    'greek-salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    
    # Postres
    'tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
    'cheesecake': 'https://images.unsplash.com/photo-1508737804141-4c3b688e2546?w=800',
    'brownie': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=800',
    
    # Bebidas
    'coca-cola': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800',
    'agua-mineral': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800',
    'cerveza': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800',
    'vino-tinto': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    
    # Entradas
    'empanadas': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800',
    'provoleta': 'https://images.unsplash.com/photo-1626957341926-98752fc2ba90?w=800',
    'tabla-quesos': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800',
}

class S3ImageUploader:
    def __init__(self):
        """Inicializar cliente S3 y conexión MySQL"""
        self.s3_client = None
        self.db_connection = None
        self.uploaded_count = 0
        self.failed_count = 0
        self.image_mapping = {}  # Mapeo de nombres a URLs de S3
        
    def setup_s3(self):
        """Configurar cliente S3"""
        try:
            if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
                print("❌ AWS credentials not found in environment variables")
                print("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
                return False
                
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            )
            
            # Verificar si el bucket existe, si no, crearlo
            try:
                self.s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
                print(f"✅ S3 bucket '{S3_BUCKET_NAME}' exists")
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    print(f"📦 Creating S3 bucket '{S3_BUCKET_NAME}'...")
                    if AWS_REGION == 'us-east-1':
                        self.s3_client.create_bucket(Bucket=S3_BUCKET_NAME)
                    else:
                        self.s3_client.create_bucket(
                            Bucket=S3_BUCKET_NAME,
                            CreateBucketConfiguration={'LocationConstraint': AWS_REGION}
                        )
                    
                    # Configurar el bucket para acceso público de lectura
                    self.s3_client.put_bucket_policy(
                        Bucket=S3_BUCKET_NAME,
                        Policy=json.dumps({
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Sid": "PublicReadGetObject",
                                "Effect": "Allow",
                                "Principal": "*",
                                "Action": "s3:GetObject",
                                "Resource": f"arn:aws:s3:::{S3_BUCKET_NAME}/*"
                            }]
                        })
                    )
                    print(f"✅ S3 bucket created successfully")
                else:
                    raise
            
            return True
            
        except Exception as e:
            print(f"❌ Error setting up S3: {e}")
            return False
    
    def setup_database(self):
        """Conectar a MySQL"""
        try:
            self.db_connection = mysql.connector.connect(**DB_CONFIG)
            print("✅ Connected to MySQL database")
            return True
        except Exception as e:
            print(f"❌ Error connecting to database: {e}")
            return False
    
    def download_and_upload_image(self, name, source_url):
        """Descargar imagen de URL y subir a S3"""
        try:
            # Descargar imagen
            response = requests.get(source_url, timeout=30)
            response.raise_for_status()
            
            # Determinar extensión
            content_type = response.headers.get('content-type', 'image/jpeg')
            extension = '.jpg'
            if 'png' in content_type:
                extension = '.png'
            elif 'webp' in content_type:
                extension = '.webp'
            
            # Generar nombre de archivo único en subcarpeta gastro
            file_name = f"gastro/products/{name}{extension}"
            
            # Subir a S3
            self.s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=file_name,
                Body=response.content,
                ContentType=content_type,
                CacheControl='public, max-age=31536000',  # Cache por 1 año
                Metadata={
                    'original-source': source_url,
                    'uploaded-date': datetime.now().isoformat()
                }
            )
            
            # Generar URL de S3
            s3_url = f"{S3_BASE_URL}/{file_name}"
            self.image_mapping[name] = s3_url
            self.uploaded_count += 1
            
            print(f"✅ Uploaded: {name} -> {s3_url}")
            return s3_url
            
        except Exception as e:
            print(f"❌ Error uploading {name}: {e}")
            self.failed_count += 1
            return None
    
    def upload_local_images(self, directory_path):
        """Subir imágenes locales a S3"""
        if not os.path.exists(directory_path):
            print(f"❌ Directory not found: {directory_path}")
            return
        
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    file_path = os.path.join(root, file)
                    name = Path(file).stem
                    
                    try:
                        with open(file_path, 'rb') as f:
                            content = f.read()
                        
                        # Determinar content type
                        content_type = 'image/jpeg'
                        if file.lower().endswith('.png'):
                            content_type = 'image/png'
                        elif file.lower().endswith('.webp'):
                            content_type = 'image/webp'
                        
                        # Subir a S3 en subcarpeta gastro
                        s3_key = f"gastro/products/{file}"
                        self.s3_client.put_object(
                            Bucket=S3_BUCKET_NAME,
                            Key=s3_key,
                            Body=content,
                            ContentType=content_type,
                            CacheControl='public, max-age=31536000'
                        )
                        
                        s3_url = f"{S3_BASE_URL}/{s3_key}"
                        self.image_mapping[name] = s3_url
                        self.uploaded_count += 1
                        
                        print(f"✅ Uploaded local: {file} -> {s3_url}")
                        
                    except Exception as e:
                        print(f"❌ Error uploading {file}: {e}")
                        self.failed_count += 1
    
    def update_database_urls(self):
        """Actualizar URLs en la base de datos"""
        if not self.db_connection:
            print("❌ No database connection")
            return
        
        cursor = self.db_connection.cursor()
        updated_count = 0
        
        try:
            # Actualizar productos con las nuevas URLs de S3
            for name, s3_url in self.image_mapping.items():
                # Intentar actualizar por nombre similar
                query = """
                    UPDATE products 
                    SET image_url = %s 
                    WHERE LOWER(REPLACE(REPLACE(name, ' ', '-'), '_', '-')) LIKE %s
                    OR image_url LIKE %s
                """
                cursor.execute(query, (
                    s3_url,
                    f"%{name}%",
                    f"%{name}%"
                ))
                
                if cursor.rowcount > 0:
                    updated_count += cursor.rowcount
                    print(f"✅ Updated DB: {name} ({cursor.rowcount} products)")
            
            self.db_connection.commit()
            print(f"\n✅ Updated {updated_count} products in database")
            
        except Exception as e:
            print(f"❌ Error updating database: {e}")
            self.db_connection.rollback()
        finally:
            cursor.close()
    
    def generate_dummy_images(self):
        """Generar y subir imágenes de ejemplo desde URLs públicas"""
        print("\n📸 Uploading sample images from Unsplash...")
        
        for name, url in SAMPLE_IMAGES.items():
            self.download_and_upload_image(name, url)
        
        print(f"\n📊 Upload Summary:")
        print(f"   ✅ Successful: {self.uploaded_count}")
        print(f"   ❌ Failed: {self.failed_count}")
    
    def run(self, use_local=False, local_path=None):
        """Ejecutar el proceso completo"""
        print("🚀 Starting S3 Image Upload Process...\n")
        
        # Setup S3
        if not self.setup_s3():
            return
        
        # Setup Database
        if not self.setup_database():
            return
        
        # Upload images
        if use_local and local_path:
            print(f"\n📁 Uploading local images from: {local_path}")
            self.upload_local_images(local_path)
        else:
            print("\n🌐 Using sample images from Unsplash")
            self.generate_dummy_images()
        
        # Update database
        if self.image_mapping:
            self.update_database_urls()
        
        # Save mapping for reference
        with open('image_mapping.json', 'w') as f:
            json.dump(self.image_mapping, f, indent=2)
        print(f"\n💾 Image mapping saved to image_mapping.json")
        
        print("\n✨ Process completed!")
        print(f"   Total uploaded: {self.uploaded_count}")
        print(f"   Total failed: {self.failed_count}")
        
        # Cleanup
        if self.db_connection:
            self.db_connection.close()


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Upload images to AWS S3')
    parser.add_argument('--local', action='store_true', help='Use local images')
    parser.add_argument('--path', type=str, default='./static/products', help='Path to local images')
    parser.add_argument('--aws-key', type=str, help='AWS Access Key ID')
    parser.add_argument('--aws-secret', type=str, help='AWS Secret Access Key')
    parser.add_argument('--bucket', type=str, help='S3 Bucket name')
    
    args = parser.parse_args()
    
    # Override environment variables if provided
    if args.aws_key:
        os.environ['AWS_ACCESS_KEY_ID'] = args.aws_key
    if args.aws_secret:
        os.environ['AWS_SECRET_ACCESS_KEY'] = args.aws_secret
    if args.bucket:
        os.environ['S3_BUCKET_NAME'] = args.bucket
    
    # Check for AWS credentials
    if not os.environ.get('AWS_ACCESS_KEY_ID'):
        print("⚠️  AWS credentials not configured!")
        print("\nOption 1: Set environment variables:")
        print("  export AWS_ACCESS_KEY_ID='your-key'")
        print("  export AWS_SECRET_ACCESS_KEY='your-secret'")
        print("  export S3_BUCKET_NAME='your-bucket-name'")
        print("\nOption 2: Pass as arguments:")
        print("  python upload_images_to_s3.py --aws-key YOUR_KEY --aws-secret YOUR_SECRET --bucket BUCKET_NAME")
        print("\n❓ Don't have AWS credentials? Visit: https://aws.amazon.com/console/")
        return
    
    uploader = S3ImageUploader()
    uploader.run(use_local=args.local, local_path=args.path)


if __name__ == "__main__":
    main()