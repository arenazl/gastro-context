import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  CreditCardIcon,
  BellIcon,
  ShieldCheckIcon,
  ServerIcon,
  PaintBrushIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'business', label: 'Datos del Negocio', icon: BuildingOfficeIcon },
  { id: 'localization', label: 'Idioma y Región', icon: GlobeAltIcon },
  { id: 'payments', label: 'Métodos de Pago', icon: CreditCardIcon },
  { id: 'notifications', label: 'Notificaciones', icon: BellIcon },
  { id: 'security', label: 'Seguridad', icon: ShieldCheckIcon },
  { id: 'backup', label: 'Respaldo', icon: ServerIcon },
  { id: 'appearance', label: 'Apariencia', icon: PaintBrushIcon }
];

export const GeneralSettings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'business';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  
  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabs.find(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Business Data
  const [businessData, setBusinessData] = useState({
    name: 'Restaurante Demo',
    legalName: 'Restaurante Demo S.A.',
    taxId: '30-12345678-9',
    address: 'Av. Principal 123',
    city: 'Buenos Aires',
    country: 'Argentina',
    phone: '+54 11 4567-8900',
    email: 'info@restaurantedemo.com',
    website: 'www.restaurantedemo.com'
  });

  // Localization
  const [localizationData, setLocalizationData] = useState({
    language: i18n.language || 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Efectivo', enabled: true, icon: '💵' },
    { id: 2, name: 'Tarjeta de Crédito', enabled: true, icon: '💳' },
    { id: 3, name: 'Tarjeta de Débito', enabled: true, icon: '💳' },
    { id: 4, name: 'Transferencia', enabled: false, icon: '🏦' },
    { id: 5, name: 'MercadoPago', enabled: true, icon: '📱' },
    { id: 6, name: 'Billetera Digital', enabled: false, icon: '📲' }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderReady: true,
    lowStock: true,
    dailyReport: false,
    weeklyReport: true,
    customerBirthday: false,
    emailEnabled: true,
    pushEnabled: false,
    smsEnabled: false
  });

  // Security
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireNumbers: true,
    requireSpecialChars: true,
    requireUppercase: true,
    maxLoginAttempts: 5,
    ipWhitelist: false
  });

  // Backup
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '03:00',
    retentionDays: 30,
    backupLocation: 'cloud',
    lastBackup: '2024-03-25 03:00:00'
  });

  // Appearance
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: theme.isDark ? 'dark' : 'light',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontFamily: 'Inter',
    fontSize: 'medium',
    compactMode: false,
    animations: true
  });

  const handleSave = () => {
    setLoading(true);
    
    // Simular guardado
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuración guardada exitosamente');
      
      // Aplicar cambios de idioma si cambió
      if (localizationData.language !== i18n.language) {
        i18n.changeLanguage(localizationData.language);
      }
      
      // Aplicar tema si cambió
      if ((appearanceSettings.theme === 'dark') !== theme.isDark) {
        toggleTheme();
      }
    }, 1000);
  };

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            Teléfono
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
      </div>
    </div>
  );

  const renderLocalizationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Idioma
          </label>
          <select
            value={localizationData.language}
            onChange={(e) => setLocalizationData({ ...localizationData, language: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Zona Horaria
          </label>
          <select
            value={localizationData.timezone}
            onChange={(e) => setLocalizationData({ ...localizationData, timezone: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
            <option value="America/New_York">Nueva York (GMT-5)</option>
            <option value="Europe/Madrid">Madrid (GMT+1)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Moneda
          </label>
          <select
            value={localizationData.currency}
            onChange={(e) => setLocalizationData({ ...localizationData, currency: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <option value="ARS">ARS - Peso Argentino</option>
            <option value="USD">USD - Dólar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="MXN">MXN - Peso Mexicano</option>
            <option value="BRL">BRL - Real</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Formato de Fecha
          </label>
          <select
            value={localizationData.dateFormat}
            onChange={(e) => setLocalizationData({ ...localizationData, dateFormat: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
            Formato de Hora
          </label>
          <select
            value={localizationData.timeFormat}
            onChange={(e) => setLocalizationData({ ...localizationData, timeFormat: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <option value="24h">24 horas (14:30)</option>
            <option value="12h">12 horas (2:30 PM)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
        Métodos de Pago Disponibles
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <GlassPanel key={method.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <span className="font-medium" style={{ color: theme.colors.text }}>
                  {method.name}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={(e) => {
                    const updated = paymentMethods.map(m =>
                      m.id === method.id ? { ...m, enabled: e.target.checked } : m
                    );
                    setPaymentMethods(updated);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Notificaciones del Sistema
          </h3>
          <div className="space-y-4">
            {[
              { key: 'newOrders', label: 'Nuevos Pedidos' },
              { key: 'orderReady', label: 'Pedidos Listos' },
              { key: 'lowStock', label: 'Stock Bajo' },
              { key: 'dailyReport', label: 'Reporte Diario' },
              { key: 'weeklyReport', label: 'Reporte Semanal' },
              { key: 'customerBirthday', label: 'Cumpleaños de Clientes' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span style={{ color: theme.colors.text }}>{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      [item.key]: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Canales de Notificación
          </h3>
          <div className="space-y-4">
            {[
              { key: 'emailEnabled', label: 'Email', icon: '📧' },
              { key: 'pushEnabled', label: 'Notificaciones Push', icon: '🔔' },
              { key: 'smsEnabled', label: 'SMS', icon: '📱' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span style={{ color: theme.colors.text }}>{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      [item.key]: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
          Configuración de Seguridad
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: theme.colors.text }}>
                Autenticación de Dos Factores
              </p>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                Añade una capa extra de seguridad
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) => setSecuritySettings({
                  ...securitySettings,
                  twoFactorAuth: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Tiempo de Sesión (minutos)
            </label>
            <input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                sessionTimeout: parseInt(e.target.value)
              })}
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
              Intentos Máximos de Login
            </label>
            <input
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                maxLoginAttempts: parseInt(e.target.value)
              })}
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

      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
          Requisitos de Contraseña
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Longitud Mínima
            </label>
            <input
              type="number"
              value={securitySettings.passwordMinLength}
              onChange={(e) => setSecuritySettings({
                ...securitySettings,
                passwordMinLength: parseInt(e.target.value)
              })}
              className="w-32 px-4 py-2 rounded-lg border-2"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            />
          </div>

          {[
            { key: 'requireNumbers', label: 'Requerir Números' },
            { key: 'requireSpecialChars', label: 'Requerir Caracteres Especiales' },
            { key: 'requireUppercase', label: 'Requerir Mayúsculas' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span style={{ color: theme.colors.text }}>{item.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings[item.key as keyof typeof securitySettings] as boolean}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    [item.key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <GlassPanel className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
          Configuración de Respaldos
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: theme.colors.text }}>
                Respaldo Automático
              </p>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                Realizar respaldos automáticamente
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={backupSettings.autoBackup}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  autoBackup: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Frecuencia
              </label>
              <select
                value={backupSettings.backupFrequency}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  backupFrequency: e.target.value
                })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="hourly">Cada Hora</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Hora del Respaldo
              </label>
              <input
                type="time"
                value={backupSettings.backupTime}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  backupTime: e.target.value
                })}
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
                Días de Retención
              </label>
              <input
                type="number"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  retentionDays: parseInt(e.target.value)
                })}
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
                Ubicación
              </label>
              <select
                value={backupSettings.backupLocation}
                onChange={(e) => setBackupSettings({
                  ...backupSettings,
                  backupLocation: e.target.value
                })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="cloud">Nube</option>
                <option value="local">Local</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: theme.colors.text }}>
              Último Respaldo
            </p>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {backupSettings.lastBackup}
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={() => toast.info('Iniciando respaldo manual...')}
          >
            Respaldar Ahora
          </button>
        </div>
      </GlassPanel>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Tema
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'light' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  appearanceSettings.theme === 'light' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
              >
                ☀️ Claro
              </button>
              <button
                onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'dark' })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  appearanceSettings.theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300'
                }`}
              >
                🌙 Oscuro
              </button>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Colores
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Color Primario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={appearanceSettings.primaryColor}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings,
                    primaryColor: e.target.value
                  })}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={appearanceSettings.primaryColor}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings,
                    primaryColor: e.target.value
                  })}
                  className="flex-1 px-4 py-2 rounded-lg border-2"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Color Secundario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={appearanceSettings.secondaryColor}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings,
                    secondaryColor: e.target.value
                  })}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={appearanceSettings.secondaryColor}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings,
                    secondaryColor: e.target.value
                  })}
                  className="flex-1 px-4 py-2 rounded-lg border-2"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Tipografía
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Fuente
              </label>
              <select
                value={appearanceSettings.fontFamily}
                onChange={(e) => setAppearanceSettings({
                  ...appearanceSettings,
                  fontFamily: e.target.value
                })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Tamaño de Texto
              </label>
              <select
                value={appearanceSettings.fontSize}
                onChange={(e) => setAppearanceSettings({
                  ...appearanceSettings,
                  fontSize: e.target.value
                })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="small">Pequeño</option>
                <option value="medium">Mediano</option>
                <option value="large">Grande</option>
                <option value="x-large">Extra Grande</option>
              </select>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Opciones Visuales
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ color: theme.colors.text }}>Modo Compacto</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearanceSettings.compactMode}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings,
                    compactMode: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ color: theme.colors.text }}>Animaciones</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearanceSettings.animations}
                  onChange={(e) => setAppearanceSettings({
                    ...appearanceSettings,
                    animations: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return renderBusinessTab();
      case 'localization':
        return renderLocalizationTab();
      case 'payments':
        return renderPaymentsTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'backup':
        return renderBackupTab();
      case 'appearance':
        return renderAppearanceTab();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader
        title="Configuración General"
        subtitle="Administra todas las configuraciones del sistema"
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

      <div className="p-6 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};