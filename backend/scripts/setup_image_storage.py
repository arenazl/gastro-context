#!/usr/bin/env python3
"""
Setup para almacenamiento de imágenes del sistema gastronómico
"""
import os

def setup_image_directories():
    """Crear directorios para almacenar imágenes de productos"""
    
    # Crear estructura de directorios para imágenes
    base_dir = "/mnt/c/Code/gastro-context"
    
    directories = [
        f"{base_dir}/uploads",
        f"{base_dir}/uploads/products",
        f"{base_dir}/uploads/products/thumbnails", 
        f"{base_dir}/uploads/categories",
        f"{base_dir}/uploads/temp"
    ]
    
    print("🖼️ Configurando almacenamiento de imágenes...")
    print("=" * 50)
    
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Creado: {directory}")
        except Exception as e:
            print(f"❌ Error creando {directory}: {e}")
    
    # Crear archivo .gitignore para uploads
    gitignore_content = """# Archivos subidos por usuarios
*.jpg
*.jpeg  
*.png
*.gif
*.webp
*.svg

# Excepto imágenes de ejemplo
!example*
!sample*
!demo*
"""
    
    try:
        with open(f"{base_dir}/uploads/.gitignore", "w") as f:
            f.write(gitignore_content)
        print(f"✅ Creado: .gitignore para uploads")
    except Exception as e:
        print(f"❌ Error creando .gitignore: {e}")
    
    print("\n🎯 Estrategia de almacenamiento:")
    print("📁 Local (desarrollo): /uploads/products/")  
    print("☁️  Producción: Se puede migrar a AWS S3, Cloudinary, etc.")
    print("🔗 URLs: http://localhost:8002/uploads/products/imagen.jpg")
    
    print("\n📋 Formatos soportados:")
    print("✅ JPG/JPEG - Fotos de productos")
    print("✅ PNG - Con transparencia") 
    print("✅ WebP - Optimizado para web")
    print("📏 Tamaños: Original + Thumbnail (300x300)")

if __name__ == "__main__":
    setup_image_directories()