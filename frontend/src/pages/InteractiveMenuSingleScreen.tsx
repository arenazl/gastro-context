import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null); // 🎬 MENSAJE FLOTANTE PARA SALUDOS

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
    // Si viene del costado, guardar el producto central actual
    if (fromSide) {
      const current = centerProduct || currentView.selectedProduct;
      if (current) {
        setPreviousCenterProduct(current);
      }
      setCenterProduct(product);
      setPairingOrigin(fromSide);
    } else {
      setCenterProduct(product);
      setPreviousCenterProduct(null);
      setPairingOrigin(null);
    }

    // Mostrar el producto seleccionado
    setCurrentView({
      type: 'product-selected',
      selectedProduct: product,
      aiResponse: `¡Excelente elección! ${product.name}`,
      pairings: { left: [], right: [] }
    });

    // Obtener maridajes de la IA
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/pairings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product: product.name,
          category: product.category || product.category_name,
          threadId: threadId
        })
      });

      const data = await response.json();
      console.log('Maridajes recibidos:', data);

      // Dividir maridajes en dos grupos (izquierda y derecha)
      const allPairings = data.pairings || [];
      const midPoint = Math.ceil(allPairings.length / 2);

      console.log('Maridajes procesados:', {
        total: allPairings.length,
        left: allPairings.slice(0, midPoint),
        right: allPairings.slice(midPoint)
      });

      setCurrentView(prev => ({
        ...prev,
        pairings: {
          left: allPairings.slice(0, midPoint),
          right: allPairings.slice(midPoint)
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

    // Agregar al carrito después de la animación
    setTimeout(() => {
      setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { product, quantity: 1 }];
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
        const response = await fetch(API_ENDPOINTS.chatMenuAI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            threadId: threadId
          })
        });

        const data = await response.json();

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
          setCurrentView({
            type: 'response',
            aiResponse: data.response,
            categorizedProducts: data.categorizedProducts || {},
            products: data.recommendedProducts || []
          });
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

      {/* Carrito flotante */}
      <motion.div
        ref={cartIconRef}
        className="fixed top-8 right-8 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl cursor-pointer">
            <ShoppingCartIcon className="w-8 h-8 text-purple-600" />
            {cartTotal > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
              >
                {cartTotal}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Productos volando al carrito */}

      //cheqyear array

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
                x: cartPos?.left || window.innerWidth - 100,
                y: cartPos?.top || 50,
                scale: 0.2,
                opacity: 0.8
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
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

          {/* Respuesta con productos */}
          {currentView.type === 'response' && currentView.categorizedProducts && (
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
                  {Object.entries(currentView.categorizedProducts).slice(0, 4).map(([category, products], index) => (
                    <li key={category} className={Object.keys(currentView.categorizedProducts).length === 1 ? 'auto-expanded' : ''}>
                      <div className="category-title">
                        <h3 className="text-2xl font-bold text-white">
                          {category}
                        </h3>
                        <span className="text-white/80 ml-auto">
                          {products.length} opciones
                        </span>
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
                                    ${product.price.toFixed(2)}
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
                  ))}
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
              {/* Carrusel izquierdo de maridajes */}
              <motion.div
                className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-500 ${activeCarousel === 'left' ? 'z-30 scale-110' : 'z-10 scale-90 opacity-70'
                  }`}
                onMouseEnter={() => setActiveCarousel('left')}
                animate={{
                  x: activeCarousel === 'left' ? 200 : 0,
                  scale: activeCarousel === 'left' ? 1.1 : 0.9
                }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-64">
                  <h3 className="text-white font-bold mb-3">Maridajes</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentView.pairings?.left.map((pairing: any, index: number) => {
                      console.log('Pairing izquierdo:', pairing);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/80 rounded-lg p-2 cursor-pointer hover:bg-white/90 flex items-center gap-2"
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
                className={`relative z-20 transition-all duration-500 ${activeCarousel === 'center' ? 'scale-100' : 'scale-90'
                  }`}
                onMouseEnter={() => setActiveCarousel('center')}
                animate={{
                  scale: activeCarousel === 'center' ? 1 : 0.95
                }}
              >
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md">
                  {currentView.selectedProduct.image_url ? (
                    <img
                      src={currentView.selectedProduct.image_url}
                      alt={currentView.selectedProduct.name}
                      className="w-full h-64 object-cover rounded-2xl mb-4"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4" />
                  )}
                  <h2 className="text-3xl font-bold mb-2">{currentView.selectedProduct.name}</h2>
                  <p className="text-gray-600 mb-4">{currentView.selectedProduct.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-4xl font-bold text-purple-600">
                      ${currentView.selectedProduct.price.toFixed(2)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => addToCart(currentView.selectedProduct!, e)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      Agregar al carrito
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Carrusel derecho de maridajes */}
              <motion.div
                className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-500 ${activeCarousel === 'right' ? 'z-30 scale-110' : 'z-10 scale-90 opacity-70'
                  }`}
                onMouseEnter={() => setActiveCarousel('right')}
                animate={{
                  x: activeCarousel === 'right' ? -200 : 0,
                  scale: activeCarousel === 'right' ? 1.1 : 0.9
                }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-64">
                  <h3 className="text-white font-bold mb-3">Bebidas</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentView.pairings?.right.map((pairing: any, index: number) => {
                      console.log('Pairing derecho:', pairing);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/80 rounded-lg p-2 cursor-pointer hover:bg-white/90 flex items-center gap-2"
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
    </div>
  );
};