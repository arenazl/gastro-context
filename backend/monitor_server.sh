#!/bin/bash

# Script de monitoreo para mantener los servidores corriendo
# Logs más detallados para diagnosticar problemas

BACKEND_PORT=9002
FRONTEND_PORT=5174
BACKEND_DIR="/mnt/c/Code/gastro-context/backend"
FRONTEND_DIR="/mnt/c/Code/gastro-context/frontend"

# Colores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_with_timestamp() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error_log() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn_log() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

check_backend() {
    log_with_timestamp "🔍 Verificando backend en puerto $BACKEND_PORT..."
    
    # Verificar si el proceso está corriendo
    if ! pgrep -f "python.*complete_server.py" > /dev/null; then
        error_log "Backend process no está corriendo"
        return 1
    fi
    
    # Verificar si responde HTTP
    if ! curl -s -f "http://localhost:$BACKEND_PORT/api/categories" > /dev/null; then
        error_log "Backend no responde en puerto $BACKEND_PORT"
        return 1
    fi
    
    log_with_timestamp "✅ Backend funcionando correctamente"
    return 0
}

check_frontend() {
    log_with_timestamp "🔍 Verificando frontend en puerto $FRONTEND_PORT..."
    
    # Verificar si el proceso está corriendo
    if ! pgrep -f "vite.*--port $FRONTEND_PORT" > /dev/null; then
        error_log "Frontend process no está corriendo"
        return 1
    fi
    
    # Verificar si responde HTTP
    if ! curl -s -f "http://localhost:$FRONTEND_PORT" > /dev/null; then
        error_log "Frontend no responde en puerto $FRONTEND_PORT"
        return 1
    fi
    
    log_with_timestamp "✅ Frontend funcionando correctamente"
    return 0
}

restart_backend() {
    warn_log "🔄 Reiniciando backend..."
    
    # Matar procesos existentes
    pkill -f "python.*complete_server.py" 2>/dev/null || true
    sleep 2
    
    # Iniciar backend
    cd "$BACKEND_DIR"
    nohup python3 complete_server.py > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Esperar que inicie
    sleep 5
    
    if check_backend; then
        log_with_timestamp "✅ Backend reiniciado exitosamente (PID: $BACKEND_PID)"
    else
        error_log "❌ Falló al reiniciar backend"
        return 1
    fi
}

restart_frontend() {
    warn_log "🔄 Reiniciando frontend..."
    
    # Matar procesos existentes
    pkill -f "vite.*--port $FRONTEND_PORT" 2>/dev/null || true
    sleep 2
    
    # Iniciar frontend
    cd "$FRONTEND_DIR"
    nohup npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Esperar que inicie
    sleep 8
    
    if check_frontend; then
        log_with_timestamp "✅ Frontend reiniciado exitosamente (PID: $FRONTEND_PID)"
    else
        error_log "❌ Falló al reiniciar frontend"
        return 1
    fi
}

# Función principal de monitoreo
monitor_servers() {
    log_with_timestamp "🚀 Iniciando monitoreo de servidores..."
    
    while true; do
        # Verificar backend
        if ! check_backend; then
            error_log "Backend caído, reiniciando..."
            restart_backend
        fi
        
        # Verificar frontend
        if ! check_frontend; then
            error_log "Frontend caído, reiniciando..."
            restart_frontend
        fi
        
        # Mostrar estado de memoria y conexiones
        log_with_timestamp "📊 Memoria: $(free -h | grep '^Mem:' | awk '{print $3"/"$2}')"
        
        # Mostrar conexiones activas
        BACKEND_CONNECTIONS=$(ss -tn sport = :$BACKEND_PORT | wc -l)
        FRONTEND_CONNECTIONS=$(ss -tn sport = :$FRONTEND_PORT | wc -l)
        log_with_timestamp "🔗 Conexiones -> Backend: $BACKEND_CONNECTIONS, Frontend: $FRONTEND_CONNECTIONS"
        
        # Esperar antes del próximo check
        sleep 30
    done
}

# Si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-monitor}" in
        "monitor")
            monitor_servers
            ;;
        "restart-backend")
            restart_backend
            ;;
        "restart-frontend")
            restart_frontend
            ;;
        "status")
            check_backend && check_frontend && log_with_timestamp "🎉 Ambos servidores funcionando"
            ;;
        *)
            echo "Uso: $0 [monitor|restart-backend|restart-frontend|status]"
            exit 1
            ;;
    esac
fi