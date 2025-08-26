import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useParams } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  ChatBubbleLeftIcon,
  HeartIcon,
  FireIcon,
  StarIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_popular?: boolean;
  is_spicy?: boolean;
  is_vegetarian?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  products?: Array<{
    id: number;
    name: string;
    price: number;
    image?: string;
  }>;
}

export const CustomerMenu: React.FC = () => {
  const { tableId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedo recomendarte platos según tus preferencias.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cargar productos
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/api/products');
      const data = await response.json();
      setProducts(data);
      
      // Extraer categorías únicas
      const uniqueCategories = [...new Set(data.map((p: Product) => p.category))];
      setCategories(uniqueCategories);
      if (uniqueCategories.length > 0) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
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

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Llamar al endpoint de Gemini
      const response = await fetch('${API_BASE_URL}/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            tableId,
            products: products.map(p => p.name),
            categories
          }
        })
      });

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date(),
        products: data.products
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error con Gemini:', error);
      // Fallback a respuesta local si falla
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('vegetariano') || lowerMessage.includes('vegano')) {
      return '🥗 Te recomiendo nuestras opciones vegetarianas: Ensalada César, Pizza Margherita y Pasta Primavera. ¡Todas son deliciosas y frescas!';
    }
    if (lowerMessage.includes('picante') || lowerMessage.includes('spicy')) {
      return '🌶️ Si te gusta el picante, prueba nuestros Tacos al Pastor o el Pollo Buffalo. ¡Tienen el nivel perfecto de picor!';
    }
    if (lowerMessage.includes('postre') || lowerMessage.includes('dulce')) {
      return '🍰 Nuestros postres más populares son el Tiramisú y el Cheesecake de frutos rojos. ¡Son irresistibles!';
    }
    if (lowerMessage.includes('recomend') || lowerMessage.includes('suger')) {
      return '⭐ Los favoritos de nuestros clientes son: Hamburguesa Clásica, Pizza Pepperoni y Pasta Carbonara. ¡No te los puedes perder!';
    }
    
    return '¡Gracias por tu mensaje! ¿Te gustaría que te recomiende algo específico? Puedo sugerirte opciones vegetarianas, picantes, o nuestros platos más populares.';
  };

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-lg sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Menú Digital</h1>
              <p className="text-sm text-gray-600">Mesa {tableId}</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(!showChat)}
                className="relative p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg"
              >
                <ChatBubbleLeftIcon className="h-6 w-6" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"
                />
              </motion.button>
              <div className="relative">
                <ShoppingCartIcon className="h-8 w-8 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Burbujas Animadas de Sugerencias */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-4">¿Qué te apetece hoy?</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {['🍕 Pizza', '🍔 Hamburguesas', '🥗 Ensaladas', '🍝 Pastas', '🌮 Tacos', '🍰 Postres'].map((item, index) => (
              <motion.button
                key={`suggestion-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="px-4 py-2 bg-white rounded-full shadow-md whitespace-nowrap"
              >
                {item}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Categorías */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {product.image_url && (
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.is_popular && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-xs font-bold rounded-full">
                        ⭐ Popular
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="text-red-500"
                    >
                      {favorites.includes(product.id) ? (
                        <HeartSolid className="h-6 w-6" />
                      ) : (
                        <HeartIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-purple-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
                    >
                      Agregar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat AI */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-4 bottom-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-6 w-6" />
                  <span className="font-semibold">Asistente Virtual</span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? '' : 'space-y-2'}`}>
                    <div className={`p-3 rounded-xl ${
                      message.sender === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.text}
                    </div>
                    
                    {/* Mostrar productos recomendados con imágenes */}
                    {message.products && message.products.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {message.products.map((product) => (
                          <motion.div
                            key={product.id}
                            whileHover={{ scale: 1.05 }}
                            className="bg-white rounded-lg shadow-md p-2 min-w-[120px] cursor-pointer"
                            onClick={() => {
                              const fullProduct = products.find(p => p.id === product.id);
                              if (fullProduct) addToCart(fullProduct);
                            }}
                          >
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-20 object-cover rounded mb-1"
                              />
                            )}
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-purple-600 font-bold">
                              ${product.price.toFixed(2)}
                            </p>
                            <button className="w-full mt-1 text-xs bg-purple-500 text-white py-1 rounded hover:bg-purple-600">
                              Agregar
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, delay: i * 0.1 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
                >
                  Enviar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carrito Flotante */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-30 p-4"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
              <p className="text-2xl font-bold text-gray-800">
                Total: ${cartTotal.toFixed(2)}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold"
            >
              Realizar Pedido
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};