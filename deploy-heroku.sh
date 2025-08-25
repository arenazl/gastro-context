#!/bin/bash

# Script de deployment para Heroku
# Ejecutar desde la raíz del proyecto

echo "🚀 Iniciando deployment a Heroku..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI no está instalado${NC}"
    echo "Instálalo desde: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Configuración
BACKEND_APP_NAME="gastro-backend-prod"
FRONTEND_APP_NAME="gastro-frontend-prod"

echo -e "${YELLOW}📦 Preparando Backend...${NC}"

# Backend deployment
cd backend

# Crear app de Heroku si no existe
if ! heroku apps:info --app $BACKEND_APP_NAME &> /dev/null; then
    echo "Creando app backend en Heroku..."
    heroku create $BACKEND_APP_NAME
fi

# Configurar buildpack de Python
heroku buildpacks:set heroku/python --app $BACKEND_APP_NAME

# Configurar variables de entorno
echo -e "${YELLOW}🔧 Configurando variables de entorno del backend...${NC}"
heroku config:set \
    MYSQL_HOST="your-mysql-host" \
    MYSQL_USER="your-mysql-user" \
    MYSQL_PASSWORD="your-mysql-password" \
    MYSQL_DATABASE="your-mysql-database" \
    MYSQL_PORT="3306" \
    CORS_ORIGINS="https://$FRONTEND_APP_NAME.herokuapp.com" \
    --app $BACKEND_APP_NAME

# Crear git subtree para backend
cd ..
git subtree push --prefix backend heroku-backend main

echo -e "${GREEN}✅ Backend desplegado${NC}"

echo -e "${YELLOW}📦 Preparando Frontend...${NC}"

# Frontend deployment
cd frontend

# Build del frontend
echo "Construyendo frontend..."
npm install
npm run build

# Crear app de Heroku si no existe
if ! heroku apps:info --app $FRONTEND_APP_NAME &> /dev/null; then
    echo "Creando app frontend en Heroku..."
    heroku create $FRONTEND_APP_NAME
fi

# Configurar buildpack estático
heroku buildpacks:set heroku/nodejs --app $FRONTEND_APP_NAME
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git --app $FRONTEND_APP_NAME

# Configurar variable de entorno con URL del backend
heroku config:set \
    BACKEND_URL="https://$BACKEND_APP_NAME.herokuapp.com" \
    --app $FRONTEND_APP_NAME

# Crear git subtree para frontend
cd ..
git subtree push --prefix frontend heroku-frontend main

echo -e "${GREEN}✅ Frontend desplegado${NC}"

echo -e "${GREEN}🎉 Deployment completado!${NC}"
echo ""
echo "URLs de tu aplicación:"
echo -e "Backend:  ${GREEN}https://$BACKEND_APP_NAME.herokuapp.com${NC}"
echo -e "Frontend: ${GREEN}https://$FRONTEND_APP_NAME.herokuapp.com${NC}"
echo ""
echo "Para ver logs:"
echo "Backend:  heroku logs --tail --app $BACKEND_APP_NAME"
echo "Frontend: heroku logs --tail --app $FRONTEND_APP_NAME"