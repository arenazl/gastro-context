#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Función para reemplazar URLs en un archivo
function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Patrones a reemplazar
    const patterns = [
      {
        // URLs HTTP directas
        from: /http:\/\/172\.29\.228\.80:9002/g,
        to: '${API_BASE_URL}'
      },
      {
        // URLs con comillas
        from: /'http:\/\/172\.29\.228\.80:9002([^'"]*)'/g,
        to: '`${API_BASE_URL}$1`'
      },
      {
        // URLs con comillas dobles
        from: /"http:\/\/172\.29\.228\.80:9002([^'"]*)"/g,
        to: '`${API_BASE_URL}$1`'
      },
      {
        // WebSocket URLs
        from: /ws:\/\/172\.29\.228\.80:9002/g,
        to: '${WS_BASE_URL}'
      }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        modified = true;
      }
    });
    
    if (modified) {
      // Agregar import si no existe
      if (!content.includes("import { API_BASE_URL") && !content.includes("from '../config/api'")) {
        // Buscar el primer import
        const firstImportMatch = content.match(/^import .* from ['"].*['"];?$/m);
        if (firstImportMatch) {
          const insertPosition = firstImportMatch.index + firstImportMatch[0].length;
          content = content.slice(0, insertPosition) + 
                   "\nimport { API_BASE_URL, WS_BASE_URL } from '../config/api';" + 
                   content.slice(insertPosition);
        }
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Función recursiva para buscar archivos
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      callback(filePath);
    }
  });
}

// Actualizar el archivo de configuración API
const apiConfigPath = path.join(__dirname, 'src/config/api.js');
const apiConfig = `// Configuración de API centralizada
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Detectar si estamos en Heroku o en producción
const isHeroku = window.location.hostname.includes('herokuapp.com');
const isHttps = window.location.protocol === 'https:';

// URL del backend según el ambiente
export const API_BASE_URL = isHeroku || isHttps
  ? 'https://gastro-ec0530e03436.herokuapp.com'  // Backend en Heroku
  : 'http://172.29.228.80:9002';  // Backend local

// WebSocket URL
export const WS_BASE_URL = isHeroku || isHttps
  ? 'wss://gastro-ec0530e03436.herokuapp.com'
  : 'ws://172.29.228.80:9002';

// URLs específicas
export const API_ENDPOINTS = {
  // Autenticación
  login: \`\${API_BASE_URL}/api/auth/login\`,
  googleAuth: \`\${API_BASE_URL}/api/auth/google\`,
  
  // Clientes
  customers: \`\${API_BASE_URL}/api/customers\`,
  customerSearch: \`\${API_BASE_URL}/api/customers/search\`,
  addresses: \`\${API_BASE_URL}/api/addresses\`,
  
  // Productos
  products: \`\${API_BASE_URL}/api/products\`,
  categories: \`\${API_BASE_URL}/api/categories\`,
  
  // Órdenes
  orders: \`\${API_BASE_URL}/api/orders\`,
  orderStatus: \`\${API_BASE_URL}/api/orders/status\`,
  
  // Mesas
  tables: \`\${API_BASE_URL}/api/tables\`,
  tableLayout: \`\${API_BASE_URL}/api/table-layout\`,
  
  // Cocina
  kitchen: \`\${API_BASE_URL}/api/kitchen\`,
  kitchenStatus: \`\${API_BASE_URL}/api/kitchen/status\`,
  
  // AI Chat
  chatMenuAI: \`\${API_BASE_URL}/api/chat/menu-ai\`,
  
  // Configuración
  company: \`\${API_BASE_URL}/api/company\`,
  settings: \`\${API_BASE_URL}/api/settings\`,
  
  // Pagos
  payments: \`\${API_BASE_URL}/api/payments\`,
  paymentWebhook: \`\${API_BASE_URL}/api/webhook/payment\`,
  
  // QR
  qrGenerate: \`\${API_BASE_URL}/api/qr/generate\`,
  
  // Reportes
  reports: \`\${API_BASE_URL}/api/reports\`,
  
  // WebSocket
  websocket: \`\${WS_BASE_URL}/ws\`
};

// Helper para hacer requests con manejo de errores
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_BASE_URL;
`;

// Crear/actualizar el archivo de configuración
fs.writeFileSync(apiConfigPath, apiConfig, 'utf8');
console.log('✅ Created/Updated API config file');

// Procesar todos los archivos
console.log('🔍 Searching for files to update...\n');
let updatedCount = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (!filePath.includes('config/api.js')) {
    if (replaceInFile(filePath)) {
      updatedCount++;
    }
  }
});

console.log(`\n✨ Updated ${updatedCount} files`);
console.log('\n📦 Now run: npm run build');