#!/usr/bin/env python3
"""
Script para migrar imágenes locales a AWS S3
y actualizar las URLs en la base de datos
"""

import os
import mysql.connector
from aws_s3_storage import s3_storage
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de base de datos
DB_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'mysql-aiven-arenazl.e.aivencloud.com'),
    'port': int(os.environ.get('MYSQL_PORT', 23108)),
    'user': os.environ.get('MYSQL_USER', 'avnadmin'),
    'password': os.environ.get('MYSQL_PASSWORD', 'AVNS_Fqe0qsChCHnqSnVsvoi'),
    'database': os.environ.get('MYSQL_DATABASE', 'gastro')
}

def migrate_local_images():
    """Migrar imágenes locales a S3"""
    
    local_dir = os.path.join(os.path.dirname(__file__), 'static', 'products')
    
    if not os.path.exists(local_dir):
        logger.warning(f"Directorio {local_dir} no existe")
        return
    
    migrated = []
    
    for filename in os.listdir(local_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            filepath = os.path.join(local_dir, filename)
            
            try:
                with open(filepath, 'rb') as f:
                    image_data = f.read()
                
                # Subir a S3
                s3_url = s3_storage.upload_image(image_data, filename)
                
                if s3_url:
                    logger.info(f"✅ Migrada: {filename} -> {s3_url}")
                    migrated.append((filename, s3_url))
                else:
                    logger.error(f"❌ Error migrando: {filename}")
                    
            except Exception as e:
                logger.error(f"❌ Error leyendo {filename}: {e}")
    
    return migrated

def update_database_urls(migrated_images):
    """Actualizar URLs en la base de datos"""
    
    if not migrated_images:
        logger.info("No hay imágenes para actualizar en BD")
        return
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        for filename, s3_url in migrated_images:
            # Actualizar productos que usen esta imagen
            old_url_patterns = [
                f"/static/products/{filename}",
                f"static/products/{filename}",
                f"/api/images/{filename}",
                filename
            ]
            
            for pattern in old_url_patterns:
                cursor.execute("""
                    UPDATE products 
                    SET image_url = %s 
                    WHERE image_url = %s OR image_url LIKE %s
                """, (s3_url, pattern, f"%{pattern}"))
                
                affected = cursor.rowcount
                if affected > 0:
                    logger.info(f"📝 Actualizados {affected} productos con {filename}")
        
        conn.commit()
        logger.info("✅ Base de datos actualizada exitosamente")
        
    except mysql.connector.Error as e:
        logger.error(f"❌ Error actualizando BD: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def set_default_images():
    """Configurar imágenes por defecto para productos sin imagen"""
    
    default_images = {
        'Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        'Pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
        'Ensalada': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        'Carne': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
        'Sopa': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        'Postre': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
        'Bebida': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'
    }
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Actualizar productos sin imagen
        for category, image_url in default_images.items():
            cursor.execute("""
                UPDATE products 
                SET image_url = %s 
                WHERE (image_url IS NULL OR image_url = '' OR image_url = 'null')
                AND category LIKE %s
            """, (image_url, f"%{category}%"))
            
            affected = cursor.rowcount
            if affected > 0:
                logger.info(f"🖼️ {affected} productos de {category} con imagen por defecto")
        
        conn.commit()
        
    except mysql.connector.Error as e:
        logger.error(f"❌ Error configurando imágenes por defecto: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    logger.info("🚀 Iniciando migración de imágenes a AWS S3...")
    logger.info(f"📍 Bucket: {s3_storage.bucket_name}")
    logger.info(f"📁 Carpeta: {s3_storage.folder_prefix}")
    
    # 1. Migrar imágenes locales
    migrated = migrate_local_images()
    
    # 2. Actualizar URLs en BD
    if migrated:
        update_database_urls(migrated)
    
    # 3. Configurar imágenes por defecto
    set_default_images()
    
    logger.info("✅ Migración completada")