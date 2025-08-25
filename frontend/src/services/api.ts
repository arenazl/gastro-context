import axios from 'axios';
import type { AxiosInstance } from 'axios';

// API configuration
// In production (Heroku), use relative URL since frontend is served from backend
// In development, use the specific backend URL
const API_URL = import.meta.env.VITE_API_URL === '' 
  ? '' // Empty string means use relative URLs (same origin)
  : (import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002');

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access_token);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    // Store tokens
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.clear();
  },
  
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },
  
  getProducts: async (params?: any) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getProduct: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  createProduct: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  
  updateProduct: async (id: number, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
};

// Tables API
export const tablesAPI = {
  getTables: async () => {
    const response = await api.get('/tables');
    return response.data;
  },
  
  updateTableStatus: async (tableId: number, status: string) => {
    const response = await api.patch(`/tables/${tableId}/status`, { status });
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  
  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};

// Payments API (mock for now)
export const paymentsAPI = {
  processPayment: async (paymentData: any) => {
    // Mock payment processing
    return {
      id: Math.floor(Math.random() * 10000),
      ...paymentData,
      status: 'completed',
      transaction_id: `TXN${Date.now()}`,
      processed_at: new Date().toISOString(),
    };
  },
  
  getPayments: async () => {
    // Mock payments
    return [];
  },
};

export default api;