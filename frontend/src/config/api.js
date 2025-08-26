// Configuración de API centralizada
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Detectar si estamos en Heroku
const isHeroku = window.location.hostname.includes('herokuapp.com');

// URL del backend según el ambiente
export const API_BASE_URL = isHeroku 
  ? 'https://gastro-ec0530e03436.herokuapp.com'  // Backend en Heroku (mismo servidor)
  : isDevelopment 
    ? 'http://172.29.228.80:9002'  // Backend local
    : 'https://gastro-ec0530e03436.herokuapp.com';  // Producción

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
  
  // WebSocket (necesita protocolo ws/wss)
  websocket: isHeroku 
    ? `wss://${window.location.hostname}/ws`
    : `ws://172.29.228.80:9002/ws`
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