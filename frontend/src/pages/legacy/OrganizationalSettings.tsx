import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  EnvelopeIcon,
  KeyIcon,
  UsersIcon,
  CogIcon
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

export const OrganizationalSettings: React.FC = () => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Editing states
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'roles'>('companies');
  
  // Form states
  const [companyForm, setCompanyForm] = useState<Company>({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    logo_url: '',
    is_active: true
  });
  
  const [userForm, setUserForm] = useState<User>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    company_id: 1,
    role_id: 0,
    is_active: true
  });
  
  const [roleForm, setRoleForm] = useState<Role>({
    id: 0,
    name: '',
    description: '',
    permissions: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyUsers(selectedCompany.id!);
    }
  }, [selectedCompany]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCompanies(), loadRoles()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/companies`);
      const data = await response.json();
      setCompanies(data);
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Error cargando empresas');
    }
  };

  const loadCompanyUsers = async (companyId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/companies/${companyId}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error cargando usuarios');
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/roles`);
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([
        { id: 1, name: 'admin', description: 'Administrador' },
        { id: 2, name: 'kitchen', description: 'Cocina' },
        { id: 3, name: 'waiter', description: 'Mozo' }
      ]);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name || !companyForm.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }

    try {
      const url = editingCompany 
        ? `${API_URL}/api/companies/${editingCompany.id}`
        : `${API_URL}/api/companies`;
      
      const response = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm)
      });

      if (response.ok) {
        toast.success(editingCompany ? 'Empresa actualizada' : 'Empresa creada');
        loadCompanies();
        setShowCompanyModal(false);
        resetCompanyForm();
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Error al guardar empresa');
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.full_name || !userForm.role_id) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    if (!editingUser && !userForm.password) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      const userData = { ...userForm, company_id: selectedCompany?.id };
      const url = editingUser 
        ? `${API_URL}/api/users/${editingUser.id}`
        : `${API_URL}/api/users`;
      
      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado');
        loadCompanyUsers(selectedCompany!.id!);
        setShowUserModal(false);
        resetUserForm();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name || !roleForm.description) {
      toast.error('Nombre y descripción son requeridos');
      return;
    }

    try {
      const url = editingRole 
        ? `${API_URL}/api/roles/${editingRole.id}`
        : `${API_URL}/api/roles`;
      
      const response = await fetch(url, {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      if (response.ok) {
        toast.success(editingRole ? 'Rol actualizado' : 'Rol creado');
        loadRoles();
        setShowRoleModal(false);
        resetRoleForm();
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Error al guardar rol');
    }
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      name: '', email: '', phone: '', address: '', 
      tax_id: '', logo_url: '', is_active: true
    });
    setEditingCompany(null);
  };

  const resetUserForm = () => {
    setUserForm({
      username: '', email: '', password: '', full_name: '',
      company_id: selectedCompany?.id || 1, role_id: 0, is_active: true
    });
    setEditingUser(null);
  };

  const resetRoleForm = () => {
    setRoleForm({ id: 0, name: '', description: '', permissions: '' });
    setEditingRole(null);
  };

  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm(company);
    } else {
      resetCompanyForm();
    }
    setShowCompanyModal(true);
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ ...user, password: '' });
    } else {
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const openRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm(role);
    } else {
      resetRoleForm();
    }
    setShowRoleModal(true);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Configuración Organizacional"
        subtitle="Gestión integral de empresas, usuarios y roles"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'companies', label: 'Empresas', icon: BuildingOffice2Icon, count: companies.length },
            { key: 'users', label: 'Usuarios', icon: UserGroupIcon, count: users.length },
            { key: 'roles', label: 'Roles', icon: ShieldCheckIcon, count: roles.length }
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
          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <BuildingOffice2Icon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Empresas
                  </h2>
                  <FloatingButton
                    onClick={() => openCompanyModal()}
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
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <AnimatedCard
                        key={company.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedCompany?.id === company.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCompany(company)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {company.logo_url ? (
                              <img
                                src={company.logo_url}
                                alt={company.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: theme.colors.primary + '20' }}
                              >
                                <BuildingOffice2Icon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                                {company.name}
                              </h3>
                              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                                {company.email}
                              </p>
                              {company.phone && (
                                <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                                  {company.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCompanyModal(company);
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
                                // handleDeleteCompany(company);
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
                <div className="text-center py-12">
                  <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                  <p style={{ color: theme.colors.textMuted }}>
                    Selecciona una empresa para ver más detalles
                  </p>
                </div>
              </GlassPanel>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <UserGroupIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Usuarios {selectedCompany && `de ${selectedCompany.name}`}
                  </h2>
                  {selectedCompany && (
                    <FloatingButton
                      onClick={() => openUserModal()}
                      variant="primary"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </FloatingButton>
                  )}
                </div>

                {!selectedCompany ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      Selecciona una empresa para ver sus usuarios
                    </p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      No hay usuarios en esta empresa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => {
                      const role = roles.find(r => r.id === user.role_id);
                      return (
                        <AnimatedCard key={user.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold" style={{ color: theme.colors.text }}>
                                {user.full_name}
                              </h4>
                              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                                @{user.username} • {user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: theme.colors.primary + '20',
                                    color: theme.colors.primary
                                  }}
                                >
                                  {role?.description || role?.name}
                                </span>
                                {user.is_active ? (
                                  <span
                                    className="px-2 py-1 rounded text-xs"
                                    style={{
                                      backgroundColor: theme.colors.success + '20',
                                      color: theme.colors.success
                                    }}
                                  >
                                    Activo
                                  </span>
                                ) : (
                                  <span
                                    className="px-2 py-1 rounded text-xs"
                                    style={{
                                      backgroundColor: theme.colors.error + '20',
                                      color: theme.colors.error
                                    }}
                                  >
                                    Inactivo
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                onClick={() => openUserModal(user)}
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: theme.colors.primary + '10' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                              </motion.button>
                              <motion.button
                                onClick={() => {/* handleDeleteUser(user) */}}
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
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                  <p style={{ color: theme.colors.textMuted }}>
                    Panel de estadísticas de usuarios
                  </p>
                </div>
              </GlassPanel>
            </>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <ShieldCheckIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Roles y Permisos
                  </h2>
                  <FloatingButton
                    onClick={() => openRoleModal()}
                    variant="primary"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </FloatingButton>
                </div>

                <div className="space-y-4">
                  {roles.map((role) => (
                    <AnimatedCard key={role.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold" style={{ color: theme.colors.text }}>
                            {role.name}
                          </h4>
                          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                            {role.description}
                          </p>
                          {role.permissions && (
                            <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
                              Permisos: {role.permissions}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => openRoleModal(role)}
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: theme.colors.primary + '10' }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                          </motion.button>
                          <motion.button
                            onClick={() => {/* handleDeleteRole(role) */}}
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
              </GlassPanel>

              <GlassPanel delay={0.2}>
                <div className="text-center py-12">
                  <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                  <p style={{ color: theme.colors.textMuted }}>
                    Panel de permisos y configuración avanzada
                  </p>
                </div>
              </GlassPanel>
            </>
          )}
        </div>
      </div>

      {/* Company Modal */}
      <AnimatePresence>
        {showCompanyModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompanyModal(false)}
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
                    {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
                  </h2>
                  <motion.button
                    onClick={() => setShowCompanyModal(false)}
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
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Ej: Restaurant El Buen Sabor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="empresa@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowCompanyModal(false)}
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
                    onClick={handleSaveCompany}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingCompany ? 'Actualizar' : 'Crear'}
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
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
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h2>
                  <motion.button
                    onClick={() => setShowUserModal(false)}
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
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="jperez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Rol
                    </label>
                    <select
                      value={userForm.role_id}
                      onChange={(e) => setUserForm({ ...userForm, role_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg appearance-none"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      <option value="">Seleccionar rol...</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.description || role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowUserModal(false)}
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
                    onClick={handleSaveUser}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Role Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRoleModal(false)}
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
                    {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                  </h2>
                  <motion.button
                    onClick={() => setShowRoleModal(false)}
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
                      Nombre del Rol
                    </label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Ej: manager, supervisor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Descripción del rol"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Permisos
                    </label>
                    <textarea
                      value={roleForm.permissions}
                      onChange={(e) => setRoleForm({ ...roleForm, permissions: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      rows={3}
                      placeholder="Lista de permisos separados por comas"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowRoleModal(false)}
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
                    onClick={handleSaveRole}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingRole ? 'Actualizar' : 'Crear'}
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