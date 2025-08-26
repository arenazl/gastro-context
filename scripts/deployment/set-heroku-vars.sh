#!/bin/bash

# Script para configurar todas las variables en Heroku
# Uso: ./set-heroku-vars.sh TU-APP-NAME

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
    echo "❌ Error: Debes proporcionar el nombre de tu app"
    echo "Uso: ./set-heroku-vars.sh TU-APP-NAME"
    exit 1
fi

echo "🔧 Configurando variables para: $APP_NAME"

# Base de datos MySQL (Aiven)
heroku config:set \
    MYSQL_HOST=mysql-aiven-arenazl.e.aivencloud.com \
    MYSQL_PORT=23108 \
    MYSQL_USER=avnadmin \
    MYSQL_PASSWORD=AVNS_Fqe0qsChCHnqSnVsvoi \
    MYSQL_DATABASE=gastro \
    --app $APP_NAME

# AWS S3 para imágenes
heroku config:set \
    AWS_ACCESS_KEY_ID=AKIATI3QXLJ4VE3LBKFN \
    AWS_SECRET_ACCESS_KEY=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 \
    AWS_BUCKET_NAME=sisbarrios \
    AWS_REGION=sa-east-1 \
    --app $APP_NAME

# Configuración de la aplicación
heroku config:set \
    JWT_SECRET_KEY=super-secret-key-$(date +%s)-change-this \
    CORS_ORIGINS="*" \
    --app $APP_NAME

echo "✅ Variables configuradas!"
echo ""
echo "Verificar con:"
echo "heroku config --app $APP_NAME"