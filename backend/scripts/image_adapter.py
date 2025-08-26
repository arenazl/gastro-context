"""
Adaptador de imágenes para manejar URLs locales y futuro S3
"""
import os
from typing import Optional

class ImageAdapter:
    """
    Adaptador para construir URLs de imágenes según el entorno
    Preparado para migración futura a AWS S3
    """
    
    def __init__(self, storage_type: str = 'local', base_url: Optional[str] = None):
        """
        storage_type: 'local' o 's3'
        base_url: URL base para las imágenes
        """
        self.storage_type = storage_type
        
        if storage_type == 'local':
            # Para desarrollo local
            self.base_url = base_url or 'http://172.29.228.80:9001/static/products'
        elif storage_type == 's3':
            # Para producción con S3
            self.base_url = base_url or 'https://your-bucket.s3.amazonaws.com/products'
        else:
            raise ValueError(f"Tipo de storage no soportado: {storage_type}")
    
    def get_product_image_url(self, filename: Optional[str]) -> Optional[str]:
        """
        Construye la URL completa de una imagen de producto
        
        Args:
            filename: Nombre del archivo (ej: 'caesar-salad.jpg')
        
        Returns:
            URL completa o None si no hay imagen
        """
        if not filename:
            return None
        
        # Si es una URL completa (migración), devolverla tal cual temporalmente
        if filename.startswith('http'):
            return filename
        
        # Construir URL según el tipo de storage
        return f"{self.base_url}/{filename}"
    
    def get_filename_from_url(self, url: str) -> str:
        """
        Extrae el nombre del archivo de una URL
        Útil para migración de URLs existentes
        """
        if not url:
            return None
        
        # Si ya es solo un nombre de archivo, devolverlo
        if not url.startswith('http'):
            return url
        
        # Extraer nombre del archivo de la URL
        return url.split('/')[-1].split('?')[0]

# Instancia global configurada desde variables de entorno
import os
STORAGE_TYPE = os.getenv('IMAGE_STORAGE_TYPE', 'local')
BASE_URL = os.getenv('IMAGE_BASE_URL', None)

image_adapter = ImageAdapter(STORAGE_TYPE, BASE_URL)