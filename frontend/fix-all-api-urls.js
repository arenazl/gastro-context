#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Lista de archivos a actualizar
const filesToUpdate = [
  'src/components/GoogleAuth.tsx',
  'src/components/PaymentModal.tsx',
  'src/components/TableLayoutDesigner.tsx',
  'src/pages/CompanySettings.tsx',
  'src/pages/CustomerMenu.tsx',
  'src/pages/CustomersManagement.tsx',
  'src/pages/InteractiveMenuAI.tsx',
  'src/pages/InteractiveMenuSingleScreen.tsx',
  'src/pages/KitchenDragDrop.tsx',
  'src/pages/KitchenKanban.tsx',
  'src/pages/KitchenModern.tsx',
  'src/pages/NewOrderWithCache.tsx',
  'src/pages/OrganizationalSettings.tsx',
  'src/pages/ProductsDynamic.tsx',
  'src/pages/ProductsManagement.tsx',
  'src/pages/ProductsModern.tsx',
  'src/pages/QRManager.tsx',
  'src/pages/Reports.tsx',
  'src/pages/RestaurantLayout.tsx',
  'src/pages/TablesManagement.tsx',
  'src/pages/TablesModern.tsx',
  'src/pages/TablesVisual.tsx',
  'src/pages/UnifiedSettings.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Eliminar líneas con API_URL local mal definidas
  const badPatterns = [
    /const API_URL = import\.meta\.env\.VITE_API_URL \|\| '\$\{API_BASE_URL\}';?\n/g,
    /const API_BASE_URL = import\.meta\.env\.VITE_API_URL \|\| '\$\{API_BASE_URL\}';?\n/g,
  ];
  
  badPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });
  
  // 2. Agregar import correcto si no existe
  const hasCorrectImport = content.includes("import { API_BASE_URL") || 
                          content.includes("import { API_URL") ||
                          content.includes("import { API_ENDPOINTS");
  
  if (!hasCorrectImport) {
    // Buscar el primer import para insertar después
    const firstImportMatch = content.match(/^import .* from ['"].*['"];?$/m);
    if (firstImportMatch) {
      const insertPosition = firstImportMatch.index + firstImportMatch[0].length;
      const importPath = file.includes('components/') ? '../config/api' : '../config/api';
      content = content.slice(0, insertPosition) + 
               `\nimport { API_BASE_URL, API_ENDPOINTS, WS_BASE_URL } from '${importPath}';` + 
               content.slice(insertPosition);
      modified = true;
    }
  }
  
  // 3. Reemplazar URLs mal formateadas
  const replacements = [
    // Reemplazar '${API_BASE_URL}' literal con API_BASE_URL variable
    { from: /'\$\{API_BASE_URL\}'/g, to: 'API_BASE_URL' },
    { from: /"\$\{API_BASE_URL\}"/g, to: 'API_BASE_URL' },
    { from: /`\$\{API_BASE_URL\}`/g, to: 'API_BASE_URL' },
    
    // Reemplazar construcciones incorrectas
    { from: /import\.meta\.env\.VITE_API_URL \|\| '\$\{API_BASE_URL\}'/g, to: 'API_BASE_URL' },
    
    // Reemplazar URLs hardcodeadas restantes
    { from: /'http:\/\/172\.29\.228\.80:9002'/g, to: 'API_BASE_URL' },
    { from: /"http:\/\/172\.29\.228\.80:9002"/g, to: 'API_BASE_URL' },
    { from: /`http:\/\/172\.29\.228\.80:9002`/g, to: 'API_BASE_URL' },
  ];
  
  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  Skip: ${file} (no changes needed)`);
  }
});

console.log('\n✨ Done! Now run: npm run build');