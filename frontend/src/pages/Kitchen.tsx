import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, CheckIcon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: number;
  table_number: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
  priority?: 'normal' | 'rush';
  waiter_name?: string;
}

export const Kitchen: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 1001,
        table_number: 5,
        status: 'pending',
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        waiter_name: 'John Doe',
        items: [
          { id: 1, product_name: 'Caesar Salad', quantity: 2, notes: 'No croutons' },
          { id: 2, product_name: 'Grilled Salmon', quantity: 1, notes: '' },
          { id: 3, product_name: 'Ribeye Steak', quantity: 1, notes: 'Medium rare' },
        ],
      },
      {
        id: 1002,
        table_number: 3,
        status: 'preparing',
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
        waiter_name: 'Jane Smith',
        priority: 'rush',
        items: [
          { id: 4, product_name: 'Margherita Pizza', quantity: 1, notes: '' },
          { id: 5, product_name: 'Pasta Carbonara', quantity: 2, notes: 'Extra bacon' },
        ],
      },
      {
        id: 1003,
        table_number: 8,
        status: 'preparing',
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        waiter_name: 'Mike Johnson',
        items: [
          { id: 6, product_name: 'French Onion Soup', quantity: 3, notes: '' },
          { id: 7, product_name: 'Chicken Parmesan', quantity: 2, notes: '' },
          { id: 8, product_name: 'Tiramisu', quantity: 2, notes: 'Birthday dessert' },
        ],
      },
      {
        id: 1004,
        table_number: 1,
        status: 'ready',
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
        waiter_name: 'Sarah Lee',
        items: [
          { id: 9, product_name: 'Fish and Chips', quantity: 1, notes: '' },
          { id: 10, product_name: 'House Burger', quantity: 1, notes: 'No pickles' },
        ],
      },
    ];
    setOrders(mockOrders);

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Add a new order every 30 seconds
      const newOrder: Order = {
        id: Date.now(),
        table_number: Math.floor(Math.random() * 10) + 1,
        status: 'pending',
        created_at: new Date().toISOString(),
        waiter_name: 'New Waiter',
        items: [
          {
            id: Date.now(),
            product_name: 'Random Dish',
            quantity: Math.floor(Math.random() * 3) + 1,
            notes: '',
          },
        ],
      };
      setOrders(prev => [newOrder, ...prev]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getOrderTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getTimeColor = (createdAt: string, status: string) => {
    if (status === 'ready' || status === 'delivered') return 'text-gray-500';
    
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes > 30) return 'text-red-600 font-bold';
    if (minutes > 15) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const updateOrderStatus = (orderId: number, newStatus: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      )
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return order.status !== 'delivered';
    return order.status === filter;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const orderCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header with filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.kitchen.title')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <BellIcon className="h-5 w-5 text-red-500 animate-pulse" />
              <span className="font-medium text-red-600">
                {orderCounts.pending} new orders
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({orderCounts.pending + orderCounts.preparing + orderCounts.ready})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending ({orderCounts.pending})
              </button>
              <button
                onClick={() => setFilter('preparing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'preparing'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Preparing ({orderCounts.preparing})
              </button>
              <button
                onClick={() => setFilter('ready')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'ready'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Ready ({orderCounts.ready})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow-sm border-2 ${
                order.priority === 'rush' ? 'border-red-500' : 'border-gray-200'
              } overflow-hidden hover:shadow-lg transition-shadow`}
            >
              {/* Order Header */}
              <div className={`px-4 py-3 border-b ${
                order.priority === 'rush' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      Table {order.table_number}
                    </span>
                    {order.priority === 'rush' && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded">
                        RUSH
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-gray-500">#{order.id}</span>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    <span className={getTimeColor(order.created_at, order.status)}>
                      {getOrderTime(order.created_at)}
                    </span>
                  </div>
                </div>
                {order.waiter_name && (
                  <div className="mt-1 text-xs text-gray-500">
                    Waiter: {order.waiter_name}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="px-4 py-3">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {item.quantity}x
                          </span>
                          <span className="text-gray-700">{item.product_name}</span>
                        </div>
                        {item.notes && (
                          <div className="mt-1 text-sm text-orange-600 italic">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium"
                      >
                        Start Preparing
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Mark Ready
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'pending')}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {order.status === 'ready' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
                      >
                        Mark Delivered
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
                      >
                        Back
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders to display</p>
            <p className="text-gray-400 text-sm mt-2">
              New orders will appear here automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
};