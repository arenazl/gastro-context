import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-toastify';
import { 
  PlusCircle, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin,
  Phone,
  User,
  Home,
  Briefcase,
  X,
  Check,
  Navigation,
  Loader,
  CreditCard
} from 'lucide-react';

export interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  dni?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface Address {
  id?: number;
  customer_id?: number;
  address_type: 'home' | 'work' | 'other';
  street_address: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  delivery_instructions?: string;
  formatted_address?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface Props {
  isModal?: boolean;
  onSelectCustomer?: (customer: Customer, address?: Address) => void;
  onClose?: () => void;
  initialSearchTerm?: string;
}


export const CustomersManagement: React.FC<Props> = ({ 
  isModal = false, 
  onSelectCustomer,
  onClose,
  initialSearchTerm = ''
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [loading, setLoading] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCustomerEditForm, setShowCustomerEditForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSearchTerm, setAddressSearchTerm] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);

  useEffect(() => {
    loadCustomers();
    // Si viene con término de búsqueda inicial, buscar clientes
    if (initialSearchTerm) {
      searchCustomers(initialSearchTerm);
    }
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      // Datos de ejemplo
      setCustomers([
        {
          id: 1,
          first_name: 'Juan',
          last_name: 'Pérez',
          dni: '12345678',
          phone: '555-0101',
        },
        {
          id: 2,
          first_name: 'María',
          last_name: 'González',
          dni: '87654321',
          phone: '555-0102'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (term: string) => {
    if (term.length < 2) return;
    
    try {
      const response = await fetch(`${API_URL}/api/customers/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        
        // Si no hay resultados y es modal, sugerir crear nuevo
        if (data.length === 0 && isModal) {
          // Intentar separar nombre y apellido
          const parts = term.trim().split(' ');
          const firstName = parts[0] || '';
          const lastName = parts.slice(1).join(' ') || '';
          
          setEditingCustomer({
            first_name: firstName,
            last_name: lastName
          });
          setShowCustomerForm(true);
        }
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const loadCustomerAddresses = async (customerId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/customers/${customerId}/addresses`);
      if (response.ok) {
        const data = await response.json();
        setCustomerAddresses(data);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      // Datos de ejemplo
      setCustomerAddresses([]);
    }
  };

  // Búsqueda de direcciones con Nominatim (OpenStreetMap)
  const searchAddressWithNominatim = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=ar,mx,es,cl,co,pe,ec,uy,py,bo`
      );
      
      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setAddressSuggestions(data);
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) {
        searchCustomers(searchTerm);
      } else if (searchTerm.length === 0) {
        loadCustomers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce para búsqueda de direcciones
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressSearchTerm) {
        searchAddressWithNominatim(addressSearchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressSearchTerm]);

  const selectAddressSuggestion = (suggestion: NominatimResult) => {
    const address = suggestion.address || {};
    
    setEditingAddress({
      ...editingAddress!,
      street_address: `${address.house_number || ''} ${address.road || ''}`.trim() || suggestion.display_name.split(',')[0],
      city: address.city || address.town || '',
      state_province: address.state || '',
      postal_code: address.postcode || '',
      country: address.country || '',
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      formatted_address: suggestion.display_name
    });
    
    setAddressSuggestions([]);
    setAddressSearchTerm('');
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    if (customer.id) {
      await loadCustomerAddresses(customer.id);
      
      // Si es modal y el cliente tiene direcciones, preguntar cuál usar
      if (isModal && customerAddresses.length > 0) {
        // Si solo hay una o hay una por defecto, seleccionarla automáticamente
        const defaultAddress = customerAddresses.find(a => a.is_default) || customerAddresses[0];
        if (onSelectCustomer) {
          onSelectCustomer(customer, defaultAddress);
        }
      } else if (isModal && customerAddresses.length === 0) {
        // Si no tiene direcciones, abrir el formulario para crear una
        setEditingAddress({ 
          address_type: 'home',
          street_address: '',
          city: '',
          is_default: true
        });
        setShowAddressModal(true);
      }
    }
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer || !editingCustomer.first_name || !editingCustomer.last_name) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    
    try {
      const method = editingCustomer.id ? 'PUT' : 'POST';
      const url = editingCustomer.id 
        ? `${API_URL}/api/customers/${editingCustomer.id}`
        : `${API_URL}/api/customers`;
        
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomer)
      });
      
      if (response.ok) {
        const savedCustomer = await response.json();
        toast.success('Cliente guardado exitosamente');
        
        // Guardar el cliente para cuando se creen direcciones
        setSelectedCustomer(savedCustomer);
        
        // Si es nuevo cliente en modal, continuar con la dirección
        if (isModal && !editingCustomer.id) {
          setEditingAddress({ 
            address_type: 'home',
            street_address: '',
            city: '',
            is_default: true
          });
          setShowAddressModal(true);
        }
        
        // Si es nuevo cliente en pantalla normal, las direcciones ya están en customerAddresses
        if (!isModal && !editingCustomer.id && customerAddresses.length > 0) {
          // Guardar las direcciones en la BD
          for (const address of customerAddresses) {
            await fetch(`${API_URL}/api/addresses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...address,
                customer_id: savedCustomer.id
              })
            });
          }
          toast.success(`${customerAddresses.length} dirección(es) guardada(s)`);
        }
        
        loadCustomers();
        setShowCustomerForm(false);
        setShowCustomerEditForm(false);
        setEditingCustomer(null);
        setCustomerAddresses([]);
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.error || 'No se pudo guardar el cliente'}`);
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast.error('Error de conexión. Verifique el servidor.');
    }
  };

  const handleSaveAddress = async () => {
    if (!editingAddress || !editingAddress.street_address || !editingAddress.city) {
      toast.error('Dirección y ciudad son requeridos');
      return;
    }
    
    if (!selectedCustomer?.id) return;
    
    try {
      const addressData = {
        ...editingAddress,
        customer_id: selectedCustomer.id
      };
      
      const method = editingAddress.id ? 'PUT' : 'POST';
      const url = editingAddress.id 
        ? `${API_URL}/api/addresses/${editingAddress.id}`
        : `${API_URL}/api/addresses`;
        
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      
      if (response.ok) {
        const savedAddress = await response.json();
        toast.success('Dirección guardada exitosamente');
        
        // Si es modal, seleccionar el cliente con la dirección
        if (isModal && onSelectCustomer) {
          onSelectCustomer(selectedCustomer, savedAddress);
        }
        
        loadCustomerAddresses(selectedCustomer.id);
        setShowAddressModal(false);
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressSearchTerm('');
        setAddressSuggestions([]);
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.error || 'No se pudo guardar la dirección'}`);
      }
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      toast.error('Error de conexión. Verifique el servidor.');
    }
  };

  const getAddressIcon = (type: string) => {
    switch(type) {
      case 'home': return Home;
      case 'work': return Briefcase;
      default: return MapPin;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           customer.dni?.includes(searchTerm) ||
           customer.phone?.includes(searchTerm);
  });

  const content = (
    <div className={isModal ? "" : "h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"}>
      {!isModal && (
        <PageHeader
          title="Gestión de Clientes"
          subtitle="Administra clientes y sus direcciones"
        />
      )}
      
      {/* Barra de búsqueda */}
      <div className={`bg-white shadow-sm border-b px-6 py-6 ${isModal ? 'rounded-t-xl' : ''}`}>
        <div className="flex items-center gap-4">
          {isModal && (
            <h2 className="text-xl font-bold text-gray-800">Buscar o Crear Cliente</h2>
          )}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, DNI o teléfono..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus={isModal}
            />
          </div>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setEditingCustomer({ first_name: '', last_name: '' });
              if (isModal) {
                setShowCustomerForm(true);
              } else {
                setShowCustomerEditForm(true);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Nuevo
          </button>
          {isModal && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Mensaje cuando no hay resultados */}
        {searchTerm.length >= 2 && filteredCustomers.length === 0 && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              No se encontró ningún cliente. Haz clic en "Nuevo" para crear uno.
            </p>
          </div>
        )}
      </div>
      
      {/* Contenido principal */}
      <div className={`flex ${isModal ? 'overflow-hidden max-h-[60vh]' : 'h-[calc(100vh-200px)]'}`}>
        {/* Lista de clientes */}
        <div className={`${isModal ? 'w-full' : 'w-1/3 border-r'} border-gray-200 bg-white overflow-y-auto`}>
          <div className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              {filteredCustomers.length > 0 ? `Clientes (${filteredCustomers.length})` : 'Sin resultados'}
            </h3>
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <motion.div
                  key={customer.id}
                  whileHover={{ x: 5 }}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${selectedCustomer?.id === customer.id ? 'text-white' : 'text-gray-800'}`}>
                        {customer.first_name} {customer.last_name}
                      </p>
                      <div className={`text-sm ${selectedCustomer?.id === customer.id ? 'text-white/80' : 'text-gray-500'} flex items-center gap-2`}>
                        {customer.dni && (
                          <>
                            <CreditCard className="h-3 w-3" />
                            <span>{customer.dni}</span>
                          </>
                        )}
                        {customer.phone && (
                          <>
                            {customer.dni && <span>•</span>}
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isModal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCustomer(customer);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Detalles del cliente - Solo mostrar si no es modal */}
        {!isModal && (
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            {selectedCustomer ? (
              <div className="p-6">
                {/* Aquí iría el detalle del cliente como antes */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingCustomer(selectedCustomer);
                        if (isModal) {
                          setShowCustomerForm(true);
                        } else {
                          setShowCustomerEditForm(true);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar Cliente
                    </button>
                  </div>

                  {/* Información del cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {selectedCustomer.dni && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">DNI:</span>
                        <span className="font-medium">{selectedCustomer.dni}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Teléfono:</span>
                        <span className="font-medium">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>

                  {selectedCustomer.notes && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Notas</h3>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedCustomer.notes}</p>
                    </div>
                  )}

                  {/* Formulario inline de cliente - Solo para pantalla normal */}
                  {!isModal && showCustomerEditForm && editingCustomer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                          Editar Cliente
                        </h4>
                        <button
                          onClick={() => {
                            setShowCustomerEditForm(false);
                            setEditingCustomer(null);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={editingCustomer?.first_name || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer!,
                              first_name: e.target.value
                            })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Juan"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido *
                          </label>
                          <input
                            type="text"
                            value={editingCustomer?.last_name || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer!,
                              last_name: e.target.value
                            })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Pérez"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            DNI (opcional)
                          </label>
                          <input
                            type="text"
                            value={editingCustomer?.dni || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer!,
                              dni: e.target.value
                            })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="12345678"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono (opcional)
                          </label>
                          <input
                            type="tel"
                            value={editingCustomer?.phone || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer!,
                              phone: e.target.value
                            })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="555-0123"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email (opcional)
                          </label>
                          <input
                            type="email"
                            value={editingCustomer?.email || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer!,
                              email: e.target.value
                            })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="cliente@email.com"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas (opcional)
                          </label>
                          <textarea
                            value={editingCustomer?.notes || ''}
                            onChange={(e) => setEditingCustomer({
                              ...editingCustomer!,
                              notes: e.target.value
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Preferencias, alergias, comentarios..."
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => {
                            setShowCustomerEditForm(false);
                            setEditingCustomer(null);
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveCustomer}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Guardar Cliente
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Direcciones del cliente */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-700">Direcciones</h3>
                      <button
                        onClick={() => {
                          setEditingAddress({ 
                            address_type: 'home',
                            street_address: '',
                            city: '',
                            is_default: customerAddresses.length === 0
                          });
                          if (isModal) {
                            setShowAddressModal(true);
                          } else {
                            setShowAddressForm(true);
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Agregar Dirección
                      </button>
                    </div>

                    <div className="space-y-3">
                      {customerAddresses.map((address) => {
                        const IconComponent = getAddressIcon(address.address_type);
                        return (
                          <div key={address.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <IconComponent className="h-5 w-5 text-gray-500 mt-1" />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-800">
                                      {address.address_type === 'home' ? 'Casa' : 
                                       address.address_type === 'work' ? 'Trabajo' : 'Otro'}
                                    </span>
                                    {address.is_default && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        Por defecto
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600">{address.street_address}</p>
                                  <p className="text-gray-500 text-sm">{address.city}</p>
                                  {address.delivery_instructions && (
                                    <p className="text-gray-500 text-sm mt-1">
                                      <span className="font-medium">Instrucciones:</span> {address.delivery_instructions}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingAddress(address);
                                    if (isModal) {
                                      setShowAddressModal(true);
                                    } else {
                                      setShowAddressForm(true);
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('¿Estás seguro de eliminar esta dirección?')) {
                                      // TODO: Implementar eliminación de dirección
                                      toast.info('Eliminación de direcciones por implementar');
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {customerAddresses.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No hay direcciones registradas</p>
                          <p className="text-sm">Agrega la primera dirección del cliente</p>
                        </div>
                      )}
                    </div>

                    {/* Formulario inline de dirección - Solo para pantalla normal */}
                    {!isModal && showAddressForm && editingAddress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 bg-white border-2 border-blue-200 rounded-lg p-6"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {editingAddress.id ? 'Editar Dirección' : 'Nueva Dirección'}
                          </h4>
                          <button
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                              setAddressSearchTerm('');
                              setAddressSuggestions([]);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Búsqueda inteligente de dirección */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Buscar dirección (OpenStreetMap)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={addressSearchTerm}
                                onChange={(e) => setAddressSearchTerm(e.target.value)}
                                placeholder="Escribe una dirección completa..."
                                className="w-full px-3 py-2 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {searchingAddress && (
                                <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                              )}
                            </div>
                            
                            {/* Sugerencias de direcciones */}
                            {addressSuggestions.length > 0 && (
                              <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {addressSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => selectAddressSuggestion(suggestion)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                                  >
                                    <p className="text-sm text-gray-800">{suggestion.display_name}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Tipo de dirección */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo de Dirección
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['home', 'work', 'other'] as const).map((type) => (
                                <button
                                  key={type}
                                  onClick={() => setEditingAddress({
                                    ...editingAddress!,
                                    address_type: type
                                  })}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    editingAddress?.address_type === type
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    {type === 'home' && <Home className="h-5 w-5" />}
                                    {type === 'work' && <Briefcase className="h-5 w-5" />}
                                    {type === 'other' && <MapPin className="h-5 w-5" />}
                                    <span className="text-xs">
                                      {type === 'home' ? 'Casa' :
                                       type === 'work' ? 'Trabajo' : 'Otro'}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Campos de dirección */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dirección *
                            </label>
                            <input
                              type="text"
                              value={editingAddress?.street_address || ''}
                              onChange={(e) => setEditingAddress({
                                ...editingAddress!,
                                street_address: e.target.value
                              })}
                              placeholder="Calle y número"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ciudad *
                              </label>
                              <input
                                type="text"
                                value={editingAddress?.city || ''}
                                onChange={(e) => setEditingAddress({
                                  ...editingAddress!,
                                  city: e.target.value
                                })}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código Postal
                              </label>
                              <input
                                type="text"
                                value={editingAddress?.postal_code || ''}
                                onChange={(e) => setEditingAddress({
                                  ...editingAddress!,
                                  postal_code: e.target.value
                                })}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Instrucciones de Entrega
                            </label>
                            <textarea
                              value={editingAddress?.delivery_instructions || ''}
                              onChange={(e) => setEditingAddress({
                                ...editingAddress!,
                                delivery_instructions: e.target.value
                              })}
                              rows={2}
                              placeholder="Ej: Timbre rojo, departamento 3B..."
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* Mostrar coordenadas si existen */}
                          {editingAddress?.latitude && editingAddress?.longitude && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-800">
                                ✅ Ubicación encontrada
                              </p>
                              <button
                                onClick={() => window.open(
                                  `https://www.google.com/maps?q=${editingAddress.latitude},${editingAddress.longitude}`,
                                  '_blank'
                                )}
                                className="mt-1 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                              >
                                <Navigation className="h-3 w-3" />
                                Ver en Google Maps
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                          <button
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                              setAddressSearchTerm('');
                              setAddressSuggestions([]);
                            }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveAddress}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Guardar Dirección
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-gray-50 overflow-y-auto">
                <div className="p-6">
                {!isModal && showCustomerEditForm && editingCustomer && !editingCustomer.id ? (
                  // Formulario para crear cliente nuevo - igual estilo que editar
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">Nuevo Cliente</h3>
                      <button
                        onClick={() => {
                          setShowCustomerEditForm(false);
                          setEditingCustomer(null);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={editingCustomer?.first_name || ''}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer!,
                            first_name: e.target.value
                          })}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Juan"
                          autoFocus
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          value={editingCustomer?.last_name || ''}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer!,
                            last_name: e.target.value
                          })}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Pérez"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DNI (opcional)
                        </label>
                        <input
                          type="text"
                          value={editingCustomer?.dni || ''}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer!,
                            dni: e.target.value
                          })}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="12345678"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono (opcional)
                        </label>
                        <input
                          type="tel"
                          value={editingCustomer?.phone || ''}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer!,
                            phone: e.target.value
                          })}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="555-0123"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email (opcional)
                        </label>
                        <input
                          type="email"
                          value={editingCustomer?.email || ''}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer!,
                            email: e.target.value
                          })}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="cliente@email.com"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas (opcional)
                        </label>
                        <textarea
                          value={editingCustomer?.notes || ''}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer!,
                            notes: e.target.value
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Preferencias, alergias, comentarios..."
                        />
                      </div>
                    </div>
                    
                    
                    {/* Sección de direcciones para cliente nuevo */}
                    <div className="mt-8 pt-6 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Direcciones</h4>
                        <button
                          onClick={() => {
                            setEditingAddress({ 
                              address_type: 'home',
                              street_address: '',
                              city: '',
                              is_default: customerAddresses.length === 0
                            });
                            setShowAddressForm(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Agregar Dirección
                        </button>
                      </div>

                      <div className="space-y-3">
                        {customerAddresses.map((address) => {
                          const IconComponent = getAddressIcon(address.address_type);
                          return (
                            <div key={address.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <IconComponent className="h-5 w-5 text-gray-500 mt-1" />
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-800">
                                        {address.address_type === 'home' ? 'Casa' : 
                                         address.address_type === 'work' ? 'Trabajo' : 'Otro'}
                                      </span>
                                      {address.is_default && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                          Por defecto
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600">{address.street_address}</p>
                                    <p className="text-gray-500 text-sm">{address.city}</p>
                                    {address.delivery_instructions && (
                                      <p className="text-gray-500 text-sm mt-1">
                                        <span className="font-medium">Instrucciones:</span> {address.delivery_instructions}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingAddress(address);
                                      setShowAddressForm(true);
                                    }}
                                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm('¿Estás seguro de eliminar esta dirección?')) {
                                        setCustomerAddresses(customerAddresses.filter(a => a.id !== address.id));
                                        toast.info('Dirección eliminada');
                                      }
                                    }}
                                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {customerAddresses.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Agrega al menos una dirección</p>
                            <p className="text-sm">Es requerida para crear el cliente</p>
                          </div>
                        )}
                      </div>

                      {/* Formulario inline de dirección para cliente nuevo */}
                      {showAddressForm && editingAddress && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 bg-white border-2 border-green-200 rounded-lg p-6"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-lg font-semibold text-gray-800">
                              {editingAddress.id ? 'Editar Dirección' : 'Nueva Dirección'}
                            </h5>
                            <button
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                setAddressSearchTerm('');
                                setAddressSuggestions([]);
                              }}
                              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            {/* Búsqueda inteligente de dirección */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buscar dirección (OpenStreetMap)
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={addressSearchTerm}
                                  onChange={(e) => setAddressSearchTerm(e.target.value)}
                                  placeholder="Escribe una dirección completa..."
                                  className="w-full px-3 py-2 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {searchingAddress && (
                                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                                )}
                              </div>
                              
                              {/* Sugerencias de direcciones */}
                              {addressSuggestions.length > 0 && (
                                <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {addressSuggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      onClick={() => selectAddressSuggestion(suggestion)}
                                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                                    >
                                      <p className="text-sm text-gray-800">{suggestion.display_name}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Tipo de dirección */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Dirección
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {(['home', 'work', 'other'] as const).map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => setEditingAddress({
                                      ...editingAddress!,
                                      address_type: type
                                    })}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      editingAddress?.address_type === type
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      {type === 'home' && <Home className="h-5 w-5" />}
                                      {type === 'work' && <Briefcase className="h-5 w-5" />}
                                      {type === 'other' && <MapPin className="h-5 w-5" />}
                                      <span className="text-xs">
                                        {type === 'home' ? 'Casa' :
                                         type === 'work' ? 'Trabajo' : 'Otro'}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Campos de dirección */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dirección *
                              </label>
                              <input
                                type="text"
                                value={editingAddress?.street_address || ''}
                                onChange={(e) => setEditingAddress({
                                  ...editingAddress!,
                                  street_address: e.target.value
                                })}
                                placeholder="Calle y número"
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Ciudad *
                                </label>
                                <input
                                  type="text"
                                  value={editingAddress?.city || ''}
                                  onChange={(e) => setEditingAddress({
                                    ...editingAddress!,
                                    city: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Código Postal
                                </label>
                                <input
                                  type="text"
                                  value={editingAddress?.postal_code || ''}
                                  onChange={(e) => setEditingAddress({
                                    ...editingAddress!,
                                    postal_code: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Instrucciones de Entrega
                              </label>
                              <textarea
                                value={editingAddress?.delivery_instructions || ''}
                                onChange={(e) => setEditingAddress({
                                  ...editingAddress!,
                                  delivery_instructions: e.target.value
                                })}
                                rows={2}
                                placeholder="Ej: Timbre rojo, departamento 3B..."
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            {/* Mostrar coordenadas si existen */}
                            {editingAddress?.latitude && editingAddress?.longitude && (
                              <div className="p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">
                                  ✅ Ubicación encontrada
                                </p>
                                <button
                                  onClick={() => window.open(
                                    `https://www.google.com/maps?q=${editingAddress.latitude},${editingAddress.longitude}`,
                                    '_blank'
                                  )}
                                  className="mt-1 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                                >
                                  <Navigation className="h-3 w-3" />
                                  Ver en Google Maps
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end gap-3 mt-6">
                            <button
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                setAddressSearchTerm('');
                                setAddressSuggestions([]);
                              }}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (!editingAddress?.street_address || !editingAddress?.city) {
                                  toast.error('Dirección y ciudad son requeridos');
                                  return;
                                }
                                
                                const newAddress = {
                                  ...editingAddress,
                                  id: Date.now(),
                                  customer_id: editingCustomer?.id || Date.now()
                                };
                                
                                setCustomerAddresses([...customerAddresses, newAddress]);
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                setAddressSearchTerm('');
                                setAddressSuggestions([]);
                                toast.success('Dirección agregada');
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Guardar Dirección
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Botones finales - Solo mostrar si hay al menos una dirección */}
                    {customerAddresses.length > 0 && (
                      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                        <button
                          onClick={() => {
                            setShowCustomerEditForm(false);
                            setEditingCustomer(null);
                            setCustomerAddresses([]);
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveCustomer}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Crear Cliente
                        </button>
                      </div>
                    )}
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Selecciona un cliente</p>
                      <p className="text-sm mt-2">o haz clic en "Nuevo" para crear uno</p>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modal de Cliente */}
      <AnimatePresence>
        {showCustomerForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerForm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {editingCustomer?.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={editingCustomer?.first_name || ''}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer!,
                        first_name: e.target.value
                      })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Juan"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={editingCustomer?.last_name || ''}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer!,
                        last_name: e.target.value
                      })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI (opcional)
                    </label>
                    <input
                      type="text"
                      value={editingCustomer?.dni || ''}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer!,
                        dni: e.target.value
                      })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12345678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={editingCustomer?.phone || ''}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer!,
                        phone: e.target.value
                      })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="555-0123"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCustomerForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {isModal ? 'Continuar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Modal de Dirección */}
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  Nueva Dirección para {selectedCustomer?.first_name} {selectedCustomer?.last_name}
                </h3>
                
                <div className="space-y-4">
                  {/* Búsqueda inteligente de dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar dirección (OpenStreetMap)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addressSearchTerm}
                        onChange={(e) => setAddressSearchTerm(e.target.value)}
                        placeholder="Escribe una dirección completa..."
                        className="w-full px-3 py-2 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {searchingAddress && (
                        <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                      )}
                    </div>
                    
                    {/* Sugerencias de direcciones */}
                    {addressSuggestions.length > 0 && (
                      <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectAddressSuggestion(suggestion)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <p className="text-sm text-gray-800">{suggestion.display_name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Tipo de dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Dirección
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['home', 'work', 'other'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setEditingAddress({
                            ...editingAddress!,
                            address_type: type
                          })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            editingAddress?.address_type === type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {type === 'home' && <Home className="h-5 w-5" />}
                            {type === 'work' && <Briefcase className="h-5 w-5" />}
                            {type === 'other' && <MapPin className="h-5 w-5" />}
                            <span className="text-xs">
                              {type === 'home' ? 'Casa' :
                               type === 'work' ? 'Trabajo' : 'Otro'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Campos de dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={editingAddress?.street_address || ''}
                      onChange={(e) => setEditingAddress({
                        ...editingAddress!,
                        street_address: e.target.value
                      })}
                      placeholder="Calle y número"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={editingAddress?.city || ''}
                        onChange={(e) => setEditingAddress({
                          ...editingAddress!,
                          city: e.target.value
                        })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={editingAddress?.postal_code || ''}
                        onChange={(e) => setEditingAddress({
                          ...editingAddress!,
                          postal_code: e.target.value
                        })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrucciones de Entrega
                    </label>
                    <textarea
                      value={editingAddress?.delivery_instructions || ''}
                      onChange={(e) => setEditingAddress({
                        ...editingAddress!,
                        delivery_instructions: e.target.value
                      })}
                      rows={2}
                      placeholder="Ej: Timbre rojo, departamento 3B..."
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Mostrar coordenadas si existen */}
                  {editingAddress?.latitude && editingAddress?.longitude && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Ubicación encontrada
                      </p>
                      <button
                        onClick={() => window.open(
                          `https://www.google.com/maps?q=${editingAddress.latitude},${editingAddress.longitude}`,
                          '_blank'
                        )}
                        className="mt-1 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        Ver en Google Maps
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddressModal(false);
                      setAddressSearchTerm('');
                      setAddressSuggestions([]);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAddress}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {isModal ? 'Usar esta Dirección' : 'Guardar Dirección'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  // Si es modal, envolver en un modal
  if (isModal) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {content}
          </div>
        </motion.div>
      </>
    );
  }

  return content;
};