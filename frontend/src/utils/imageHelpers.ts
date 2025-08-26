/**
 * Helper para manejar URLs de imágenes de productos
 * Centraliza la lógica para construir URLs desde diferentes fuentes
 */

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'https://sisbarrios.s3.sa-east-1.amazonaws.com';
const IMAGE_PATH_PREFIX = import.meta.env.VITE_IMAGE_PATH_PREFIX || 'gastro/products/';
const IMAGE_STORAGE_TYPE = import.meta.env.VITE_IMAGE_STORAGE_TYPE || 's3';

/**
 * Construye la URL completa de una imagen
 * @param imagePath - Puede ser:
 *   - URL completa (https://...)
 *   - Path relativo (gastro/products/pizza.jpg)
 *   - Solo nombre (pizza.jpg)
 * @returns URL completa de la imagen
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  // Si no hay imagen, retornar placeholder
  if (!imagePath) {
    return `${IMAGE_BASE_URL}/${IMAGE_PATH_PREFIX}hamburguesa-clasica.jpg`;
  }

  // Si ya es una URL completa, devolverla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Si ya incluye el prefijo, construir URL
  if (imagePath.startsWith(IMAGE_PATH_PREFIX)) {
    return `${IMAGE_BASE_URL}/${imagePath}`;
  }

  // Si es solo el nombre del archivo, agregar prefijo completo
  return `${IMAGE_BASE_URL}/${IMAGE_PATH_PREFIX}${imagePath}`;
}

/**
 * Obtiene la URL de imagen por nombre de producto
 * @param productName - Nombre del producto
 * @returns URL de la imagen correspondiente
 */
export function getImageByProductName(productName: string): string {
  // Normalizar nombre para buscar imagen
  const normalizedName = productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return getImageUrl(`${normalizedName}.jpg`);
}

/**
 * Mapeo directo de nombres de productos a imágenes
 */
export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  // Hamburguesas
  'Hamburguesa Clásica': 'hamburguesa-clasica.jpg',
  'Hamburguesa Doble': 'hamburguesa-doble.jpg',
  'Hamburguesa con Bacon': 'hamburguesa-bacon.jpg',
  'Hamburguesa Vegetariana': 'hamburguesa-vegetariana.jpg',
  
  // Pizzas
  'Pizza Margherita': 'pizza-margherita.jpg',
  'Pizza Pepperoni': 'pizza-pepperoni.jpg',
  'Pizza 4 Quesos': 'pizza-cuatro-quesos.jpg',
  'Pizza Hawaiana': 'pizza-hawaiana.jpg',
  
  // Carnes
  'Bife de Chorizo': 'bife-de-chorizo.jpg',
  'Asado de Tira': 'asado-de-tira.jpg',
  'Pollo al Grill': 'pollo-al-grill.jpg',
  'Salmón Grillado': 'salmon-grillado.jpg',
  
  // Bebidas
  'Coca Cola': 'coca-cola.jpg',
  'Cerveza': 'cerveza-artesanal.jpg',
  'Vino Tinto': 'vino-tinto.jpg',
  'Agua Mineral': 'agua-mineral.jpg',
};

/**
 * Obtiene imagen desde el mapeo o genera una por defecto
 */
export function getProductImage(productName: string, currentImageUrl?: string): string {
  // Si ya tiene una URL válida, usarla
  if (currentImageUrl) {
    return getImageUrl(currentImageUrl);
  }

  // Buscar en el mapeo
  const mappedImage = PRODUCT_IMAGE_MAP[productName];
  if (mappedImage) {
    return getImageUrl(mappedImage);
  }

  // Generar nombre basado en el producto
  return getImageByProductName(productName);
}

/**
 * Verifica si el storage es S3
 */
export function isS3Storage(): boolean {
  return IMAGE_STORAGE_TYPE === 's3';
}

/**
 * Obtiene la configuración actual de imágenes
 */
export function getImageConfig() {
  return {
    baseUrl: IMAGE_BASE_URL,
    pathPrefix: IMAGE_PATH_PREFIX,
    storageType: IMAGE_STORAGE_TYPE,
  };
}