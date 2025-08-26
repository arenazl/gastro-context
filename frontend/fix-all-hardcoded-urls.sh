#!/bin/bash

echo "🔧 Actualizando TODAS las URLs hardcodeadas en el proyecto..."

# Array de archivos que necesitan actualización
files=(
  "src/components/GoogleAuth.tsx"
  "src/components/PaymentModal.tsx"
  "src/components/TableLayoutDesigner.tsx"
  "src/pages/CompanySettings.tsx"
  "src/pages/CustomerMenu.tsx"
  "src/pages/CustomersManagement.tsx"
  "src/pages/InteractiveMenuAI.tsx"
  "src/pages/KitchenDragDrop.tsx"
  "src/pages/KitchenKanban.tsx"
  "src/pages/KitchenModern.tsx"
  "src/pages/NewOrderWithCache.tsx"
  "src/pages/OrganizationalSettings.tsx"
  "src/pages/ProductsDynamic.tsx"
  "src/pages/ProductsManagement.tsx"
  "src/pages/ProductsModern.tsx"
  "src/pages/QRManager.tsx"
  "src/pages/Reports.tsx"
  "src/pages/RestaurantLayout.tsx"
  "src/pages/TablesManagement.tsx"
  "src/pages/TablesModern.tsx"
  "src/pages/TablesVisual.tsx"
  "src/pages/UnifiedSettings.tsx"
)

for file in "${files[@]}"; do
  echo "  📝 Procesando: $file"
  
  # Verificar si el archivo ya tiene el import
  if ! grep -q "import.*API_BASE_URL\|import.*API_ENDPOINTS" "$file"; then
    # Agregar el import después del primer import
    sed -i "1,/^import.*from/s/import.*from.*/&\nimport { API_BASE_URL, API_ENDPOINTS } from '..\/config\/api';/" "$file"
  fi
  
  # Reemplazar todas las URLs hardcodeadas
  # Para fetch con URL completa
  sed -i "s|fetch('http://172\.29\.228\.80:9002/api/\([^']*\)'|fetch(API_ENDPOINTS.\1 \|\| \`\${API_BASE_URL}/api/\1\`|g" "$file"
  sed -i 's|fetch("http://172\.29\.228\.80:9002/api/\([^"]*\)"|fetch(API_ENDPOINTS.\1 \|\| `${API_BASE_URL}/api/\1`|g' "$file"
  sed -i 's|fetch(`http://172\.29\.228\.80:9002/api/\([^`]*\)`|fetch(API_ENDPOINTS.\1 \|\| `${API_BASE_URL}/api/\1`|g' "$file"
  
  # Para URLs simples
  sed -i "s|'http://172\.29\.228\.80:9002|'\${API_BASE_URL}|g" "$file"
  sed -i 's|"http://172\.29\.228\.80:9002|`${API_BASE_URL}|g' "$file"
  sed -i 's|`http://172\.29\.228\.80:9002|`${API_BASE_URL}|g' "$file"
  
  # Para WebSocket
  sed -i "s|'ws://172\.29\.228\.80:9002|'\${WS_BASE_URL}|g" "$file"
  sed -i 's|"ws://172\.29\.228\.80:9002|`${WS_BASE_URL}|g' "$file"
  sed -i 's|`ws://172\.29\.228\.80:9002|`${WS_BASE_URL}|g' "$file"
  
  echo "    ✅ Actualizado"
done

echo ""
echo "✨ ¡Actualización completada!"
echo "📦 Ahora ejecuta: npm run build"