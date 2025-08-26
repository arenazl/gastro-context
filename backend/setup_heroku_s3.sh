#!/bin/bash

echo "🚀 Configurando variables de entorno S3 en Heroku..."
echo "================================================"

# Configuración de AWS S3
heroku config:set AWS_ACCESS_KEY_ID=AKIATI3QXLJ4VE3LBKFN
heroku config:set AWS_SECRET_ACCESS_KEY=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
heroku config:set AWS_REGION=sa-east-1
heroku config:set S3_BUCKET_NAME=sisbarrios
heroku config:set S3_BASE_URL=https://sisbarrios.s3.sa-east-1.amazonaws.com

# Configuración de almacenamiento de imágenes
heroku config:set IMAGE_STORAGE_TYPE=s3
heroku config:set IMAGE_BASE_PATH=gastro/products/

echo ""
echo "✅ Variables configuradas!"
echo ""
echo "📋 Para verificar la configuración, ejecuta:"
echo "   heroku config"
echo ""
echo "🔄 Para reiniciar la aplicación:"
echo "   heroku restart"
echo ""
echo "📝 Ejemplo de URLs de imágenes en S3:"
echo "   https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/hamburguesa-clasica.jpg"
echo "   https://sisbarrios.s3.sa-east-1.amazonaws.com/gastro/products/pizza-margherita.jpg"
echo ""
echo "💡 Tip: Si cambias de proveedor en el futuro, solo actualiza:"
echo "   - IMAGE_STORAGE_TYPE (ej: 'cloudinary', 'firebase')"
echo "   - S3_BASE_URL (con la nueva URL base)"