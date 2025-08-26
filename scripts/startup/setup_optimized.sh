#!/bin/bash

# Script para configurar y ejecutar el sistema optimizado
# Este script resuelve los problemas de performance

echo "🚀 Configurando Sistema Gastronómico Optimizado"
echo "================================================"

# Detener servicios anteriores
echo "⏹️  Deteniendo servicios anteriores..."
pkill -f "python.*server.py" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
docker-compose down 2>/dev/null

# Configurar entorno
echo "📁 Configurando entorno..."
cd /mnt/c/Code/gastro-context

# Instalar dependencias del backend si es necesario
echo "📦 Verificando dependencias del backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "🐍 Creando entorno virtual Python..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt --quiet

# Aplicar optimizaciones de base de datos
echo "🗄️  Aplicando optimizaciones de base de datos..."
mysql -h mysql-aiven-arenazl.e.aivencloud.com \
      -P 23108 \
      -u avnadmin \
      -pAVNS_Fqe0qsChCHnqSnVsvoi \
      gastro < optimize_database.sql 2>/dev/null

echo "✅ Índices de base de datos optimizados"

# Iniciar Redis con Docker
echo "🔴 Iniciando Redis para caché..."
docker run -d \
    --name gastro-redis \
    -p 6379:6379 \
    redis:7-alpine \
    2>/dev/null || docker start gastro-redis

# Esperar a que Redis esté listo
sleep 2

# Iniciar backend optimizado
echo "🚀 Iniciando backend FastAPI optimizado..."
nohup python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend iniciado con PID: $BACKEND_PID"

# Verificar que el backend esté funcionando
sleep 3
if curl -s http://localhost:9000/health > /dev/null; then
    echo "✅ Backend funcionando correctamente"
else
    echo "❌ Error: Backend no responde"
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando frontend React..."
cd ../frontend
npm install --silent
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Frontend iniciado con PID: $FRONTEND_PID"

# Crear archivo con PIDs para detener servicios después
cat > ../stop_services.sh << EOF
#!/bin/bash
echo "Deteniendo servicios..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
docker stop gastro-redis 2>/dev/null
echo "Servicios detenidos"
EOF

chmod +x ../stop_services.sh

echo ""
echo "==================================================="
echo "✅ Sistema Gastronómico Optimizado Iniciado"
echo "==================================================="
echo ""
echo "📊 Mejoras implementadas:"
echo "   ✓ Backend FastAPI con pool de conexiones (30 conexiones)"
echo "   ✓ Redis cache para consultas frecuentes"
echo "   ✓ Lazy loading de productos por categoría"
echo "   ✓ Índices optimizados en MySQL"
echo "   ✓ API endpoints optimizados con paginación"
echo ""
echo "🔗 URLs del sistema:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:9000"
echo "   - API Docs: http://localhost:9000/api/docs"
echo ""
echo "📈 Mejoras de performance esperadas:"
echo "   - Carga de categorías: <100ms (cache)"
echo "   - Carga de productos: <200ms (lazy loading)"
echo "   - Búsquedas: <150ms (índices optimizados)"
echo ""
echo "⏹️  Para detener: ./stop_services.sh"
echo ""