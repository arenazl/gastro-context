#!/bin/bash

echo "🔄 Reiniciando servicios..."

# Matar procesos existentes
echo "⏹️  Deteniendo servicios actuales..."
pkill -f "python.*complete_server" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null
fuser -k 9002/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null
sleep 3  # Más tiempo para liberar puertos

# Iniciar backend
echo "🚀 Iniciando backend en puerto 9002..."
cd /mnt/c/Code/gastro-context/backend
python3 complete_server.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Esperar a que el backend esté listo
sleep 3

# Iniciar frontend con retry
echo "🎨 Iniciando frontend en puerto 5173..."
cd /mnt/c/Code/gastro-context/frontend
npm run dev -- --host 0.0.0.0 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Esperar más tiempo para el binding de red
sleep 5

echo "✅ Servicios reiniciados:"
echo "   - Backend:  http://172.29.228.80:9002"
echo "   - Frontend: http://172.29.228.80:5173"
echo ""
echo "⚠️  IMPORTANTE: Nunca uses localhost desde Windows"
echo "   Siempre usa la IP: 172.29.228.80"
echo ""
echo "PIDs:"
echo "   - Backend PID:  $BACKEND_PID"
echo "   - Frontend PID: $FRONTEND_PID"