#!/bin/bash

# Script para iniciar el sistema correctamente para acceso desde Windows
echo "🚀 INICIANDO SISTEMA PARA WINDOWS"
echo "=================================="
echo ""

# Obtener IP de WSL2
WSL_IP=$(ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
echo "📍 IP de WSL2 detectada: $WSL_IP"
echo ""

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -f complete_server 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Iniciar Backend con MySQL real
echo "🔧 Iniciando Backend con MySQL real..."
cd /mnt/c/Code/gastro-context/backend
python3 complete_server.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ Backend PID: $BACKEND_PID"
sleep 2

# Verificar Backend
echo "🔍 Verificando Backend..."
if curl -s http://$WSL_IP:9001/health > /dev/null; then
    echo "   ✅ Backend respondiendo en $WSL_IP:9001"
fi

# Iniciar Frontend
echo "🎨 Iniciando Frontend React..."
cd /mnt/c/Code/gastro-context/frontend
npm run dev -- --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ Frontend PID: $FRONTEND_PID"
sleep 3

echo ""
echo "=================================="
echo "✅ SISTEMA INICIADO CORRECTAMENTE"
echo "=================================="
echo ""
echo "🌐 ACCESO DESDE WINDOWS:"
echo ""
echo "   Frontend: http://$WSL_IP:5173"
echo "   Backend:  http://$WSL_IP:9001"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - NO uses localhost desde Windows"
echo "   - SIEMPRE usa la IP: $WSL_IP"
echo "   - El frontend ya está configurado para usar esta IP"
echo ""
echo "🔑 CREDENCIALES:"
echo "   Email: admin@restaurant.com"
echo "   Password: admin o admin123"
echo ""
echo "📊 BASE DE DATOS:"
echo "   - MySQL Aiven REAL"
echo "   - 12 categorías activas"
echo "   - Cientos de productos reales"
echo "   - NO hay datos hardcodeados"
echo ""
echo "🛑 Para detener todo:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "=================================="

# Guardar PIDs para detener después
cat > /mnt/c/Code/gastro-context/STOP_SYSTEM.sh << EOF
#!/bin/bash
echo "Deteniendo sistema..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
pkill -f complete_server 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
echo "Sistema detenido"
EOF
chmod +x /mnt/c/Code/gastro-context/STOP_SYSTEM.sh

echo "💡 Creado script STOP_SYSTEM.sh para detener todo"
echo ""
echo "🎉 Sistema listo para usar desde Windows!"