#!/bin/bash

# Script simplificado de deployment para Heroku
# cuando ya tienes una app y base de datos configurada

echo "🚀 Deployment a Heroku - Sistema Gastronómico"
echo "============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar Heroku CLI
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI no está instalado${NC}"
    echo "Instálalo desde: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Solicitar nombre de la app
echo -e "${YELLOW}📝 Ingresa el nombre de tu app en Heroku:${NC}"
read -p "App name: " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}❌ Nombre de app requerido${NC}"
    exit 1
fi

# Verificar si la app existe
if ! heroku apps:info --app $APP_NAME &> /dev/null; then
    echo -e "${RED}❌ La app $APP_NAME no existe en Heroku${NC}"
    echo -e "${YELLOW}Crear primero con: heroku create $APP_NAME${NC}"
    exit 1
fi

echo -e "${GREEN}✅ App encontrada: $APP_NAME${NC}"

# Obtener URL de la base de datos
echo -e "${YELLOW}🔍 Obteniendo configuración de base de datos...${NC}"
DB_URL=$(heroku config:get DATABASE_URL --app $APP_NAME 2>/dev/null)
CLEARDB_URL=$(heroku config:get CLEARDB_DATABASE_URL --app $APP_NAME 2>/dev/null)
JAWSDB_URL=$(heroku config:get JAWSDB_URL --app $APP_NAME 2>/dev/null)

# Determinar qué base de datos está disponible
if [ ! -z "$CLEARDB_URL" ]; then
    echo -e "${GREEN}✅ ClearDB MySQL detectado${NC}"
    DB_URL=$CLEARDB_URL
    DB_TYPE="mysql"
elif [ ! -z "$JAWSDB_URL" ]; then
    echo -e "${GREEN}✅ JawsDB MySQL detectado${NC}"
    DB_URL=$JAWSDB_URL
    DB_TYPE="mysql"
elif [ ! -z "$DB_URL" ]; then
    if [[ $DB_URL == postgres* ]]; then
        echo -e "${YELLOW}⚠️  PostgreSQL detectado - Necesitarás modificar el código${NC}"
        DB_TYPE="postgres"
    else
        echo -e "${GREEN}✅ Base de datos detectada${NC}"
        DB_TYPE="mysql"
    fi
else
    echo -e "${YELLOW}⚠️  No se detectó base de datos en Heroku${NC}"
    echo -e "${BLUE}Usando configuración de Aiven MySQL del .env${NC}"
    DB_TYPE="aiven"
fi

# Parsear URL de la base de datos si existe
if [ ! -z "$DB_URL" ] && [ "$DB_TYPE" == "mysql" ]; then
    # Extraer componentes de la URL MySQL
    # Formato: mysql://usuario:password@host:puerto/database
    
    # Remover mysql://
    DB_STRIPPED=${DB_URL#mysql://}
    
    # Extraer usuario y password
    USER_PASS=${DB_STRIPPED%%@*}
    DB_USER=${USER_PASS%%:*}
    DB_PASS=${USER_PASS#*:}
    
    # Extraer host y puerto
    HOST_PORT_DB=${DB_STRIPPED#*@}
    HOST_PORT=${HOST_PORT_DB%%/*}
    
    if [[ $HOST_PORT == *:* ]]; then
        DB_HOST=${HOST_PORT%%:*}
        DB_PORT=${HOST_PORT#*:}
    else
        DB_HOST=$HOST_PORT
        DB_PORT=3306
    fi
    
    # Extraer nombre de la base de datos
    DB_NAME=${HOST_PORT_DB#*/}
    DB_NAME=${DB_NAME%%\?*}  # Remover query params si existen
    
    echo -e "${GREEN}📊 Configuración de BD parseada:${NC}"
    echo "  Host: $DB_HOST"
    echo "  Puerto: $DB_PORT"
    echo "  Base de datos: $DB_NAME"
    echo "  Usuario: $DB_USER"
fi

# Configurar variables de entorno en Heroku
echo -e "${YELLOW}🔧 Configurando variables de entorno...${NC}"

if [ "$DB_TYPE" == "aiven" ]; then
    # Usar configuración de Aiven del archivo .env.heroku
    heroku config:set \
        MYSQL_HOST=mysql-aiven-arenazl.e.aivencloud.com \
        MYSQL_PORT=23108 \
        MYSQL_USER=avnadmin \
        MYSQL_PASSWORD=AVNS_Fqe0qsChCHnqSnVsvoi \
        MYSQL_DATABASE=gastro \
        DB_TYPE=mysql \
        CORS_ORIGINS="*" \
        JWT_SECRET_KEY="your-super-secret-jwt-key-$(date +%s)" \
        --app $APP_NAME
elif [ ! -z "$DB_URL" ]; then
    heroku config:set \
        MYSQL_HOST=$DB_HOST \
        MYSQL_PORT=$DB_PORT \
        MYSQL_USER=$DB_USER \
        MYSQL_PASSWORD=$DB_PASS \
        MYSQL_DATABASE=$DB_NAME \
        DB_TYPE=$DB_TYPE \
        CORS_ORIGINS="*" \
        JWT_SECRET_KEY="your-super-secret-jwt-key-$(date +%s)" \
        --app $APP_NAME
fi

# Preparar el código para deployment
echo -e "${YELLOW}📦 Preparando código para deployment...${NC}"

# Verificar si estamos en un repo git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}Inicializando repositorio git...${NC}"
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
fi

# Agregar remote de Heroku si no existe
if ! git remote | grep heroku > /dev/null 2>&1; then
    echo -e "${YELLOW}Agregando remote de Heroku...${NC}"
    heroku git:remote -a $APP_NAME
fi

# Configurar buildpack
echo -e "${YELLOW}🔧 Configurando buildpacks...${NC}"
heroku buildpacks:clear --app $APP_NAME
heroku buildpacks:add heroku/python --app $APP_NAME
heroku buildpacks:add heroku/nodejs --app $APP_NAME

# Crear archivo de configuración para build
cat > build.sh << 'EOF'
#!/bin/bash
# Build script para Heroku

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build

# Copiar build del frontend al backend para servir estático
cp -r dist ../backend/static
EOF

chmod +x build.sh

# Push a Heroku
echo -e "${YELLOW}🚀 Desplegando a Heroku...${NC}"
echo -e "${BLUE}Esto puede tomar varios minutos...${NC}"

git add .
git commit -m "Configure for Heroku deployment" --allow-empty
git push heroku main --force

# Verificar estado
echo -e "${YELLOW}🔍 Verificando deployment...${NC}"
heroku ps --app $APP_NAME

# Mostrar logs
echo -e "${YELLOW}📜 Últimos logs:${NC}"
heroku logs --tail -n 50 --app $APP_NAME

echo ""
echo -e "${GREEN}🎉 ¡Deployment completado!${NC}"
echo ""
echo -e "${BLUE}URLs y comandos útiles:${NC}"
echo -e "  App: ${GREEN}https://$APP_NAME.herokuapp.com${NC}"
echo -e "  Logs: ${YELLOW}heroku logs --tail --app $APP_NAME${NC}"
echo -e "  Bash: ${YELLOW}heroku run bash --app $APP_NAME${NC}"
echo -e "  Config: ${YELLOW}heroku config --app $APP_NAME${NC}"
echo ""

# Abrir la app en el navegador
echo -e "${YELLOW}¿Abrir la app en el navegador? (s/n)${NC}"
read -p "> " OPEN_APP
if [ "$OPEN_APP" == "s" ] || [ "$OPEN_APP" == "S" ]; then
    heroku open --app $APP_NAME
fi