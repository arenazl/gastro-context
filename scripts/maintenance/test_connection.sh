#!/bin/bash

echo "🔍 Verificando Conexión Frontend-Backend"
echo "========================================"

# Test Backend
echo -n "1. Backend health check... "
if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALLA - Backend no responde en puerto 9000"
    exit 1
fi

# Test Categories endpoint
echo -n "2. Endpoint de categorías... "
CATEGORIES=$(curl -s http://localhost:9000/api/v1/products/categories)
if [ ! -z "$CATEGORIES" ] && [[ "$CATEGORIES" == *"Entradas"* ]]; then
    echo "✅ OK"
else
    echo "❌ FALLA - No devuelve categorías"
    exit 1
fi

# Test Login endpoint
echo -n "3. Endpoint de login... "
LOGIN=$(curl -s -X POST http://localhost:9000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@restaurant.com","password":"admin"}')
if [[ "$LOGIN" == *"access_token"* ]]; then
    echo "✅ OK"
else
    echo "❌ FALLA - Login no funciona"
    exit 1
fi

# Test Frontend
echo -n "4. Frontend server... "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALLA - Frontend no responde en puerto 5173"
    exit 1
fi

# Check environment variables
echo -n "5. Variables de entorno... "
ENV_CHECK=$(cat /mnt/c/Code/gastro-context/frontend/.env.local 2>/dev/null)
if [[ "$ENV_CHECK" == *"localhost:9000"* ]]; then
    echo "✅ OK (apunta a localhost:9000)"
else
    echo "⚠️  ADVERTENCIA - .env.local puede tener URL incorrecta"
    echo "   Contenido actual: $ENV_CHECK"
fi

echo ""
echo "========================================"
echo "✅ TODAS LAS VERIFICACIONES PASARON"
echo "========================================"
echo ""
echo "El sistema está funcionando correctamente:"
echo "- Backend: http://localhost:9000"
echo "- Frontend: http://localhost:5173"
echo ""
echo "Puedes probar el login con:"
echo "  Email: admin@restaurant.com"
echo "  Password: admin"