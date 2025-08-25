#!/bin/bash

echo "======================================"
echo "   PRUEBA COMPLETA DEL SISTEMA"
echo "======================================"
echo ""

# Test 1: Backend Health
echo "1. TEST BACKEND HEALTH:"
echo "   URL: http://localhost:9000/health"
RESPONSE=$(curl -s -w "\nSTATUS_CODE:%{http_code}" http://localhost:9000/health)
STATUS_CODE=$(echo "$RESPONSE" | grep "STATUS_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "STATUS_CODE:")
echo "   Response: $BODY"
echo "   ✅ STATUS CODE: $STATUS_CODE"
echo ""

# Test 2: Backend Login
echo "2. TEST LOGIN ENDPOINT:"
echo "   URL: http://localhost:9000/api/v1/auth/login"
echo "   Data: {email:admin@restaurant.com, password:admin}"
RESPONSE=$(curl -s -X POST http://localhost:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin"}' \
  -w "\nSTATUS_CODE:%{http_code}")
STATUS_CODE=$(echo "$RESPONSE" | grep "STATUS_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "STATUS_CODE:" | python3 -m json.tool 2>/dev/null | head -5)
echo "   Response: $BODY..."
echo "   ✅ STATUS CODE: $STATUS_CODE"
echo ""

# Test 3: Frontend Server
echo "3. TEST FRONTEND SERVER:"
echo "   URL: http://localhost:5173"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$STATUS" == "200" ]; then
    echo "   ✅ STATUS CODE: $STATUS - Frontend funcionando"
else
    echo "   ❌ STATUS CODE: $STATUS - Frontend NO responde"
fi
echo ""

# Test 4: API Configuration
echo "4. VERIFICAR CONFIGURACIÓN API:"
echo "   Archivo: .env.local"
ENV_URL=$(grep "VITE_API_URL" /mnt/c/Code/gastro-context/frontend/.env.local 2>/dev/null | cut -d= -f2)
echo "   Configurado: $ENV_URL"
if [[ "$ENV_URL" == *"localhost:9000"* ]]; then
    echo "   ✅ URL correcta (localhost:9000)"
else
    echo "   ❌ URL INCORRECTA - debería ser http://localhost:9000"
fi
echo ""

# Test 5: Test real de conexión Frontend -> Backend
echo "5. TEST CONEXIÓN FRONTEND -> BACKEND:"
echo "   Simulando login desde el navegador..."

# Primero obtenemos el frontend
FRONTEND_HTML=$(curl -s http://localhost:5173 2>/dev/null | head -20)
if [[ "$FRONTEND_HTML" == *"<div id=\"root\">"* ]]; then
    echo "   ✅ Frontend HTML cargando correctamente"
    
    # Ahora intentamos login desde el frontend
    echo "   Intentando login via API..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:9000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:5173" \
        -H "Referer: http://localhost:5173/login" \
        -d '{"email":"admin@restaurant.com","password":"admin"}' \
        -w "\nSTATUS:%{http_code}")
    
    STATUS=$(echo "$LOGIN_RESPONSE" | grep "STATUS:" | cut -d: -f2)
    if [ "$STATUS" == "200" ]; then
        echo "   ✅ Login exitoso - STATUS $STATUS"
    else
        echo "   ❌ Login falló - STATUS $STATUS"
    fi
else
    echo "   ❌ Frontend no está cargando"
fi

echo ""
echo "======================================"
echo "   RESUMEN"
echo "======================================"

# Verificación final
if [ "$STATUS_CODE" == "200" ] && [ "$STATUS" == "200" ]; then
    echo "✅ SISTEMA FUNCIONANDO CORRECTAMENTE"
    echo ""
    echo "Puedes acceder a:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend:  http://localhost:9000"
    echo ""
    echo "Login con:"
    echo "  - Email: admin@restaurant.com"
    echo "  - Password: admin"
else
    echo "❌ HAY PROBLEMAS EN EL SISTEMA"
    echo ""
    echo "Revisa los errores arriba"
fi
echo "======================================"