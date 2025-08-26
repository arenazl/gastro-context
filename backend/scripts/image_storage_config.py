"""
Configuración para almacenamiento de imágenes en servicios externos
Compatible con Cloudinary (gratis hasta 25GB)
"""

import os
import base64
import requests
from typing import Optional

class ImageStorage:
    def __init__(self):
        # Opción 1: Cloudinary (Recomendado - Gratis)
        self.use_cloudinary = os.environ.get('CLOUDINARY_URL') is not None
        
        # Opción 2: Imgur (Gratis pero con límites)
        self.use_imgur = os.environ.get('IMGUR_CLIENT_ID') is not None
        
        # Opción 3: URLs externas (usar las que ya tienes)
        self.use_external = True  # Por defecto
        
        if self.use_cloudinary:
            self._setup_cloudinary()
        elif self.use_imgur:
            self._setup_imgur()
    
    def _setup_cloudinary(self):
        """Configurar Cloudinary desde URL"""
        # CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
        url = os.environ.get('CLOUDINARY_URL')
        if url:
            # Parsear URL de Cloudinary
            import re
            match = re.match(r'cloudinary://(.+):(.+)@(.+)', url)
            if match:
                self.cloudinary_api_key = match.group(1)
                self.cloudinary_api_secret = match.group(2)
                self.cloudinary_cloud_name = match.group(3)
    
    def _setup_imgur(self):
        """Configurar Imgur"""
        self.imgur_client_id = os.environ.get('IMGUR_CLIENT_ID')
    
    def upload_image(self, image_data: bytes, filename: str) -> Optional[str]:
        """
        Subir imagen y retornar URL
        """
        if self.use_cloudinary:
            return self._upload_to_cloudinary(image_data, filename)
        elif self.use_imgur:
            return self._upload_to_imgur(image_data)
        else:
            # Por defecto: guardar localmente (temporal en Heroku)
            return self._save_locally(image_data, filename)
    
    def _upload_to_cloudinary(self, image_data: bytes, filename: str) -> str:
        """Subir a Cloudinary"""
        import cloudinary
        import cloudinary.uploader
        
        cloudinary.config(
            cloud_name=self.cloudinary_cloud_name,
            api_key=self.cloudinary_api_key,
            api_secret=self.cloudinary_api_secret
        )
        
        # Convertir bytes a base64
        b64_data = base64.b64encode(image_data).decode('utf-8')
        data_uri = f"data:image/jpeg;base64,{b64_data}"
        
        # Subir a Cloudinary
        result = cloudinary.uploader.upload(
            data_uri,
            public_id=filename.replace('.jpg', ''),
            folder='products'
        )
        
        return result['secure_url']
    
    def _upload_to_imgur(self, image_data: bytes) -> str:
        """Subir a Imgur"""
        headers = {
            'Authorization': f'Client-ID {self.imgur_client_id}'
        }
        
        # Convertir a base64
        b64_data = base64.b64encode(image_data).decode('utf-8')
        
        response = requests.post(
            'https://api.imgur.com/3/image',
            headers=headers,
            data={'image': b64_data}
        )
        
        if response.status_code == 200:
            return response.json()['data']['link']
        return None
    
    def _save_locally(self, image_data: bytes, filename: str) -> str:
        """Guardar localmente (temporal en Heroku)"""
        static_dir = os.path.join(os.path.dirname(__file__), 'static', 'products')
        os.makedirs(static_dir, exist_ok=True)
        
        filepath = os.path.join(static_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        return f"/static/products/{filename}"
    
    def get_default_images(self):
        """
        URLs de imágenes por defecto alojadas externamente
        Estas funcionan siempre, sin importar el filesystem
        """
        return {
            "pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
            "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
            "pasta": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
            "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
            "steak": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
            "soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
            "dessert": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400",
            "drink": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
            "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
            "wine": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400"
        }

# Instancia global
image_storage = ImageStorage()