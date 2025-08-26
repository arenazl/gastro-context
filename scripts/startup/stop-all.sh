#!/bin/bash

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${RED}╔══════════════════════════════════════╗${NC}"
echo -e "${RED}║   🛑 DETENIENDO SISTEMA COMPLETO 🛑   ║${NC}"
echo -e "${RED}╚══════════════════════════════════════╝${NC}"
echo ""

# Función para detener servicio
stop_service() {
    local port=$1
    local name=$2
    local pid_file=$3
    
    echo -e "${YELLOW}▸ Deteniendo $name...${NC}"
    
    # Intentar usar PID guardado
    if [ -f "$pid_file" ]; then
        PID=$(cat $pid_file)
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
            rm -f $pid_file
        fi
    fi
    
    # Asegurarse de liberar el puerto
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    fuser -k $port/tcp 2>/dev/null || true
    
    echo -e "${GREEN}✓ $name detenido${NC}"
}

# Detener Backend
stop_service 9002 "Backend" ".backend.pid"

# Detener Frontend
stop_service 5173 "Frontend" ".frontend.pid"

# Matar procesos npm adicionales
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Limpiar archivos temporales
echo -e "\n${YELLOW}▸ Limpiando archivos temporales...${NC}"
rm -f .backend.pid .frontend.pid
rm -f nohup.out

echo ""
echo -e "${RED}╔══════════════════════════════════════╗${NC}"
echo -e "${RED}║    ✅ SISTEMA DETENIDO COMPLETAMENTE  ║${NC}"
echo -e "${RED}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Para reiniciar el sistema:${NC}"
echo -e "   ${YELLOW}./start-all.sh${NC}"
echo ""