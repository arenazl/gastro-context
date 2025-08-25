#!/bin/bash

echo "🔄 Reiniciando la aplicación..."

# Matar procesos existentes
echo "⏹️ Deteniendo servicios..."
pkill -f "enhanced_server.py" 2>/dev/null
pkill -f "http-server" 2>/dev/null
lsof -ti:9000 | xargs kill -9 2>/dev/null
lsof -ti:8003 | xargs kill -9 2>/dev/null

# Limpiar cache de npm
echo "🗑️ Limpiando cache..."
cd /mnt/c/Code/gastro-context/frontend
rm -rf dist
rm -rf node_modules/.vite

# Construir frontend
echo "🔨 Construyendo frontend..."
npm run build

# Iniciar backend
echo "🚀 Iniciando backend..."
cd /mnt/c/Code/gastro-context/backend
python3 enhanced_server.py &

# Esperar un poco para que el backend arranque
sleep 2

# Iniciar frontend
echo "🌐 Iniciando frontend..."
cd /mnt/c/Code/gastro-context/frontend
npx http-server dist -p 9000 -a 0.0.0.0 &

echo "✅ Aplicación reiniciada!"
echo ""
echo "📱 Accede a la app en: http://172.29.228.80:9000/"
echo ""
echo "🔄 Para refrescar sin cache en el navegador:"
echo "   Windows/Linux: Ctrl + Shift + R"
echo "   Mac: Cmd + Shift + R"
echo ""
echo "⚡ O abre en ventana incógnito/privada para evitar cache"