# React + Vite Architecture for Restaurant Management System

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── forms/          # Form components
│   │   │   ├── OrderForm.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── PaymentForm.tsx
│   │   ├── layout/         # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TabletNav.tsx  # Optimized for tablets
│   │   │   └── Footer.tsx
│   │   └── restaurant/     # Business-specific components
│   │       ├── TableGrid.tsx
│   │       ├── MenuCard.tsx
│   │       ├── OrderTicket.tsx
│   │       └── KitchenDisplay.tsx
│   ├── pages/              # Route-based pages
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── waiter/
│   │   │   ├── TableView.tsx
│   │   │   ├── OrderCreate.tsx
│   │   │   └── OrderList.tsx
│   │   ├── kitchen/
│   │   │   ├── KitchenQueue.tsx
│   │   │   └── OrderDetails.tsx
│   │   └── pos/
│   │       ├── Checkout.tsx
│   │       └── PaymentProcess.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   ├── useAuth.ts
│   │   ├── useOrder.ts
│   │   └── useOffline.ts
│   ├── services/           # API and external services
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── orders.ts
│   │   │   └── products.ts
│   │   ├── websocket.ts
│   │   └── stripe.ts
│   ├── store/             # State management
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── OrderContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   └── reducers/
│   │       ├── orderReducer.ts
│   │       └── cartReducer.ts
│   ├── utils/             # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── styles/            # Global styles
│   │   ├── index.css
│   │   └── tailwind.css
│   ├── types/             # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── components.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
│   ├── manifest.json      # PWA manifest
│   └── service-worker.js  # Service worker for offline
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Restaurant Management System',
        short_name: 'RestaurantPOS',
        description: 'Complete restaurant management solution',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.restaurant\.com\/api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

## Core Components

### API Client Setup
```typescript
// src/services/api/client.ts
import axios, { AxiosInstance } from 'axios'

class ApiClient {
  private client: AxiosInstance
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refresh
          await this.refreshToken()
        }
        return Promise.reject(error)
      }
    )
  }
  
  private async refreshToken() {
    // Implement token refresh logic
  }
  
  get = this.client.get
  post = this.client.post
  put = this.client.put
  delete = this.client.delete
  patch = this.client.patch
}

export default new ApiClient()
```

### WebSocket Hook
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocket(role: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const { token } = useAuth()
  
  const connect = useCallback(() => {
    if (!token) return
    
    const wsUrl = `${import.meta.env.VITE_WS_URL}/ws/${role}?token=${token}`
    ws.current = new WebSocket(wsUrl)
    
    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setLastMessage(message)
      
      // Handle specific message types
      switch (message.type) {
        case 'new_order':
          // Play notification sound for kitchen
          if (role === 'kitchen') {
            playNotificationSound()
          }
          break
        case 'order_ready':
          // Update UI for waiters
          break
      }
    }
    
    ws.current.onclose = () => {
      setIsConnected(false)
      // Attempt reconnection after 3 seconds
      setTimeout(connect, 3000)
    }
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [token, role])
  
  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }, [])
  
  useEffect(() => {
    connect()
    
    return () => {
      ws.current?.close()
    }
  }, [connect])
  
  return { isConnected, lastMessage, sendMessage }
}

function playNotificationSound() {
  const audio = new Audio('/sounds/notification.mp3')
  audio.play().catch(console.error)
}
```

### Table Management Component
```tsx
// src/components/restaurant/TableGrid.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table } from '@types/models'
import api from '@services/api/client'

interface TableGridProps {
  onTableSelect: (table: Table) => void
}

export const TableGrid: React.FC<TableGridProps> = ({ onTableSelect }) => {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    fetchTables()
  }, [])
  
  const fetchTables = async () => {
    try {
      const response = await api.get('/tables')
      setTables(response.data)
    } catch (error) {
      console.error('Failed to fetch tables:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getTableColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-500 hover:bg-green-200'
      case 'occupied':
        return 'bg-red-100 border-red-500 hover:bg-red-200'
      case 'reserved':
        return 'bg-yellow-100 border-yellow-500 hover:bg-yellow-200'
      case 'cleaning':
        return 'bg-gray-100 border-gray-500 hover:bg-gray-200'
      default:
        return 'bg-white border-gray-300'
    }
  }
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
      {tables.map((table) => (
        <button
          key={table.id}
          onClick={() => onTableSelect(table)}
          className={`
            relative p-6 rounded-lg border-2 transition-all duration-200
            ${getTableColor(table.current_status)}
            min-h-[120px] flex flex-col items-center justify-center
            touch-manipulation active:scale-95
          `}
          style={{ minHeight: '120px' }} // Ensure 44px+ touch target
        >
          <div className="text-2xl font-bold mb-1">
            Table {table.number}
          </div>
          <div className="text-sm text-gray-600">
            {table.capacity} seats
          </div>
          <div className="text-xs mt-2 font-medium">
            {table.current_status.toUpperCase()}
          </div>
          {table.current_order_id && (
            <div className="absolute top-2 right-2">
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Order #{table.current_order_id}
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
```

### Order Creation Form
```tsx
// src/components/forms/OrderForm.tsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Product, OrderItem } from '@types/models'
import { formatCurrency } from '@utils/formatters'

interface OrderFormData {
  table_number: number
  customer_name?: string
  customer_notes?: string
  items: OrderItem[]
}

export const OrderForm: React.FC = () => {
  const [cart, setCart] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<OrderFormData>()
  
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.base_price,
        modifications: {}
      }]
    })
  }
  
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId))
  }
  
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  }
  
  const onSubmit = async (data: OrderFormData) => {
    const orderData = {
      ...data,
      items: cart
    }
    
    try {
      const response = await api.post('/orders', orderData)
      // Handle success - navigate to order view or clear cart
      setCart([])
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Product Selection */}
      <div className="flex-1">
        <ProductGrid
          category={selectedCategory}
          onProductSelect={addToCart}
        />
      </div>
      
      {/* Cart and Order Details */}
      <div className="w-full lg:w-96 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Current Order</h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Table Number
            </label>
            <input
              type="number"
              {...register('table_number', { required: true, min: 1 })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.table_number && (
              <span className="text-red-500 text-xs">Table number is required</span>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              {...register('customer_name')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Cart Items */}
          <div className="mb-4 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              cart.map(item => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))
            )}
          </div>
          
          {/* Total */}
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  )
}
```

### Offline Support with Service Worker
```typescript
// src/hooks/useOffline.ts
import { useState, useEffect } from 'react'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      // Sync pending requests when back online
      syncPendingRequests()
    }
    
    const handleOffline = () => {
      setIsOffline(true)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const syncPendingRequests = async () => {
    const requests = JSON.parse(localStorage.getItem('pendingRequests') || '[]')
    
    for (const request of requests) {
      try {
        await api[request.method](request.url, request.data)
      } catch (error) {
        console.error('Failed to sync request:', error)
      }
    }
    
    localStorage.removeItem('pendingRequests')
    setPendingRequests([])
  }
  
  const queueRequest = (method: string, url: string, data?: any) => {
    const request = { method, url, data, timestamp: Date.now() }
    const existing = JSON.parse(localStorage.getItem('pendingRequests') || '[]')
    existing.push(request)
    localStorage.setItem('pendingRequests', JSON.stringify(existing))
    setPendingRequests(existing)
  }
  
  return { isOffline, pendingRequests, queueRequest }
}
```

### Tailwind Configuration for Restaurant UI
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Restaurant brand colors
        'restaurant': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      screens: {
        'tablet': '768px',
        'desktop': '1024px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### State Management with Context
```tsx
// src/store/contexts/OrderContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react'

interface OrderState {
  currentOrder: Order | null
  cart: OrderItem[]
  selectedTable: number | null
}

type OrderAction =
  | { type: 'SET_TABLE'; payload: number }
  | { type: 'ADD_TO_CART'; payload: OrderItem }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ORDER'; payload: Order }

const initialState: OrderState = {
  currentOrder: null,
  cart: [],
  selectedTable: null,
}

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_TABLE':
      return { ...state, selectedTable: action.payload }
    case 'ADD_TO_CART':
      const existing = state.cart.find(
        item => item.product_id === action.payload.product_id
      )
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product_id === action.payload.product_id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return { ...state, cart: [...state.cart, action.payload] }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product_id !== action.payload)
      }
    case 'CLEAR_CART':
      return { ...state, cart: [] }
    case 'SET_ORDER':
      return { ...state, currentOrder: action.payload }
    default:
      return state
  }
}

const OrderContext = createContext<{
  state: OrderState
  dispatch: React.Dispatch<OrderAction>
} | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState)
  
  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}
```

## Performance Optimizations

### Code Splitting
```tsx
// src/App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy load pages
const AdminDashboard = lazy(() => import('@pages/admin/Dashboard'))
const WaiterView = lazy(() => import('@pages/waiter/TableView'))
const KitchenQueue = lazy(() => import('@pages/kitchen/KitchenQueue'))
const POSCheckout = lazy(() => import('@pages/pos/Checkout'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/waiter/*" element={<WaiterView />} />
          <Route path="/kitchen/*" element={<KitchenQueue />} />
          <Route path="/pos/*" element={<POSCheckout />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### Memoization for Expensive Components
```tsx
// src/components/restaurant/MenuCard.tsx
import React, { memo } from 'react'

export const MenuCard = memo(({ product, onSelect }) => {
  return (
    <div className="menu-card">
      {/* Component content */}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.is_available === nextProps.product.is_available
})
```

## Testing Setup

```typescript
// src/components/__tests__/TableGrid.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TableGrid } from '../restaurant/TableGrid'
import { vi } from 'vitest'

describe('TableGrid', () => {
  it('displays tables with correct status colors', () => {
    const mockTables = [
      { id: 1, number: 1, capacity: 4, current_status: 'available' },
      { id: 2, number: 2, capacity: 2, current_status: 'occupied' }
    ]
    
    render(<TableGrid tables={mockTables} onTableSelect={vi.fn()} />)
    
    expect(screen.getByText('Table 1')).toBeInTheDocument()
    expect(screen.getByText('Table 2')).toBeInTheDocument()
  })
  
  it('calls onTableSelect when table is clicked', () => {
    const handleSelect = vi.fn()
    const mockTables = [
      { id: 1, number: 1, capacity: 4, current_status: 'available' }
    ]
    
    render(<TableGrid tables={mockTables} onTableSelect={handleSelect} />)
    
    fireEvent.click(screen.getByText('Table 1'))
    expect(handleSelect).toHaveBeenCalledWith(mockTables[0])
  })
})
```