import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
  BuildingOfficeIcon,
  UserPlusIcon,
  PhotoIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  KeyIcon,
  BuildingOffice2Icon
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
}

export const CompaniesManagement: React.FC = () => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    company_id: 0,
    role_id: 0,
    is_active: true
  });

  // Importar configuración centralizada (NO MÁS HARDCODEO!)
  const API_URL = import('../config/api.config').then(m => m.API_URL);

  useEffect(() => {
    loadCompanies();
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyUsers(selectedCompany.id!);
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/companies`);
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Error cargando empresas');
    } finally {
      setLoading(false);
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
      // Roles por defecto si falla la carga
      setRoles([
        { id: 1, name: 'admin', description: 'Administrador' },
        { id: 2, name: 'kitchen', description: 'Cocina' },
        { id: 3, name: 'waiter', description: 'Mozo' }
      ]);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch(`${API_URL}/api/upload/logo`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        setCompanyForm({ ...companyForm, logo_url: url });
        toast.success('Logo cargado exitosamente');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error al cargar el logo');
    } finally {
      setUploadingLogo(false);
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
        setShowCompanyForm(false);
        setEditingCompany(null);
        setCompanyForm({
          name: '',
          email: '',
          phone: '',
          address: '',
          tax_id: '',
          logo_url: '',
          is_active: true
        });
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
      const userData = {
        ...userForm,
        company_id: selectedCompany?.id
      };

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
        setShowUserForm(false);
        setEditingUser(null);
        setUserForm({
          username: '',
          email: '',
          password: '',
          full_name: '',
          company_id: 0,
          role_id: 0,
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    const result = await Swal.fire({
      title: '¿Eliminar empresa?',
      text: `¿Estás seguro de eliminar ${company.name}? Se eliminarán todos los usuarios y datos asociados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.colors.error,
      cancelButtonColor: theme.colors.textMuted,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/companies/${company.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('Empresa eliminada');
          loadCompanies();
          if (selectedCompany?.id === company.id) {
            setSelectedCompany(null);
            setUsers([]);
          }
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        toast.error('Error al eliminar empresa');
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Estás seguro de eliminar a ${user.full_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.colors.error,
      cancelButtonColor: theme.colors.textMuted,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/api/users/${user.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('Usuario eliminado');
          loadCompanyUsers(selectedCompany!.id!);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Gestión de Empresas"
        subtitle="Administra empresas y usuarios del sistema"
        actions={[
          {
            label: 'Nueva Empresa',
            onClick: () => {
              setEditingCompany(null);
              setCompanyForm({
                name: '',
                email: '',
                phone: '',
                address: '',
                tax_id: '',
                logo_url: '',
                is_active: true
              });
              setShowCompanyForm(true);
            },
            variant: 'primary',
            icon: PlusIcon
          }
        ]}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Empresas */}
        <GlassPanel delay={0.1}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
              <BuildingOffice2Icon className="h-6 w-6" style={{ color: theme.colors.primary }} />
              Empresas
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <motion.div
                className="h-12 w-12 border-4"
                style={{
                  borderColor: theme.colors.primary + '20',
                  borderTopColor: theme.colors.primary
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <motion.div
                  key={company.id}
                  className="p-4 rounded-lg cursor-pointer transition-all"
                  style={{
                    backgroundColor: selectedCompany?.id === company.id 
                      ? theme.colors.primary + '10'
                      : theme.colors.surface,
                    border: `2px solid ${selectedCompany?.id === company.id 
                      ? theme.colors.primary 
                      : theme.colors.border}`
                  }}
                  onClick={() => setSelectedCompany(company)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                          <BuildingOfficeIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
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
                          setEditingCompany(company);
                          setCompanyForm(company);
                          setShowCompanyForm(true);
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
                          handleDeleteCompany(company);
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
                </motion.div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Panel de Usuarios */}
        <GlassPanel delay={0.2}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
              <UserGroupIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
              Usuarios {selectedCompany && `de ${selectedCompany.name}`}
            </h2>
            {selectedCompany && (
              <FloatingButton
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    username: '',
                    email: '',
                    password: '',
                    full_name: '',
                    company_id: selectedCompany.id!,
                    role_id: 0,
                    is_active: true
                  });
                  setShowUserForm(true);
                }}
                variant="primary"
              >
                <UserPlusIcon className="h-5 w-5" />
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
            <div className="space-y-3">
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
                          onClick={() => {
                            setEditingUser(user);
                            setUserForm({ ...user, password: '' });
                            setShowUserForm(true);
                          }}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: theme.colors.primary + '10' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteUser(user)}
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
        </div>
      </div>

      {/* Modal de Empresa */}
      <AnimatePresence>
        {showCompanyForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompanyForm(false)}
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
                    onClick={() => setShowCompanyForm(false)}
                    className="p-2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center transition-all hover:border-opacity-100"
                      style={{
                        borderColor: theme.colors.primary + '60',
                        backgroundColor: theme.colors.surface
                      }}
                    >
                      {uploadingLogo ? (
                        <motion.div
                          className="h-6 w-6 border-2"
                          style={{
                            borderColor: theme.colors.primary + '20',
                            borderTopColor: theme.colors.primary
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : companyForm.logo_url ? (
                        <img
                          src={companyForm.logo_url}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <PhotoIcon className="h-8 w-8" style={{ color: theme.colors.textMuted }} />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
                      Click para subir logo
                    </p>
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Av. Principal 123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      CUIT/RUC
                    </label>
                    <input
                      type="text"
                      value={companyForm.tax_id}
                      onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="20-12345678-9"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowCompanyForm(false)}
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

      {/* Modal de Usuario */}
      <AnimatePresence>
        {showUserForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserForm(false)}
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
                    onClick={() => setShowUserForm(false)}
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
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: theme.colors.textMuted }} />
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Contraseña
                      </label>
                      <div className="relative">
                        <KeyIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: theme.colors.textMuted }} />
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            border: `1px solid ${theme.colors.border}`
                          }}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Rol
                    </label>
                    <div className="relative">
                      <ShieldCheckIcon className="absolute left-3 top-3 h-5 w-5" style={{ color: theme.colors.textMuted }} />
                      <select
                        value={userForm.role_id}
                        onChange={(e) => setUserForm({ ...userForm, role_id: parseInt(e.target.value) })}
                        className="w-full pl-10 pr-4 py-2 rounded-lg appearance-none"
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

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="user-active"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="user-active" className="text-sm" style={{ color: theme.colors.text }}>
                      Usuario activo
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowUserForm(false)}
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
    </div>
  );
};