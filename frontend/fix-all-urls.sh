#!/bin/bash

# Script para reemplazar todas las URLs hardcodeadas con imports de la configuración

echo "🔧 Actualizando todas las URLs hardcodeadas..."

# Lista de archivos a actualizar (excluyendo api.js que es la configuración)
files=(
  "src/pages/CompanySettings.tsx"
  "src/pages/InteractiveMenuSingleScreen.tsx"
  "src/pages/ProductsDynamic.tsx"
  "src/pages/KitchenKanban.tsx"
  "src/pages/CustomerMenu.tsx"
  "src/pages/QRManager.tsx"
  "src/pages/NewOrderWithCache.tsx"
  "src/pages/ProductsModern.tsx"
  "src/components/TableLayoutDesigner.tsx"
  "src/pages/KitchenDragDrop.tsx"
  "src/pages/KitchenModern.tsx"
  "src/pages/CustomersManagement.tsx"
  "src/pages/TablesVisual.tsx"
  "src/pages/Reports.tsx"
  "src/pages/UnifiedSettings.tsx"
  "src/pages/RestaurantLayout.tsx"
  "src/pages/OrganizationalSettings.tsx"
  "src/pages/TablesManagement.tsx"
  "src/components/GoogleAuth.tsx"
  "src/pages/ProductsManagement.tsx"
  "src/components/PaymentModal.tsx"
  "src/pages/TablesModern.tsx"
)

# Función para actualizar un archivo
update_file() {
  local file=$1
  echo "  Procesando: $file"
  
  # Crear backup
  cp "$file" "$file.bak"
  
  # Reemplazar URLs HTTP
  sed -i "s|http://172\.29\.228\.80:9002|' + API_BASE_URL + '|g" "$file"
  sed -i 's|"http://172\.29\.228\.80:9002|`${API_BASE_URL}|g' "$file"
  sed -i "s|'http://172\.29\.228\.80:9002|"'`${API_BASE_URL}|g' "$file"
  
  # Reemplazar URLs WebSocket
  sed -i "s|ws://172\.29\.228\.80:9002|' + WS_BASE_URL + '|g" "$file"
  sed -i 's|"ws://172\.29\.228\.80:9002|`${WS_BASE_URL}|g' "$file"
  sed -i "s|'ws://172\.29\.228\.80:9002|"'`${WS_BASE_URL}|g' "$file"
  
  # Si el archivo fue modificado y no tiene el import, agregarlo
  if ! grep -q "import.*API_BASE_URL.*from.*config/api" "$file"; then
    # Buscar el primer import y agregar después
    sed -i "0,/^import .* from/s//&\nimport { API_BASE_URL, WS_BASE_URL } from '..\/config\/api';/" "$file"
  fi
  
  # Eliminar backup si todo salió bien
  rm "$file.bak"
}

# Actualizar cada archivo
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    update_file "$file"
  else
    echo "  ⚠️  No encontrado: $file"
  fi
done

echo "✅ Actualización completada!"
echo "📦 Ahora ejecuta: npm run build"