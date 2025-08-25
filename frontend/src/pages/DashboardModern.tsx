import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, GradientText } from '../components/AnimatedComponents';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
  trend: 'up' | 'down';
}

export const DashboardModern: React.FC = () => {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats: StatCard[] = [
    {
      title: 'Today\'s Revenue',
      value: '$4,238',
      change: 12.5,
      icon: CurrencyDollarIcon,
      color: theme.colors.success,
      trend: 'up'
    },
    {
      title: 'Active Orders',
      value: 18,
      change: -5.2,
      icon: ShoppingCartIcon,
      color: theme.colors.primary,
      trend: 'down'
    },
    {
      title: 'Customers Today',
      value: 142,
      change: 8.7,
      icon: UserGroupIcon,
      color: theme.colors.secondary,
      trend: 'up'
    },
    {
      title: 'Avg. Order Time',
      value: '24 min',
      change: -15.3,
      icon: ClockIcon,
      color: theme.colors.accent,
      trend: 'up'
    }
  ];

  const recentOrders = [
    { id: '001', table: 5, time: '2 min ago', status: 'preparing', total: 45.50, items: 3 },
    { id: '002', table: 12, time: '5 min ago', status: 'ready', total: 128.00, items: 7 },
    { id: '003', table: 3, time: '8 min ago', status: 'delivered', total: 67.25, items: 4 },
    { id: '004', table: 8, time: '12 min ago', status: 'preparing', total: 89.99, items: 5 },
    { id: '005', table: 1, time: '15 min ago', status: 'delivered', total: 234.50, items: 12 }
  ];

  const popularItems = [
    { name: 'Caesar Salad', orders: 45, revenue: '$585', trend: 12 },
    { name: 'Ribeye Steak', orders: 38, revenue: '$1,520', trend: -5 },
    { name: 'Grilled Salmon', orders: 32, revenue: '$960', trend: 18 },
    { name: 'Margherita Pizza', orders: 28, revenue: '$420', trend: 8 },
    { name: 'Tiramisu', orders: 25, revenue: '$187.50', trend: 22 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return theme.colors.warning;
      case 'ready': return theme.colors.success;
      case 'delivered': return theme.colors.info;
      default: return theme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing': return FireIcon;
      case 'ready': return CheckCircleIcon;
      case 'delivered': return CheckCircleIcon;
      default: return ExclamationCircleIcon;
    }
  };

  return (
    <div>
      {/* Page Header with Actions */}
      <PageHeader
        title="Dashboard"
        subtitle={currentTime.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }) + ' • ' + currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        actions={[
          {
            label: 'Ver Reportes',
            onClick: () => console.log('Ver reportes'),
            variant: 'primary',
            icon: ChartBarIcon
          },
          {
            label: 'Exportar',
            onClick: () => console.log('Exportar'),
            variant: 'secondary',
            icon: ArrowDownIcon
          }
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
          const isPositive = (stat.trend === 'up' && stat.change > 0) || (stat.trend === 'down' && stat.change < 0);

          return (
            <AnimatedCard
              key={stat.title}
              delay={index * 0.1}
              className="p-6"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                    {stat.title}
                  </p>
                  <motion.p
                    className="text-3xl font-bold mt-2"
                    style={{ color: theme.colors.text }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.p>
                  <div className="flex items-center mt-2 gap-1">
                    <TrendIcon
                      className="h-4 w-4"
                      style={{ color: isPositive ? theme.colors.success : theme.colors.error }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: isPositive ? theme.colors.success : theme.colors.error }}
                    >
                      {Math.abs(stat.change)}%
                    </span>
                    <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                      vs yesterday
                    </span>
                  </div>
                </div>
                <motion.div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: stat.color + '20' }}
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring" }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </motion.div>
              </div>
            </AnimatedCard>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <GlassPanel className="lg:col-span-2" delay={0.4}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
              Recent Orders
            </h2>
            <motion.button
              className="text-sm font-medium"
              style={{ color: theme.colors.primary }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All →
            </motion.button>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow"
                  style={{ backgroundColor: theme.colors.surface }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: getStatusColor(order.status) + '20' }}
                    >
                      <StatusIcon
                        className="h-5 w-5"
                        style={{ color: getStatusColor(order.status) }}
                      />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        Order #{order.id} - Table {order.table}
                      </p>
                      <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                        {order.items} items • {order.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: theme.colors.primary }}>
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status)
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassPanel>

        {/* Popular Items */}
        <GlassPanel delay={0.6}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
              Top Items Today
            </h2>
            <ChartBarIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
          </div>

          <div className="space-y-4">
            {popularItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm" style={{ color: theme.colors.text }}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                      {item.revenue}
                    </span>
                    {item.trend > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" style={{ color: theme.colors.success }} />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.surface }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: theme.colors.primary,
                        width: '0%'
                      }}
                      animate={{ width: `${(item.orders / 45) * 100}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {item.orders}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: theme.colors.border }}>
            <p className="text-sm font-medium mb-3" style={{ color: theme.colors.text }}>
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                className="p-3 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: theme.colors.primary + '20',
                  color: theme.colors.primary
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New Order
              </motion.button>
              <motion.button
                className="p-3 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: theme.colors.secondary + '20',
                  color: theme.colors.secondary
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Reports
              </motion.button>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Activity Chart Placeholder */}
      <GlassPanel delay={0.8}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
            Sales Overview
          </h2>
          <div className="flex gap-2">
            {['Day', 'Week', 'Month'].map((period) => (
              <motion.button
                key={period}
                className="px-3 py-1 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: period === 'Day' ? theme.colors.primary : theme.colors.surface,
                  color: period === 'Day' ? 'white' : theme.colors.text
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {period}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div
          className="h-64 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <ChartBarIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
            <p style={{ color: theme.colors.textMuted }}>Sales chart visualization here</p>
          </motion.div>
        </div>
      </GlassPanel>
    </div>
  );
};