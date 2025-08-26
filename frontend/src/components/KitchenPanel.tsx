import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { Clock, CheckCircle, AlertCircle, Coffee, UtensilsCrossed } from 'lucide-react';

import { useTranslation } from 'react-i18next';

interface OrderItem {
  product_name: string;
  quantity: number;
  status: 'pending' | 'preparing' | 'ready';
  notes?: string;
}

interface Order {
  id: number;
  table_number: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  created_at: string;
  waiter?: string;
  updated_at?: string;
}

const KitchenPanel: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://172.29.228.80:9001';
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          setConnectionStatus('connected');
          console.log('Connected to kitchen WebSocket');
          
          // Request active orders
          wsRef.current?.send(JSON.stringify({
            type: 'get_active_orders'
          }));
        };
        
        wsRef.current.onmessage = (event) => {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('disconnected');
        };
        
        wsRef.current.onclose = () => {
          setConnectionStatus('disconnected');
          // Desactivado: reconexión automática de WebSocket
          // reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionStatus('disconnected');
      }
    };
    
    connectWebSocket();
    
    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'active_orders':
        setOrders(message.orders);
        break;
        
      case 'order_received':
        setOrders(prev => [...prev, message.order]);
        // Play notification sound
        playNotificationSound();
        break;
        
      case 'order_status_changed':
        setOrders(prev => prev.map(order => 
          order.id === message.order_id 
            ? { ...order, status: message.status, updated_at: message.updated_at }
            : order
        ));
        break;
        
      case 'item_status_changed':
        setOrders(prev => prev.map(order => {
          if (order.id === message.order_id) {
            const updatedItems = [...order.items];
            updatedItems[message.item_index] = {
              ...updatedItems[message.item_index],
              status: message.status
            };
            return {
              ...order,
              items: updatedItems,
              status: message.order_ready ? 'ready' : order.status
            };
          }
          return order;
        }));
        break;
    }
  };
  
  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };
  
  const updateItemStatus = (orderId: number, itemIndex: number, newStatus: 'preparing' | 'ready') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_item_status',
        order_id: orderId,
        item_index: itemIndex,
        status: newStatus
      }));
    }
  };
  
  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_order_status',
        order_id: orderId,
        status: newStatus
      }));
    }
  };
  
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'delivered': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'preparing': return <Coffee className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };
  
  const activeOrders = orders.filter(order => order.status !== 'delivered');
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UtensilsCrossed className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-800">{t('pages.kitchen.title')}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'connecting' ? 'Conectando...' :
                 'Desconectado'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              <Clock className="inline w-4 h-4 mr-1" />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-600">Pendientes</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {orders.filter(o => o.status === 'preparing').length}
          </div>
          <div className="text-sm text-blue-600">Preparando</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {orders.filter(o => o.status === 'ready').length}
          </div>
          <div className="text-sm text-green-600">Listos</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {activeOrders.length}
          </div>
          <div className="text-sm text-purple-600">Total Activos</div>
        </div>
      </div>
      
      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeOrders.map(order => (
          <div 
            key={order.id}
            className={`bg-white rounded-lg shadow-md border-2 ${
              order.status === 'pending' ? 'border-yellow-400 animate-pulse' :
              order.status === 'preparing' ? 'border-blue-400' :
              order.status === 'ready' ? 'border-green-400' :
              'border-gray-300'
            }`}
          >
            {/* Order Header */}
            <div className={`p-3 rounded-t-md ${getStatusColor(order.status)}`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">Mesa {order.table_number}</span>
                  <span className="ml-2 text-sm opacity-75">#{order.id}</span>
                </div>
                <div className="text-sm">
                  {getTimeSince(order.created_at)}
                </div>
              </div>
              {order.waiter && (
                <div className="text-xs mt-1 opacity-75">
                  Mesero: {order.waiter}
                </div>
              )}
            </div>
            
            {/* Order Items */}
            <div className="p-3 space-y-2">
              {order.items.map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    item.status === 'ready' ? 'bg-green-50' :
                    item.status === 'preparing' ? 'bg-blue-50' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {getItemStatusIcon(item.status)}
                    <div>
                      <div className="font-medium text-sm">
                        {item.quantity}x {item.product_name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-600 italic">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Item Action Buttons */}
                  <div className="flex space-x-1">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => updateItemStatus(order.id, index, 'preparing')}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Preparar
                      </button>
                    )}
                    {item.status === 'preparing' && (
                      <button
                        onClick={() => updateItemStatus(order.id, index, 'ready')}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Listo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Actions */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex justify-between">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Comenzar Preparación
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Marcar Como Listo
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Entregado
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {activeOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Coffee className="w-16 h-16 mb-4" />
          <p className="text-lg">No hay pedidos activos</p>
          <p className="text-sm mt-2">Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      )}
    </div>
  );
};

export default KitchenPanel;