#!/bin/bash

# Script específico para iniciar el backend con MySQL real
# USAR ESTE SCRIPT PARA EL BACKEND

echo "🚀 Iniciando Backend con MySQL Real"
echo "===================================="
echo ""

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -f simple_fastapi_server 2>/dev/null
pkill -f complete_server 2>/dev/null
sleep 1

# Iniciar Backend con MySQL
echo "🔧 Iniciando complete_server.py..."
cd /mnt/c/Code/gastro-context/backend
python3 complete_server.py &
BACKEND_PID=$!

echo ""
echo "✅ Backend iniciado con PID: $BACKEND_PID"
echo ""
echo "📍 URL: http://localhost:9000"
echo "📊 Health Check: http://localhost:9000/health"
echo ""
echo "⚠️ IMPORTANTE:"
echo "   - Este servidor usa conexión HTTPS directa a MySQL Aiven"
echo "   - No requiere librerías Python externas"
echo "   - Los datos son REALES desde la base de datos"
echo ""
echo "🛑 Para detener: kill $BACKEND_PID"
echo ""
echo "===================================="