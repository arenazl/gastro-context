import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Shield,
  Settings,
  ChevronRight,
  Globe,
  CreditCard,
  Bell,
  Database,
  Palette,
  Store,
  Clock,
  Receipt,
  Package,
  FileText,
  Zap,
  Wifi,
  Printer,
  QrCode,
  ChefHat,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle,
  Truck,
  Calculator,
  Smartphone,
  Search,
  LayoutGrid,
  DollarSign,
  Briefcase,
  UserCircle,
  MapPin,
  Calendar,
  ShoppingBag,
  Layers
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface SettingSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  path: string;
  badge?: string;
  category: 'restaurant' | 'operations' | 'administration' | 'advanced';
  hasForm?: boolean;
  status?: 'active' | 'coming-soon' | 'beta';
  isGrouped?: boolean;
  groupedItems?: string[];
}

interface SettingCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const categories: SettingCategory[] = [
  {
    id: 'restaurant',
    name: 'Mi Restaurante',
    description: 'Información básica y configuración general',
    icon: Store,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'operations',
    name: 'Operación Diaria',
    description: 'Gestión de menú, mesas y pedidos',
    icon: UtensilsCrossed,
    color: '#10B981',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'administration',
    name: 'Administración',
    description: 'Empleados, finanzas y reportes',
    icon: Briefcase,
    color: '#6366F1',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'advanced',
    name: 'Avanzado',
    description: 'Integraciones y configuración técnica',
    icon: Settings,
    color: '#F59E0B',
    gradient: 'from-amber-500 to-amber-600'
  }
];

const settingSections: SettingSection[] = [
  // MI RESTAURANTE
  {
    id: 'business-complete',
    title: 'Información del Negocio',
    subtitle: 'Datos, logo, sucursales, horarios y contacto',
    icon: Store,
    color: '#3B82F6',
    path: '/settings/business-complete',
    category: 'restaurant',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Datos fiscales', 'Logo', 'Sucursales', 'Horarios', 'Contacto']
  },
  {
    id: 'regional',
    title: 'Configuración Regional',
    subtitle: 'Idioma, zona horaria, moneda e impuestos',
    icon: Globe,
    color: '#0EA5E9',
    path: '/settings/regional',
    category: 'restaurant',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Idioma', 'Zona horaria', 'Moneda', 'Impuestos', 'Formato de fecha']
  },
  {
    id: 'appearance-branding',
    title: 'Apariencia y Marca',
    subtitle: 'Temas, colores, fuentes y personalización',
    icon: Palette,
    color: '#06B6D4',
    path: '/settings/appearance',
    category: 'restaurant',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Tema', 'Colores', 'Logo', 'Fuentes', 'Modo oscuro']
  },

  // OPERACIÓN DIARIA
  {
    id: 'menu-products',
    title: 'Menú y Productos',
    subtitle: 'Categorías, productos, precios, ingredientes y stock',
    icon: UtensilsCrossed,
    color: '#10B981',
    path: '/products',
    category: 'operations',
    hasForm: true,
    status: 'active',
    badge: 'Completo',
    isGrouped: true,
    groupedItems: ['Categorías', 'Productos', 'Precios', 'Ingredientes', 'Stock']
  },
  {
    id: 'tables-areas',
    title: 'Mesas y Salones',
    subtitle: 'Distribución, áreas, capacidad y diseño visual',
    icon: LayoutGrid,
    color: '#059669',
    path: '/tables-visual',
    category: 'operations',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Mesas', 'Áreas', 'Capacidad', 'Layout', 'QR por mesa']
  },
  {
    id: 'kitchen-orders',
    title: 'Cocina y Pedidos',
    subtitle: 'Flujo de cocina, tiempos y gestión de órdenes',
    icon: ChefHat,
    color: '#047857',
    path: '/kitchen-kanban',
    category: 'operations',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Estados', 'Tiempos', 'Prioridades', 'Notificaciones']
  },
  {
    id: 'customer-service',
    title: 'Atención al Cliente',
    subtitle: 'Reservas, lista de espera, feedback y fidelización',
    icon: UserCircle,
    color: '#065F46',
    path: '/settings/customer-service',
    category: 'operations',
    badge: 'Nuevo',
    hasForm: true,
    status: 'beta',
    isGrouped: true,
    groupedItems: ['Reservas', 'Lista espera', 'Feedback', 'Programa puntos']
  },

  // ADMINISTRACIÓN
  {
    id: 'staff-complete',
    title: 'Personal y Accesos',
    subtitle: 'Empleados, roles, permisos, turnos y asistencia',
    icon: Users,
    color: '#6366F1',
    path: '/employees-management',
    category: 'administration',
    badge: 'Nuevo',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Empleados', 'Roles', 'Permisos', 'Turnos', 'Asistencia']
  },
  {
    id: 'finance-complete',
    title: 'Finanzas y Pagos',
    subtitle: 'Métodos de pago, cajas, cierres y contabilidad',
    icon: DollarSign,
    color: '#4F46E5',
    path: '/settings/finance',
    category: 'administration',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Métodos pago', 'Cajas', 'Cierres Z', 'Propinas', 'Reportes']
  },
  {
    id: 'inventory-suppliers',
    title: 'Inventario y Proveedores',
    subtitle: 'Stock, compras, proveedores y costos',
    icon: Package,
    color: '#4338CA',
    path: '/settings/inventory',
    category: 'administration',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Inventario', 'Proveedores', 'Órdenes compra', 'Costos']
  },
  {
    id: 'reports-analytics',
    title: 'Reportes y Análisis',
    subtitle: 'Ventas, estadísticas, KPIs y dashboards',
    icon: FileText,
    color: '#3730A3',
    path: '/settings/reports',
    category: 'administration',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Ventas', 'Productos', 'Empleados', 'KPIs', 'Exportar']
  },

  // AVANZADO
  {
    id: 'integrations-all',
    title: 'Integraciones Externas',
    subtitle: 'Delivery, contabilidad, marketing y redes',
    icon: Wifi,
    color: '#F59E0B',
    path: '/settings/integrations',
    category: 'advanced',
    badge: 'Múltiple',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Delivery apps', 'Contabilidad', 'Google', 'Redes sociales']
  },
  {
    id: 'hardware-devices',
    title: 'Hardware y Dispositivos',
    subtitle: 'Impresoras, tablets, POS y lectores',
    icon: Printer,
    color: '#F97316',
    path: '/settings/hardware',
    category: 'advanced',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Impresoras', 'Tablets', 'Terminal POS', 'Lector QR']
  },
  {
    id: 'notifications-complete',
    title: 'Notificaciones y Alertas',
    subtitle: 'Email, SMS, WhatsApp, push y sistema',
    icon: Bell,
    color: '#EA580C',
    path: '/settings/notifications',
    category: 'advanced',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Email', 'SMS', 'WhatsApp', 'Push', 'Alertas sistema']
  },
  {
    id: 'security-backup',
    title: 'Seguridad y Respaldos',
    subtitle: 'Contraseñas, backups, logs y auditoría',
    icon: Shield,
    color: '#DC2626',
    path: '/settings/security',
    category: 'advanced',
    hasForm: true,
    status: 'active',
    isGrouped: true,
    groupedItems: ['Contraseñas', 'Backups', 'Logs', 'Auditoría', '2FA']
  }
];

export const SettingsHub: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleNavigate = (path: string, status?: string) => {
    if (status === 'coming-soon') {
      toast.info('🚀 Esta función estará disponible próximamente');
      return;
    }

    // Navigate to the appropriate page based on path
    const navigationMap = {
      '/products': '/products',
      '/tables-visual': '/tables-visual',
      '/kitchen-kanban': '/kitchen-kanban',
      '/employees-management': '/employees-management',
      '/settings/unified': '/unified-settings',
      '/settings/business-complete': '/business-settings',
      '/settings/regional': '/localization-settings',
      '/qr-manager': '/qr-manager',
    };

    const mappedPath = navigationMap[path];
    if (mappedPath) {
      navigate(mappedPath);
    } else {
      // For other settings, use general settings with tab
      const tabId = path.split('/').pop();
      navigate(`/general-settings?tab=${tabId}`);
    }
  };

  // Filtrar secciones según categoría y búsqueda
  const filteredSections = settingSections.filter(section => {
    const matchesCategory = !selectedCategory || section.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (section.groupedItems && section.groupedItems.some(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    return matchesCategory && matchesSearch;
  });

  // Agrupar secciones por categoría
  const groupedSections = categories.map(category => ({
    ...category,
    sections: filteredSections.filter(section => section.category === category.id)
  })).filter(group => group.sections.length > 0);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      <PageHeader
        title="Centro de Configuración"
        subtitle="Todo tu restaurante en un solo lugar"
      />

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar configuración..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                !selectedCategory 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                style={{
                  background: selectedCategory === category.id 
                    ? `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
                    : undefined
                }}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {searchTerm && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{filteredSections.length}</span> resultados para 
                <span className="font-medium ml-1">"{searchTerm}"</span>
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}

          {/* Grouped Sections */}
          {groupedSections.map((group, groupIndex) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              className="mb-12"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-lg`}
                >
                  <group.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {group.sections.length} {group.sections.length === 1 ? 'módulo' : 'módulos'}
                  </span>
                </div>
              </div>

              {/* Section Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {group.sections.map((section, index) => {
                  const isExpanded = expandedCard === section.id;
                  
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`bg-white rounded-2xl border-2 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden ${
                        section.status === 'coming-soon' 
                          ? 'opacity-75 border-gray-200' 
                          : 'border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      {/* Card Gradient Accent */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 opacity-75"
                        style={{ 
                          background: `linear-gradient(90deg, ${section.color}, ${section.color}dd)`
                        }}
                      />

                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3"
                            style={{ 
                              backgroundColor: section.color + '15',
                              border: `2px solid ${section.color}30`
                            }}
                          >
                            <section.icon
                              className="h-7 w-7 transition-colors"
                              style={{ color: section.color }}
                            />
                          </div>
                          {section.badge && (
                            <span
                              className="px-3 py-1.5 text-xs font-bold rounded-full"
                              style={{
                                backgroundColor: section.status === 'beta' 
                                  ? '#DBEAFE'
                                  : section.color + '15',
                                color: section.status === 'beta'
                                  ? '#1E40AF'
                                  : section.color
                              }}
                            >
                              {section.badge}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {section.subtitle}
                        </p>

                        {/* Grouped Items */}
                        {section.isGrouped && section.groupedItems && (
                          <div className="mb-4">
                            <div 
                              className="flex flex-wrap gap-1.5"
                              onMouseEnter={() => setExpandedCard(section.id)}
                              onMouseLeave={() => setExpandedCard(null)}
                            >
                              {section.groupedItems.slice(0, isExpanded ? undefined : 3).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-200"
                                >
                                  {item}
                                </span>
                              ))}
                              {!isExpanded && section.groupedItems.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg font-medium">
                                  +{section.groupedItems.length - 3} más
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => handleNavigate(section.path, section.status)}
                          className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                            section.status === 'coming-soon'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 group-hover:shadow-md'
                          }`}
                        >
                          <span>
                            {section.status === 'coming-soon' ? 'Próximamente' : 'Configurar'}
                          </span>
                          <ArrowRight className={`h-4 w-4 transition-transform ${
                            section.status !== 'coming-soon' ? 'group-hover:translate-x-1' : ''
                          }`} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* No Results */}
          {filteredSections.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta con otros términos o categorías
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Limpiar filtros
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">
                <span className="font-medium">{settingSections.filter(s => s.status === 'active').length}</span> configuraciones activas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                <span className="font-medium">{settingSections.filter(s => s.isGrouped).length}</span> módulos agrupados
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Sistema Gastronómico v2.0.0
          </div>
        </div>
      </div>
    </div>
  );
};