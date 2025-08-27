import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useParams } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  ingredients?: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ConversationStep {
  id: string;
  type: 'question' | 'response' | 'products' | 'pairing' | 'categorized_products' | 'casual_response';
  content: string;
  products?: Product[];
  categorizedProducts?: Record<string, Product[]>;
  pairings?: Array<{
    name: string;
    description: string;
    type: 'wine' | 'beverage' | 'side';
  }>;
  ingredients?: Array<{
    name: string;
    name_en?: string;
    quantity?: number;
    unit?: string;
    is_optional?: boolean;
    is_allergen?: boolean;
    allergen_type?: string;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    image_url?: string;
  }>;
  visible: boolean;
}

export const InteractiveMenuAI: React.FC = () => {
  const { tableId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userInput, setUserInput] = useState('');
  const [conversationSteps, setConversationSteps] = useState<ConversationStep[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMenuButton, setShowMenuButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStage, setConversationStage] = useState<'initial' | 'pairings' | 'beverages'>('initial');
  const [selectedFood, setSelectedFood] = useState<Product | null>(null);
  const [selectedPairing, setSelectedPairing] = useState<Product | null>(null);
  const [threadId, setThreadId] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<'ingredients' | 'pairing' | 'beverage' | 'completed'>('ingredients');
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [fadeOutSteps, setFadeOutSteps] = useState(false); // Para hacer fade out cuando el usuario empiece a escribir
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null); // 🎬 MENSAJE FLOTANTE PARA SALUDOS
  const [debugInfo, setDebugInfo] = useState<string>(''); // 🐛 INFO DE DEBUG
  const inputRef = useRef<HTMLInputElement>(null);
  const pairingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const beverageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Componente de fondo dinámico con imágenes rotando
  const DynamicBackground: React.FC<{ stage: 'initial' | 'pairings' | 'beverages' }> = ({ stage }) => {
    const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
    
    // URLs de ejemplo para cada tipo - en producción vendrían de la BD
    const imagesByStage = {
      initial: [
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop'
      ],
      pairings: [
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1573641287741-60f13c05b44f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&h=600&fit=crop'
      ],
      beverages: [
        'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop'
      ]
    };
    
    const getBackgroundGradient = () => {
      switch (stage) {
        case 'initial':
          return 'from-indigo-900 via-purple-900 to-pink-900';
        case 'pairings':
          return 'from-emerald-900 via-green-900 to-teal-900';
        case 'beverages':
          return 'from-orange-900 via-amber-900 to-yellow-900';
        default:
          return 'from-indigo-900 via-purple-900 to-pink-900';
      }
    };
    
    useEffect(() => {
      setBackgroundImages(imagesByStage[stage]);
    }, [stage]);
    
    return (
      <>
        {/* Fondo de gradiente dinámico */}
        <motion.div 
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()}`}
        />
        
        {/* Imágenes rotando muy tenues */}
        <div className="absolute inset-0">
          {backgroundImages.map((imageUrl, i) => (
            <motion.div
              key={`${stage}-${i}`}
              className="absolute opacity-30"
              style={{
                width: '200px',
                height: '200px',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '20px'
              }}
              initial={{ 
                x: Math.random() * (window.innerWidth - 200),
                y: Math.random() * (window.innerHeight - 200),
                rotate: Math.random() * 360
              }}
              animate={{
                x: Math.random() * (window.innerWidth - 200),
                y: Math.random() * (window.innerHeight - 200),
                rotate: Math.random() * 360
              }}
              transition={{
                duration: 30 + Math.random() * 20,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear'
              }}
            />
          ))}
        </div>
        
        {/* Partículas animadas */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`particle-${stage}-${i}`}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </div>
      </>
    );
  };
  
  // Animación de texto letra por letra
  const AnimatedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
    return (
      <motion.div className={className}>
        {text.split('').map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.03,
              type: 'spring',
              damping: 20,
              stiffness: 300
            }}
            className="inline-block"
            style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  // Inicializar caché y cargar productos
  useEffect(() => {
    // Generar threadId único
    const newThreadId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setThreadId(newThreadId);
    
    initializeMenu();
    // Iniciar con la pregunta animada
    setTimeout(() => {
      // Flujo dinámico: Saludo → ¿en qué te puedo ayudar? → pregunta específica del rubro
      setConversationSteps([{
        id: '1',
        type: 'question', 
        content: '¡Hola! ¿En qué te puedo ayudar hoy?',
        visible: true
      }]);
    }, 500);
  }, []);

  // 🎭 COMPONENTE DE TEXTO FLOTANTE SUTIL
  const FloatingText: React.FC<{ 
    text: string, 
    delay?: number, 
    onComplete?: () => void 
  }> = ({ text, delay = 0, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
        let index = 0;
        const interval = setInterval(() => {
          if (index <= text.length) {
            setDisplayedText(text.slice(0, index));
            index++;
          } else {
            clearInterval(interval);
            if (onComplete) setTimeout(onComplete, 1000);
          }
        }, 50); // 50ms por letra para efecto typewriter suave

        return () => clearInterval(interval);
      }, delay);

      return () => clearTimeout(timer);
    }, [text, delay, onComplete]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 0.2 : 0, y: isVisible ? 0 : 20 }}
        className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   text-white text-lg font-light tracking-wide text-center
                   bg-black/10 backdrop-blur-sm rounded-full px-6 py-3
                   pointer-events-none select-none z-50"
        style={{ 
          fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {displayedText}
      </motion.div>
    );
  };

  // 🕐 FUNCIONES DE TEMPORIZADORES AUTOMÁTICOS CON TEXTO FLOTANTE
  const [showPairingText, setShowPairingText] = useState(false);
  const [showBeverageText, setShowBeverageText] = useState(false);

  const startPairingTimer = () => {
    if (pairingTimerRef.current) clearTimeout(pairingTimerRef.current);
    
    setWaitingForUser(true);
    pairingTimerRef.current = setTimeout(() => {
      if (currentStage !== 'ingredients') return;
      
      // Mostrar texto flotante sutil
      setShowPairingText(true);
      setCurrentStage('pairing');
      setWaitingForUser(false);
    }, 3000); // 3 segundos de espera
  };

  const startBeverageTimer = () => {
    if (beverageTimerRef.current) clearTimeout(beverageTimerRef.current);
    
    setWaitingForUser(true);
    beverageTimerRef.current = setTimeout(() => {
      if (currentStage !== 'pairing') return;
      
      // Mostrar texto flotante sutil  
      setShowBeverageText(true);
      setCurrentStage('beverage');
      setWaitingForUser(false);
    }, 3000); // 3 segundos de espera
  };

  // Limpiar timers al desmontar componente
  useEffect(() => {
    return () => {
      if (pairingTimerRef.current) clearTimeout(pairingTimerRef.current);
      if (beverageTimerRef.current) clearTimeout(beverageTimerRef.current);
    };
  }, []);

  const initializeMenu = async () => {
    try {
      // Inicializar caché del servidor (carga todos los datos en memoria)
      console.log('🔄 Inicializando caché del menú...');
      const initResponse = await fetch('${API_BASE_URL}/api/menu/init');
      const initData = await initResponse.json();
      
      if (initData.status === 'success') {
        console.log('✅ Caché inicializado:', initData.data);
      }
      
      // Cargar productos para el frontend
      const response = await fetch('${API_BASE_URL}/api/products');
      const data = await response.json();
      setProducts(data);
      
      console.log('🎉 Menú interactivo listo para usar con caché optimizado');
    } catch (error) {
      console.error('Error initializing menu:', error);
    }
  };

  const addToCart = (product: Product) => {
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
  };

  const handleUserInput = async () => {
    if (!userInput.trim() || isLoading) return;

    const userText = userInput;
    setUserInput('');
    setIsLoading(true);
    
    // 🚫 CANCELAR TEMPORIZADORES al interactuar el usuario
    if (pairingTimerRef.current) {
      clearTimeout(pairingTimerRef.current);
      pairingTimerRef.current = null;
    }
    if (beverageTimerRef.current) {
      clearTimeout(beverageTimerRef.current);
      beverageTimerRef.current = null;
    }
    
    // Ocultar textos flotantes si están visible
    setShowPairingText(false);
    setShowBeverageText(false);
    setWaitingForUser(false);
    
    // Agregar respuesta del usuario
    const userStep: ConversationStep = {
      id: Date.now().toString(),
      type: 'response',
      content: userText,
      visible: true
    };
    
    setConversationSteps(prev => [...prev, userStep]);
    setIsTyping(true);

    try {
      // Llamar al backend con Gemini
      const response = await fetch(API_ENDPOINTS.chatMenuAI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          threadId: threadId, // 🧠 Thread persistente  
          context: {
            tableId,
            requestType: 'recommendation',
            selectedFood: selectedFood?.name,
            selectedPairing: selectedPairing?.name,
            weather: 'templado',
            temperature: 22,
            timeOfDay: new Date().getHours() < 12 ? 'mañana' : new Date().getHours() < 18 ? 'tarde' : 'noche'
          }
        })
      });

      const data = await response.json();
      
      // 🔍 DEBUG: Ver qué datos vienen del backend
      console.log("🔍 DATOS DEL BACKEND:", {
        query_type: data.query_type,
        show_animated_message: data.show_animated_message,
        response: data.response,
        recommendedProducts: data.recommendedProducts,
        categorizedProducts: data.categorizedProducts,
        fullData: data
      });
      
      console.log("🔎 CONDICIONES:", {
        isGreeting: data.query_type === 'greeting',
        hasAnimatedMessage: data.show_animated_message,
        bothTrue: data.query_type === 'greeting' && data.show_animated_message
      });
      
      // Agregar respuesta de IA
      // 🎯 DETECTAR SI ES CONVERSACIÓN CASUAL PARA MOSTRAR DIFERENTE
      const isCasualConversation = data.query_type === 'greeting' || data.query_type === 'casual_conversation';
      
      console.log("💬 TIPO DE CONVERSACIÓN:", {
        query_type: data.query_type,
        isCasualConversation,
        tieneProductos: !!(data.recommendedProducts?.length || data.categorizedProducts)
      });
      
      // 🎬 VERIFICAR SI HAY MENSAJE DE SALUDO EN LOS PRODUCTOS
      const greetingItem = data.recommendedProducts?.find(item => item.is_greeting);
      
      if (greetingItem && greetingItem.show_animated_message) {
        console.log("🎬 MOSTRANDO MENSAJE FLOTANTE:", greetingItem.name);
        setFloatingMessage(greetingItem.name);
        setDebugInfo(`FLOTANTE: ${greetingItem.name} (${new Date().toLocaleTimeString()})`);
        
        // Hacer que desaparezca a los 5 segundos
        setTimeout(() => {
          console.log("🎬 OCULTANDO mensaje flotante");
          setFloatingMessage(null);
        }, 5000);
        
        // No procesar más, el saludo está manejado
        setRecommendedProducts([]);
        return;
      } else if (data.query_type === 'greeting') {
        console.log("🎭 SALUDO NORMAL (sin mensaje flotante)");
        // Saludo normal sin mensaje flotante
        const aiStep: ConversationStep = {
          id: (Date.now() + 1).toString(),
          type: 'casual_response',
          content: data.response || "¡Hola! ¿En qué te puedo ayudar?",
          visible: true
        };
        setConversationSteps(prev => [...prev, aiStep]);
      } else {
        console.log("📝 RESPUESTA NORMAL");
        // Respuesta normal
        const aiStep: ConversationStep = {
          id: (Date.now() + 1).toString(),
          type: isCasualConversation ? 'casual_response' : 'response',
          content: data.response || getLocalRecommendation(userText),
          visible: true
        };
        
        setConversationSteps(prev => [...prev, aiStep]);
      }

      // Cambiar stage según el tipo de consulta
      if (data.query_type === 'product_pairings') {
        setConversationStage('pairings');
        if (data.recommendedProducts?.length > 0) {
          setSelectedPairing(data.recommendedProducts[0]);
        }
        
        // 🕐 ACTIVAR TEMPORIZADOR AUTOMÁTICO para sugerencia de bebida después de maridaje
        setCurrentStage('pairing');
        setTimeout(() => {
          startBeverageTimer();
        }, 1000); // Esperar 1 segundo después de mostrar maridajes
        
      } else if (data.query_type === 'smart_beverage_recommendation') {
        setConversationStage('beverages');
      } else if (data.query_type === 'specific_product_ingredients') {
        if (data.recommendedProducts?.length > 0 && !selectedFood) {
          setSelectedFood(data.recommendedProducts[0]);
        }
      }

      // Si hay productos recomendados, mostrarlos (pero NO si es conversación casual)
      // Manejar productos categorizados (carruseles) o productos simples
      
      // Procesar productos recomendados
      let categorizedProds = {};
      let hasMultipleCategories = false;
      
      console.log("📦 PROCESANDO PRODUCTOS:", {
        tieneCategorizedProducts: !!data.categorizedProducts,
        tieneRecommendedProducts: !!data.recommendedProducts,
        cantidadRecommended: data.recommendedProducts?.length || 0
      });
      
      // Primero verificar si hay categorizedProducts del backend
      if (data.categorizedProducts && typeof data.categorizedProducts === 'object' && !Array.isArray(data.categorizedProducts)) {
        categorizedProds = data.categorizedProducts;
        hasMultipleCategories = Object.keys(categorizedProds).length > 1;
        console.log("📦 Usando categorizedProducts del backend:", categorizedProds);
      } 
      // Si no hay categorizedProducts, procesar recommendedProducts
      else if (data.recommendedProducts && data.recommendedProducts.length > 0) {
        // Agrupar productos por categoría
        const categories = new Set();
        data.recommendedProducts.forEach(product => {
          const category = product.category || 'General';
          categories.add(category);
          if (!categorizedProds[category]) categorizedProds[category] = [];
          categorizedProds[category].push(product);
        });
        hasMultipleCategories = categories.size > 1;
        console.log("📦 Agrupando recommendedProducts por categoría:", {
          categorias: Array.from(categories),
          hasMultipleCategories,
          categorizedProds
        });
      }
      
      // Si hay productos, SIEMPRE usar el carrusel categorizado (con auto-expand si es una sola categoría)
      if (!isCasualConversation && Object.keys(categorizedProds).length > 0) {
        console.log("🎨 RENDERIZANDO CARRUSEL CATEGORIZADO", {
          categorias: Object.keys(categorizedProds),
          esUnaCategoria: Object.keys(categorizedProds).length === 1
        });
        setTimeout(() => {
          const categorizedStep: ConversationStep = {
            id: (Date.now() + 2).toString(),
            type: 'categorized_products',
            content: '',
            categorizedProducts: categorizedProds,
            visible: true
          };
          setConversationSteps(prev => [...prev, categorizedStep]);
        }, 1000);
        
      } 
      // Fallback: Si por alguna razón no se categorizaron pero hay productos
      else if (!isCasualConversation && data.recommendedProducts && data.recommendedProducts.length > 0) {
        console.log("🎨 RENDERIZANDO PRODUCTOS SIMPLES (FALLBACK)");
        setTimeout(() => {
          const productsStep: ConversationStep = {
            id: (Date.now() + 2).toString(),
            type: 'products',
            content: '',
            products: data.recommendedProducts,
            visible: true
          };
          setConversationSteps(prev => [...prev, productsStep]);
          
          // Si es búsqueda de producto específico, mostrar ingredientes automáticamente
          if (data.query_type === 'specific_product_ingredients' && data.recommendedProducts.length === 1) {
            setTimeout(() => {
              // Mostrar ingredientes directamente si vienen en la respuesta
              if (data.ingredients && data.ingredients.length > 0) {
                const ingredientsStep: ConversationStep = {
                  id: (Date.now() + 3).toString(),
                  type: 'products',
                  content: 'Ingredientes:',
                  ingredients: data.ingredients,
                  visible: true
                };
                setConversationSteps(prev => [...prev, ingredientsStep]);
                
                // 🕐 ACTIVAR TEMPORIZADOR AUTOMÁTICO para sugerencia de maridaje
                setCurrentStage('ingredients');
                setTimeout(() => {
                  startPairingTimer();
                }, 1000); // Esperar 1 segundo después de mostrar ingredientes
              }
            }, 500);
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error:', error);
      // Fallback local
      const recommendations = getLocalRecommendation(userText);
      const aiStep: ConversationStep = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: recommendations,
        visible: true
      };
      setConversationSteps(prev => [...prev, aiStep]);
      
      // Mostrar productos relacionados
      const relatedProducts = getRelatedProducts(userText);
      if (relatedProducts.length > 0) {
        setTimeout(() => {
          const productsStep: ConversationStep = {
            id: (Date.now() + 2).toString(),
            type: 'products',
            content: '',
            products: relatedProducts,
            visible: true
          };
          setConversationSteps(prev => [...prev, productsStep]);
        }, 1000);
      }
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      setTimeout(() => setShowMenuButton(true), 2000);
    }
  };

  const getLocalRecommendation = (input: string): string => {
    const lower = input.toLowerCase();
    
    if (lower.includes('pasta') || lower.includes('fideos')) {
      return 'Excelente elección! Nuestras pastas son preparadas al momento. Te recomiendo especialmente la Carbonara con panceta ahumada o los Ravioles de espinaca con salsa de nuez.';
    }
    if (lower.includes('saludable') || lower.includes('light') || lower.includes('dieta')) {
      return 'Perfecto! Tenemos opciones súper frescas y nutritivas. Las ensaladas gourmet son increíbles, y también tenemos bowls de quinoa y opciones veganas deliciosas.';
    }
    if (lower.includes('carne') || lower.includes('parrilla')) {
      return 'Para los amantes de la carne! Nuestros cortes son de primera calidad. El bife de chorizo y las costillas BBQ son los favoritos de la casa.';
    }
    if (lower.includes('pizza')) {
      return 'Las pizzas son nuestra especialidad! Masa madre fermentada 48 horas. La Margherita es clásica, pero la Pizza de rúcula y jamón crudo es espectacular.';
    }
    if (lower.includes('postre') || lower.includes('dulce')) {
      return 'Momento dulce! El Tiramisú es irresistible, y la Tarta de chocolate con helado es perfecta para compartir.';
    }
    
    return 'Interesante elección! Déjame mostrarte algunas opciones que te van a encantar.';
  };

  const getRelatedProducts = (input: string): Product[] => {
    const lower = input.toLowerCase();
    let filtered = products;
    
    if (lower.includes('pasta') || lower.includes('fideos')) {
      filtered = products.filter(p => p.category?.toLowerCase().includes('pasta'));
    } else if (lower.includes('pizza')) {
      filtered = products.filter(p => p.category?.toLowerCase().includes('pizza'));
    } else if (lower.includes('carne') || lower.includes('parrilla')) {
      filtered = products.filter(p => 
        p.category?.toLowerCase().includes('carne') || 
        p.name.toLowerCase().includes('bife') ||
        p.name.toLowerCase().includes('asado')
      );
    } else if (lower.includes('ensalada') || lower.includes('saludable')) {
      filtered = products.filter(p => 
        p.category?.toLowerCase().includes('ensalada') ||
        p.description?.toLowerCase().includes('saludable')
      );
    } else if (lower.includes('postre') || lower.includes('dulce')) {
      filtered = products.filter(p => p.category?.toLowerCase().includes('postre'));
    }
    
    return filtered.slice(0, 4); // Máximo 4 productos
  };

  const fetchPairings = async (product: Product) => {
    setSelectedProduct(product);
    setIsLoading(true);
    
    try {
      // Buscar maridajes e ingredientes
      const response = await fetch('${API_BASE_URL}/api/chat/pairings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          product: product.name,
          description: product.description,
          category: product.category
        })
      });

      const data = await response.json();
      
      const pairingStep: ConversationStep = {
        id: Date.now().toString(),
        type: 'pairing',
        content: `${product.name}`,
        pairings: data.pairings || getLocalPairings(product),
        ingredients: data.ingredients || [],
        visible: true
      };
      
      setConversationSteps(prev => [...prev, pairingStep]);
      
    } catch (error) {
      console.error('Error fetching pairings:', error);
      // Fallback local
      const pairingStep: ConversationStep = {
        id: Date.now().toString(),
        type: 'pairing',
        content: `${product.name}`,
        pairings: getLocalPairings(product),
        ingredients: [],
        visible: true
      };
      setConversationSteps(prev => [...prev, pairingStep]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalPairings = (product: Product) => {
    const category = product.category?.toLowerCase() || '';
    const name = product.name.toLowerCase();
    
    if (category.includes('pasta') || name.includes('pasta')) {
      return [
        { name: 'Vino Malbec', description: 'Un tinto con cuerpo que realza los sabores', type: 'wine' as const },
        { name: 'Limonada con menta', description: 'Refrescante y equilibra la cremosidad', type: 'beverage' as const },
        { name: 'Pan de ajo', description: 'El complemento perfecto', type: 'side' as const }
      ];
    }
    if (category.includes('pizza')) {
      return [
        { name: 'Cerveza artesanal', description: 'La combinación clásica e infalible', type: 'beverage' as const },
        { name: 'Vino Pinot Noir', description: 'Ligero y frutal, ideal con pizza', type: 'wine' as const },
        { name: 'Ensalada verde', description: 'Para equilibrar y refrescar', type: 'side' as const }
      ];
    }
    if (category.includes('carne')) {
      return [
        { name: 'Vino Cabernet Sauvignon', description: 'Taninos robustos para la carne', type: 'wine' as const },
        { name: 'Papas rústicas', description: 'El acompañamiento tradicional', type: 'side' as const },
        { name: 'Chimichurri', description: 'Salsa argentina que potencia el sabor', type: 'side' as const }
      ];
    }
    
    return [
      { name: 'Agua con gas y limón', description: 'Refrescante y versátil', type: 'beverage' as const },
      { name: 'Vino blanco', description: 'Ligero y aromático', type: 'wine' as const }
    ];
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  console.log("🔵🔵🔵 RENDERIZANDO InteractiveMenuAI 🔵🔵🔵");
  
  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Fondo dinámico con imágenes rotando */}
      <DynamicBackground stage={conversationStage} />
      
      {/* 🎭 TEXTOS FLOTANTES SUTILES */}
      {showPairingText && (
        <FloatingText 
          text="¿Te ayudo a buscar un acompañamiento?" 
          onComplete={() => {
            setTimeout(() => setShowPairingText(false), 2000);
          }}
        />
      )}
      
      {showBeverageText && (
        <FloatingText 
          text="¿Lo acompañamos con una bebida?" 
          onComplete={() => {
            setTimeout(() => setShowBeverageText(false), 2000);
          }}
        />
      )}

      {/* Header minimalista */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-50 p-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-xl font-light">Mesa {tableId}</h1>
          </div>
          
          {/* Botón de menú tradicional */}
          <AnimatePresence>
            {showMenuButton && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30"
              >
                Ver Menú Completo
              </motion.button>
            )}
          </AnimatePresence>

          {/* Carrito */}
          <div className="relative">
            <ShoppingCartIcon className="h-8 w-8 text-white" />
            {cart.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center"
              >
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Área de conversación */}
      <div className="relative z-40 max-w-5xl mx-auto px-4 py-8 min-h-[calc(100vh-200px)]">
        <AnimatePresence>
          {conversationSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="mb-8"
            >
              {step.type === 'question' && (
                <motion.div 
                  className="text-center mb-12"
                  animate={{ opacity: fadeOutSteps ? 0 : 1 }}
                  transition={{ duration: 1.5 }}
                >
                  <AnimatedText 
                    text={step.content}
                    className="text-6xl md:text-7xl font-bold text-white"
                  />
                </motion.div>
              )}

              {/* 🎭 RESPUESTAS CASUALES EN TEXTO GRANDE */}
              {step.type === 'casual_response' && (
                <motion.div 
                  className="text-center mb-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: fadeOutSteps ? 0 : 1,
                    scale: fadeOutSteps ? 0.8 : 1
                  }}
                  transition={{ duration: 1.5 }}
                >
                  <AnimatedText 
                    text={step.content}
                    className="text-5xl md:text-6xl font-bold text-white"
                  />
                </motion.div>
              )}

              {step.type === 'response' && (
                <motion.div
                  initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`${index % 2 === 0 ? 'text-left' : 'text-right'} mb-4`}
                >
                  <div className={`inline-block max-w-2xl p-6 rounded-2xl backdrop-blur-md ${
                    index % 2 === 0 
                      ? 'bg-white/10 text-white' 
                      : 'bg-white/90 text-gray-800'
                  }`}>
                    <p className="text-lg">{step.content}</p>
                  </div>
                </motion.div>
              )}

              {/* 🎭 ACORDEÓN VERTICAL DE CATEGORÍAS ESTILO CLÁSICO */}
              {step.type === 'categorized_products' && step.categorizedProducts && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="category-accordion"
                >
                  <ul>
                    {Object.entries(step.categorizedProducts).map(([category, products], categoryIndex) => {
                      // Si hay solo una categoría, expandirla automáticamente
                      const isSingleCategory = Object.keys(step.categorizedProducts).length === 1;
                      const shouldAutoExpand = isSingleCategory || categoryIndex === 0;
                      const categoryEmoji = 
                        category === 'Carnes' ? '🥩' : 
                        category === 'Pastas' ? '🍝' : 
                        category === 'Aves' ? '🍗' : 
                        category === 'Pescados' || category === 'Pescados y Mariscos' ? '🐟' : 
                        category === 'Ensaladas' ? '🥗' : 
                        category === 'Pizzas' ? '🍕' : 
                        category === 'Entradas' ? '🥘' : '🍽️';
                      
                      return (
                        <li key={category} className={shouldAutoExpand ? 'auto-expanded' : ''}>
                          {/* Header de Categoría */}
                          <div className="category-title">
                            <span className="text-5xl mr-4">{categoryEmoji}</span>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-white">
                                {category}
                              </h3>
                              <p className="text-white/80 text-sm">
                                {products.length} opciones deliciosas
                              </p>
                            </div>
                          </div>
                          
                          {/* Productos */}
                          <div className="category-products">
                            <div 
                              className="products-grid-accordion"
                              onWheel={(e) => {
                                // Solo aplicar scroll horizontal si el evento NO viene del input
                                const target = e.target as HTMLElement;
                                const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
                                const isInsideInput = target.closest('input, textarea');
                                
                                if (!isInput && !isInsideInput) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const container = e.currentTarget as HTMLElement;
                                  container.scrollLeft += e.deltaY * 2;
                                }
                              }}
                            >
                              {products.map((product, productIndex) => (
                                <motion.div
                                  key={product.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  whileInView={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: productIndex * 0.05 }}
                                  whileHover={{ scale: 1.05 }}
                                  className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer flex-shrink-0"
                                  style={{ width: '180px' }}
                                  onClick={() => fetchPairings(product)}
                                >
                                  {product.image_url ? (
                                    <img 
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-32 object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400" />
                                  )}
                                  <div className="p-2">
                                    <h4 className="font-bold text-gray-800 text-xs mb-1 line-clamp-1">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                                      {product.description}
                                    </p>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold text-green-600">
                                        ${product.price}
                                      </span>
                                      <span className="text-xs text-purple-600">
                                        →
                                      </span>
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
                </motion.div>
              )}

              {step.type === 'products' && step.products && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="category-accordion"
                  style={{ zIndex: 1 }}
                >
                  <ul>
                    <li>
                      <div className="category-title">
                        <h3 className="text-2xl font-bold text-white">
                          Recomendaciones para ti
                        </h3>
                      </div>
                      
                      <div className="category-products">
                        <div 
                          className="products-grid-accordion"
                          onWheel={(e) => {
                            const target = e.target as HTMLElement;
                            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
                            const isInsideInput = target.closest('input, textarea');
                            
                            if (!isInput && !isInsideInput) {
                              e.preventDefault();
                              e.stopPropagation();
                              const container = e.currentTarget as HTMLElement;
                              container.scrollLeft += e.deltaY * 2;
                            }
                          }}
                        >
                          {step.products.map((product, pIndex) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              transition={{ delay: pIndex * 0.05 }}
                              className="inline-block"
                              style={{ minWidth: '200px' }}
                            >
                              <div 
                                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
                                onClick={() => fetchPairings(product)}
                              >
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded-lg mb-2"
                                  />
                                ) : (
                                  <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-2" />
                                )}
                                <h4 className="font-bold text-gray-800 mb-1">{product.name}</h4>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-bold text-purple-600">
                                    ${product.price.toFixed(2)}
                                  </span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                    className="p-2 bg-purple-600 text-white rounded-full"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </li>
                  </ul>
                </motion.div>
              )}

              {step.type === 'pairing' && (step.pairings || step.ingredients) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="category-accordion"
                  style={{ zIndex: 1 }}
                >
                  <ul>
                    <li>
                      <div className="category-title">
                        <h3 className="text-2xl font-bold text-white">
                          {step.content || 'Maridajes perfectos'}
                        </h3>
                      </div>
                      
                      <div className="category-products">
                        {/* Ingredientes flotantes */}
                        {step.ingredients && step.ingredients.length > 0 && (
                          <div className="absolute right-4 top-4 space-y-1 opacity-20 hover:opacity-60 transition-opacity duration-300 z-20">
                            {step.ingredients.map((ingredient, iIndex) => (
                              <motion.div
                                key={iIndex}
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 0.2 }}
                                transition={{ 
                                  delay: iIndex * 0.05,
                                  duration: 0.3
                                }}
                                className="text-xs text-gray-500 text-right"
                              >
                                {ingredient.name}
                                {ingredient.is_vegan && <span className="ml-1">🌱</span>}
                                {ingredient.is_allergen && <span className="ml-1 text-red-400">⚠️</span>}
                              </motion.div>
                            ))}
                          </div>
                        )}
                        
                        {/* Maridajes en scroll horizontal */}
                        {step.pairings && step.pairings.length > 0 && (
                          <div 
                            className="products-grid-accordion"
                            onWheel={(e) => {
                              const target = e.target as HTMLElement;
                              const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
                              const isInsideInput = target.closest('input, textarea');
                              
                              if (!isInput && !isInsideInput) {
                                e.preventDefault();
                                e.stopPropagation();
                                const container = e.currentTarget as HTMLElement;
                                container.scrollLeft += e.deltaY * 2;
                              }
                            }}
                          >
                            {step.pairings.map((pairing, pIndex) => (
                              <motion.div
                                key={pIndex}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: pIndex * 0.05 }}
                                className="inline-block"
                                style={{ minWidth: '280px' }}
                              >
                                <div className={`p-4 rounded-xl shadow-lg ${
                                  pairing.type === 'wine' ? 'bg-purple-100' :
                                  pairing.type === 'beverage' ? 'bg-blue-100' :
                                  'bg-green-100'
                                }`}>
                                  <div className="flex items-start gap-3">
                                    <span className="text-2xl">
                                      {pairing.type === 'wine' ? '🍷' :
                                       pairing.type === 'beverage' ? '🥤' : '🍽️'}
                                    </span>
                                    <div>
                                      <h5 className="font-semibold text-gray-800">{pairing.name}</h5>
                                      <p className="text-sm text-gray-600 mt-1">{pairing.description}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  </ul>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      delay: i * 0.15,
                      duration: 1
                    }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent"
        style={{ zIndex: 50 }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                // Activar fade out cuando el usuario empiece a escribir
                if (e.target.value.length > 0 && !fadeOutSteps) {
                  setFadeOutSteps(true);
                  // Limpiar los pasos de conversación casual después de 2 segundos
                  setTimeout(() => {
                    setConversationSteps(prev => prev.filter(step => 
                      step.type !== 'question' && step.type !== 'casual_response'
                    ));
                    setFadeOutSteps(false);
                  }, 2000);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
              placeholder="Escribí qué tenés ganas de comer..."
              className="w-full px-6 py-4 pr-16 bg-white/90 backdrop-blur-md rounded-full text-lg focus:outline-none focus:ring-4 focus:ring-purple-400 shadow-2xl"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleUserInput}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <SparklesIcon className="h-6 w-6" />
                </motion.div>
              ) : (
                <ArrowRightIcon className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Carrito flotante mejorado */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed right-4 bottom-24 bg-white rounded-2xl shadow-2xl p-4 min-w-[250px]"
          >
            <h3 className="font-bold text-gray-800 mb-2">Tu pedido</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.product.name} x{item.quantity}</span>
                  <span className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold"
              >
                Confirmar Pedido
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 MENSAJE FLOTANTE PARA SALUDOS - Solo aparece cuando es greeting */}
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
          >
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl px-8 py-6 shadow-2xl max-w-lg text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}
              >
                {floatingMessage}
              </motion.p>
              
              {/* Indicador de que desaparecerá */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ 
                  duration: 5, 
                  ease: "linear" 
                }}
                className="h-1 bg-white/30 rounded-full mt-4"
                style={{ transformOrigin: "left" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🐛 DEBUG INFO EN PANTALLA */}
      {debugInfo && (
        <div className="fixed top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm font-mono z-50">
          {debugInfo}
          <br />
          floatingMessage: {floatingMessage || 'null'}
        </div>
      )}
    </div>
  );
};