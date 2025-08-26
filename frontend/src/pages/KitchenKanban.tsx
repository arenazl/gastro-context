import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import {
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  statusConfig, 
  getTimeUrgency, 
  getMinutesRemaining,
  productImages 
} from '../config/kitchenConfig';

type OrderStatus = 'pending' | 'preparing' | 'ready';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  notes?: string;
  image?: string;
  price: number;
}

interface Order {
  id: number;
  table: number;
  customer?: string;
  waiter?: string;
  items: OrderItem[];
  created_at: Date;
  status: OrderStatus;
  priority?: 'normal' | 'urgent' | 'vip';
  elapsed_minutes: number;
  total: number;
}

export const KitchenKanban: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const refreshInterval = useRef<NodeJS.Timer>();
  const progressInterval = useRef<NodeJS.Timer>();

  // Datos realistas con nombres de clientes
  useEffect(() => {
    const initialOrders: Order[] = [
      // Pendientes
      {
        id: 101,
        table: 5,
        customer: 'Juan García',
        waiter: 'Carlos M.',
        status: 'pending',
        priority: 'urgent',
        created_at: new Date(Date.now() - 6 * 60000),
        elapsed_minutes: 6, // Urgente - pasó el tiempo objetivo
        total: 6930,
        items: [
          { id: 1, name: 'Hamburguesa Clásica', quantity: 2, price: 1850, image: productImages['Hamburguesa Clásica'] },
          { id: 2, name: 'Papas Fritas', quantity: 2, price: 890, image: productImages['Papas Fritas'] },
          { id: 3, name: 'Coca Cola', quantity: 3, price: 450, notes: 'Sin hielo', image: productImages['Coca Cola'] }
        ]
      },
      {
        id: 102,
        table: 12,
        customer: 'María López',
        waiter: 'Ana S.',
        status: 'pending',
        created_at: new Date(Date.now() - 3 * 60000),
        elapsed_minutes: 3,
        total: 3300,
        items: [
          { id: 4, name: 'Pizza Margherita', quantity: 1, price: 2200, image: productImages['Pizza Margherita'] },
          { id: 5, name: 'Cerveza', quantity: 2, price: 550, image: productImages['Cerveza'] }
        ]
      },
      {
        id: 103,
        table: 8,
        customer: 'Roberto Díaz (VIP)',
        waiter: 'Luis R.',
        status: 'pending',
        priority: 'vip',
        created_at: new Date(Date.now() - 1 * 60000),
        elapsed_minutes: 1,
        total: 11250,
        items: [
          { id: 6, name: 'Bife de Chorizo', quantity: 2, price: 3500, notes: 'Término medio', image: productImages['Bife de Chorizo'] },
          { id: 7, name: 'Ensalada César', quantity: 1, price: 1450, image: productImages['Ensalada César'] },
          { id: 8, name: 'Vino Tinto', quantity: 1, price: 2800, image: productImages['Vino Tinto'] }
        ]
      },
      // Preparando
      {
        id: 104,
        table: 3,
        customer: 'Ana Martínez',
        waiter: 'María G.',
        status: 'preparing',
        created_at: new Date(Date.now() - 18 * 60000),
        elapsed_minutes: 18, // Tardando más del objetivo
        total: 3920,
        items: [
          { id: 9, name: 'Milanesa Napolitana', quantity: 1, price: 2650, image: productImages['Milanesa Napolitana'] },
          { id: 10, name: 'Papas Fritas', quantity: 1, price: 890, image: productImages['Papas Fritas'] },
          { id: 11, name: 'Agua Mineral', quantity: 2, price: 380, image: productImages['Agua Mineral'] }
        ]
      },
      {
        id: 105,
        table: 7,
        customer: 'Carlos Rodríguez',
        waiter: 'Pedro L.',
        status: 'preparing',
        created_at: new Date(Date.now() - 8 * 60000),
        elapsed_minutes: 8,
        total: 5860,
        items: [
          { id: 12, name: 'Pasta Carbonara', quantity: 2, price: 1950, image: productImages['Pasta Carbonara'] },
          { id: 13, name: 'Tiramisú', quantity: 2, price: 980, image: productImages['Tiramisú'] }
        ]
      },
      {
        id: 106,
        table: 15,
        customer: 'Lucía Fernández',
        waiter: 'Sofia T.',
        status: 'preparing',
        created_at: new Date(Date.now() - 12 * 60000),
        elapsed_minutes: 12,
        total: 5300,
        items: [
          { id: 14, name: 'Salmón Grillado', quantity: 1, price: 3200, notes: 'Sin sal', image: productImages['Salmón Grillado'] },
          { id: 15, name: 'Risotto de Hongos', quantity: 1, price: 2100, image: productImages['Risotto de Hongos'] }
        ]
      },
      // Listos
      {
        id: 107,
        table: 10,
        customer: 'Fernando Silva',
        waiter: 'Juan P.',
        status: 'ready',
        created_at: new Date(Date.now() - 7 * 60000),
        elapsed_minutes: 7, // Tardando en entregar
        total: 6650,
        items: [
          { id: 16, name: 'Pizza Margherita', quantity: 2, price: 2200, image: productImages['Pizza Margherita'] },
          { id: 17, name: 'Helado', quantity: 3, price: 750, image: productImages['Helado'] }
        ]
      },
      {
        id: 108,
        table: 2,
        customer: 'Patricia Gómez',
        waiter: 'Roberto M.',
        status: 'ready',
        created_at: new Date(Date.now() - 2 * 60000),
        elapsed_minutes: 2,
        total: 2300,
        items: [
          { id: 18, name: 'Hamburguesa Clásica', quantity: 1, price: 1850, image: productImages['Hamburguesa Clásica'] },
          { id: 19, name: 'Coca Cola', quantity: 1, price: 450, image: productImages['Coca Cola'] }
        ]
      }
    ];
    // Los datos iniciales ya no se usan, se cargan desde el servidor
  }, []);

  // Función para cargar órdenes desde el servidor
  const loadFreshData = useCallback(async () => {
    try {
      const response = await fetch('${API_BASE_URL}/api/orders/kitchen');
      if (!response.ok) throw new Error('Error al cargar órdenes');
      
      const data = await response.json();
      
      // Transformar las órdenes del servidor al formato del componente
      const transformedOrders = (data || []).map((order: any) => {
        const createdAt = new Date(order.created_at);
        const elapsedMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);
        
        // Determinar el estado de la orden basado en los items
        let orderStatus = 'pending';
        if (order.items && order.items.length > 0) {
          const itemStatuses = order.items.map((item: any) => item.status);
          if (itemStatuses.every((s: string) => s === 'ready')) {
            orderStatus = 'ready';
          } else if (itemStatuses.some((s: string) => s === 'preparing')) {
            orderStatus = 'preparing';
          } else if (itemStatuses.some((s: string) => s === 'viewed')) {
            orderStatus = 'preparing';
          }
        }
        
        // Calcular total basado en los items
        const total = (order.items || []).reduce((sum: number, item: any) => {
          return sum + (item.quantity * 1500); // Precio aproximado por item
        }, 0);
        
        return {
          id: order.id,
          table: order.table_number,
          customer: `Mesa ${order.table_number}`,
          waiter: order.waiter || 'Sin asignar',
          status: orderStatus,
          created_at: createdAt,
          elapsed_minutes: elapsedMinutes,
          total: total,
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: 1500, // Precio aproximado
            image: productImages[item.name] || productImages['Hamburguesa Clásica']
          }))
        };
      });
      
      // Filtrar solo órdenes activas (pending, preparing, ready)
      const activeOrders = transformedOrders.filter((order: any) => 
        ['pending', 'preparing', 'ready'].includes(order.status)
      );
      
      // Ordenar por tiempo (más antiguas primero dentro de cada estado)
      activeOrders.sort((a: any, b: any) => {
        if (a.status !== b.status) {
          const statusPriority = { 'pending': 0, 'preparing': 1, 'ready': 2 };
          return statusPriority[a.status as keyof typeof statusPriority] - statusPriority[b.status as keyof typeof statusPriority];
        }
        return b.elapsed_minutes - a.elapsed_minutes;
      });
      
      setOrders(activeOrders);
      
      // Si hay nuevas órdenes pendientes, mostrar alerta
      const newPending = activeOrders.filter((o: any) => o.status === 'pending' && o.elapsed_minutes < 1);
      if (newPending.length > 0) {
        setNewOrderAlert('pending');
        setTimeout(() => setNewOrderAlert(null), 2000);
      }
    } catch (error) {
      console.error('Error al cargar órdenes desde el servidor:', error);
      // En caso de error, mantener las órdenes actuales sin hacer nada
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadFreshData();
  }, [loadFreshData]);

  // Sistema de refresh automático con barra de progreso
  useEffect(() => {
    let progress = 0;
    
    // Actualizar barra de progreso cada 100ms
    progressInterval.current = setInterval(() => {
      progress += 1;
      setRefreshProgress(progress);
      
      // Cuando llega al 100%, refrescar datos y reiniciar
      if (progress >= 100) {
        loadFreshData();
        progress = 0;
        setRefreshProgress(0);
      }
    }, 100); // 100ms * 100 = 10 segundos

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [loadFreshData]);

  // Actualizar tiempos cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prev => prev.map(order => ({
        ...order,
        elapsed_minutes: order.elapsed_minutes + 1
      })));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Función para ordenar pedidos por urgencia (minutos restantes para cambiar de estado)
  const sortOrdersByUrgency = (ordersList: Order[]): Order[] => {
    return [...ordersList].sort((a, b) => {
      // Prioridad VIP y urgente primero
      if (a.priority === 'vip' && b.priority !== 'vip') return -1;
      if (b.priority === 'vip' && a.priority !== 'vip') return 1;
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      
      // Luego por minutos restantes (menos minutos = más urgente)
      const aRemaining = getMinutesRemaining(a.status, a.elapsed_minutes);
      const bRemaining = getMinutesRemaining(b.status, b.elapsed_minutes);
      
      // Si uno está atrasado y otro no
      if (aRemaining === 0 && bRemaining > 0) return -1;
      if (bRemaining === 0 && aRemaining > 0) return 1;
      
      // Ordenar por tiempo transcurrido (más tiempo = más urgente)
      return b.elapsed_minutes - a.elapsed_minutes;
    });
  };

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    if (draggedOrder) {
      await moveOrder(draggedOrder.id, newStatus);
      setDraggedOrder(null);
    }
  };

  const moveOrder = async (orderId: number, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      // Mapear estados del componente a estados del backend
      const backendStatus = newStatus === 'preparing' ? 'preparing' : 
                           newStatus === 'ready' ? 'ready' : 'viewed';
      
      // Actualizar estado en el servidor (actualizar todos los items de la orden)
      const response = await fetch(`${API_BASE_URL}/api/kitchen/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: backendStatus })
      });
      
      if (!response.ok) throw new Error('Error al actualizar estado');
      
      // Actualizar estado local solo si el servidor responde OK
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus, elapsed_minutes: 0 } : o
      ));
      
      // Si la orden se completa, recargar datos para obtener actualizaciones
      if (newStatus === 'ready') {
        setTimeout(() => loadFreshData(), 500);
      }
    } catch (error) {
      console.error('Error al actualizar estado de la orden:', error);
      // En caso de error, mostrar el error pero mantener el estado local sin cambios
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader
        title="Cocina"
        subtitle="Vista Kanban en tiempo real"
      />

      {/* Barra de progreso de refresh */}
      <div className="h-1 bg-gray-200 relative">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ width: `${refreshProgress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Contenedor Kanban */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full grid grid-cols-3 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const columnOrders = sortOrdersByUrgency(orders.filter(o => o.status === status));
            const ColumnIcon = config.icon;
            
            return (
              <div
                key={status}
                className={`flex flex-col ${config.bgColor} rounded-xl shadow-lg overflow-hidden border ${config.borderColor}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status as OrderStatus)}
              >
                {/* Header de columna */}
                <div className={`${config.headerBg} text-white p-4 shadow-md`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ColumnIcon className="h-6 w-6" />
                      <h3 className="text-lg font-bold">{config.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                        {columnOrders.length}
                      </span>
                      {newOrderAlert === status && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                        >
                          NUEVO
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido de columna con scroll */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <AnimatePresence>
                    {columnOrders.map((order) => {
                      const minutesRemaining = getMinutesRemaining(order.status, order.elapsed_minutes);
                      const nextStatus = config.nextStatus;
                      const nextConfig = nextStatus ? statusConfig[nextStatus] : null;
                      
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.02 }}
                          draggable
                          onDragStart={() => handleDragStart(order)}
                          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-move"
                        >
                          {/* Header con nombre del cliente */}
                          <div className="px-3 pt-3 pb-2">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-gray-900 text-sm">
                                {order.customer}
                              </div>
                              {order.priority === 'vip' && (
                                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  VIP
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info de mesa y tiempo */}
                          <div className="px-3 pb-2 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-2xl font-bold text-gray-800">
                                  Mesa {order.table}
                                </span>
                                {order.priority === 'urgent' && (
                                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                    URGENTE
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getTimeUrgency(order.status, order.elapsed_minutes)}`}>
                                  <ClockIcon className="h-3 w-3" />
                                  {order.elapsed_minutes}m
                                </div>
                                {minutesRemaining > 0 ? (
                                  <span className="text-xs text-gray-500 mt-1">
                                    Faltan {minutesRemaining}m
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-600 font-semibold mt-1">
                                    Atrasado {Math.abs(minutesRemaining)}m
                                  </span>
                                )}
                              </div>
                            </div>
                            {order.waiter && (
                              <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                <UserIcon className="h-3 w-3" />
                                <span>{order.waiter}</span>
                              </div>
                            )}
                          </div>

                          {/* Items con imágenes */}
                          <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <img
                                  src={item.image || 'https://via.placeholder.com/40'}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700">{item.quantity}x</span>
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                  </div>
                                  {item.notes && (
                                    <div className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                                      <span>📝</span>
                                      <span>{item.notes}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Línea de total */}
                          <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-gray-700">
                                <CurrencyDollarIcon className="h-4 w-4" />
                                <span className="text-sm font-semibold">Total:</span>
                              </div>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </div>

                          {/* Footer con acciones - Color según estado destino */}
                          <div className="p-3 bg-white border-t border-gray-100">
                            <div className="flex gap-2">
                              {status === 'pending' && (
                                <button
                                  onClick={() => moveOrder(order.id, 'preparing')}
                                  className={`flex-1 ${statusConfig.preparing.buttonBg} ${statusConfig.preparing.buttonHover} 
                                           text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors 
                                           flex items-center justify-center gap-1`}
                                >
                                  <FireIcon className="h-4 w-4" />
                                  Preparar
                                </button>
                              )}
                              {status === 'preparing' && (
                                <button
                                  onClick={() => moveOrder(order.id, 'ready')}
                                  className={`flex-1 ${statusConfig.ready.buttonBg} ${statusConfig.ready.buttonHover} 
                                           text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors 
                                           flex items-center justify-center gap-1`}
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Listo
                                </button>
                              )}
                              {status === 'ready' && (
                                <button
                                  onClick={() => {
                                    setOrders(prev => prev.filter(o => o.id !== order.id));
                                  }}
                                  className="flex-1 text-white py-2 px-3 rounded-lg 
                                           text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                  style={{ backgroundColor: '#FF5722', ':hover': { backgroundColor: '#E64A19' } }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E64A19'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF5722'}
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Entregar
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Mensaje cuando no hay pedidos */}
                  {columnOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <ColumnIcon className="h-12 w-12 mb-2 opacity-30" />
                      <p className="text-sm">Sin pedidos</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};