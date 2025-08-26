#!/bin/bash

echo "🚀 Iniciando Sistema Gastronómico en WSL"
echo "========================================="

# Obtener IP de WSL
WSL_IP=$(hostname -I | awk '{print $1}')
echo "📍 IP de WSL detectada: $WSL_IP"

# Detener servicios anteriores
echo "⏹️  Deteniendo servicios anteriores..."
pkill -f simple_fastapi_server 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Iniciar backend
echo "🔧 Iniciando Backend en $WSL_IP:9000..."
cd /mnt/c/Code/gastro-context/backend
python3 simple_fastapi_server.py &
BACKEND_PID=$!
sleep 2

# Verificar backend
if curl -s http://$WSL_IP:9000/health > /dev/null; then
    echo "✅ Backend funcionando en http://$WSL_IP:9000"
else
    echo "❌ Backend no responde"
fi

# Actualizar configuración del frontend
echo "🔧 Configurando Frontend para usar $WSL_IP..."
echo "VITE_API_URL=http://$WSL_IP:9000" > /mnt/c/Code/gastro-context/frontend/.env.local

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
cd /mnt/c/Code/gastro-context/frontend
VITE_API_URL=http://$WSL_IP:9000 npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
sleep 3

echo ""
echo "========================================="
echo "✅ SISTEMA INICIADO EN WSL"
echo "========================================="
echo ""
echo "📍 URLs para acceder desde Windows:"
echo ""
echo "   Frontend: http://$WSL_IP:5173"
echo "   Backend:  http://$WSL_IP:9000"
echo ""
echo "📍 O también puedes usar:"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:9000"
echo ""
echo "🔑 Credenciales de login:"
echo "   Email: admin@restaurant.com"
echo "   Password: admin"
echo ""
echo "⚠️  IMPORTANTE para Windows + WSL:"
echo "   Si localhost no funciona, usa $WSL_IP"
echo "========================================="