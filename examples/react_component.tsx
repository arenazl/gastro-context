/**
 * Componente estándar para productos en el sistema gastronómico.
 * SIEMPRE usar esta estructura para componentes de React + Vite.
 * 
 * Incluye:
 * - React puro con hooks (sin Next.js)
 * - Vite para build y desarrollo
 * - Tailwind CSS para estilos
 * - Patrones de estado local y props
 * - Integración con WebSocket para tiempo real
 */

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

// Tipos específicos del sistema gastronómico
interface Product {
  id: number
  name: string
  description: string
  base_price: number
  preparation_time: number
  is_available: boolean
  image_url?: string
  allergens?: string[]
  category: {
    id: number
    name: string
  }
  variants?: ProductVariant[]
}

interface ProductVariant {
  id: number
  name: string
  type: 'size' | 'temperature' | 'style'
  price_modifier: number
  is_available: boolean
}

interface CartItem {
  product: Product
  quantity: number
  variant?: ProductVariant
  modifications: Record<string, boolean>
  special_notes: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (item: CartItem) => void
  tableNumber?: number
  className?: string
  isKitchenView?: boolean
}

/**
 * Componente de tarjeta de producto optimizado para tablets de meseros.
 * Incluye variantes, modificaciones y notas especiales.
 * 
 * Usa React puro + Vite (sin Next.js Image component)
 */
export default function ProductCard({ 
  product, 
  onAddToCart, 
  tableNumber,
  className = "",
  isKitchenView = false 
}: ProductCardProps) {
  // Estado local del componente
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [modifications, setModifications] = useState<Record<string, boolean>>({})
  const [specialNotes, setSpecialNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Modificaciones comunes para productos gastronómicos
  const commonModifications = [
    { key: 'sin_cebolla', label: 'Sin cebolla', icon: '🧅' },
    { key: 'extra_queso', label: 'Extra queso', icon: '🧀' },
    { key: 'sin_gluten', label: 'Sin gluten', icon: '🌾' },
    { key: 'picante', label: 'Picante', icon: '🌶️' },
    { key: 'sin_lactosa', label: 'Sin lactosa', icon: '🥛' }
  ]
  
  // Calcular precio final con variante
  const finalPrice = product.base_price + (selectedVariant?.price_modifier || 0)
  const totalPrice = finalPrice * quantity

  // Manejar adición al carrito
  const handleAddToCart = async () => {
    if (!product.is_available) {
      toast.error('Producto no disponible')
      return
    }
    
    setIsLoading(true)
    
    try {
      const cartItem: CartItem = {
        product,
        quantity,
        variant: selectedVariant || undefined,
        modifications,
        special_notes: specialNotes.trim()
      }
      
      await onAddToCart(cartItem)
      
      // Limpiar formulario después de agregar
      setQuantity(1)
      setSelectedVariant(null)
      setModifications({})
      setSpecialNotes('')
      
      toast.success(`${product.name} agregado al pedido`)
      
    } catch (error) {
      toast.error('Error agregando producto')
      console.error('Error adding to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Manejar cambio de modificaciones
  const handleModificationChange = (key: string, checked: boolean) => {
    setModifications(prev => ({
      ...prev,
      [key]: checked
    }))
  }

  // Manejar error de imagen
  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={`
      bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden
      hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
      ${!product.is_available ? 'opacity-60 grayscale' : ''}
      ${isKitchenView ? 'border-l-4 border-l-orange-500' : ''}
      ${className}
    `}>
      {/* Imagen del producto - React standard img tag */}
      <div className="relative h-48 bg-gray-100">
        {product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Badge de disponibilidad */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              No disponible
            </span>
          </div>
        )}
        
        {/* Tiempo de preparación */}
        {!isKitchenView && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            ⏱️ {product.preparation_time} min
          </div>
        )}
      </div>
      
      {/* Contenido de la tarjeta */}
      <div className="p-4">
        {/* Header con nombre y precio */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">
            {product.name}
          </h3>
          <span className="text-lg font-bold text-green-600 ml-2">
            ${finalPrice.toFixed(2)}
          </span>
        </div>
        
        {/* Descripción */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        {/* Alérgenos */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-orange-600 font-medium">
              ⚠️ Contiene: {product.allergens.join(', ')}
            </span>
          </div>
        )}
        
        {!isKitchenView && product.is_available && (
          <>
            {/* Selector de variantes */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variante:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.filter(v => v.is_available).map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`
                        px-3 py-2 text-sm rounded-lg border transition-colors
                        ${selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                      type="button"
                    >
                      {variant.name}
                      {variant.price_modifier !== 0 && (
                        <span className="ml-1 text-xs">
                          ({variant.price_modifier > 0 ? '+' : ''}${variant.price_modifier})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Modificaciones comunes */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modificaciones:
              </label>
              <div className="grid grid-cols-2 gap-1">
                {commonModifications.map(mod => (
                  <label key={mod.key} className="flex items-center text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modifications[mod.key] || false}
                      onChange={(e) => handleModificationChange(mod.key, e.target.checked)}
                      className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{mod.icon} {mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Notas especiales */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas especiales:
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Ej: Sin sal, término medio, etc."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                maxLength={200}
              />
            </div>
            
            {/* Controles de cantidad y agregar */}
            <div className="flex items-center justify-between">
              {/* Selector de cantidad */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                  type="button"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="px-4 py-2 font-semibold text-lg min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  disabled={quantity >= 10}
                  type="button"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              
              {/* Botón agregar al carrito */}
              <button
                onClick={handleAddToCart}
                disabled={isLoading || !product.is_available}
                className={`
                  px-6 py-2 rounded-lg font-semibold text-white transition-all duration-200
                  min-h-[44px] min-w-[120px] flex items-center justify-center
                  ${isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                type="button"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <span>Agregar</span>
                    {quantity > 1 && (
                      <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">
                        ${totalPrice.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </>
        )}
        
        {/* Vista de cocina - información relevante */}
        {isKitchenView && (
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Tiempo estimado:</span>
              <span className="font-semibold text-orange-600">
                {product.preparation_time} minutos
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook personalizado para manejar productos con WebSocket
 * Actualiza disponibilidad en tiempo real usando WebSocket nativo
 */
export function useProductUpdates(productId: number) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  
  useEffect(() => {
    // Obtener WebSocket URL desde variables de entorno de Vite
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
    
    // Conectar a WebSocket para actualizaciones en tiempo real
    const ws = new WebSocket(`${wsUrl}/products/${productId}`)
    
    ws.onopen = () => {
      setConnectionStatus('connected')
      setIsLoading(false)
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'product_update') {
          setProduct(data.product)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    ws.onclose = () => {
      setConnectionStatus('disconnected')
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('disconnected')
      setIsLoading(false)
    }
    
    return () => {
      ws.close()
    }
  }, [productId])
  
  return { product, isLoading, connectionStatus }
}

/**
 * Hook para manejar carrito de compras con localStorage
 */
export function useShoppingCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  
  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurant-cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])
  
  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('restaurant-cart', JSON.stringify(cartItems))
  }, [cartItems])
  
  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      // Buscar si ya existe un item similar
      const existingIndex = prev.findIndex(cartItem => 
        cartItem.product.id === item.product.id &&
        cartItem.variant?.id === item.variant?.id &&
        JSON.stringify(cartItem.modifications) === JSON.stringify(item.modifications)
      )
      
      if (existingIndex >= 0) {
        // Actualizar cantidad si existe
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity
        }
        return updated
      } else {
        // Agregar nuevo item
        return [...prev, item]
      }
    })
  }
  
  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index))
  }
  
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }
    
    setCartItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity: newQuantity }
      return updated
    })
  }
  
  const clearCart = () => {
    setCartItems([])
  }
  
  const totalAmount = cartItems.reduce((total, item) => {
    const itemPrice = item.product.base_price + (item.variant?.price_modifier || 0)
    return total + (itemPrice * item.quantity)
  }, 0)
  
  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    itemCount: cartItems.length
  }
}

/**
 * Utilidades para formateo específico del negocio gastronómico
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

export const formatPreparationTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Hook para hacer requests a la API
 */
export function useApi() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  const request = async (endpoint: string, options?: RequestInit) => {
    const url = `${apiUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
  
  return { request }
}