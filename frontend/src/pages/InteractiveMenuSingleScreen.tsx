import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import dataFetchService from '../services/dataFetchService';

import {
  ShoppingCartIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  category_name?: string;
  image_url?: string;
  stock_quantity?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CurrentView {
  type: 'idle' | 'user-query' | 'response' | 'product-selected';
  userQuery?: string;
  aiResponse?: string;
  products?: Product[];
  categorizedProducts?: Record<string, Product[]>;
  selectedProduct?: Product;
  pairings?: {
    left: Product[];
    right: Product[];
  };
  isIngredientsView?: boolean; // Flag para vista de ingredientes
}

export const InteractiveMenuSingleScreen: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentView, setCurrentView] = useState<CurrentView>({ type: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const [flyingProducts, setFlyingProducts] = useState<Array<{ product: Product, id: string, startPos: { x: number, y: number } }>>([]);
  const [activeCarousel, setActiveCarousel] = useState<'center' | 'left' | 'right'>('center');
  const [centerProduct, setCenterProduct] = useState<Product | null>(null);
  const [previousCenterProduct, setPreviousCenterProduct] = useState<Product | null>(null);
  const [pairingOrigin, setPairingOrigin] = useState<'left' | 'right' | null>(null);
  const [hidingCenterProduct, setHidingCenterProduct] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitioningProductId, setTransitioningProductId] = useState<number | null>(null);
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null); // 🎬 MENSAJE FLOTANTE PARA SALUDOS
  const [showCartDropdown, setShowCartDropdown] = useState(false); // Dropdown del carrito
  const [previousView, setPreviousView] = useState<CurrentView | null>(null); // Estado anterior antes de seleccionar producto

  const inputRef = useRef<HTMLInputElement>(null);
  const cartIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generar thread ID único
    const newThreadId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setThreadId(newThreadId);

    // Recuperar mensaje flotante si existe y no han pasado más de 5 segundos
    const savedMessage = sessionStorage.getItem('floatingMessage');
    const savedTime = sessionStorage.getItem('floatingMessageTime');
    if (savedMessage && savedTime) {
      const elapsed = Date.now() - parseInt(savedTime);
      if (elapsed < 5000) {
        setFloatingMessage(savedMessage);
        // Programar para que desaparezca en el tiempo restante
        setTimeout(() => {
          setFloatingMessage(null);
          sessionStorage.removeItem('floatingMessage');
          sessionStorage.removeItem('floatingMessageTime');
        }, 5000 - elapsed);
      } else {
        // Si ya pasaron los 5 segundos, limpiar
        sessionStorage.removeItem('floatingMessage');
        sessionStorage.removeItem('floatingMessageTime');
      }
    }
  }, []);

  const selectProductAndGetPairings = async (product: Product, fromSide?: 'left' | 'right') => {
    // Guardar el estado actual antes de seleccionar el producto
    if (!previousView && currentView.type === 'response') {
      setPreviousView(currentView);
    }
    
    // Si viene del costado, guardar el producto central actual y animar transición
    if (fromSide) {
      // Marcar el producto como en transición
      setTransitioningProductId(product.id);
      setIsTransitioning(true);
      setPairingOrigin(fromSide);
      
      const current = centerProduct || currentView.selectedProduct;
      if (current) {
        setPreviousCenterProduct(current);
      }
      
      // Delay para la animación visual
      setTimeout(() => {
        setCenterProduct(product);
        // Después de un poco más, quitar la marca de transición
        setTimeout(() => {
          setIsTransitioning(false);
          setTransitioningProductId(null);
          setPairingOrigin(null);
        }, 400);
      }, 300);
    } else {
      setCenterProduct(product);
      setPreviousCenterProduct(null);
      setPairingOrigin(null);
    }

    // Mostrar el producto seleccionado manteniendo los pairings anteriores para evitar parpadeo
    setCurrentView(prev => ({
      type: 'product-selected',
      selectedProduct: product,
      aiResponse: `¡Excelente elección! ${product.name}`,
      pairings: prev.pairings || { left: [], right: [] } // Mantener los pairings anteriores
    }));

    // Obtener maridajes de la IA
    try {
      const data = await dataFetchService.fetch(`${API_BASE_URL}/api/chat/pairings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product: product.name,
          category: product.category || product.category_name,
          threadId: threadId
        }),
        showNotification: false,
        cacheDuration: 5 * 60 * 1000
      });

      console.log('Maridajes recibidos:', data);

      // Dividir maridajes en dos grupos: entradas/acompañamientos a la izquierda, bebidas a la derecha
      const allPairings = data.pairings || [];
      
      // Separar por tipo de producto
      const appetizersAndSides = allPairings.filter((p: any) => 
        p.type === 'appetizer' || p.type === 'side' || 
        p.category_name?.toLowerCase().includes('entrada') ||
        p.category_name?.toLowerCase().includes('ensalada') ||
        p.category_name?.toLowerCase().includes('acompañamiento') ||
        p.category_name?.toLowerCase().includes('guarnici')
      );
      
      const beverages = allPairings.filter((p: any) => 
        p.type === 'wine' || p.type === 'beverage' || p.type === 'cocktail' ||
        p.category_name?.toLowerCase().includes('bebida') ||
        p.category_name?.toLowerCase().includes('vino') ||
        p.category_name?.toLowerCase().includes('cerveza') ||
        p.category_name?.toLowerCase().includes('jugo') ||
        p.category_name?.toLowerCase().includes('agua')
      );
      
      // Si no hay separación clara, dividir por la mitad
      const leftPairings = appetizersAndSides.length > 0 ? appetizersAndSides.slice(0, 4) : allPairings.slice(0, 4);
      const rightPairings = beverages.length > 0 ? beverages.slice(0, 4) : allPairings.slice(4, 8);

      console.log('Maridajes procesados:', {
        total: allPairings.length,
        entradas: leftPairings,
        bebidas: rightPairings
      });

      setCurrentView(prev => ({
        ...prev,
        pairings: {
          left: leftPairings,
          right: rightPairings
        }
      }));
    } catch (error) {
      console.error('Error obteniendo maridajes:', error);
    }
  };

  const addToCart = (product: Product, event: React.MouseEvent) => {
    // Obtener posición del producto clickeado
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    // Crear animación de vuelo
    const flyId = `fly-${Date.now()}-${Math.random()}`;
    setFlyingProducts(prev => [...prev, { product, id: flyId, startPos }]);
    
    // Si es el producto del centro, ocultarlo y volver al estado anterior
    if (currentView.selectedProduct && product.id === currentView.selectedProduct.id) {
      setHidingCenterProduct(true);
      
      // Después de agregar al carrito, volver al estado anterior (carrusel con pairings)
      setTimeout(() => {
        // Restaurar el estado anterior si existe, sino mantener la respuesta actual
        if (previousView && previousView.type === 'response') {
          setCurrentView(previousView);
          setPreviousView(null); // Limpiar el estado guardado
        } else {
          // Si no hay estado anterior, mantener el carrusel pero sin producto seleccionado
          setCurrentView(prev => ({
            ...prev,
            selectedProduct: null,
            pairings: prev.pairings // Mantener los pairings laterales
          }));
        }
        setHidingCenterProduct(false);
        setCenterProduct(null);
        setPreviousCenterProduct(null);
      }, 800);
    }

    // Agregar al carrito después de la animación
    setTimeout(() => {
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });

      // Eliminar producto volador
      setFlyingProducts(prev => prev.filter(p => p.id !== flyId));
    }, 600);
  };

  const handleUserInput = async () => {
    if (!userInput.trim() || isLoading) return;

    const userText = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Mostrar query del usuario en el centro
    setCurrentView({
      type: 'user-query',
      userQuery: userText
    });

    // Después de 2 segundos, cambiar a respuesta
    setTimeout(async () => {
      try {
        const data = await dataFetchService.fetch(API_ENDPOINTS.chatMenuAI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            threadId: threadId
          }),
          showNotification: true,
          cacheDuration: 10 * 60 * 1000, // Cache por 10 minutos
          cacheKey: `chat_${userText.toLowerCase().trim()}` // Cache por query
        });

        // 🎬 SI ES SALUDO CON MENSAJE FLOTANTE - USANDO SESSIONSTORAGE
        if (data.query_type === 'greeting' && data.show_animated_message) {
          setFloatingMessage(data.response);
          // También guardar en sessionStorage para persistir entre re-renders
          sessionStorage.setItem('floatingMessage', data.response);
          sessionStorage.setItem('floatingMessageTime', Date.now().toString());
          // Hacer que desaparezca a los 5 segundos
          setTimeout(() => {
            setFloatingMessage(null);
            sessionStorage.removeItem('floatingMessage');
            sessionStorage.removeItem('floatingMessageTime');
          }, 5000);
          // Poner vista idle para no romper el renderizado
          setCurrentView({ type: 'idle' });
        } else {
          // Respuesta normal
          // Convertir array a objeto si es necesario
          let categorizedProds = {};
          if (Array.isArray(data.categorizedProducts)) {
            // Si es un array, agruparlo por categoría
            categorizedProds = data.categorizedProducts.reduce((acc, product) => {
              const category = product.category || 'General';
              if (!acc[category]) acc[category] = [];
              acc[category].push(product);
              return acc;
            }, {});
          } else if (data.categorizedProducts) {
            categorizedProds = data.categorizedProducts;
          }

          // Detectar si es respuesta de ingredientes
          if (data.query_type === 'specific_product_ingredients' && data.recommendedProducts?.length === 1) {
            // Vista especial para ingredientes: producto + explicación
            setCurrentView({
              type: 'response',
              aiResponse: data.response,
              products: data.recommendedProducts,
              isIngredientsView: true // Flag para renderizado especial
            });
          } else {
            // Vista normal con categorías
            setCurrentView({
              type: 'response',
              aiResponse: data.response,
              categorizedProducts: categorizedProds,
              products: data.recommendedProducts || []
            });
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 overflow-hidden relative">
      {/* Partículas de fondo animadas */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Carrito con dropdown integrado - posición relativa para dropdown */}
      <div className="fixed top-6 right-8 z-50">
        <div className="relative">
          <motion.div
            ref={cartIconRef}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCartDropdown(!showCartDropdown)}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-md rounded-full p-4 shadow-2xl cursor-pointer"
          >
            <ShoppingCartIcon className="w-8 h-8 text-white" />
            {cartTotal > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 rounded-full w-7 h-7 flex items-center justify-center text-base font-bold shadow-lg"
              >
                {cartTotal}
              </motion.div>
            )}
          </motion.div>
          
          {/* Dropdown del carrito - posicionado absolutamente debajo del ícono */}
          <AnimatePresence>
            {showCartDropdown && cart.length > 0 && (
              <motion.div
                initial={{ y: -20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute right-0 top-16 bg-white rounded-2xl shadow-2xl p-4 min-w-[300px] max-w-[350px]"
              >
                <h3 className="font-bold text-gray-800 mb-3 text-lg">Tu pedido</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <span className="text-xs text-gray-500 block">x{item.quantity}</span>
                      </div>
                      <span className="font-semibold text-purple-600">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3">
                  <div className="flex justify-between font-bold mb-3">
                    <span>Total:</span>
                    <span className="text-purple-600 text-xl">${cartTotal.toFixed(2)}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold"
                  >
                    Confirmar Pedido
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Productos volando al carrito */}

      <AnimatePresence>
        {Array.isArray(flyingProducts) && flyingProducts.map(({ product, id, startPos }) => {

          const cartPos = cartIconRef.current?.getBoundingClientRect();
          return (
            <motion.div
              key={id}
              className="fixed z-50 pointer-events-none"
              initial={{
                x: startPos.x,
                y: startPos.y,
                scale: 1,
                opacity: 1
              }}
              animate={{
                x: [startPos.x, startPos.x, cartPos?.left || window.innerWidth - 100],
                y: [startPos.y, startPos.y - 100, cartPos?.top || 50],
                scale: [1, 0.8, 0.2],
                opacity: [1, 0.9, 0.8]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                times: [0, 0.4, 1]
              }}
            >
              <div className="bg-white rounded-lg p-2 shadow-xl">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <AnimatePresence mode="wait">
          {/* Estado idle - Bienvenida */}
          {currentView.type === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <SparklesIcon className="w-24 h-24 text-white/80 mx-auto mb-6" />
              </motion.div>
              <h1 className="text-5xl font-bold text-white mb-4">
                ¡Hola! ¿Qué te gustaría hoy?
              </h1>
              <p className="text-white/70 text-xl">
                Escribí lo que se te antoje y te mostraré las mejores opciones
              </p>
            </motion.div>
          )}

          {/* Query del usuario en el centro */}
          {currentView.type === 'user-query' && (
            <motion.div
              key="query"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 1.2 }}
              className="text-center"
            >
              <motion.h2
                className="text-6xl font-bold text-white"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                "{currentView.userQuery}"
              </motion.h2>
              <motion.div className="mt-8">
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-4 h-4 bg-white rounded-full"
                      animate={{ y: [0, -20, 0] }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.1,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Vista especial para ingredientes */}
          {currentView.type === 'response' && currentView.isIngredientsView && currentView.products && (
            <motion.div
              key="ingredients-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 flex gap-8">
                {/* Producto a la izquierda */}
                <div className="flex-shrink-0 w-1/3">
                  {currentView.products[0] && (
                    <div className="text-center">
                      {currentView.products[0].image_url ? (
                        <img
                          src={currentView.products[0].image_url}
                          alt={currentView.products[0].name}
                          className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl mb-4" />
                      )}
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {currentView.products[0].name}
                      </h3>
                      <p className="text-3xl font-bold text-purple-600">
                        ${(currentView.products[0].price || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Descripción de ingredientes a la derecha */}
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">¿Qué tiene?</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {currentView.aiResponse}
                  </p>
                  
                  {/* Botón para agregar al carrito */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => currentView.products[0] && addToCart(currentView.products[0], e)}
                    className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    Agregar al carrito
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Respuesta normal con productos */}
          {currentView.type === 'response' && !currentView.isIngredientsView && currentView.categorizedProducts && (
            <motion.div
              key="response"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-6xl"
            >
              {/* Respuesta de la IA */}
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white text-center mb-8"
              >
                {currentView.aiResponse}
              </motion.h2>

              {/* Acordeón de categorías */}
              <div className="category-accordion" style={{ zIndex: 1 }}>
                <ul>
                  {Object.entries(currentView.categorizedProducts).slice(0, 4).map(([category, products], index) => {
                    // Obtener una imagen aleatoria de los productos que tengan imagen
                    const productsWithImages = products.filter(p => p.image_url);
                    const randomProduct = productsWithImages.length > 0 
                      ? productsWithImages[Math.floor(Math.random() * productsWithImages.length)]
                      : products[0];
                    const backgroundImage = randomProduct?.image_url;
                    
                    return (
                      <li key={category} className={Object.keys(currentView.categorizedProducts).length === 1 ? 'auto-expanded' : ''}>
                        <div className="category-title relative overflow-hidden">
                          {/* Imagen de fondo con blur suave */}
                          {backgroundImage && (
                            <div 
                              className="absolute inset-0 z-0"
                              style={{
                                backgroundImage: `url(${backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(2px) brightness(0.7) saturate(1.2)',
                                transform: 'scale(1.05)' // Para evitar bordes blancos por el blur
                              }}
                            />
                          )}
                          {/* Overlay gradiente más suave */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 z-10" />
                          
                          {/* Contenido del título */}
                          <div className="relative z-20 flex items-center justify-between h-full px-8">
                            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                              {category}
                            </h3>
                            <span className="text-white/90 ml-auto font-medium drop-shadow">
                              {products.length} opciones
                            </span>
                          </div>
                        </div>

                      <div className="category-products">
                        <div className="products-grid-accordion">
                          {products.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              className="inline-block"
                              style={{ minWidth: '200px' }}
                            >
                              <div
                                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 cursor-pointer hover:shadow-xl transition-shadow h-[280px] flex flex-col"
                                onClick={() => selectProductAndGetPairings(product)}
                              >
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-36 object-cover rounded-lg mb-2 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-full h-36 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-2 flex-shrink-0" />
                                )}
                                <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{product.name}</h4>
                                <p className="text-xs text-gray-600 line-clamp-2 flex-grow">{product.description}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-lg font-bold text-purple-600">
                                    ${(product.price || 0).toFixed(2)}
                                  </span>
                                  <motion.div
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.8 }}
                                    className="bg-purple-600 text-white rounded-full p-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Vista con producto seleccionado y maridajes */}
          {currentView.type === 'product-selected' && currentView.selectedProduct && (
            <motion.div
              key="product-selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex items-center justify-center relative"
            >
              {/* Carrusel izquierdo de entradas/acompañamientos */}
              <motion.div
                className={`absolute left-20 top-[45%] -translate-y-1/2 ${
                  activeCarousel === 'left' ? 'z-30' : 'z-10'
                }`}
                onMouseEnter={() => setActiveCarousel('left')}
                initial={{ opacity: 0, x: -100 }}
                animate={{
                  opacity: 1,
                  x: activeCarousel === 'left' ? 20 : 0,
                  scale: activeCarousel === 'left' ? 1.05 : 1,
                  y: [0, -10, 0] // Animación flotante
                }}
                transition={{ 
                  x: { type: 'spring', damping: 20 },
                  scale: { type: 'spring', damping: 15 },
                  y: { 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 w-80 shadow-2xl">
                  <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                    <span className="text-2xl">🥗</span>
                    Entradas y Acompañamientos
                  </h3>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {currentView.pairings?.left.map((pairing: any, index: number) => {
                      console.log('Pairing izquierdo:', pairing);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08, type: 'spring', damping: 20 }}
                          whileHover={{ 
                            x: 10, 
                            scale: 1.03,
                            transition: { duration: 0.2 }
                          }}
                          className="bg-white/95 rounded-lg p-3 cursor-pointer hover:bg-white transition-colors flex items-center gap-3 shadow-md"
                          onClick={() => selectProductAndGetPairings(pairing, 'left')}
                        >
                          {pairing.image_url ? (
                            <img
                              src={pairing.image_url}
                              alt={pairing.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{pairing.name}</h4>
                            <p className="text-xs text-gray-600 truncate">{pairing.description}</p>
                            <span className="text-purple-600 font-bold text-sm">${typeof pairing.price === 'number' ? pairing.price.toFixed(2) : '0.00'}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Producto central seleccionado */}
              <motion.div
                className="relative z-20"
                onMouseEnter={() => setActiveCarousel('center')}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: activeCarousel === 'center' ? 1.05 : 1,
                  y: activeCarousel === 'center' ? -5 : 0
                }}
                transition={{ 
                  type: 'spring', 
                  damping: 15,
                  stiffness: 100
                }}
              >
                <motion.div 
                  className="bg-white rounded-3xl shadow-2xl p-4 md:p-6 lg:p-8 max-w-xs md:max-w-sm lg:max-w-md w-full"
                  animate={{
                    scale: hidingCenterProduct ? 0 : 1,
                    opacity: hidingCenterProduct ? 0 : 1,
                    y: hidingCenterProduct ? -100 : [0, -5, 0],
                  }}
                  transition={{
                    scale: { duration: 0.6, ease: "easeInOut" },
                    opacity: { duration: 0.3 },
                    y: {
                      duration: hidingCenterProduct ? 0.6 : 4,
                      repeat: hidingCenterProduct ? 0 : Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  {currentView.selectedProduct.image_url ? (
                    <img
                      src={currentView.selectedProduct.image_url}
                      alt={currentView.selectedProduct.name}
                      className="w-full h-32 md:h-48 lg:h-64 object-cover rounded-2xl mb-3 md:mb-4"
                    />
                  ) : (
                    <div className="w-full h-32 md:h-48 lg:h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-3 md:mb-4" />
                  )}
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">{currentView.selectedProduct.name}</h2>
                  <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{currentView.selectedProduct.description}</p>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600">
                      ${(currentView.selectedProduct.price || 0).toFixed(2)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => addToCart(currentView.selectedProduct!, e)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl font-semibold shadow-lg w-full md:w-auto"
                    >
                      Agregar al carrito
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Carrusel derecho de bebidas */}
              <motion.div
                className={`absolute right-20 top-[45%] -translate-y-1/2 ${
                  activeCarousel === 'right' ? 'z-30' : 'z-10'
                }`}
                onMouseEnter={() => setActiveCarousel('right')}
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: 1,
                  x: activeCarousel === 'right' ? -20 : 0,
                  scale: activeCarousel === 'right' ? 1.05 : 1,
                  y: [0, 10, 0] // Animación flotante opuesta
                }}
                transition={{ 
                  x: { type: 'spring', damping: 20 },
                  scale: { type: 'spring', damping: 15 },
                  y: { 
                    duration: 3,
                    delay: 1.5, // Desfase para que no floten al mismo tiempo
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 w-80 shadow-2xl">
                  <h3 className="text-white font-bold mb-3 text-lg flex items-center gap-2">
                    <span className="text-2xl">🍷</span>
                    Bebidas Recomendadas
                  </h3>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {currentView.pairings?.right.map((pairing: any, index: number) => {
                      console.log('Pairing derecho:', pairing);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08, type: 'spring', damping: 20 }}
                          whileHover={{ 
                            x: -10, 
                            scale: 1.03,
                            transition: { duration: 0.2 }
                          }}
                          className="bg-white/95 rounded-lg p-3 cursor-pointer hover:bg-white transition-colors flex items-center gap-3 shadow-md"
                          onClick={() => selectProductAndGetPairings(pairing, 'right')}
                        >
                          {pairing.image_url ? (
                            <img
                              src={pairing.image_url}
                              alt={pairing.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{pairing.name}</h4>
                            <p className="text-xs text-gray-600 truncate">{pairing.description}</p>
                            <span className="text-purple-600 font-bold text-sm">${typeof pairing.price === 'number' ? pairing.price.toFixed(2) : '0.00'}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Botón para volver */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-8 left-8 text-white/80 hover:text-white"
                onClick={() => setCurrentView({ type: 'idle' })}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input fijo abajo */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent"
        style={{ zIndex: 100 }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => {
                console.log("📝 Escribiendo:", e.target.value);
                setUserInput(e.target.value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
              placeholder="Escribí qué tenés ganas..."
              className="w-full px-6 py-4 pr-14 text-lg bg-white/90 backdrop-blur-md border-2 border-purple-400 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                console.log("🔴🔴🔴 BOTÓN CLICKEADO 🔴🔴🔴");
                console.log("userInput actual:", userInput);
                console.log("isLoading:", isLoading);
                handleUserInput();
              }}
              disabled={isLoading || !userInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 🎬 MENSAJE FLOTANTE PARA SALUDOS */}
      <AnimatePresence>
        {floatingMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 300,
              duration: 0.6
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            style={{ zIndex: 9999 }}
          >
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl px-10 py-8 shadow-2xl max-w-2xl text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-6xl font-bold text-white mb-3"
                style={{
                  textShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}
              >
                {floatingMessage}
              </motion.p>

              {/* Barra de progreso que se desvanece */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{
                  duration: 5,
                  ease: "linear"
                }}
                className="h-1 bg-white/30 rounded-full mt-4 mx-auto w-48"
                style={{ transformOrigin: "left" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal del Carrito - DESACTIVADO, usando dropdown ahora */}
      <AnimatePresence>
        {false && showCartDropdown && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartDropdown(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal del Carrito */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 h-full flex flex-col">
                {/* Header del Modal */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <ShoppingCartIcon className="w-8 h-8 text-purple-600" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Tu Carrito
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCartDropdown(false)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </motion.button>
                </div>
                
                {/* Contenido del Carrito */}
                <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ShoppingCartIcon className="w-24 h-24 mb-4 opacity-30" />
                      <p className="text-xl">Tu carrito está vacío</p>
                      <p className="text-sm mt-2">¡Agrega algunos productos deliciosos!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-gray-50 rounded-xl p-4 flex items-center gap-4"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg" />
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <p className="text-sm text-gray-500">${(item.price || 0).toFixed(2)} c/u</p>
                          </div>
                          
                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (item.quantity > 1) {
                                  setCart(prev => prev.map(i => 
                                    i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
                                  ));
                                } else {
                                  setCart(prev => prev.filter(i => i.id !== item.id));
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              <span className="text-lg">−</span>
                            </motion.button>
                            
                            <span className="font-bold text-lg w-12 text-center">{item.quantity}</span>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setCart(prev => prev.map(i => 
                                  i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                                ));
                              }}
                              className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center"
                            >
                              <span className="text-lg text-purple-600">+</span>
                            </motion.button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg text-purple-600">
                              ${((item.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Footer con Total y Botones */}
                {cart.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-2xl font-bold">Total:</span>
                      <motion.span
                        key={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-bold text-purple-600"
                      >
                        ${cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0).toFixed(2)}
                      </motion.span>
                    </div>
                    
                    <div className="flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setCart([]);
                          setShowCartDropdown(false);
                        }}
                        className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 font-semibold hover:bg-gray-50"
                      >
                        Vaciar Carrito
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg"
                        onClick={() => {
                          // Aquí iría la lógica para procesar el pedido
                          alert('¡Procesando tu pedido!');
                          setShowCartDropdown(false);
                        }}
                      >
                        Procesar Pedido
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};