"""
Configuración para almacenamiento de imágenes en AWS S3
"""

import os
import boto3
from botocore.exceptions import ClientError
import logging
from typing import Optional
import mimetypes

logger = logging.getLogger(__name__)

class S3ImageStorage:
    def __init__(self):
        # Configuración de AWS desde variables de entorno
        self.aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID', 'AKIATI3QXLJ4VE3LBKFN')
        self.aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY', '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')
        self.bucket_name = os.environ.get('AWS_BUCKET_NAME', 'sisbarrios')
        self.region = os.environ.get('AWS_REGION', 'sa-east-1')
        
        # Carpeta específica para el proyecto gastronómico
        self.folder_prefix = 'sisbarrios/gastro/'
        
        # Inicializar cliente S3
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.region
        )
        
        # URL base para acceder a las imágenes
        self.base_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com"
        
    def upload_image(self, image_data: bytes, filename: str, content_type: str = None) -> Optional[str]:
        """
        Subir imagen a S3 y retornar URL pública
        """
        try:
            # Determinar content type
            if not content_type:
                content_type, _ = mimetypes.guess_type(filename)
                if not content_type:
                    content_type = 'image/jpeg'
            
            # Crear key completo con carpeta
            s3_key = f"{self.folder_prefix}{filename}"
            
            # Subir a S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=image_data,
                ContentType=content_type,
                ACL='public-read',  # Hacer la imagen pública
                CacheControl='max-age=31536000'  # Cache de 1 año
            )
            
            # Retornar URL pública
            url = f"{self.base_url}/{s3_key}"
            logger.info(f"Imagen subida exitosamente a S3: {url}")
            return url
            
        except ClientError as e:
            logger.error(f"Error subiendo imagen a S3: {e}")
            return None
    
    def delete_image(self, filename: str) -> bool:
        """
        Eliminar imagen de S3
        """
        try:
            s3_key = f"{self.folder_prefix}{filename}"
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Imagen eliminada de S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Error eliminando imagen de S3: {e}")
            return False
    
    def list_images(self) -> list:
        """
        Listar todas las imágenes en la carpeta
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=self.folder_prefix
            )
            
            if 'Contents' not in response:
                return []
            
            images = []
            for obj in response['Contents']:
                if obj['Key'] != self.folder_prefix:  # Ignorar la carpeta misma
                    images.append({
                        'filename': obj['Key'].replace(self.folder_prefix, ''),
                        'url': f"{self.base_url}/{obj['Key']}",
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat()
                    })
            
            return images
            
        except ClientError as e:
            logger.error(f"Error listando imágenes de S3: {e}")
            return []
    
    def get_image_url(self, filename: str) -> str:
        """
        Obtener URL pública de una imagen
        """
        s3_key = f"{self.folder_prefix}{filename}"
        return f"{self.base_url}/{s3_key}"
    
    def generate_presigned_url(self, filename: str, expiration: int = 3600) -> Optional[str]:
        """
        Generar URL temporal con firma (para imágenes privadas)
        """
        try:
            s3_key = f"{self.folder_prefix}{filename}"
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Error generando URL firmada: {e}")
            return None

# Instancia global
s3_storage = S3ImageStorage()

# URLs de imágenes por defecto (ahora en S3)
DEFAULT_PRODUCT_IMAGES = {
    "pizza": f"{s3_storage.base_url}/{s3_storage.folder_prefix}pizza-default.jpg",
    "burger": f"{s3_storage.base_url}/{s3_storage.folder_prefix}burger-default.jpg",
    "pasta": f"{s3_storage.base_url}/{s3_storage.folder_prefix}pasta-default.jpg",
    "salad": f"{s3_storage.base_url}/{s3_storage.folder_prefix}salad-default.jpg",
    "steak": f"{s3_storage.base_url}/{s3_storage.folder_prefix}steak-default.jpg",
    "soup": f"{s3_storage.base_url}/{s3_storage.folder_prefix}soup-default.jpg",
    "dessert": f"{s3_storage.base_url}/{s3_storage.folder_prefix}dessert-default.jpg",
    "drink": f"{s3_storage.base_url}/{s3_storage.folder_prefix}drink-default.jpg",
    "coffee": f"{s3_storage.base_url}/{s3_storage.folder_prefix}coffee-default.jpg",
    "wine": f"{s3_storage.base_url}/{s3_storage.folder_prefix}wine-default.jpg"
}