import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { toast } from '../../lib/toast';
import {
  ClockIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  notes?: string;
  elapsed_time: number; // minutos
}

interface Order {
  id: number;
  table: number;
  waiter?: string;
  items: OrderItem[];
  created_at: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  priority?: 'normal' | 'urgent' | 'vip';
  total_items: number;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    icon: BellAlertIcon 
  },
  preparing: { 
    label: 'Preparando', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50',
    icon: FireIcon 
  },
  ready: { 
    label: 'Listo', 
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    bgLight: 'bg-green-50',
    icon: CheckCircleIcon 
  },
  delivered: { 
    label: 'Entregado', 
    color: 'bg-gray-400', 
    textColor: 'text-gray-600',
    bgLight: 'bg-gray-50',
    icon: EyeIcon 
  }
};

export const KitchenProfessional: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState<Record<string, number>>({
    pending: 0,
    preparing: 0,
    ready: 0
  });
  const pulseTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Mock data
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 1,
        table: 5,
        waiter: 'Juan',
        status: 'pending',
        priority: 'urgent',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        total_items: 4,
        items: [
          { id: 1, name: 'Hamburguesa Clásica', quantity: 2, elapsed_time: 5 },
          { id: 2, name: 'Papas Fritas', quantity: 2, elapsed_time: 5 },
          { id: 3, name: 'Coca Cola', quantity: 2, elapsed_time: 5, notes: 'Sin hielo' }
        ]
      },
      {
        id: 2,
        table: 8,
        waiter: 'María',
        status: 'preparing',
        created_at: new Date(Date.now() - 12 * 60000).toISOString(),
        total_items: 3,
        items: [
          { id: 4, name: 'Pizza Margherita', quantity: 1, elapsed_time: 12 },
          { id: 5, name: 'Ensalada César', quantity: 1, elapsed_time: 12 },
          { id: 6, name: 'Agua Mineral', quantity: 2, elapsed_time: 12 }
        ]
      },
      {
        id: 3,
        table: 3,
        waiter: 'Pedro',
        status: 'ready',
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
        total_items: 2,
        items: [
          { id: 7, name: 'Milanesa Napolitana', quantity: 1, elapsed_time: 20, notes: 'Sin cebolla' },
          { id: 8, name: 'Puré de Papas', quantity: 1, elapsed_time: 20 }
        ]
      },
      {
        id: 4,
        table: 12,
        status: 'pending',
        priority: 'vip',
        created_at: new Date(Date.now() - 2 * 60000).toISOString(),
        total_items: 5,
        items: [
          { id: 9, name: 'Bife de Chorizo', quantity: 2, elapsed_time: 2 },
          { id: 10, name: 'Ensalada Mixta', quantity: 2, elapsed_time: 2 },
          { id: 11, name: 'Vino Tinto', quantity: 1, elapsed_time: 2 }
        ]
      }
    ];
    setOrders(mockOrders);
  }, []);

  // Simular nuevos pedidos
  useEffect(() => {
    const interval = setInterval(() => {
      const randomStatus = ['pending', 'preparing', 'ready'][Math.floor(Math.random() * 3)];
      
      // Incrementar contador
      setNewOrdersCount(prev => ({
        ...prev,
        [randomStatus]: prev[randomStatus] + 1
      }));

      // Limpiar el contador después de 3 segundos
      if (pulseTimeouts.current[randomStatus]) {
        clearTimeout(pulseTimeouts.current[randomStatus]);
      }
      
      pulseTimeouts.current[randomStatus] = setTimeout(() => {
        setNewOrdersCount(prev => ({
          ...prev,
          [randomStatus]: 0
        }));
      }, 3000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 10) return 'text-green-600';
    if (minutes < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
    ));
    toast.success(`Orden #${orderId} movida a ${statusConfig[newStatus as keyof typeof statusConfig].label}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <PageHeader
        title="Cocina"
        subtitle="Gestión de pedidos en tiempo real"
        actions={[
          {
            label: 'Actualizar',
            onClick: () => window.location.reload(),
            icon: ArrowPathIcon,
            variant: 'secondary'
          }
        ]}
      />

      {/* Tabs de Estados - Más compactos */}
      <div className="bg-white shadow-sm border-b px-4 py-2">
        <div className="flex gap-2">
          {Object.entries(statusConfig).map(([key, config]) => {
            if (key === 'delivered') return null; // No mostrar entregados
            const Icon = config.icon;
            const count = getOrdersByStatus(key).length;
            const newCount = newOrdersCount[key] || 0;
            
            return (
              <motion.button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${activeTab === key 
                    ? `${config.bgLight} ${config.textColor} shadow-sm` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                <span>{config.label}</span>
                
                {/* Badge con cantidad */}
                <span className={`
                  ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === key ? 'bg-white' : 'bg-gray-200'}
                `}>
                  {count}
                </span>

                {/* Badge animado para nuevos pedidos */}
                <AnimatePresence>
                  {newCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
                               rounded-full h-5 w-5 flex items-center justify-center font-bold"
                    >
                      {newCount}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Pulso para notificación */}
                {newCount > 0 && (
                  <motion.span
                    className="absolute inset-0 rounded-lg bg-red-400 opacity-30"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Contenido - Cards de pedidos */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {getOrdersByStatus(activeTab).map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header de la tarjeta */}
                <div className={`
                  px-3 py-2 border-b flex justify-between items-center
                  ${order.priority === 'urgent' ? 'bg-red-50' : 
                    order.priority === 'vip' ? 'bg-purple-50' : 'bg-gray-50'}
                `}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">Mesa {order.table}</span>
                    {order.priority === 'urgent' && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        URGENTE
                      </span>
                    )}
                    {order.priority === 'vip' && (
                      <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <ClockIcon className={`h-4 w-4 ${getTimeColor(order.items[0]?.elapsed_time || 0)}`} />
                    <span className={getTimeColor(order.items[0]?.elapsed_time || 0)}>
                      {order.items[0]?.elapsed_time || 0}m
                    </span>
                  </div>
                </div>

                {/* Items del pedido */}
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.quantity}x</span>{' '}
                        <span>{item.name}</span>
                        {item.notes && (
                          <div className="text-xs text-orange-600 mt-0.5">
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer con acciones */}
                <div className="px-3 py-2 bg-gray-50 border-t flex gap-2">
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      className="flex-1 bg-orange-500 text-white py-1.5 px-3 rounded text-sm font-medium
                               hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <FireIcon className="h-4 w-4" />
                      Preparar
                    </button>
                  )}
                  {activeTab === 'preparing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'ready')}
                      className="flex-1 bg-green-500 text-white py-1.5 px-3 rounded text-sm font-medium
                               hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Listo
                    </button>
                  )}
                  {activeTab === 'ready' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                      className="flex-1 bg-gray-500 text-white py-1.5 px-3 rounded text-sm font-medium
                               hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                    >
                      Entregado
                    </button>
                  )}
                  {order.waiter && (
                    <div className="text-xs text-gray-500 flex items-center">
                      Mesero: {order.waiter}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Mensaje cuando no hay pedidos */}
        {getOrdersByStatus(activeTab).length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            {(() => {
              const StatusIcon = statusConfig[activeTab as keyof typeof statusConfig]?.icon || BellAlertIcon;
              return <StatusIcon className="h-16 w-16 mb-4" />;
            })()}
            <p className="text-lg">No hay pedidos {statusConfig[activeTab as keyof typeof statusConfig]?.label?.toLowerCase() || ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};