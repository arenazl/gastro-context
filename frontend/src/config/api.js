// Configuración de API centralizada
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// URLs desde variables de entorno o valores por defecto
// En producción, Vite reemplazará estas variables durante el build
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isProduction 
    ? 'https://gastro-ec0530e03436.herokuapp.com'  // Fallback para producción
    : 'http://172.29.228.80:9002');  // Backend local para desarrollo

export const WS_BASE_URL = import.meta.env.VITE_WS_URL ||
  (isProduction
    ? 'wss://gastro-ec0530e03436.herokuapp.com'
    : 'ws://172.29.228.80:9002');

// URLs específicas
export const API_ENDPOINTS = {
  // Autenticación
  login: `${API_BASE_URL}/api/auth/login`,
  googleAuth: `${API_BASE_URL}/api/auth/google`,
  
  // Clientes
  customers: `${API_BASE_URL}/api/customers`,
  customerSearch: `${API_BASE_URL}/api/customers/search`,
  addresses: `${API_BASE_URL}/api/addresses`,
  
  // Productos
  products: `${API_BASE_URL}/api/products`,
  categories: `${API_BASE_URL}/api/categories`,
  
  // Órdenes
  orders: `${API_BASE_URL}/api/orders`,
  orderStatus: `${API_BASE_URL}/api/orders/status`,
  
  // Mesas
  tables: `${API_BASE_URL}/api/tables`,
  tableLayout: `${API_BASE_URL}/api/table-layout`,
  
  // Cocina
  kitchen: `${API_BASE_URL}/api/kitchen`,
  kitchenStatus: `${API_BASE_URL}/api/kitchen/status`,
  
  // AI Chat
  chatMenuAI: `${API_BASE_URL}/api/chat/menu-ai`,
  
  // Configuración
  company: `${API_BASE_URL}/api/company`,
  settings: `${API_BASE_URL}/api/settings`,
  
  // Pagos
  payments: `${API_BASE_URL}/api/payments`,
  paymentWebhook: `${API_BASE_URL}/api/webhook/payment`,
  
  // QR
  qrGenerate: `${API_BASE_URL}/api/qr/generate`,
  
  // Reportes
  reports: `${API_BASE_URL}/api/reports`,
  
  // WebSocket
  websocket: `${WS_BASE_URL}/ws`
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_BASE_URL;