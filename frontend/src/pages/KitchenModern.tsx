import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton, GradientText } from '../components/AnimatedComponents';
import {
  ClockIcon,
  FireIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
}

interface Order {
  id: number;
  table_number: number;
  customer_name?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
  priority: 'normal' | 'high' | 'urgent';
  time_elapsed: number;
  waiter?: string;
}

export const KitchenModern: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    // Desactivado: actualizaciones automáticas cada 5 segundos
    // const interval = setInterval(loadOrders, 5000);
    // return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8003'}/api/orders/kitchen`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      // Mock data
      setOrders([
        {
          id: 101,
          table_number: 5,
          customer_name: 'John Doe',
          items: [
            { id: 1, name: 'Caesar Salad', quantity: 2, status: 'preparing' },
            { id: 2, name: 'Grilled Salmon', quantity: 1, status: 'pending', notes: 'No lemon' },
            { id: 3, name: 'Tiramisu', quantity: 2, status: 'pending' }
          ],
          status: 'preparing',
          created_at: '14:25',
          priority: 'normal',
          time_elapsed: 12,
          waiter: 'Sarah'
        },
        {
          id: 102,
          table_number: 3,
          customer_name: 'Jane Smith',
          items: [
            { id: 4, name: 'Ribeye Steak', quantity: 1, status: 'ready', notes: 'Medium rare' },
            { id: 5, name: 'Mashed Potatoes', quantity: 1, status: 'ready' }
          ],
          status: 'ready',
          created_at: '14:20',
          priority: 'high',
          time_elapsed: 17,
          waiter: 'Mike'
        },
        {
          id: 103,
          table_number: 8,
          items: [
            { id: 6, name: 'Margherita Pizza', quantity: 2, status: 'pending' },
            { id: 7, name: 'Garlic Bread', quantity: 1, status: 'pending' },
            { id: 8, name: 'Coca Cola', quantity: 3, status: 'ready' }
          ],
          status: 'pending',
          created_at: '14:30',
          priority: 'urgent',
          time_elapsed: 7,
          waiter: 'Tom'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'preparing': return theme.colors.info;
      case 'ready': return theme.colors.success;
      case 'completed': return theme.colors.textMuted;
      default: return theme.colors.textMuted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.colors.error;
      case 'high': return theme.colors.warning;
      case 'normal': return theme.colors.primary;
      default: return theme.colors.textMuted;
    }
  };

  const getTimeColor = (minutes: number) => {
    if (minutes > 30) return theme.colors.error;
    if (minutes > 20) return theme.colors.warning;
    return theme.colors.success;
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8003'}/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const updateItemStatus = async (orderId: number, itemId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8003'}/api/orders/${orderId}/items/${itemId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        loadOrders();
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    avgTime: Math.round(orders.reduce((acc, o) => acc + o.time_elapsed, 0) / orders.length || 0)
  };

  return (
    <div>
      {/* Page Header with Actions */}
      <PageHeader 
        title={t('pages.kitchen.title')}
        subtitle={`${stats.pending} pendientes • ${stats.preparing} preparando • ${stats.ready} listos`}
        actions={[
          {
            label: 'Actualizar',
            onClick: loadOrders,
            variant: 'primary',
            icon: ArrowPathIcon
          },
          {
            label: 'Alertas',
            onClick: () => console.log('Ver alertas'),
            variant: 'secondary',
            icon: BellIcon
          }
        ]}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <AnimatedCard delay={0.1} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Pending</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.warning }}>{stats.pending}</p>
            </div>
            <ClockIcon className="h-8 w-8" style={{ color: theme.colors.warning }} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Preparing</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.info }}>{stats.preparing}</p>
            </div>
            <FireIcon className="h-8 w-8" style={{ color: theme.colors.info }} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Ready</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>{stats.ready}</p>
            </div>
            <CheckIcon className="h-8 w-8" style={{ color: theme.colors.success }} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Avg Time</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>{stats.avgTime}m</p>
            </div>
            <ClockIcon className="h-8 w-8" style={{ color: theme.colors.primary }} />
          </div>
        </AnimatedCard>
      </div>

      {/* Filter Tabs */}
      <GlassPanel delay={0.5} className="mt-6">
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'preparing', 'ready'] as const).map((status) => (
            <motion.button
              key={status}
              onClick={() => setFilter(status)}
              className="px-4 py-2 rounded-lg font-medium capitalize transition-all"
              style={{
                backgroundColor: filter === status ? theme.colors.primary : theme.colors.surface,
                color: filter === status ? 'white' : theme.colors.text
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {status}
              {status !== 'all' && (
                <span className="ml-2">
                  ({orders.filter(o => o.status === status).length})
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              className="h-12 w-12 border-4 rounded-full"
              style={{
                borderColor: theme.colors.primary + '20',
                borderTopColor: theme.colors.primary
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <AnimatedCard
                    className="p-4 cursor-pointer"
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Priority Border */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                      style={{ backgroundColor: getPriorityColor(order.priority) }}
                    />
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 pl-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: theme.colors.text }}>
                            Table {order.table_number}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getStatusColor(order.status) + '20',
                              color: getStatusColor(order.status)
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                        {order.customer_name && (
                          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                            {order.customer_name}
                          </p>
                        )}
                      </div>
                      <motion.div
                        className="text-right"
                        animate={{
                          color: getTimeColor(order.time_elapsed)
                        }}
                      >
                        <p className="text-lg font-bold">{order.time_elapsed}m</p>
                        <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                          {order.created_at}
                        </p>
                      </motion.div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ backgroundColor: theme.colors.surface }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getStatusColor(item.status) }}
                            />
                            <span className="text-sm" style={{ color: theme.colors.text }}>
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          {item.notes && (
                            <ExclamationTriangleIcon
                              className="h-4 w-4"
                              style={{ color: theme.colors.warning }}
                            />
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-center" style={{ color: theme.colors.textMuted }}>
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" style={{ color: theme.colors.textMuted }} />
                        <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                          {order.waiter}
                        </span>
                      </div>
                      {order.priority === 'urgent' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <ExclamationTriangleIcon
                            className="h-5 w-5"
                            style={{ color: theme.colors.error }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </AnimatedCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </GlassPanel>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                      Order #{selectedOrder.id} - Table {selectedOrder.table_number}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                      {selectedOrder.customer_name || 'Walk-in Customer'}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>Status</p>
                    <p
                      className="text-sm font-medium mt-1"
                      style={{ color: getStatusColor(selectedOrder.status) }}
                    >
                      {selectedOrder.status}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>Priority</p>
                    <p
                      className="text-sm font-medium mt-1"
                      style={{ color: getPriorityColor(selectedOrder.priority) }}
                    >
                      {selectedOrder.priority}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>Time</p>
                    <p
                      className="text-sm font-medium mt-1"
                      style={{ color: getTimeColor(selectedOrder.time_elapsed) }}
                    >
                      {selectedOrder.time_elapsed} minutes
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium" style={{ color: theme.colors.text }}>Order Items</h3>
                  {selectedOrder.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: theme.colors.text }}>
                            {item.quantity}x {item.name}
                          </p>
                          {item.notes && (
                            <p className="text-sm" style={{ color: theme.colors.warning }}>
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status !== 'ready' && (
                          <motion.button
                            onClick={() => updateItemStatus(selectedOrder.id, item.id, 
                              item.status === 'pending' ? 'preparing' : 'ready'
                            )}
                            className="px-3 py-1 rounded-lg text-sm font-medium"
                            style={{
                              backgroundColor: theme.colors.primary,
                              color: 'white'
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {item.status === 'pending' ? 'Start' : 'Ready'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedOrder.status === 'pending' && (
                    <FloatingButton
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing');
                        setSelectedOrder(null);
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      <FireIcon className="h-5 w-5 mr-2" />
                      Start Preparing
                    </FloatingButton>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <FloatingButton
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'ready');
                        setSelectedOrder(null);
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Mark as Ready
                    </FloatingButton>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <FloatingButton
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'completed');
                        setSelectedOrder(null);
                      }}
                      variant="secondary"
                      className="flex-1"
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Complete Order
                    </FloatingButton>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};