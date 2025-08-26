#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Obtener IP de WSL
WSL_IP=$(hostname -I | awk '{print $1}')

clear
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 SISTEMA GASTRONÓMICO COMPLETO 🚀  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Función para matar procesos en puertos
kill_port() {
    local port=$1
    local name=$2
    echo -e "${YELLOW}▸ Liberando puerto $port ($name)...${NC}"
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    fuser -k $port/tcp 2>/dev/null || true
}

# Liberar puertos si están ocupados
echo -e "${BLUE}📍 Limpiando puertos...${NC}"
kill_port 9002 "Backend"
kill_port 5173 "Frontend"
sleep 1

echo ""
echo -e "${BLUE}📦 Verificando dependencias...${NC}"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 no está instalado${NC}"
    exit 1
fi

# Verificar Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

# Instalar dependencias del backend si es necesario
# Verificar si podemos usar venv o usar pip directamente
if command -v python3 -m venv &> /dev/null 2>&1 && [ ! -f "backend/.no_venv" ]; then
    if [ ! -d "backend/venv" ]; then
        echo -e "${YELLOW}▸ Intentando crear entorno virtual...${NC}"
        cd backend
        python3 -m venv venv 2>/dev/null
        if [ $? -eq 0 ]; then
            source venv/bin/activate
            pip install -q -r requirements.txt 2>/dev/null || pip install -q fastapi uvicorn mysql-connector-python python-multipart python-jose passlib stripe websockets aiofiles
        else
            echo -e "${YELLOW}▸ No se puede crear venv, usando pip global...${NC}"
            touch .no_venv
            pip3 install --user -q -r requirements.txt 2>/dev/null || pip3 install --user -q fastapi uvicorn mysql-connector-python python-multipart python-jose passlib stripe websockets aiofiles
        fi
        cd ..
    else
        echo -e "${GREEN}✓ Entorno virtual de Python listo${NC}"
    fi
else
    echo -e "${YELLOW}▸ Instalando dependencias con pip...${NC}"
    cd backend
    pip3 install --user -q -r requirements.txt 2>/dev/null || pip3 install --user -q fastapi uvicorn mysql-connector-python python-multipart python-jose passlib stripe websockets aiofiles
    cd ..
fi

# Instalar dependencias del frontend si es necesario
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}▸ Instalando dependencias de Node.js...${NC}"
    cd frontend
    npm install --silent
    cd ..
else
    echo -e "${GREEN}✓ Dependencias de Node.js listas${NC}"
fi

echo ""
echo -e "${BLUE}🔥 Iniciando servicios...${NC}"

# Iniciar Backend
echo -e "${YELLOW}▸ Iniciando Backend en puerto 9002...${NC}"
cd backend
# Intentar activar venv si existe, sino usar python3 directamente
if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
    source venv/bin/activate 2>/dev/null || true
fi
nohup python3 complete_server.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Guardar PIDs
echo $BACKEND_PID > .backend.pid

# Esperar a que el backend esté listo
for i in {1..15}; do
    if curl -s http://$WSL_IP:9002/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend iniciado correctamente${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}❌ Backend no pudo iniciar${NC}"
        echo -e "${YELLOW}Ver logs: tail -f backend.log${NC}"
        exit 1
    fi
    sleep 1
done

# Iniciar Frontend
echo -e "${YELLOW}▸ Iniciando Frontend en puerto 5173...${NC}"
cd frontend
nohup npm run dev -- --host 0.0.0.0 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Guardar PID
echo $FRONTEND_PID > .frontend.pid

# Esperar a que el frontend esté listo
sleep 3
for i in {1..10}; do
    if curl -s http://$WSL_IP:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend iniciado correctamente${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠ Frontend iniciándose...${NC}"
    fi
    sleep 1
done

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    ✅ SISTEMA INICIADO CON ÉXITO    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📱 Accede a la aplicación:${NC}"
echo -e "   ${BLUE}Frontend:${NC} http://$WSL_IP:5173"
echo -e "   ${BLUE}Backend API:${NC} http://$WSL_IP:9002/docs"
echo ""
echo -e "${GREEN}📝 Comandos útiles:${NC}"
echo -e "   ${YELLOW}Ver logs backend:${NC}  tail -f backend.log"
echo -e "   ${YELLOW}Ver logs frontend:${NC} tail -f frontend.log"
echo -e "   ${YELLOW}Detener todo:${NC}      ./stop-all.sh"
echo -e "   ${YELLOW}Reiniciar:${NC}         ./stop-all.sh && ./start-all.sh"
echo ""
echo -e "${GREEN}📊 Estado de los procesos:${NC}"
echo -e "   Backend PID:  $BACKEND_PID"
echo -e "   Frontend PID: $FRONTEND_PID"
echo ""