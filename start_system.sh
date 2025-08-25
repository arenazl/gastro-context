#!/bin/bash

echo "🚀 Iniciando Sistema Gastronómico"
echo "================================="

# Detener procesos anteriores
echo "⏹️  Deteniendo servicios anteriores..."
pkill -f "simple_fastapi_server.py" 2>/dev/null
pkill -f "fast_mysql_server.js" 2>/dev/null
pkill -f "real_server.py" 2>/dev/null

# Iniciar backend
echo "🔧 Iniciando Backend API..."
cd /mnt/c/Code/gastro-context/backend
python3 simple_fastapi_server.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Esperar a que el backend esté listo
sleep 2
if curl -s http://localhost:9000/health > /dev/null; then
    echo "✅ Backend respondiendo correctamente"
else
    echo "⚠️  Backend no responde, pero continuando..."
fi

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
cd /mnt/c/Code/gastro-context/frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"

# Crear script para detener
cat > /mnt/c/Code/gastro-context/stop_system.sh << EOF
#!/bin/bash
echo "Deteniendo servicios..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
pkill -f "simple_fastapi_server.py" 2>/dev/null
echo "✅ Servicios detenidos"
EOF
chmod +x /mnt/c/Code/gastro-context/stop_system.sh

echo ""
echo "================================="
echo "✅ Sistema Iniciado Correctamente"
echo "================================="
echo ""
echo "📍 URLs del Sistema:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:9000"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo ""
echo "⏹️  Para detener: ./stop_system.sh"
echo ""