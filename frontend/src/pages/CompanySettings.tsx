import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  CogIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  ClockIcon,
  TruckIcon,
  BellIcon,
  PaintBrushIcon,
  LanguageIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  CreditCardIcon,
  TagIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface CompanySettingsData {
  // General
  currency_symbol: string;
  currency_position: 'before' | 'after';
  decimal_places: number;
  thousand_separator: string;
  decimal_separator: string;
  
  // Impuestos
  tax_enabled: boolean;
  tax_percentage: number;
  tax_name: string;
  tax_included_in_price: boolean;
  
  // Pedidos
  order_prefix: string;
  order_number_length: number;
  auto_print_kitchen: boolean;
  auto_print_receipt: boolean;
  require_table_selection: boolean;
  require_customer_info: boolean;
  
  // Mesas
  table_auto_available_after_payment: boolean;
  table_reservation_enabled: boolean;
  table_reservation_max_hours: number;
  
  // Productos
  show_product_images: boolean;
  allow_out_of_stock_orders: boolean;
  track_inventory: boolean;
  low_stock_alert_threshold: number;
  
  // Interfaz
  theme: string;
  primary_color: string;
  secondary_color: string;
  logo_position: 'left' | 'center' | 'right';
  show_company_name: boolean;
  
  // Horario
  timezone: string;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  
  // Notificaciones
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  notification_email: string;
  notification_phone: string;
  
  // Pagos
  cash_enabled: boolean;
  card_enabled: boolean;
  digital_wallet_enabled: boolean;
  allow_partial_payments: boolean;
  tip_enabled: boolean;
  tip_suggestions: number[];
  
  // Delivery
  delivery_enabled: boolean;
  delivery_fee: number;
  minimum_delivery_order: number;
  delivery_radius_km: number;
  
  // Descuentos
  allow_manual_discounts: boolean;
  max_discount_percentage: number;
  require_manager_approval_discount: boolean;
  
  // Empleados
  employee_clock_in_required: boolean;
  track_employee_sales: boolean;
  commission_enabled: boolean;
  commission_percentage: number;
  
  // Reportes
  daily_report_auto_send: boolean;
  daily_report_time: string;
  weekly_report_enabled: boolean;
  monthly_report_enabled: boolean;
  
  // Idioma
  language: string;
  date_format: string;
  time_format: '12h' | '24h';
}

interface SettingSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const settingSections: SettingSection[] = [
  { id: 'general', title: 'General', icon: CogIcon, color: '#6B7280' },
  { id: 'taxes', title: 'Impuestos', icon: CalculatorIcon, color: '#EF4444' },
  { id: 'orders', title: 'Pedidos', icon: DocumentTextIcon, color: '#F59E0B' },
  { id: 'tables', title: 'Mesas', icon: TableCellsIcon, color: '#10B981' },
  { id: 'products', title: 'Productos', icon: ShoppingBagIcon, color: '#3B82F6' },
  { id: 'interface', title: 'Interfaz', icon: PaintBrushIcon, color: '#8B5CF6' },
  { id: 'schedule', title: 'Horarios', icon: ClockIcon, color: '#EC4899' },
  { id: 'notifications', title: 'Notificaciones', icon: BellIcon, color: '#14B8A6' },
  { id: 'payments', title: 'Pagos', icon: CreditCardIcon, color: '#F97316' },
  { id: 'delivery', title: 'Delivery', icon: TruckIcon, color: '#84CC16' },
  { id: 'discounts', title: 'Descuentos', icon: TagIcon, color: '#A855F7' },
  { id: 'employees', title: 'Empleados', icon: UserGroupIcon, color: '#0EA5E9' },
  { id: 'reports', title: 'Reportes', icon: DocumentTextIcon, color: '#D946EF' },
  { id: 'language', title: 'Idioma y Región', icon: LanguageIcon, color: '#06B6D4' },
  { id: 'companies', title: 'Gestión de Empresas', icon: BuildingOffice2Icon, color: '#7C3AED' }
];

export const CompanySettings: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { updateSettings: updateLocalization } = useLocalization();
  const [settings, setSettings] = useState<CompanySettingsData | null>(null);
  const [activeSection, setActiveSection] = useState('language');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<CompanySettingsData | null>(null);

  const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || API_BASE_URL);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings && originalSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/company/settings`);
      const data = await response.json();
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error cargando configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/company/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Configuraciones guardadas exitosamente');
        setOriginalSettings(settings);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error guardando configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const updateSetting = (key: keyof CompanySettingsData, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Símbolo de Moneda
          </label>
          <input
            type="text"
            value={settings?.currency_symbol || ''}
            onChange={(e) => updateSetting('currency_symbol', e.target.value)}
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
            Posición de Moneda
          </label>
          <select
            value={settings?.currency_position || 'before'}
            onChange={(e) => updateSetting('currency_position', e.target.value)}
            className="w-full px-4 py-2 rounded-lg"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <option value="before">Antes del monto</option>
            <option value="after">Después del monto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Decimales
          </label>
          <input
            type="number"
            min="0"
            max="4"
            value={settings?.decimal_places || 2}
            onChange={(e) => updateSetting('decimal_places', parseInt(e.target.value))}
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
            Separador de Miles
          </label>
          <input
            type="text"
            value={settings?.thousand_separator || ','}
            onChange={(e) => updateSetting('thousand_separator', e.target.value)}
            className="w-full px-4 py-2 rounded-lg"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderTaxSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="checkbox"
          id="tax-enabled"
          checked={settings?.tax_enabled || false}
          onChange={(e) => updateSetting('tax_enabled', e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="tax-enabled" className="text-sm font-medium" style={{ color: theme.colors.text }}>
          Habilitar impuestos
        </label>
      </div>

      {settings?.tax_enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Nombre del Impuesto
            </label>
            <input
              type="text"
              value={settings?.tax_name || ''}
              onChange={(e) => updateSetting('tax_name', e.target.value)}
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
              Porcentaje (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings?.tax_percentage || 0}
              onChange={(e) => updateSetting('tax_percentage', parseFloat(e.target.value))}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="tax-included"
                checked={settings?.tax_included_in_price || false}
                onChange={(e) => updateSetting('tax_included_in_price', e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="tax-included" className="text-sm" style={{ color: theme.colors.text }}>
                Impuesto incluido en el precio
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrderSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Prefijo de Orden
          </label>
          <input
            type="text"
            value={settings?.order_prefix || ''}
            onChange={(e) => updateSetting('order_prefix', e.target.value)}
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
            Longitud del Número
          </label>
          <input
            type="number"
            min="4"
            max="10"
            value={settings?.order_number_length || 6}
            onChange={(e) => updateSetting('order_number_length', parseInt(e.target.value))}
            className="w-full px-4 py-2 rounded-lg"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="auto-print-kitchen"
            checked={settings?.auto_print_kitchen || false}
            onChange={(e) => updateSetting('auto_print_kitchen', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="auto-print-kitchen" className="text-sm" style={{ color: theme.colors.text }}>
            Imprimir automáticamente en cocina
          </label>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="auto-print-receipt"
            checked={settings?.auto_print_receipt || false}
            onChange={(e) => updateSetting('auto_print_receipt', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="auto-print-receipt" className="text-sm" style={{ color: theme.colors.text }}>
            Imprimir automáticamente recibo
          </label>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="require-table"
            checked={settings?.require_table_selection || false}
            onChange={(e) => updateSetting('require_table_selection', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="require-table" className="text-sm" style={{ color: theme.colors.text }}>
            Requerir selección de mesa
          </label>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="require-customer"
            checked={settings?.require_customer_info || false}
            onChange={(e) => updateSetting('require_customer_info', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="require-customer" className="text-sm" style={{ color: theme.colors.text }}>
            Requerir información del cliente
          </label>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-medium" style={{ color: theme.colors.text }}>Métodos de Pago</h3>
        
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="cash-enabled"
            checked={settings?.cash_enabled || false}
            onChange={(e) => updateSetting('cash_enabled', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="cash-enabled" className="text-sm" style={{ color: theme.colors.text }}>
            Efectivo
          </label>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="card-enabled"
            checked={settings?.card_enabled || false}
            onChange={(e) => updateSetting('card_enabled', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="card-enabled" className="text-sm" style={{ color: theme.colors.text }}>
            Tarjeta de Crédito/Débito
          </label>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="wallet-enabled"
            checked={settings?.digital_wallet_enabled || false}
            onChange={(e) => updateSetting('digital_wallet_enabled', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="wallet-enabled" className="text-sm" style={{ color: theme.colors.text }}>
            Billetera Digital
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium" style={{ color: theme.colors.text }}>Configuración de Propinas</h3>
        
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="tip-enabled"
            checked={settings?.tip_enabled || false}
            onChange={(e) => updateSetting('tip_enabled', e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="tip-enabled" className="text-sm" style={{ color: theme.colors.text }}>
            Habilitar propinas
          </label>
        </div>

        {settings?.tip_enabled && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Sugerencias de Propina (%)
            </label>
            <div className="flex gap-2">
              {settings?.tip_suggestions?.map((tip, index) => (
                <input
                  key={index}
                  type="number"
                  min="0"
                  max="100"
                  value={tip}
                  onChange={(e) => {
                    const newTips = [...(settings.tip_suggestions || [])];
                    newTips[index] = parseInt(e.target.value);
                    updateSetting('tip_suggestions', newTips);
                  }}
                  className="w-20 px-2 py-1 rounded-lg text-center"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCompaniesManagement = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [companyForm, setCompanyForm] = useState({
      name: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      logo_url: ''
    });

    const loadCompanies = async () => {
      try {
        const response = await fetch(`${API_URL}/api/companies`);
        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        console.error('Error loading companies:', error);
        toast.error('Error cargando empresas');
      }
    };

    const handleSaveCompany = async () => {
      try {
        const method = editingCompany ? 'PUT' : 'POST';
        const url = editingCompany 
          ? `${API_URL}/api/companies/${editingCompany.id}`
          : `${API_URL}/api/companies`;

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyForm)
        });

        if (response.ok) {
          toast.success(editingCompany ? 'Empresa actualizada' : 'Empresa creada');
          setShowForm(false);
          setEditingCompany(null);
          setCompanyForm({ name: '', email: '', phone: '', address: '', tax_id: '', logo_url: '' });
          loadCompanies();
        }
      } catch (error) {
        console.error('Error saving company:', error);
        toast.error('Error guardando empresa');
      }
    };

    const handleEditCompany = (company: any) => {
      setEditingCompany(company);
      setCompanyForm({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        tax_id: company.tax_id || '',
        logo_url: company.logo_url || ''
      });
      setShowForm(true);
    };

    const handleDeleteCompany = async (id: number) => {
      if (window.confirm('¿Estás seguro de eliminar esta empresa?')) {
        try {
          const response = await fetch(`${API_URL}/api/companies/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            toast.success('Empresa eliminada');
            loadCompanies();
          }
        } catch (error) {
          console.error('Error deleting company:', error);
          toast.error('Error eliminando empresa');
        }
      }
    };

    React.useEffect(() => {
      loadCompanies();
    }, []);

    return (
      <div className="space-y-6">
        {/* Header con botón agregar */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              Gestión de Empresas
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Administra las empresas del sistema
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowForm(true);
              setEditingCompany(null);
              setCompanyForm({ name: '', email: '', phone: '', address: '', tax_id: '', logo_url: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: theme.colors.primary,
              color: 'white'
            }}
          >
            <BuildingOffice2Icon className="h-5 w-5" />
            Nueva Empresa
          </motion.button>
        </div>

        {/* Formulario de empresa */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
              </h4>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg"
                style={{ color: theme.colors.textMuted }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="Ej: Restaurante El Buen Sabor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Email de Contacto *
                </label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="contacto@empresa.com"
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
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  CUIT/RUT/Tax ID
                </label>
                <input
                  type="text"
                  value={companyForm.tax_id}
                  onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="20-12345678-9"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Dirección
                </label>
                <textarea
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg h-20"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="Calle Ejemplo 123, Ciudad, Provincia"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  URL del Logo
                </label>
                <input
                  type="url"
                  value={companyForm.logo_url}
                  onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCompany}
                disabled={!companyForm.name || !companyForm.email}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.success,
                  color: 'white'
                }}
              >
                <CheckIcon className="h-4 w-4" />
                {editingCompany ? 'Actualizar' : 'Crear'} Empresa
              </button>
              
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Lista de empresas */}
        <div className="space-y-3">
          <h4 className="font-semibold" style={{ color: theme.colors.text }}>
            Empresas Registradas
          </h4>
          
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
              <p style={{ color: theme.colors.textMuted }}>
                No hay empresas registradas
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {companies.map((company) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg flex justify-between items-start"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={company.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <BuildingOffice2Icon className="h-8 w-8" style={{ color: theme.colors.primary }} />
                      )}
                      <div>
                        <h5 className="font-semibold" style={{ color: theme.colors.text }}>
                          {company.name}
                        </h5>
                        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                          ID: {company.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1" style={{ color: theme.colors.textMuted }}>
                      <p>📧 {company.email}</p>
                      {company.phone && <p>📞 {company.phone}</p>}
                      {company.address && <p>📍 {company.address}</p>}
                      {company.tax_id && <p>🆔 {company.tax_id}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: theme.colors.primary }}
                      title="Editar empresa"
                    >
                      <CogIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: theme.colors.error }}
                      title="Eliminar empresa"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLanguageSettings = () => {
    const handleLanguageChange = (newLanguage: string) => {
      updateSetting('language', newLanguage);
      // Cambiar el idioma de la aplicación inmediatamente
      i18n.changeLanguage(newLanguage);
      localStorage.setItem('i18nextLng', newLanguage);
      
      // Actualizar contexto de localización
      updateLocalization({ language: newLanguage });
    };

    const handleTimezoneChange = (newTimezone: string) => {
      updateSetting('timezone', newTimezone);
      // Actualizar contexto de localización
      updateLocalization({ timezone: newTimezone });
    };

    const timezones = [
      { value: 'America/Argentina/Buenos_Aires', label: t('timezones.america_argentina') },
      { value: 'America/New_York', label: t('timezones.america_new_york') },
      { value: 'America/Mexico_City', label: t('timezones.america_mexico') },
      { value: 'America/Sao_Paulo', label: t('timezones.america_sao_paulo') },
      { value: 'Europe/Madrid', label: t('timezones.europe_madrid') }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.language_setting')}
            </label>
            <select
              value={settings?.language || 'es'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <option value="es">{t('languages.es')}</option>
              <option value="en">{t('languages.en')}</option>
              <option value="pt">{t('languages.pt')}</option>
            </select>
            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
              El cambio de idioma se aplica inmediatamente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.timezone')}
            </label>
            <select
              value={settings?.timezone || 'America/Argentina/Buenos_Aires'}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.dateFormat')}
            </label>
            <select
              value={settings?.date_format || 'DD/MM/YYYY'}
              onChange={(e) => updateSetting('date_format', e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              {t('settings.timeFormat')}
            </label>
            <select
              value={settings?.time_format || '24h'}
              onChange={(e) => updateSetting('time_format', e.target.value as '12h' | '24h')}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <option value="12h">12 horas (AM/PM)</option>
              <option value="24h">24 horas</option>
            </select>
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary + '10' }}>
          <p className="text-sm" style={{ color: theme.colors.primary }}>
            <strong>Nota:</strong> La zona horaria afecta cómo se muestran las fechas y horas en reportes, 
            órdenes y registros del sistema. El formato de fecha y hora se aplica en toda la aplicación.
          </p>
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    if (loading) {
      return (
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
      );
    }

    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'taxes':
        return renderTaxSettings();
      case 'orders':
        return renderOrderSettings();
      case 'payments':
        return renderPaymentSettings();
      case 'language':
        return renderLanguageSettings();
      case 'companies':
        return renderCompaniesManagement();
      default:
        return (
          <div className="text-center py-12">
            <p style={{ color: theme.colors.textMuted }}>
              Sección en desarrollo
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader
        title="Configuración de Empresa"
        subtitle="Personaliza el comportamiento del sistema para tu empresa"
        actions={hasChanges ? [
          {
            label: 'Cancelar',
            onClick: handleCancel,
            variant: 'secondary',
            icon: XMarkIcon
          },
          {
            label: saving ? 'Guardando...' : 'Guardar Cambios',
            onClick: handleSave,
            variant: 'primary',
            icon: CheckIcon,
            disabled: saving
          }
        ] : []}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Sidebar de secciones */}
        <div className="lg:col-span-1">
          <GlassPanel delay={0.1}>
            <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>
              Secciones
            </h3>
            <div className="space-y-2">
              {settingSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                    style={{
                      backgroundColor: isActive ? section.color + '20' : 'transparent',
                      color: isActive ? section.color : theme.colors.textMuted
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{section.title}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeSection"
                        className="absolute left-0 w-1 h-8 rounded-r-lg"
                        style={{ backgroundColor: section.color }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </GlassPanel>
        </div>

        {/* Contenido de configuración */}
        <div className="lg:col-span-3">
          <GlassPanel delay={0.2}>
            <div className="flex items-center gap-3 mb-6">
              {(() => {
                const section = settingSections.find(s => s.id === activeSection);
                const Icon = section?.icon || CogIcon;
                return (
                  <>
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: (section?.color || theme.colors.primary) + '20' }}
                    >
                      <Icon className="h-6 w-6" style={{ color: section?.color || theme.colors.primary }} />
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {section?.title || 'Configuración'}
                    </h2>
                  </>
                );
              })()}
            </div>

            {renderSectionContent()}
          </GlassPanel>
        </div>
      </div>

      {/* Indicador de cambios sin guardar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
            style={{
              backgroundColor: theme.colors.warning,
              color: 'white'
            }}
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Hay cambios sin guardar</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};