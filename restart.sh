#!/bin/bash

echo "========================================"
echo "   REINICIANDO SISTEMA GASTRONOMICO"
echo "========================================"
echo ""

# PASO 1: Matar todos los procesos
echo "[1/5] Deteniendo procesos anteriores..."
pkill -9 -f simple_fastapi_server 2>/dev/null
pkill -9 -f "npm run dev" 2>/dev/null
pkill -9 -f node 2>/dev/null
pkill -9 -f vite 2>/dev/null
lsof -ti:9000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "[2/5] Esperando 3 segundos..."
sleep 3

# PASO 2: Crear logs si no existe
mkdir -p /mnt/c/Code/gastro-context/logs

# PASO 3: Iniciar Backend
echo "[3/5] Iniciando Backend Python..."
cd /mnt/c/Code/gastro-context/backend
python3 simple_fastapi_server.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

# Esperar y verificar backend
sleep 3
if curl -s http://localhost:9000/health | grep -q "operational"; then
    echo "      ✓ Backend funcionando!"
else
    echo "      ✗ Backend no responde, reintentando..."
    python3 simple_fastapi_server.py &
    BACKEND_PID=$!
    sleep 2
fi

# PASO 4: Iniciar Frontend
echo "[4/5] Iniciando Frontend React..."
cd /mnt/c/Code/gastro-context/frontend
npm run dev -- --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "      Frontend PID: $FRONTEND_PID"

# Esperar a que compile
echo "[5/5] Esperando que compile (10 segundos)..."
sleep 10

# Verificar Frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
    echo "      ✓ Frontend funcionando!"
else
    echo "      ⚠ Frontend puede estar compilando aún"
fi

echo ""
echo "========================================"
echo "   SISTEMA REINICIADO"
echo "========================================"
echo ""
echo "PIDs de los procesos:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "URLs de Acceso:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:9000"
echo ""
echo "O desde Windows:"
echo "   Frontend: http://172.29.228.80:5173"
echo "   Backend:  http://172.29.228.80:9000"
echo ""
echo "Credenciales:"
echo "   Email: admin@restaurant.com"
echo "   Password: admin"
echo ""
echo "Ver logs:"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo ""
echo "Para detener todo:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "========================================"

# Guardar PIDs para poder detener después
echo "$BACKEND_PID" > /mnt/c/Code/gastro-context/.backend.pid
echo "$FRONTEND_PID" > /mnt/c/Code/gastro-context/.frontend.pid

echo ""
echo "PIDs guardados en .backend.pid y .frontend.pid"