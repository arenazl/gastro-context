// Fallback para cuando Cache API no esté disponible
class ImageFallbackCacheService {
  private cacheName = 'gastro-images-fallback';
  private cacheIndex: Set<string> = new Set();

  async init(): Promise<void> {
    try {
      // Cargar índice desde localStorage
      const storedIndex = localStorage.getItem(`${this.cacheName}-index`);
      if (storedIndex) {
        this.cacheIndex = new Set(JSON.parse(storedIndex));
        console.log(`📋 Loaded fallback cache index: ${this.cacheIndex.size} items`);
      }
    } catch (error) {
      console.error('Failed to initialize fallback cache:', error);
    }
  }

  async precacheImages(imageUrls: string[]): Promise<void> {
    const startTime = performance.now();
    console.log(`🔄 FALLBACK: Precacheando ${imageUrls.length} URLs en memoria...`);
    
    let cached = 0;
    let failed = 0;
    
    // En lugar de Cache API, solo precargamos las imágenes en el navegador
    // Esto las mantiene en el cache HTTP del navegador
    for (let i = 0; i < imageUrls.length; i += 10) {
      const batch = imageUrls.slice(i, i + 10);
      console.log(`📦 Fallback batch ${Math.floor(i/10) + 1}/${Math.ceil(imageUrls.length/10)}`);
      
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            // Precargar imagen usando Image()
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = url;
            });
            
            // Marcar como cached en nuestro índice
            this.cacheIndex.add(url);
            cached++;
            
            if (cached % 50 === 0) {
              console.log(`✅ Fallback cached: ${cached}/${imageUrls.length}`);
            }
            
          } catch (error) {
            failed++;
          }
        })
      );
      
      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Guardar índice en localStorage
    try {
      localStorage.setItem(`${this.cacheName}-index`, JSON.stringify([...this.cacheIndex]));
    } catch (error) {
      console.warn('Could not save cache index to localStorage:', error);
    }
    
    const duration = Math.round(performance.now() - startTime);
    console.log(`🎉 FALLBACK COMPLETE:`);
    console.log(`   ✅ Cached: ${cached}/${imageUrls.length} images`);
    console.log(`   ❌ Failed: ${failed}/${imageUrls.length} images`);
    console.log(`   ⏱️ Duration: ${duration}ms (${(duration/1000).toFixed(1)}s)`);
    console.log(`   📋 Method: HTTP Cache + Memory preloading`);
  }

  async isImageCached(url: string): Promise<boolean> {
    // En fallback mode, consideramos cached si está en nuestro índice
    // (significa que se precargó exitosamente)
    return this.cacheIndex.has(url);
  }

  async getCacheSize(): Promise<{ count: number; urls: string[] }> {
    return {
      count: this.cacheIndex.size,
      urls: [...this.cacheIndex]
    };
  }

  async clearCache(): Promise<void> {
    this.cacheIndex.clear();
    localStorage.removeItem(`${this.cacheName}-index`);
    console.log('🗑️ Fallback cache cleared');
  }
}

export const imageFallbackCacheService = new ImageFallbackCacheService();