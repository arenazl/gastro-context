import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import {
  UserCheckIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  StarIcon,
  HomeIcon,
  BuildingOfficeIcon,
  HeartIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002';

interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  preferences?: string;
  notes?: string;
  company_id: number;
  loyalty_points: number;
  total_visits: number;
  total_spent: number;
  is_active: boolean;
  created_at?: string;
}

interface Address {
  id?: number;
  customer_id: number;
  company_id: number;
  address_type: 'home' | 'work' | 'other';
  street_address: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  delivery_instructions?: string;
  is_active: boolean;
  created_at?: string;
}

export const CustomersManagement: React.FC = () => {
  const { theme } = useTheme();
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Editing states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'customers' | 'addresses'>('customers');
  
  // Form states
  const [customerForm, setCustomerForm] = useState<Customer>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    preferences: '',
    notes: '',
    company_id: 1,
    loyalty_points: 0,
    total_visits: 0,
    total_spent: 0,
    is_active: true
  });
  
  const [addressForm, setAddressForm] = useState<Address>({
    customer_id: 0,
    company_id: 1,
    address_type: 'home',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'Argentina',
    is_default: false,
    delivery_instructions: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerAddresses(selectedCustomer.id!);
    }
  }, [selectedCustomer]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCustomers(), loadAddresses()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers?company_id=1`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        if (data.length > 0 && !selectedCustomer) {
          setSelectedCustomer(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Error cargando clientes');
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/addresses?company_id=1`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Error cargando direcciones');
    }
  };

  const loadCustomerAddresses = async (customerId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/addresses?customer_id=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Error loading customer addresses:', error);
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.first_name || !customerForm.last_name) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }

    try {
      const url = editingCustomer 
        ? `${API_URL}/api/customers/${editingCustomer.id}`
        : `${API_URL}/api/customers`;
      
      const response = await fetch(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });

      if (response.ok) {
        toast.success(editingCustomer ? 'Cliente actualizado' : 'Cliente creado');
        loadCustomers();
        setShowCustomerModal(false);
        resetCustomerForm();
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Error al guardar cliente');
    }
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street_address || !addressForm.city) {
      toast.error('Dirección y ciudad son requeridas');
      return;
    }

    try {
      const addressData = {
        ...addressForm,
        customer_id: selectedCustomer?.id
      };
      
      const url = editingAddress 
        ? `${API_URL}/api/addresses/${editingAddress.id}`
        : `${API_URL}/api/addresses`;
      
      const response = await fetch(url, {
        method: editingAddress ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });

      if (response.ok) {
        toast.success(editingAddress ? 'Dirección actualizada' : 'Dirección creada');
        if (selectedCustomer) {
          loadCustomerAddresses(selectedCustomer.id!);
        } else {
          loadAddresses();
        }
        setShowAddressModal(false);
        resetAddressForm();
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar dirección');
    }
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      first_name: '', last_name: '', email: '', phone: '',
      date_of_birth: '', preferences: '', notes: '',
      company_id: 1, loyalty_points: 0, total_visits: 0,
      total_spent: 0, is_active: true
    });
    setEditingCustomer(null);
  };

  const resetAddressForm = () => {
    setAddressForm({
      customer_id: selectedCustomer?.id || 0, company_id: 1,
      address_type: 'home', street_address: '', city: '',
      state_province: '', postal_code: '', country: 'Argentina',
      is_default: false, delivery_instructions: '', is_active: true
    });
    setEditingAddress(null);
  };

  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm(customer);
    } else {
      resetCustomerForm();
    }
    setShowCustomerModal(true);
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm(address);
    } else {
      resetAddressForm();
    }
    setShowAddressModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return HomeIcon;
      case 'work': return BuildingOfficeIcon;
      default: return MapPinIcon;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'home': return '#10B981';
      case 'work': return '#3B82F6';
      default: return '#8B5CF6';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Gestión de Clientes y Direcciones"
        subtitle="Administra tu base de clientes y sus direcciones de entrega"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'customers', label: 'Clientes', icon: UserCheckIcon, count: filteredCustomers.length },
            { key: 'addresses', label: 'Direcciones', icon: MapPinIcon, count: addresses.length }
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <UserCheckIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Clientes
                  </h2>
                  <FloatingButton
                    onClick={() => openCustomerModal()}
                    variant="primary"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </FloatingButton>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
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
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <AnimatedCard
                        key={customer.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedCustomer?.id === customer.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                              style={{ backgroundColor: theme.colors.primary }}
                            >
                              {customer.first_name[0]}{customer.last_name[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                                {customer.first_name} {customer.last_name}
                              </h3>
                              {customer.email && (
                                <p className="text-sm flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
                                  <EnvelopeIcon className="h-4 w-4" />
                                  {customer.email}
                                </p>
                              )}
                              {customer.phone && (
                                <p className="text-sm flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
                                  <PhoneIcon className="h-4 w-4" />
                                  {customer.phone}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <StarIcon className="h-4 w-4 text-yellow-500" />
                                  <span className="text-xs text-yellow-600">{customer.loyalty_points} pts</span>
                                </div>
                                <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                                  {customer.total_visits} visitas
                                </div>
                                <div className="text-xs font-semibold" style={{ color: theme.colors.success }}>
                                  ${customer.total_spent?.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCustomerModal(customer);
                              }}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: theme.colors.primary + '10' }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                // handleDeleteCustomer(customer);
                              }}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: theme.colors.error + '10' }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                            </motion.button>
                          </div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                )}
              </GlassPanel>

              <GlassPanel delay={0.2}>
                {selectedCustomer ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                        Perfil de {selectedCustomer.first_name}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <StarIcon className="h-5 w-5" />
                            <span className="font-semibold">Puntos de Lealtad</span>
                          </div>
                          <p className="text-2xl font-bold">{selectedCustomer.loyalty_points}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-4 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="h-5 w-5" />
                            <span className="font-semibold">Total Visitas</span>
                          </div>
                          <p className="text-2xl font-bold">{selectedCustomer.total_visits}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <HeartIcon className="h-5 w-5" />
                          <span className="font-semibold">Total Gastado</span>
                        </div>
                        <p className="text-2xl font-bold">${selectedCustomer.total_spent?.toFixed(2)}</p>
                      </div>
                      
                      {selectedCustomer.preferences && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2" style={{ color: theme.colors.text }}>
                            Preferencias
                          </h4>
                          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                            {selectedCustomer.preferences}
                          </p>
                        </div>
                      )}
                      
                      {selectedCustomer.notes && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2" style={{ color: theme.colors.text }}>
                            Notas
                          </h4>
                          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                            {selectedCustomer.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserCheckIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      Selecciona un cliente para ver su perfil
                    </p>
                  </div>
                )}
              </GlassPanel>
            </>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <MapPinIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Direcciones {selectedCustomer && `de ${selectedCustomer.first_name}`}
                  </h2>
                  {selectedCustomer && (
                    <FloatingButton
                      onClick={() => openAddressModal()}
                      variant="primary"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </FloatingButton>
                  )}
                </div>

                {!selectedCustomer ? (
                  <div className="text-center py-12">
                    <MapPinIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      Selecciona un cliente para ver sus direcciones
                    </p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPinIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      Este cliente no tiene direcciones registradas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => {
                      const IconComponent = getAddressTypeIcon(address.address_type);
                      const iconColor = getAddressTypeColor(address.address_type);
                      
                      return (
                        <AnimatedCard key={address.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: iconColor + '20' }}
                              >
                                <IconComponent className="h-6 w-6" style={{ color: iconColor }} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold" style={{ color: theme.colors.text }}>
                                    {address.address_type === 'home' ? 'Casa' : 
                                     address.address_type === 'work' ? 'Trabajo' : 'Otro'}
                                  </h4>
                                  {address.is_default && (
                                    <span
                                      className="px-2 py-1 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: theme.colors.warning + '20',
                                        color: theme.colors.warning
                                      }}
                                    >
                                      Principal
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                                  {address.street_address}
                                </p>
                                <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                                  {address.city}, {address.state_province} {address.postal_code}
                                </p>
                                {address.delivery_instructions && (
                                  <p className="text-xs mt-2 p-2 bg-yellow-50 rounded" style={{ color: theme.colors.textMuted }}>
                                    📝 {address.delivery_instructions}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                onClick={() => openAddressModal(address)}
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: theme.colors.primary + '10' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                              </motion.button>
                              <motion.button
                                onClick={() => {/* handleDeleteAddress(address) */}}
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: theme.colors.error + '10' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <TrashIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                              </motion.button>
                            </div>
                          </div>
                        </AnimatedCard>
                      );
                    })}
                  </div>
                )}
              </GlassPanel>

              <GlassPanel delay={0.2}>
                <div className="text-center py-12">
                  <MapPinIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                  <p style={{ color: theme.colors.textMuted }}>
                    Mapa de ubicaciones y estadísticas
                  </p>
                </div>
              </GlassPanel>
            </>
          )}
        </div>
      </div>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerModal(false)}
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
                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                  <motion.button
                    onClick={() => setShowCustomerModal(false)}
                    className="p-2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={customerForm.first_name}
                        onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={customerForm.last_name}
                        onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="Apellido"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="cliente@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={customerForm.date_of_birth}
                      onChange={(e) => setCustomerForm({ ...customerForm, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Preferencias
                    </label>
                    <textarea
                      value={customerForm.preferences}
                      onChange={(e) => setCustomerForm({ ...customerForm, preferences: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      rows={2}
                      placeholder="Preferencias alimentarias, alergias, etc."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowCustomerModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                  <FloatingButton
                    onClick={handleSaveCustomer}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingCustomer ? 'Actualizar' : 'Crear'}
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
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
                    {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                  </h2>
                  <motion.button
                    onClick={() => setShowAddressModal(false)}
                    className="p-2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Tipo de Dirección
                    </label>
                    <select
                      value={addressForm.address_type}
                      onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      <option value="home">Casa</option>
                      <option value="work">Trabajo</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={addressForm.street_address}
                      onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Av. Principal 123"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="Buenos Aires"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Instrucciones de Entrega
                    </label>
                    <textarea
                      value={addressForm.delivery_instructions}
                      onChange={(e) => setAddressForm({ ...addressForm, delivery_instructions: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      rows={2}
                      placeholder="Indicaciones especiales para la entrega..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-default"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="is-default" className="text-sm" style={{ color: theme.colors.text }}>
                      Dirección principal
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                  <FloatingButton
                    onClick={handleSaveAddress}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingAddress ? 'Actualizar' : 'Crear'}
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