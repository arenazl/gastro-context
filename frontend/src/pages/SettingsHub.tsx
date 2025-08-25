import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Shield,
  UserCheck,
  MapPin,
  LayoutGrid,
  Square,
  Settings,
  ChevronRight,
  Briefcase,
  Home,
  UserCircle,
  Map,
  TableProperties,
  Sliders,
  Globe,
  CreditCard,
  Bell,
  Lock,
  Database,
  Palette
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

interface SettingSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  path: string;
  badge?: string;
}

const settingSections: SettingSection[] = [
  {
    id: 'unified',
    title: 'Configuración Integral ABM',
    subtitle: 'Empresas, usuarios, roles, clientes, direcciones, áreas y mesas',
    icon: Building2,
    color: '#3B82F6',
    path: '/settings/unified',
    badge: 'Todo en 1'
  },
  {
    id: 'business',
    title: 'Datos del Negocio',
    subtitle: 'Información fiscal y comercial de la empresa',
    icon: Briefcase,
    color: '#0891B2',
    path: '/settings/business'
  },
  {
    id: 'localization',
    title: 'Idioma y Región',
    subtitle: 'Configuración regional, idioma y zona horaria',
    icon: Globe,
    color: '#7C3AED',
    path: '/settings/localization'
  },
  {
    id: 'payments',
    title: 'Métodos de Pago',
    subtitle: 'Configurar formas de pago aceptadas',
    icon: CreditCard,
    color: '#059669',
    path: '/settings/payments'
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    subtitle: 'Alertas y comunicaciones del sistema',
    icon: Bell,
    color: '#DC2626',
    path: '/settings/notifications'
  },
  {
    id: 'security',
    title: 'Seguridad',
    subtitle: 'Contraseñas, autenticación y permisos',
    icon: Lock,
    color: '#991B1B',
    path: '/settings/security'
  },
  {
    id: 'backup',
    title: 'Respaldo y Datos',
    subtitle: 'Copias de seguridad y exportación',
    icon: Database,
    color: '#1E40AF',
    path: '/settings/backup'
  },
  {
    id: 'appearance',
    title: 'Apariencia',
    subtitle: 'Temas, colores y personalización visual',
    icon: Palette,
    color: '#BE185D',
    path: '/settings/appearance'
  }
];

export const SettingsHub: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    // Navigate to the appropriate page
    if (path === '/settings/unified') {
      navigate('/unified-settings');
    } else if (path === '/settings/business') {
      // Datos del Negocio tiene su propia página
      navigate('/business-settings');
    } else if (path === '/settings/localization') {
      // Idioma y Región tiene su propia página
      navigate('/localization-settings');
    } else if (path === '/settings/payments' || 
               path === '/settings/notifications' || 
               path === '/settings/security' || 
               path === '/settings/backup' || 
               path === '/settings/appearance') {
      // Estas opciones van a GeneralSettings con el tab correspondiente
      const tabId = path.split('/').pop();
      navigate(`/general-settings?tab=${tabId}`);
    } else {
      // For pages not yet implemented, show a toast
      toast.info('Esta sección estará disponible próximamente');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Centro de Configuración"
        subtitle="Administra todos los aspectos de tu sistema"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Main Sections */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Gestión Principal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {settingSections.slice(0, 8).map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNavigate(section.path)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: section.color + '20' }}
                      >
                        <section.icon
                          className="h-6 w-6"
                          style={{ color: section.color }}
                        />
                      </div>
                      {section.badge && (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: section.color + '20',
                            color: section.color
                          }}
                        >
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {section.subtitle}
                    </p>
                    <div className="flex items-center text-sm font-medium group-hover:text-blue-600 transition-colors">
                      <span>Configurar</span>
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* System Configuration */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Configuración del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {settingSections.slice(8).map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 8) * 0.05 }}
                  onClick={() => handleNavigate(section.path)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: section.color + '20' }}
                      >
                        <section.icon
                          className="h-6 w-6"
                          style={{ color: section.color }}
                        />
                      </div>
                      {section.badge && (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: section.color + '20',
                            color: section.color
                          }}
                        >
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {section.subtitle}
                    </p>
                    <div className="flex items-center text-sm font-medium group-hover:text-blue-600 transition-colors">
                      <span>Configurar</span>
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mesas Configuradas</p>
                <p className="text-2xl font-bold text-gray-900">35</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Áreas</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Clientes Registrados</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};