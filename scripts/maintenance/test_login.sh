#!/bin/bash

echo "============================================"
echo "    PRUEBA DEFINITIVA DE LOGIN"
echo "============================================"
echo ""

# 1. Verificar que ambos servicios estén activos
echo "📍 PASO 1: Verificar servicios"
echo "--------------------------------------------"

BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health)
echo "Backend (puerto 9000): STATUS $BACKEND_STATUS"

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
echo "Frontend (puerto 5173): STATUS $FRONTEND_STATUS"

# 2. Verificar configuración
echo ""
echo "📍 PASO 2: Verificar configuración de API"
echo "--------------------------------------------"
API_CONFIG=$(curl -s http://localhost:5173/src/services/api.ts 2>/dev/null | grep "VITE_API_URL" | head -1)
echo "Configuración en frontend:"
echo "$API_CONFIG"

# 3. Hacer login directo al backend
echo ""
echo "📍 PASO 3: Login directo al backend"
echo "--------------------------------------------"
echo "POST http://localhost:9000/api/v1/auth/login"
echo "Body: {email: admin@restaurant.com, password: admin}"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | grep -v "HTTP_STATUS:")

echo "Response Status: $HTTP_STATUS"
echo "Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

# 4. Simular login desde el frontend
echo ""
echo "📍 PASO 4: Simular login desde frontend"
echo "--------------------------------------------"
echo "Simulando que el navegador hace el request..."
echo ""

FRONTEND_LOGIN=$(curl -s -X POST http://localhost:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -H "Referer: http://localhost:5173/login" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -d '{"email":"admin@restaurant.com","password":"admin"}' \
  -w "\nHTTP_STATUS:%{http_code}")

FRONT_STATUS=$(echo "$FRONTEND_LOGIN" | grep "HTTP_STATUS:" | cut -d: -f2)
FRONT_BODY=$(echo "$FRONTEND_LOGIN" | grep -v "HTTP_STATUS:")

echo "Response Status: $FRONT_STATUS"
if [[ "$FRONT_BODY" == *"access_token"* ]]; then
    echo "✅ Login exitoso - Token recibido"
else
    echo "❌ Login falló - No se recibió token"
fi

# 5. Resumen
echo ""
echo "============================================"
echo "    RESUMEN FINAL"
echo "============================================"

if [ "$BACKEND_STATUS" == "200" ] && [ "$FRONTEND_STATUS" == "200" ] && [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ SISTEMA FUNCIONANDO CORRECTAMENTE"
    echo ""
    echo "URLs del sistema:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:9000"
    echo ""
    echo "Para hacer login:"
    echo "  1. Abre http://localhost:5173 en tu navegador"
    echo "  2. Serás redirigido a /login"
    echo "  3. Usa estas credenciales:"
    echo "     Email: admin@restaurant.com"
    echo "     Password: admin"
else
    echo "❌ HAY PROBLEMAS:"
    if [ "$BACKEND_STATUS" != "200" ]; then
        echo "  - Backend no responde en puerto 9000"
    fi
    if [ "$FRONTEND_STATUS" != "200" ]; then
        echo "  - Frontend no responde en puerto 5173"
    fi
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "  - Login endpoint no funciona"
    fi
fi
echo "============================================"