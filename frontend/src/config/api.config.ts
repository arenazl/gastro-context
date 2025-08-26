// Configuración centralizada de API
// NO MÁS HARDCODEO! 😄

export const getApiUrl = () => {
  // En producción, usar URL relativa para mismo dominio
  if (import.meta.env.MODE === 'production') {
    return '';
  }
  
  // En desarrollo, usar variable de entorno o default
  return import.meta.env.VITE_API_URL || 'http://localhost:9002';
};

export const API_URL = getApiUrl();