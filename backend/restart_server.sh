#!/bin/bash

echo "🔄 Reiniciando servidor backend..."

# Matar cualquier proceso Python que esté usando el puerto 9002
echo "⚡ Matando procesos anteriores..."
pkill -f "python3.*complete_server" 2>/dev/null || true
sleep 1

# Verificar si el puerto está libre
if lsof -Pi :9002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Puerto 9002 aún ocupado, forzando cierre..."
    lsof -ti:9002 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Iniciar el servidor
echo "🚀 Iniciando servidor en puerto 9002..."
python3 complete_server.py &

echo "✅ Servidor reiniciado exitosamente"
echo "📍 URL: http://172.29.228.80:9002"