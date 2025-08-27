import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { imageCacheService } from '../services/imageCache.service';

interface ImageWithSkeletonProps {
  src?: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  skeletonClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  fallbackSrc = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  className = '',
  skeletonClassName = '',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [actualSrc, setActualSrc] = useState<string>('');
  const blobUrlRef = useRef<string | null>(null);

  // Obtener imagen del caché o URL original
  const getImageSource = async (imageSrc: string): Promise<string> => {
    const cachedUrl = await imageCacheService.getCachedImageUrl(imageSrc);
    return cachedUrl;
  };

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const imageToLoad = src || fallbackSrc;

    // Verificar primero si la imagen está en cache
    imageCacheService.isImageCached(imageToLoad).then(async (inCache) => {
      if (inCache) {
        // Si está en cache, cargar inmediatamente desde el caché
        console.log(`🎯 Image from cache: ${imageToLoad}`);
        const cachedUrl = await getImageSource(imageToLoad);
        if (cachedUrl.startsWith('blob:')) {
          blobUrlRef.current = cachedUrl;
        }
        setShouldLoad(true);
        setActualSrc(cachedUrl);
        setIsLoading(false);
        return;
      }

      console.log(`📥 Image not cached, lazy loading: ${imageToLoad}`);
      // Si no está en cache, usar Intersection Observer
      const observer = new IntersectionObserver(
        async (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
            // Intentar obtener del caché primero
            const sourceUrl = await getImageSource(imageToLoad);
            if (sourceUrl.startsWith('blob:')) {
              blobUrlRef.current = sourceUrl;
            }
            setActualSrc(sourceUrl);
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
      
      return () => observer.disconnect();
    });
    // Cleanup blob URLs
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src, fallbackSrc, shouldLoad]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    if (src && src !== fallbackSrc) {
      setActualSrc(fallbackSrc);
    }
    onError?.();
  };

  // Skeleton component con animación tipo Facebook
  const SkeletonLoader = () => (
    <div className={`relative overflow-hidden bg-gray-200 ${className} ${skeletonClassName}`}>
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 transform -skew-x-12 animate-shimmer"
          style={{
            animation: 'shimmer 1.5s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Content placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-20 mx-auto"></div>
            <div className="h-2 bg-gray-300 rounded w-16 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {/* Skeleton loader */}
        {(isLoading || !shouldLoad) && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <SkeletonLoader />
          </motion.div>
        )}

        {/* Actual image */}
        {shouldLoad && (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${actualSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Hidden img element for loading detection */}
            <img
              src={actualSrc}
              alt={alt}
              className="opacity-0 absolute inset-0 w-full h-full"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">Error al cargar</p>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS para la animación shimmer
const shimmerStyles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = shimmerStyles;
  document.head.appendChild(styleSheet);
}