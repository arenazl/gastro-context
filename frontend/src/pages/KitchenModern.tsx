import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton, GradientText } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import {
  ClockIcon,
  FireIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ArrowPathIcon,
  SparklesIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

// Nuevas interfaces para la estructura mejorada
interface KitchenItem {
  id: number;
  item_id: number;
  name: string;
  quantity: number;
  station: 'grill' | 'salads' | 'desserts' | 'drinks' | 'fryer' | 'general';
  status: 'new' | 'viewed' | 'preparing' | 'delayed' | 'ready' | 'delivered';
  special_instructions?: string;
  waiting_minutes: number;
  cooking_minutes: number;
  estimated_minutes: number;
  alert_color: 'green' | 'yellow' | 'red';
  started_at?: string;
}

interface KitchenOrder {
  id: number;
  table_number: number;
  waiter: string;
  priority: 'normal' | 'rush' | 'vip';
  created_at: string;
  items: KitchenItem[];
}

// Mapeo de estaciones a colores y nombres
const stationConfig = {
  grill: { name: 'Parrilla', color: '#EF4444', icon: FireIcon },
  salads: { name: 'Ensaladas', color: '#10B981', icon: SparklesIcon },
  desserts: { name: 'Postres', color: '#F59E0B', icon: SparklesIcon },
  drinks: { name: 'Bebidas', color: '#3B82F6', icon: SparklesIcon },
  fryer: { name: 'Freidora', color: '#8B5CF6', icon: FireIcon },
  general: { name: 'General', color: '#6B7280', icon: SparklesIcon }
};

// Mapeo de estados a colores
const statusConfig = {
  new: { name: 'Nuevo', color: '#3B82F6', icon: BellIcon },
  viewed: { name: 'Visto', color: '#8B5CF6', icon: EyeIcon },
  preparing: { name: 'Preparando', color: '#F59E0B', icon: FireIcon },
  delayed: { name: 'Demorado', color: '#EF4444', icon: ExclamationTriangleIcon },
  ready: { name: 'Listo', color: '#10B981', icon: CheckCircleIcon },
  delivered: { name: 'Entregado', color: '#6B7280', icon: TruckIcon }
};


export const KitchenModern: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadOrders();
    // Auto-refresh cada 10 segundos si está habilitado
    const interval = autoRefresh ? setInterval(loadOrders, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders/kitchen`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error cargando pedidos de cocina');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de un item
  const updateItemStatus = async (itemId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/kitchen/items/${itemId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        toast.success(`Estado actualizado a ${statusConfig[newStatus as keyof typeof statusConfig].name}`);
        loadOrders();
      }
    } catch (error) {
      toast.error('Error actualizando estado');
    }
  };

  // Filtrar órdenes por estación y estado
  const filteredOrders = orders.filter(order => {
    const hasMatchingItems = order.items.some(item => {
      const stationMatch = selectedStation === 'all' || item.station === selectedStation;
      const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
      return stationMatch && statusMatch;
    });
    return hasMatchingItems;
  });

  // Calcular estadísticas
  const stats = {
    pending: orders.reduce((acc, order) => 
      acc + order.items.filter(item => item.status === 'new' || item.status === 'viewed').length, 0),
    preparing: orders.reduce((acc, order) => 
      acc + order.items.filter(item => item.status === 'preparing').length, 0),
    ready: orders.reduce((acc, order) => 
      acc + order.items.filter(item => item.status === 'ready').length, 0),
    delayed: orders.reduce((acc, order) => 
      acc + order.items.filter(item => item.status === 'delayed').length, 0)
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader
        title="Cocina"
        subtitle={`${filteredOrders.length} órdenes activas`}
        actions={[
          {
            label: autoRefresh ? 'Pausar' : 'Reanudar',
            onClick: () => setAutoRefresh(!autoRefresh),
            variant: autoRefresh ? 'secondary' : 'primary',
            icon: autoRefresh ? PauseIcon : PlayIcon
          },
          {
            label: 'Actualizar',
            onClick: loadOrders,
            variant: 'secondary',
            icon: ArrowPathIcon
          }
        ]}
      />

      <div className="p-6">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>Pendientes</p>
                <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{stats.pending}</p>
              </div>
              <BellIcon className="h-8 w-8" style={{ color: '#3B82F6' }} />
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>Preparando</p>
                <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{stats.preparing}</p>
              </div>
              <FireIcon className="h-8 w-8" style={{ color: '#F59E0B' }} />
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>Listos</p>
                <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{stats.ready}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8" style={{ color: '#10B981' }} />
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>Demorados</p>
                <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{stats.delayed}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8" style={{ color: '#EF4444' }} />
            </div>
          </GlassPanel>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStation('all')}
              className={`px-4 py-2 rounded-lg ${selectedStation === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Todas las estaciones
            </button>
            {Object.entries(stationConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStation(key)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedStation === key ? 'text-white' : 'text-gray-700'
                }`}
                style={{
                  backgroundColor: selectedStation === key ? config.color : '#E5E7EB'
                }}
              >
                <config.icon className="h-5 w-5" />
                {config.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg ${selectedStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Todos
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedStatus === key ? 'text-white' : 'text-gray-700'
                }`}
                style={{
                  backgroundColor: selectedStatus === key ? config.color : '#E5E7EB'
                }}
              >
                <config.icon className="h-4 w-4" />
                {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Órdenes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <ArrowPathIcon className="h-8 w-8" style={{ color: theme.colors.primary }} />
                </motion.div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p style={{ color: theme.colors.textMuted }}>No hay órdenes que coincidan con los filtros</p>
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassPanel className="h-full">
                    {/* Header de la orden */}
                    <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold" style={{ color: theme.colors.text }}>
                            Mesa {order.table_number}
                          </div>
                          {order.priority === 'vip' && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-600 text-white">
                              VIP
                            </span>
                          )}
                          {order.priority === 'rush' && (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-600 text-white">
                              URGENTE
                            </span>
                          )}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.textMuted }}>
                          #{order.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textMuted }}>
                        <UserIcon className="h-4 w-4" />
                        {order.waiter}
                        <ClockIcon className="h-4 w-4 ml-2" />
                        {new Date(order.created_at).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    {/* Items de la orden */}
                    <div className="p-4 space-y-3">
                      {order.items.map(item => {
                        const station = stationConfig[item.station];
                        const status = statusConfig[item.status];
                        const StatusIcon = status.icon;
                        
                        return (
                          <motion.div
                            key={item.id}
                            className="p-3 rounded-lg border"
                            style={{
                              borderColor: item.alert_color === 'red' ? '#EF4444' : 
                                         item.alert_color === 'yellow' ? '#F59E0B' : 
                                         theme.colors.border,
                              backgroundColor: item.alert_color === 'red' ? '#FEF2F2' :
                                             item.alert_color === 'yellow' ? '#FFFBEB' :
                                             theme.colors.surface
                            }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium" style={{ color: theme.colors.text }}>
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span 
                                    className="px-2 py-0.5 rounded-full text-xs"
                                    style={{ 
                                      backgroundColor: station.color + '20',
                                      color: station.color
                                    }}
                                  >
                                    {station.name}
                                  </span>
                                </div>
                                {item.special_instructions && (
                                  <p className="text-sm italic" style={{ color: theme.colors.textMuted }}>
                                    📝 {item.special_instructions}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <StatusIcon className="h-5 w-5" style={{ color: status.color }} />
                                <span className="text-sm font-medium" style={{ color: status.color }}>
                                  {status.name}
                                </span>
                              </div>
                            </div>

                            {/* Tiempos */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex gap-3">
                                <span style={{ color: theme.colors.textMuted }}>
                                  ⏱️ Esperando: {item.waiting_minutes}min
                                </span>
                                {item.cooking_minutes > 0 && (
                                  <span style={{ color: theme.colors.textMuted }}>
                                    🔥 Cocinando: {item.cooking_minutes}min
                                  </span>
                                )}
                              </div>
                              <span style={{ color: theme.colors.textMuted }}>
                                Est: {item.estimated_minutes}min
                              </span>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-2 mt-3">
                              {item.status === 'new' && (
                                <button
                                  onClick={() => updateItemStatus(item.id, 'viewed')}
                                  className="flex-1 px-3 py-1 rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
                                >
                                  <EyeIcon className="h-4 w-4 inline mr-1" />
                                  Marcar como visto
                                </button>
                              )}
                              {item.status === 'viewed' && (
                                <button
                                  onClick={() => updateItemStatus(item.id, 'preparing')}
                                  className="flex-1 px-3 py-1 rounded bg-orange-600 text-white text-sm hover:bg-orange-700"
                                >
                                  <PlayIcon className="h-4 w-4 inline mr-1" />
                                  Empezar preparación
                                </button>
                              )}
                              {item.status === 'preparing' && (
                                <>
                                  <button
                                    onClick={() => updateItemStatus(item.id, 'delayed')}
                                    className="flex-1 px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                                  >
                                    <PauseIcon className="h-4 w-4 inline mr-1" />
                                    Demorar
                                  </button>
                                  <button
                                    onClick={() => updateItemStatus(item.id, 'ready')}
                                    className="flex-1 px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                                  >
                                    <CheckIcon className="h-4 w-4 inline mr-1" />
                                    Listo
                                  </button>
                                </>
                              )}
                              {item.status === 'delayed' && (
                                <button
                                  onClick={() => updateItemStatus(item.id, 'preparing')}
                                  className="flex-1 px-3 py-1 rounded bg-orange-600 text-white text-sm hover:bg-orange-700"
                                >
                                  <PlayIcon className="h-4 w-4 inline mr-1" />
                                  Reanudar
                                </button>
                              )}
                              {item.status === 'ready' && (
                                <button
                                  onClick={() => updateItemStatus(item.id, 'delivered')}
                                  className="flex-1 px-3 py-1 rounded bg-gray-600 text-white text-sm hover:bg-gray-700"
                                >
                                  <TruckIcon className="h-4 w-4 inline mr-1" />
                                  Entregar
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </GlassPanel>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};