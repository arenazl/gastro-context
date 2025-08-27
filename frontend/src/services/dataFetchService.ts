// Servicio global para manejo de requests con cache y notificaciones
import { toast } from 'react-toastify';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number; // milisegundos
}

class DataFetchService {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  // Configuración por defecto
  private defaultCacheDuration = 5 * 60 * 1000; // 5 minutos
  private isFirstLoad = true;

  private getCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}_${paramString}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.expiresIn;
  }

  private showNotification(fromCache: boolean) {
    if (fromCache) {
      // Mensaje cuando viene del cache
      toast.success('✨ Obtenidos automáticamente desde el caché', {
        position: "bottom-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        className: 'bg-green-600',
        progressClassName: 'bg-green-800',
      });
    } else {
      // Mensaje cuando viene de la BD
      toast.info('🔄 Obteniendo información desde la base de datos...\nLas siguientes llamadas se realizarán mucho más rápido', {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        className: 'bg-blue-600',
        progressClassName: 'bg-blue-800',
      });
    }
  }

  async fetch<T>(
    url: string,
    options?: RequestInit & { 
      params?: any; 
      cacheDuration?: number;
      showNotification?: boolean;
      cacheKey?: string;
    }
  ): Promise<T> {
    const {
      params,
      cacheDuration = this.defaultCacheDuration,
      showNotification = true,
      cacheKey: customCacheKey,
      ...fetchOptions
    } = options || {};

    const cacheKey = customCacheKey || this.getCacheKey(url, params);

    // Revisar si hay datos en cache válidos
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && !this.isExpired(cachedEntry)) {
      if (showNotification) {
        this.showNotification(true); // Desde cache
      }
      return cachedEntry.data as T;
    }

    // Revisar si ya hay una request pendiente para la misma key
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Si no hay cache válido ni request pendiente, hacer nueva request
    if (showNotification) {
      this.showNotification(false); // Desde BD
    }

    // Construir URL con params si existen
    let finalUrl = url;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      finalUrl = `${url}?${queryString}`;
    }

    // Crear nueva request
    const requestPromise = fetch(finalUrl, fetchOptions)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Guardar en cache
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          expiresIn: cacheDuration
        });

        // Limpiar request pendiente
        this.pendingRequests.delete(cacheKey);
        
        return data;
      })
      .catch((error) => {
        // Limpiar request pendiente en caso de error
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Guardar como request pendiente
    this.pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  // Método para limpiar cache manualmente
  clearCache(pattern?: string) {
    if (pattern) {
      // Limpiar solo las keys que coincidan con el patrón
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpiar todo el cache
      this.cache.clear();
    }
  }

  // Método para precalentar cache
  async warmCache(urls: Array<{ url: string; params?: any }>) {
    const promises = urls.map(({ url, params }) => 
      this.fetch(url, { 
        params, 
        showNotification: false // No mostrar notificación en precalentamiento
      }).catch(() => {
        // Ignorar errores en precalentamiento
      })
    );

    await Promise.all(promises);
  }

  // Obtener estadísticas del cache
  getCacheStats() {
    const validEntries = Array.from(this.cache.values()).filter(
      entry => !this.isExpired(entry)
    );

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Singleton
export const dataFetchService = new DataFetchService();
export default dataFetchService;