import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton, GradientText } from '../components/AnimatedComponents';
import {
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Table {
  id: number;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: number;
  order_total?: number;
  occupied_since?: string;
  customer_name?: string;
}

export const TablesModern: React.FC = () => {
  const { theme } = useTheme();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    number: '',
    seats: '4',
    status: 'available'
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || API_BASE_URL}/api/tables`);
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error loading tables:', error);
      // Mock data
      setTables([
        { id: 1, number: 1, seats: 4, status: 'available' },
        { id: 2, number: 2, seats: 2, status: 'occupied', current_order_id: 101, order_total: 45.50, occupied_since: '14:30', customer_name: 'John Doe' },
        { id: 3, number: 3, seats: 6, status: 'reserved', customer_name: 'Jane Smith' },
        { id: 4, number: 4, seats: 4, status: 'cleaning' },
        { id: 5, number: 5, seats: 8, status: 'occupied', current_order_id: 102, order_total: 120.00, occupied_since: '13:45', customer_name: 'Party of 6' },
        { id: 6, number: 6, seats: 2, status: 'available' },
        { id: 7, number: 7, seats: 4, status: 'available' },
        { id: 8, number: 8, seats: 6, status: 'occupied', current_order_id: 103, order_total: 89.99, occupied_since: '14:00' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.colors.success;
      case 'occupied': return theme.colors.error;
      case 'reserved': return theme.colors.warning;
      case 'cleaning': return theme.colors.info;
      default: return theme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircleIcon;
      case 'occupied': return UserGroupIcon;
      case 'reserved': return ClockIcon;
      case 'cleaning': return SparklesIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const handleStatusChange = async (table: Table, newStatus: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || API_BASE_URL}/api/tables/${table.id}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        loadTables();
      }
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  const handleSaveTable = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || API_BASE_URL}/api/tables`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: parseInt(formData.number),
            seats: parseInt(formData.seats),
            status: formData.status
          })
        }
      );

      if (response.ok) {
        loadTables();
        setShowAddModal(false);
        setFormData({ number: '', seats: '4', status: 'available' });
      }
    } catch (error) {
      console.error('Error saving table:', error);
    }
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length
  };

  return (
    <div className="p-6">
      {/* Page Header with Actions */}
      <PageHeader 
        title="Gestión de Mesas"
        subtitle={`${tables.filter(t => t.status === 'available').length} disponibles de ${tables.length} mesas`}
        actions={[
          {
            label: 'Nueva Mesa',
            onClick: () => setShowAddModal(true),
            variant: 'primary',
            icon: PlusIcon
          }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <AnimatedCard delay={0.1} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Total Tables</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{stats.total}</p>
            </div>
            <div className="p-3 " style={{ backgroundColor: theme.colors.primary + '20' }}>
              <UserGroupIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Available</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>{stats.available}</p>
            </div>
            <div className="p-3 " style={{ backgroundColor: theme.colors.success + '20' }}>
              <CheckCircleIcon className="h-6 w-6" style={{ color: theme.colors.success }} />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Occupied</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.error }}>{stats.occupied}</p>
            </div>
            <div className="p-3 " style={{ backgroundColor: theme.colors.error + '20' }}>
              <UserGroupIcon className="h-6 w-6" style={{ color: theme.colors.error }} />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Reserved</p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.warning }}>{stats.reserved}</p>
            </div>
            <div className="p-3 " style={{ backgroundColor: theme.colors.warning + '20' }}>
              <ClockIcon className="h-6 w-6" style={{ color: theme.colors.warning }} />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Tables Grid */}
      <GlassPanel delay={0.5}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: theme.colors.text }}>
          Restaurant Floor
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              className="h-12 w-12 border-4 "
              style={{
                borderColor: theme.colors.primary + '20',
                borderTopColor: theme.colors.primary
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.map((table, index) => {
              const StatusIcon = getStatusIcon(table.status);
              
              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => setSelectedTable(table)}
                  className="relative p-6  cursor-pointer transition-all"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `2px solid ${getStatusColor(table.status)}40`
                  }}
                >
                  {/* Table Number */}
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: getStatusColor(table.status) }}
                    >
                      {table.number}
                    </span>
                  </div>

                  {/* Status Icon */}
                  <div className="absolute top-2 right-2">
                    <StatusIcon
                      className="h-6 w-6"
                      style={{ color: getStatusColor(table.status) }}
                    />
                  </div>

                  {/* Table Visual */}
                  <div className="mt-8 mb-4 flex justify-center">
                    <motion.div
                      className="w-16 h-16  flex items-center justify-center"
                      style={{
                        backgroundColor: getStatusColor(table.status) + '20',
                        border: `2px solid ${getStatusColor(table.status)}`
                      }}
                      animate={{
                        scale: table.status === 'occupied' ? [1, 1.1, 1] : 1
                      }}
                      transition={{
                        duration: 2,
                        repeat: table.status === 'occupied' ? Infinity : 0
                      }}
                    >
                      <span className="text-xl font-bold" style={{ color: getStatusColor(table.status) }}>
                        {table.seats}
                      </span>
                    </motion.div>
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <p className="text-xs font-medium uppercase mb-1" style={{ color: theme.colors.textMuted }}>
                      {table.status}
                    </p>
                    {table.status === 'occupied' && (
                      <>
                        <p className="text-sm" style={{ color: theme.colors.text }}>
                          {table.customer_name || 'Guest'}
                        </p>
                        <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                          Since {table.occupied_since}
                        </p>
                        {table.order_total && (
                          <p className="text-sm font-bold mt-1" style={{ color: theme.colors.primary }}>
                            ${table.order_total.toFixed(2)}
                          </p>
                        )}
                      </>
                    )}
                    {table.status === 'reserved' && table.customer_name && (
                      <p className="text-sm" style={{ color: theme.colors.text }}>
                        {table.customer_name}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassPanel>

      {/* Table Details Modal */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    Table {selectedTable.number}
                  </h2>
                  <motion.button
                    onClick={() => setSelectedTable(null)}
                    className="p-2 "
                    style={{ backgroundColor: theme.colors.surface }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XCircleIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 " style={{ backgroundColor: theme.colors.surface }}>
                    <span style={{ color: theme.colors.textMuted }}>Seats</span>
                    <span className="font-medium" style={{ color: theme.colors.text }}>{selectedTable.seats}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 " style={{ backgroundColor: theme.colors.surface }}>
                    <span style={{ color: theme.colors.textMuted }}>Status</span>
                    <span
                      className="px-3 py-1  text-sm font-medium"
                      style={{
                        backgroundColor: getStatusColor(selectedTable.status) + '20',
                        color: getStatusColor(selectedTable.status)
                      }}
                    >
                      {selectedTable.status}
                    </span>
                  </div>

                  {selectedTable.customer_name && (
                    <div className="flex items-center justify-between p-3 " style={{ backgroundColor: theme.colors.surface }}>
                      <span style={{ color: theme.colors.textMuted }}>Customer</span>
                      <span className="font-medium" style={{ color: theme.colors.text }}>{selectedTable.customer_name}</span>
                    </div>
                  )}

                  {selectedTable.order_total && (
                    <div className="flex items-center justify-between p-3 " style={{ backgroundColor: theme.colors.surface }}>
                      <span style={{ color: theme.colors.textMuted }}>Current Bill</span>
                      <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                        ${selectedTable.order_total.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    {selectedTable.status !== 'available' && (
                      <FloatingButton
                        onClick={() => {
                          handleStatusChange(selectedTable, 'available');
                          setSelectedTable(null);
                        }}
                        variant="primary"
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Mark Available
                      </FloatingButton>
                    )}
                    {selectedTable.status === 'available' && (
                      <FloatingButton
                        onClick={() => {
                          handleStatusChange(selectedTable, 'occupied');
                          setSelectedTable(null);
                        }}
                        variant="primary"
                      >
                        <UserGroupIcon className="h-5 w-5 mr-2" />
                        Mark Occupied
                      </FloatingButton>
                    )}
                    {selectedTable.status !== 'cleaning' && (
                      <FloatingButton
                        onClick={() => {
                          handleStatusChange(selectedTable, 'cleaning');
                          setSelectedTable(null);
                        }}
                        variant="secondary"
                      >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Mark Cleaning
                      </FloatingButton>
                    )}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    Add New Table
                  </h2>
                  <motion.button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 "
                    style={{ backgroundColor: theme.colors.surface }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XCircleIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Table Number
                    </label>
                    <input
                      type="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="w-full px-4 py-2 "
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Enter table number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Number of Seats
                    </label>
                    <select
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                      className="w-full px-4 py-2 "
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <option key={num} value={num}>{num} seats</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Initial Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 "
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="cleaning">Cleaning</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2  font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <FloatingButton
                    onClick={handleSaveTable}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Add Table
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};