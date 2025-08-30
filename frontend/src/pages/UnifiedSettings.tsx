import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton } from '../components/AnimatedComponents';
import { toast } from '../lib/toast';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  MapPinIcon,
  Squares2X2Icon,
  Square3Stack3DIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CogIcon,
  GlobeAltIcon,
  CreditCardIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';


interface Company {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  logo_url?: string;
  is_active: boolean;
}

interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  full_name: string;
  company_id: number;
  role_id: number;
  is_active: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: string;
}

interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  loyalty_points: number;
  total_visits: number;
  total_spent: number;
  is_active: boolean;
}

interface Address {
  id?: number;
  customer_id: number;
  address_type: 'home' | 'work' | 'other';
  street_address: string;
  city: string;
  is_default: boolean;
  is_active: boolean;
}

interface Area {
  id?: number;
  name: string;
  description?: string;
  capacity: number;
  outdoor: boolean;
  color: string;
  is_active: boolean;
}

interface Table {
  id?: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location?: string;
  area_id?: number;
  area_name?: string;
  shape?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export const UnifiedSettings: React.FC = () => {
  const { theme } = useTheme();
  
  // Tab states - EXACTAMENTE como pidió el usuario
  const [empresasTab, setEmpresasTab] = useState<'empresas' | 'usuarios' | 'roles'>('empresas');
  const [clientesTab, setClientesTab] = useState<'clientes' | 'direcciones'>('clientes');
  const [areasTab, setAreasTab] = useState<'areas' | 'mesas'>('areas');
  const [configTab, setConfigTab] = useState<'idioma' | 'pagos' | 'datos_negocio'>('idioma');
  
  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCompanies(),
        loadUsers(),
        loadRoles(),
        loadCustomers(),
        loadAreas(),
        loadTables()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        if (data.length > 0) setSelectedCompany(data[0]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Error loading users:', response.statusText);
        setUsers([]); // Array vacío en caso de error
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Array vacío en caso de error
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        console.error('Error loading roles:', response.statusText);
        setRoles([]); // Array vacío en caso de error
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]); // Array vacío en caso de error
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers?company_id=1`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        if (data.length > 0) setSelectedCustomer(data[0]);
      } else {
        console.error('Error loading customers:', response.statusText);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
    
    // Cargar direcciones
    try {
      const response = await fetch(`${API_URL}/api/addresses`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      } else {
        console.error('Error loading addresses:', response.statusText);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    }
  };

  const loadAreas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/areas?company_id=1`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data);
        if (data.length > 0) setSelectedArea(data[0]);
      } else {
        console.error('Error loading areas:', response.statusText);
        setAreas([]);
      }
    } catch (error) {
      console.error('Error loading areas:', error);
      setAreas([]);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      } else {
        console.error('Error loading tables:', response.statusText);
        setTables([]);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      setTables([]);
    }
  };

  // Funciones para manejar los botones +
  const handleAddCompany = () => {
    toast.info('Funcionalidad para agregar empresa próximamente');
  };

  const handleAddUser = () => {
    toast.info('Funcionalidad para agregar usuario próximamente');
  };

  const handleAddRole = () => {
    toast.info('Funcionalidad para agregar rol próximamente');
  };

  const handleAddCustomer = () => {
    toast.info('Funcionalidad para agregar cliente próximamente');
  };

  const handleAddAddress = () => {
    toast.info('Funcionalidad para agregar dirección próximamente');
  };

  const handleAddArea = () => {
    toast.info('Funcionalidad para agregar área próximamente');
  };

  const handleAddTable = () => {
    toast.info('Funcionalidad para agregar mesa próximamente');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Configuración ABM Integral"
        subtitle="Gestiona empresas, usuarios, clientes, áreas y configuraciones en tarjetas organizadas"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
          
          {/* TARJETA 1: EMPRESAS + USUARIOS + ROLES */}
          <GlassPanel delay={0.1}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <BuildingOffice2Icon className="h-5 w-5" style={{ color: theme.colors.primary }} />
                  Empresas
                </h2>
              </div>

              {/* Tabs Empresas */}
              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEmpresasTab('empresas')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      empresasTab === 'empresas'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Empresas
                  </button>
                  <button
                    onClick={() => setEmpresasTab('usuarios')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      empresasTab === 'usuarios'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Usuarios
                  </button>
                  <button
                    onClick={() => setEmpresasTab('roles')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      empresasTab === 'roles'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Roles
                  </button>
                </div>
              </div>

              {/* Contenido según tab activo */}
              <div className="min-h-[300px]">
                {empresasTab === 'empresas' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">Empresas ({companies.length})</h3>
                      <button 
                        onClick={handleAddCompany}
                        className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {companies.map((company) => (
                        <AnimatedCard 
                          key={company.id} 
                          className={`p-3 cursor-pointer transition-all ${
                            selectedCompany?.id === company.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedCompany(company)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                              {company.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{company.name}</p>
                              <p className="text-xs text-gray-500 truncate">{company.email}</p>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}

                {empresasTab === 'usuarios' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">Usuarios ({users.length})</h3>
                      <button onClick={handleAddUser} className="p-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {users.map((user) => {
                        const role = roles.find(r => r.id === user.role_id);
                        return (
                          <AnimatedCard key={user.id} className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {user.full_name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{role?.description}</p>
                              </div>
                            </div>
                          </AnimatedCard>
                        );
                      })}
                    </div>
                  </div>
                )}

                {empresasTab === 'roles' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">Roles ({roles.length})</h3>
                      <button onClick={handleAddRole} className="p-1 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <AnimatedCard key={role.id} className="p-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{role.description || role.name}</p>
                              <p className="text-xs text-gray-500 truncate">{role.name}</p>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </GlassPanel>

          {/* TARJETA 2: CLIENTES + DIRECCIONES */}
          <GlassPanel delay={0.2}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <UserCircleIcon className="h-5 w-5" style={{ color: theme.colors.success }} />
                  Clientes
                </h2>
              </div>

              {/* Tabs Clientes */}
              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setClientesTab('clientes')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      clientesTab === 'clientes'
                        ? 'bg-white text-green-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Clientes
                  </button>
                  <button
                    onClick={() => setClientesTab('direcciones')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      clientesTab === 'direcciones'
                        ? 'bg-white text-green-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Direcciones
                  </button>
                </div>
              </div>

              <div className="min-h-[300px]">
                {clientesTab === 'clientes' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">Clientes ({customers.length})</h3>
                      <button onClick={handleAddCustomer} className="p-1 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customers.map((customer) => (
                        <AnimatedCard 
                          key={customer.id} 
                          className={`p-3 cursor-pointer transition-all ${
                            selectedCustomer?.id === customer.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                          }`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {customer.first_name[0]}{customer.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {customer.first_name} {customer.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {customer.loyalty_points} pts • {customer.total_visits} visitas
                              </p>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}

                {clientesTab === 'direcciones' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">
                        Direcciones {selectedCustomer && `(${selectedCustomer.first_name})`}
                      </h3>
                      <button onClick={handleAddAddress} className="p-1 bg-pink-600 text-white rounded-md hover:bg-pink-700">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Mostrar TODAS las direcciones si no hay cliente seleccionado, o filtrar por cliente seleccionado */}
                      {(!selectedCustomer ? addresses : addresses.filter(addr => addr.customer_id === selectedCustomer.id)).map((address) => (
                        <AnimatedCard key={address.id} className="p-3">
                          <div className="flex items-start gap-2">
                            {address.address_type === 'home' ? (
                              <HomeIcon className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : (
                              <BuildingOfficeIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{address.street_address}</p>
                              <p className="text-xs text-gray-500">{address.city}</p>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>

          {/* TARJETA 3: ÁREAS + MESAS */}
          <GlassPanel delay={0.3}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <Squares2X2Icon className="h-5 w-5" style={{ color: theme.colors.warning }} />
                  Áreas y Mesas
                </h2>
              </div>

              {/* Tabs Áreas */}
              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setAreasTab('areas')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      areasTab === 'areas'
                        ? 'bg-white text-teal-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Áreas
                  </button>
                  <button
                    onClick={() => setAreasTab('mesas')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      areasTab === 'mesas'
                        ? 'bg-white text-teal-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Mesas
                  </button>
                </div>
              </div>

              <div className="min-h-[300px]">
                {areasTab === 'areas' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">Áreas ({areas.length})</h3>
                      <button onClick={handleAddArea} className="p-1 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {areas.map((area) => (
                        <AnimatedCard 
                          key={area.id} 
                          className={`p-3 cursor-pointer transition-all ${
                            selectedArea?.id === area.id ? 'ring-2 ring-teal-500 bg-teal-50' : ''
                          }`}
                          onClick={() => setSelectedArea(area)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: area.color + '20' }}
                            >
                              <Squares2X2Icon 
                                className="h-4 w-4" 
                                style={{ color: area.color }} 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{area.name}</p>
                              <p className="text-xs text-gray-500">Cap: {area.capacity}</p>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}

                {areasTab === 'mesas' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm text-gray-700">
                        Mesas {selectedArea && `(${selectedArea.name})`}
                      </h3>
                      <button onClick={handleAddTable} className="p-1 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {/* Mostrar TODAS las mesas si no hay área seleccionada, o filtrar por área seleccionada */}
                      {(!selectedArea ? tables : tables.filter(t => t.location === selectedArea.name || t.area_id === selectedArea.id)).map((table) => (
                        <AnimatedCard key={table.id} className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Icono de mesa según estado */}
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{
                                backgroundColor: table.status === 'available' ? '#10B981' : 
                                              table.status === 'occupied' ? '#EF4444' : 
                                              table.status === 'reserved' ? '#F59E0B' : '#6B7280'
                              }}
                            >
                              {table.number}
                            </div>
                            
                            {/* Información principal */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">Mesa {table.number}</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  table.status === 'available' ? 'bg-green-100 text-green-700' :
                                  table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                                  table.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {table.status === 'available' ? 'Disponible' :
                                   table.status === 'occupied' ? 'Ocupada' :
                                   table.status === 'reserved' ? 'Reservada' : 'Limpiando'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>👥 {table.capacity} personas</span>
                                <span>🏷️ Forma: {table.shape || 'Circular'}</span>
                                <span>📍 {table.location || (selectedArea ? selectedArea.name : '')}</span>
                              </div>
                            </div>
                            
                            {/* Botones de acción */}
                            <div className="flex items-center gap-1">
                              <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>

          {/* TARJETA 4: CONFIGURACIÓN GENERAL (Idioma + Métodos de Pago) */}
          <GlassPanel delay={0.4}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <CogIcon className="h-5 w-5" style={{ color: theme.colors.secondary }} />
                  Configuración General
                </h2>
              </div>

              {/* Tabs Configuración */}
              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setConfigTab('idioma')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      configTab === 'idioma'
                        ? 'bg-white text-indigo-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Idioma
                  </button>
                  <button
                    onClick={() => setConfigTab('pagos')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      configTab === 'pagos'
                        ? 'bg-white text-indigo-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Métodos de Pago
                  </button>
                  <button
                    onClick={() => setConfigTab('datos_negocio')}
                    className={`flex-1 py-2 px-2 text-xs rounded-md transition-all ${
                      configTab === 'datos_negocio'
                        ? 'bg-white text-indigo-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Datos del Negocio
                  </button>
                </div>
              </div>

              <div className="min-h-[300px]">
                {configTab === 'idioma' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium text-sm text-gray-700">Idioma y Región</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Idioma Principal</p>
                        <select className="w-full p-2 text-sm border rounded">
                          <option>Español (Argentina)</option>
                          <option>English (US)</option>
                          <option>Português (BR)</option>
                        </select>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Zona Horaria</p>
                        <select className="w-full p-2 text-sm border rounded">
                          <option>GMT-3 (Buenos Aires)</option>
                          <option>GMT-5 (New York)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {configTab === 'pagos' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCardIcon className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium text-sm text-gray-700">Métodos de Pago</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Efectivo</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Tarjeta de Crédito</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">MercadoPago</span>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Transferencia</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {configTab === 'datos_negocio' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BriefcaseIcon className="h-5 w-5 text-purple-500" />
                      <h3 className="font-medium text-sm text-gray-700">Datos del Negocio</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Razón Social</p>
                        <p className="text-xs text-gray-600">Gastro Premium S.A.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">CUIT</p>
                        <p className="text-xs text-gray-600">20-12345678-9</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Dirección Fiscal</p>
                        <p className="text-xs text-gray-600">Av. Corrientes 1234, CABA</p>
                      </div>
                      <button className="w-full p-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                        Editar Datos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>

        </div>
      </div>
    </div>
  );
};