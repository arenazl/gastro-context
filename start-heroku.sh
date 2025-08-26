#!/bin/bash

# Verificar que el frontend está construido
if [ ! -d "backend/static/assets" ]; then
    echo "⚠️ Frontend assets not found, building..."
    cd frontend && npm run build && cd ..
    mkdir -p backend/static
    cp -r frontend/dist/* backend/static/
    echo "✅ Frontend built and copied"
fi

# Iniciar el servidor
echo "🚀 Starting server..."
cd backend && python complete_server.py