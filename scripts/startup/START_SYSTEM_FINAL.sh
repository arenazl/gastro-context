#!/bin/bash

echo "🚀 INICIANDO SISTEMA GASTRONÓMICO"
echo "=================================="
echo ""

# Limpiar procesos anteriores
echo "🧹 Limpiando procesos anteriores..."
pkill -f simple_fastapi_server 2>/dev/null
pkill -f complete_server 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Iniciar Backend Python con MySQL real
echo "🔧 Iniciando Backend Python con MySQL real..."
cd /mnt/c/Code/gastro-context/backend
python3 complete_server.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
sleep 2

# Verificar Backend
echo "🔍 Verificando Backend..."
if curl -s http://localhost:9000/health > /dev/null; then
    echo "   ✅ Backend respondiendo en localhost:9000"
fi

# Iniciar Frontend
echo "🎨 Iniciando Frontend React..."
cd /mnt/c/Code/gastro-context/frontend
npm run dev -- --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"
sleep 3

echo ""
echo "=================================="
echo "✅ SISTEMA INICIADO CORRECTAMENTE"
echo "=================================="
echo ""
echo "📍 ACCESO DESDE WINDOWS:"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:9000"
echo ""
echo "📍 SI localhost NO FUNCIONA, usa:"
echo ""
echo "   Frontend: http://172.29.228.80:5173"
echo "   Backend:  http://172.29.228.80:9000"
echo ""
echo "🔑 CREDENCIALES:"
echo "   Email: admin@restaurant.com"
echo "   Password: admin"
echo ""
echo "📝 NOTAS:"
echo "   - Backend: complete_server.py con MySQL Aiven real"
echo "   - Frontend: React + Vite"
echo "   - Datos: REALES desde MySQL con conexión HTTPS"
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
pkill -f simple_fastapi_server 2>/dev/null
pkill -f complete_server 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
echo "Sistema detenido"
EOF
chmod +x /mnt/c/Code/gastro-context/STOP_SYSTEM.sh

echo "💡 Creado script STOP_SYSTEM.sh para detener todo"