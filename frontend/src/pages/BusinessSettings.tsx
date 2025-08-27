import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';

import { PageHeader } from '../components/PageHeader';
import { GlassPanel } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import {
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  MapPinIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const BusinessSettings: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('/logo-placeholder.png');

  const [businessData, setBusinessData] = useState({
    // Información básica
    name: 'Restaurante Demo',
    legalName: 'Restaurante Demo S.A.',
    businessType: 'restaurant',
    
    // Información fiscal
    taxId: '30-12345678-9',
    taxCategory: 'responsable_inscripto',
    
    // Contacto
    phone: '+54 11 4567-8900',
    alternativePhone: '+54 11 4567-8901',
    email: 'info@restaurantedemo.com',
    website: 'www.restaurantedemo.com',
    
    // Dirección
    address: 'Av. Principal 123',
    city: 'Buenos Aires',
    state: 'Buenos Aires',
    postalCode: 'C1425',
    country: 'Argentina',
    
    // Información adicional
    foundedYear: '2020',
    capacity: '150',
    employeeCount: '25',
    description: 'Restaurante de cocina internacional con más de 5 años de experiencia.'
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success('Datos del negocio actualizados exitosamente');
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader
        title="Datos del Negocio"
        subtitle="Información fiscal y comercial de tu empresa"
        actions={[
          {
            label: loading ? 'Guardando...' : 'Guardar Cambios',
            onClick: handleSave,
            variant: 'primary',
            icon: CheckIcon,
            disabled: loading
          },
          {
            label: 'Cancelar',
            onClick: () => window.history.back(),
            variant: 'secondary',
            icon: XMarkIcon
          }
        ]}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Logo y nombre */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <BuildingOfficeIcon className="h-5 w-5" />
            Identidad del Negocio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Logo del Negocio
              </label>
              <div className="space-y-4">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <CameraIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="text-sm"
                  style={{ color: theme.colors.text }}
                />
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={businessData.name}
                  onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Razón Social
                </label>
                <input
                  type="text"
                  value={businessData.legalName}
                  onChange={(e) => setBusinessData({ ...businessData, legalName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Tipo de Negocio
                </label>
                <select
                  value={businessData.businessType}
                  onChange={(e) => setBusinessData({ ...businessData, businessType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <option value="restaurant">Restaurante</option>
                  <option value="bar">Bar</option>
                  <option value="cafe">Cafetería</option>
                  <option value="fastfood">Comida Rápida</option>
                  <option value="foodtruck">Food Truck</option>
                  <option value="catering">Catering</option>
                </select>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Información fiscal */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <IdentificationIcon className="h-5 w-5" />
            Información Fiscal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                CUIT/RUC/NIT
              </label>
              <input
                type="text"
                value={businessData.taxId}
                onChange={(e) => setBusinessData({ ...businessData, taxId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Categoría Fiscal
              </label>
              <select
                value={businessData.taxCategory}
                onChange={(e) => setBusinessData({ ...businessData, taxCategory: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="responsable_inscripto">Responsable Inscripto</option>
                <option value="monotributo">Monotributo</option>
                <option value="exento">Exento</option>
                <option value="consumidor_final">Consumidor Final</option>
              </select>
            </div>
          </div>
        </GlassPanel>

        {/* Información de contacto */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <PhoneIcon className="h-5 w-5" />
            Información de Contacto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Teléfono Principal
              </label>
              <input
                type="tel"
                value={businessData.phone}
                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Teléfono Alternativo
              </label>
              <input
                type="tel"
                value={businessData.alternativePhone}
                onChange={(e) => setBusinessData({ ...businessData, alternativePhone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Email
              </label>
              <input
                type="email"
                value={businessData.email}
                onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Sitio Web
              </label>
              <input
                type="url"
                value={businessData.website}
                onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>
        </GlassPanel>

        {/* Dirección */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <MapPinIcon className="h-5 w-5" />
            Dirección
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Dirección
              </label>
              <input
                type="text"
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Ciudad
              </label>
              <input
                type="text"
                value={businessData.city}
                onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Estado/Provincia
              </label>
              <input
                type="text"
                value={businessData.state}
                onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Código Postal
              </label>
              <input
                type="text"
                value={businessData.postalCode}
                onChange={(e) => setBusinessData({ ...businessData, postalCode: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                País
              </label>
              <input
                type="text"
                value={businessData.country}
                onChange={(e) => setBusinessData({ ...businessData, country: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>
        </GlassPanel>

        {/* Información adicional */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Información Adicional
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Año de Fundación
              </label>
              <input
                type="text"
                value={businessData.foundedYear}
                onChange={(e) => setBusinessData({ ...businessData, foundedYear: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Capacidad (personas)
              </label>
              <input
                type="number"
                value={businessData.capacity}
                onChange={(e) => setBusinessData({ ...businessData, capacity: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Número de Empleados
              </label>
              <input
                type="number"
                value={businessData.employeeCount}
                onChange={(e) => setBusinessData({ ...businessData, employeeCount: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Descripción del Negocio
              </label>
              <textarea
                value={businessData.description}
                onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};