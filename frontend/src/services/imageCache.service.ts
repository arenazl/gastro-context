class ImageCacheService {
  private cacheName = 'gastro-images-v1';
  private cache: Cache | null = null;
  private cacheCheckRegistry = new Map<string, boolean>(); // Registry para evitar verificaciones repetidas

  async init(): Promise<void> {
    try {
      // Verificar si Cache API está disponible
      if (typeof caches === 'undefined' || !('caches' in window)) {
        console.log('⚠️ Cache API no disponible, usando fallback en memoria');
        this.cache = null;
        return;
      }
      
      this.cache = await caches.open(this.cacheName);
      console.log('🖼️ Image cache initialized');
      
      // Pre-poblar el registry con las URLs ya cacheadas
      await this.populateRegistry();
    } catch (error) {
      console.warn('Cache API no disponible, usando fallback:', error);
      this.cache = null;
    }
  }

  // Poblar el registry con URLs ya cacheadas para mejor performance
  private async populateRegistry(): Promise<void> {
    if (!this.cache) return;
    
    try {
      const keys = await this.cache.keys();
      keys.forEach(request => {
        this.cacheCheckRegistry.set(request.url, true);
      });
      
      if (keys.length > 0) {
        console.log(`📋 Registry populated with ${keys.length} cached images`);
      }
    } catch (error) {
      console.error('Failed to populate cache registry:', error);
    }
  }

  async precacheImages(imageUrls: string[]): Promise<void> {
    const startTime = performance.now();
    console.log(`🚀 INICIO precacheImages - ${imageUrls.length} URLs recibidas`);
    console.log(`📋 Primeras 5 URLs:`, imageUrls.slice(0, 5));
    
    if (!this.cache) {
      console.log(`🔄 Cache no inicializado, inicializando...`);
      await this.init();
    }
    
    if (!this.cache) {
      console.log(`⚠️ Cache API no disponible, usando preload fallback`);
      this.preloadImagesFallback(imageUrls);
      return;
    }

    console.log(`✅ Cache inicializado correctamente`);
    console.log(`🔄 Starting precache of ${imageUrls.length} images...`);
    
    const batchSize = 10;
    let cached = 0;
    let failed = 0;
    
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageUrls.length/batchSize)} (${batch.length} URLs)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (url) => {
          try {
            console.log(`⏳ Fetching: ${url}`);
            const response = await fetch(url);
            
            if (response.ok) {
              const clonedResponse = response.clone();
              await this.cache!.put(url, clonedResponse);
              
              // Actualizar registry para marcar como cacheada
              this.cacheCheckRegistry.set(url, true);
              
              cached++;
              console.log(`✅ Cached ${cached}/${imageUrls.length}: ${url.substring(0, 50)}...`);
              return { success: true, url };
            } else {
              console.warn(`⚠️ Bad response (${response.status}): ${url}`);
              failed++;
              return { success: false, url, error: `Status ${response.status}` };
            }
          } catch (error) {
            console.error(`❌ Failed to cache: ${url}`, error);
            failed++;
            return { success: false, url, error };
          }
        })
      );
      
      console.log(`📊 Batch complete: ${batchResults.filter(r => r.status === 'fulfilled' && r.value.success).length}/${batch.length} successful`);
      
      // Pausa pequeña entre batches para no saturar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`🎉 PRECACHING COMPLETE:`);
    console.log(`   ✅ Cached: ${cached}/${imageUrls.length} images`);
    console.log(`   ❌ Failed: ${failed}/${imageUrls.length} images`);
    console.log(`   ⏱️ Duration: ${duration}ms (${(duration/1000).toFixed(1)}s)`);
    
    // Verificar que realmente se guardaron
    const finalCacheSize = await this.getCacheSize();
    console.log(`🗂️ Final cache size: ${finalCacheSize.count} total images stored`);
  }

  // Fallback para browsers sin Cache API - usa preload de imágenes nativas
  private preloadImagesFallback(imageUrls: string[]): void {
    console.log(`🔄 Fallback: Preloading ${imageUrls.length} imágenes con <img> tags`);
    
    imageUrls.forEach((url, index) => {
      const img = new Image();
      img.onload = () => {
        console.log(`✅ Preloaded ${index + 1}/${imageUrls.length}: ${url.substring(0, 50)}...`);
        // Marcar como "cacheada" en el registry
        this.cacheCheckRegistry.set(url, true);
      };
      img.onerror = () => {
        console.warn(`❌ Failed to preload: ${url.substring(0, 50)}...`);
        this.cacheCheckRegistry.set(url, false);
      };
      
      // Iniciar la carga
      img.src = url;
      
      // Opcional: mantener referencia temporal para evitar garbage collection
      setTimeout(() => {
        // Limpiar referencia después de un tiempo
        img.src = '';
      }, 30000); // 30 segundos
    });
  }

  async getCachedImage(url: string): Promise<Response | null> {
    if (!this.cache) await this.init();
    if (!this.cache) return null;

    try {
      const cachedResponse = await this.cache.match(url);
      if (cachedResponse) {
        console.log(`🎯 Cache hit: ${url}`);
        return cachedResponse;
      }
    } catch (error) {
      console.error('Cache lookup failed:', error);
    }
    
    return null;
  }

  async getCachedImageUrl(url: string): Promise<string> {
    const cachedResponse = await this.getCachedImage(url);
    
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      const objectUrl = URL.createObjectURL(blob);
      console.log(`🖼️ Created blob URL from cache for: ${url}`);
      return objectUrl;
    }
    
    return url;
  }

  async isImageCached(url: string): Promise<boolean> {
    // Verificar primero en el registry para evitar llamadas repetidas al Cache API
    if (this.cacheCheckRegistry.has(url)) {
      const isInRegistry = this.cacheCheckRegistry.get(url)!;
      // console.log(`🔍 Cache check from registry: ${url} - ${isInRegistry ? 'HIT' : 'MISS'}`);
      return isInRegistry;
    }
    
    // Si no está en registry, verificar en Cache API
    const cached = await this.getCachedImage(url);
    const isCached = cached !== null;
    
    // Guardar resultado en registry
    this.cacheCheckRegistry.set(url, isCached);
    
    return isCached;
  }

  async clearCache(): Promise<void> {
    try {
      await caches.delete(this.cacheName);
      this.cacheCheckRegistry.clear(); // Limpiar también el registry
      console.log('🗑️ Image cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<{ count: number; urls: string[] }> {
    if (!this.cache) await this.init();
    if (!this.cache) return { count: 0, urls: [] };

    try {
      const keys = await this.cache.keys();
      return {
        count: keys.length,
        urls: keys.map(req => req.url)
      };
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return { count: 0, urls: [] };
    }
  }

  // 🔍 FUNCIÓN PARA VERIFICAR DÓNDE SE GUARDAN LAS IMÁGENES
  async inspectCacheStorage(): Promise<void> {
    console.log('🔍 === INSPECCIÓN DE CACHE STORAGE ===');
    
    try {
      // 1. Verificar si Cache API está disponible
      if (!('caches' in window)) {
        console.error('❌ Cache API no disponible en este browser');
        return;
      }
      
      // 2. Listar todos los caches disponibles
      const cacheNames = await caches.keys();
      console.log(`📂 Caches disponibles (${cacheNames.length}):`, cacheNames);
      
      // 3. Inspeccionar nuestro cache específico
      if (cacheNames.includes(this.cacheName)) {
        const ourCache = await caches.open(this.cacheName);
        const keys = await ourCache.keys();
        
        console.log(`🗂️ Nuestro cache '${this.cacheName}':`);
        console.log(`   📊 Total de imágenes: ${keys.length}`);
        console.log(`   📋 Primeras 5 URLs:`, keys.slice(0, 5).map(req => req.url));
        
        // 4. Verificar una imagen específica
        if (keys.length > 0) {
          const firstKey = keys[0];
          const cachedResponse = await ourCache.match(firstKey);
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            console.log(`✅ Imagen verificada: ${firstKey.url}`);
            console.log(`   📏 Tamaño: ${(blob.size / 1024).toFixed(1)} KB`);
            console.log(`   🎭 Tipo: ${blob.type}`);
          }
        }
      } else {
        console.log(`⚠️ Cache '${this.cacheName}' no encontrado`);
      }
      
      // 5. Información de ubicación del cache
      console.log('📍 === UBICACIÓN DEL CACHE ===');
      console.log('🖥️ Desktop - Chrome: %AppData%\\Local\\Google\\Chrome\\User Data\\Default\\Service Worker\\CacheStorage\\');
      console.log('🖥️ Desktop - Firefox: %AppData%\\Roaming\\Mozilla\\Firefox\\Profiles\\[profile]\\storage\\default\\[domain]\\cache\\');
      console.log('🖥️ Desktop - Edge: Similar a Chrome pero en carpeta Microsoft Edge');
      console.log('📱 Mobile: Almacenado en el directorio de datos de la app del browser');
      
    } catch (error) {
      console.error('❌ Error inspeccionando cache:', error);
    }
  }
}

export const imageCacheService = new ImageCacheService();