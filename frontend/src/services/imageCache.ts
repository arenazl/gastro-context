class ImageCacheService {
  private cache: Map<string, string> = new Map();
  private loadingImages: Map<string, Promise<string>> = new Map();
  private categoryImages: Map<number, Set<string>> = new Map();
  
  async preloadImage(url: string): Promise<string> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    
    if (this.loadingImages.has(url)) {
      return this.loadingImages.get(url)!;
    }
    
    const loadPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.src = url;
      
      img.onload = () => {
        this.cache.set(url, url);
        this.loadingImages.delete(url);
        resolve(url);
      };
      
      img.onerror = () => {
        this.loadingImages.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
    });
    
    this.loadingImages.set(url, loadPromise);
    return loadPromise;
  }
  
  async preloadCategoryImages(categoryId: number, imageUrls: string[]) {
    if (!this.categoryImages.has(categoryId)) {
      this.categoryImages.set(categoryId, new Set());
    }
    
    const categorySet = this.categoryImages.get(categoryId)!;
    
    const promises = imageUrls
      .filter(url => url && !categorySet.has(url))
      .map(url => {
        categorySet.add(url);
        return this.preloadImage(url).catch(err => {
          console.warn(`Failed to preload image: ${url}`, err);
          return null;
        });
      });
    
    await Promise.allSettled(promises);
  }
  
  clearCategoryCache(categoryId: number) {
    const categorySet = this.categoryImages.get(categoryId);
    if (categorySet) {
      categorySet.forEach(url => {
        this.cache.delete(url);
      });
      this.categoryImages.delete(categoryId);
    }
  }
  
  clearAllCache() {
    this.cache.clear();
    this.loadingImages.clear();
    this.categoryImages.clear();
  }
  
  getCacheSize(): number {
    return this.cache.size;
  }
  
  isImageCached(url: string): boolean {
    return this.cache.has(url);
  }
  
  getCategoryProgress(categoryId: number): { loaded: number; total: number } {
    const categorySet = this.categoryImages.get(categoryId);
    if (!categorySet) {
      return { loaded: 0, total: 0 };
    }
    
    let loaded = 0;
    categorySet.forEach(url => {
      if (this.cache.has(url)) {
        loaded++;
      }
    });
    
    return { loaded, total: categorySet.size };
  }
}

export const imageCache = new ImageCacheService();
export default imageCache;