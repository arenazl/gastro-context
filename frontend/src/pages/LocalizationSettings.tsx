import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import {
  GlobeAltIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  LanguageIcon,
  CheckIcon,
  XMarkIcon,
  MapIcon
} from '@heroicons/react/24/outline';

export const LocalizationSettings: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    // Idioma
    language: i18n.language || 'es',
    fallbackLanguage: 'en',
    autoDetectLanguage: true,
    
    // Región
    country: 'AR',
    timezone: 'America/Argentina/Buenos_Aires',
    
    // Formatos
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 'monday',
    
    // Moneda
    currency: 'ARS',
    currencyPosition: 'before',
    decimalSeparator: ',',
    thousandSeparator: '.',
    decimalPlaces: 2,
    
    // Unidades
    temperatureUnit: 'celsius',
    weightUnit: 'kg',
    distanceUnit: 'km'
  });

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  const timezones = [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)', country: 'Argentina' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)', country: 'México' },
    { value: 'America/New_York', label: 'Nueva York (GMT-5)', country: 'USA' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)', country: 'USA' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)', country: 'Brasil' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)', country: 'España' },
    { value: 'Europe/Paris', label: 'París (GMT+1)', country: 'Francia' },
    { value: 'Europe/London', label: 'Londres (GMT)', country: 'Reino Unido' }
  ];

  const currencies = [
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' }
  ];

  const handleSave = () => {
    setLoading(true);
    
    // Aplicar cambio de idioma si cambió
    if (settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
    
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuración regional guardada exitosamente');
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader
        title="Idioma y Región"
        subtitle="Configuración de idioma, zona horaria y formatos regionales"
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
        {/* Configuración de Idioma */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <LanguageIcon className="h-5 w-5" />
            Configuración de Idioma
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text }}>
                Idioma Principal
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSettings({ ...settings, language: lang.code })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      settings.language === lang.code 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium" style={{ color: theme.colors.text }}>
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Idioma de Respaldo
                </label>
                <select
                  value={settings.fallbackLanguage}
                  onChange={(e) => setSettings({ ...settings, fallbackLanguage: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoDetectLanguage}
                    onChange={(e) => setSettings({ ...settings, autoDetectLanguage: e.target.checked })}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <span style={{ color: theme.colors.text }}>
                    Detectar idioma automáticamente según el navegador
                  </span>
                </label>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Zona Horaria y Región */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <ClockIcon className="h-5 w-5" />
            Zona Horaria y Región
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Zona Horaria
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} - {tz.country}
                  </option>
                ))}
              </select>
              <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                Hora actual: {new Date().toLocaleTimeString('es-AR', { timeZone: settings.timezone })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                País/Región
              </label>
              <select
                value={settings.country}
                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="AR">Argentina</option>
                <option value="MX">México</option>
                <option value="ES">España</option>
                <option value="US">Estados Unidos</option>
                <option value="BR">Brasil</option>
                <option value="CL">Chile</option>
                <option value="CO">Colombia</option>
                <option value="PE">Perú</option>
              </select>
            </div>
          </div>
        </GlassPanel>

        {/* Formatos de Fecha y Hora */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <CalendarIcon className="h-5 w-5" />
            Formatos de Fecha y Hora
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Formato de Fecha
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (25/03/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (03/25/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-03-25)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (25-03-2024)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Formato de Hora
              </label>
              <select
                value={settings.timeFormat}
                onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Primer Día de la Semana
              </label>
              <select
                value={settings.firstDayOfWeek}
                onChange={(e) => setSettings({ ...settings, firstDayOfWeek: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="monday">Lunes</option>
                <option value="sunday">Domingo</option>
                <option value="saturday">Sábado</option>
              </select>
            </div>
          </div>
        </GlassPanel>

        {/* Configuración de Moneda */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <CurrencyDollarIcon className="h-5 w-5" />
            Configuración de Moneda
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Moneda
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Posición del Símbolo
              </label>
              <select
                value={settings.currencyPosition}
                onChange={(e) => setSettings({ ...settings, currencyPosition: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="before">Antes del número ($100)</option>
                <option value="after">Después del número (100$)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Separador Decimal
              </label>
              <select
                value={settings.decimalSeparator}
                onChange={(e) => setSettings({ ...settings, decimalSeparator: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value=",">Coma (,)</option>
                <option value=".">Punto (.)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Separador de Miles
              </label>
              <select
                value={settings.thousandSeparator}
                onChange={(e) => setSettings({ ...settings, thousandSeparator: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value=".">Punto (.)</option>
                <option value=",">Coma (,)</option>
                <option value=" ">Espacio ( )</option>
                <option value="">Sin separador</option>
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
                value={settings.decimalPlaces}
                onChange={(e) => setSettings({ ...settings, decimalPlaces: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-sm font-medium text-blue-900">Ejemplo de formato:</p>
                <p className="text-lg font-bold text-blue-600">
                  {settings.currencyPosition === 'before' ? '$' : ''}
                  1{settings.thousandSeparator}234{settings.decimalSeparator}56
                  {settings.currencyPosition === 'after' ? '$' : ''}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Unidades de Medida */}
        <GlassPanel className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <MapIcon className="h-5 w-5" />
            Unidades de Medida
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Temperatura
              </label>
              <select
                value={settings.temperatureUnit}
                onChange={(e) => setSettings({ ...settings, temperatureUnit: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Peso
              </label>
              <select
                value={settings.weightUnit}
                onChange={(e) => setSettings({ ...settings, weightUnit: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="lb">Libras (lb)</option>
                <option value="oz">Onzas (oz)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Distancia
              </label>
              <select
                value={settings.distanceUnit}
                onChange={(e) => setSettings({ ...settings, distanceUnit: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="km">Kilómetros (km)</option>
                <option value="m">Metros (m)</option>
                <option value="mi">Millas (mi)</option>
                <option value="ft">Pies (ft)</option>
              </select>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};