import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LocalizationSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  currencySymbol: string;
}

interface LocalizationContextType {
  settings: LocalizationSettings;
  updateSettings: (newSettings: Partial<LocalizationSettings>) => void;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatCurrency: (amount: number) => string;
}

const defaultSettings: LocalizationSettings = {
  language: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'ARS',
  currencySymbol: '$'
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState<LocalizationSettings>(defaultSettings);

  useEffect(() => {
    // Cargar configuraciones guardadas
    const savedSettings = localStorage.getItem('localizationSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({ ...defaultSettings, ...parsed });
      
      // Aplicar idioma guardado
      if (parsed.language && i18n.language !== parsed.language) {
        i18n.changeLanguage(parsed.language);
      }
    }
  }, [i18n]);

  const updateSettings = (newSettings: Partial<LocalizationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('localizationSettings', JSON.stringify(updatedSettings));

    // Cambiar idioma si es necesario
    if (newSettings.language && newSettings.language !== i18n.language) {
      i18n.changeLanguage(newSettings.language);
    }
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: settings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    const locale = settings.language === 'en' ? 'en-US' : 
                  settings.language === 'pt' ? 'pt-BR' : 'es-AR';

    const formatter = new Intl.DateTimeFormat(locale, options);
    const formatted = formatter.format(dateObj);

    // Aplicar formato personalizado
    if (settings.dateFormat === 'MM/DD/YYYY' && settings.language !== 'en') {
      return formatted.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3');
    } else if (settings.dateFormat === 'YYYY-MM-DD') {
      return formatted.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
    }

    return formatted;
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: settings.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12h'
    };

    const locale = settings.language === 'en' ? 'en-US' : 
                  settings.language === 'pt' ? 'pt-BR' : 'es-AR';

    const formatter = new Intl.DateTimeFormat(locale, options);
    return formatter.format(dateObj);
  };

  const formatDateTime = (date: Date | string): string => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  const formatCurrency = (amount: number): string => {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    const locale = settings.language === 'en' ? 'en-US' : 
                  settings.language === 'pt' ? 'pt-BR' : 'es-AR';

    try {
      return new Intl.NumberFormat(locale, options).format(amount);
    } catch {
      // Fallback si la moneda no es válida
      return `${settings.currencySymbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <LocalizationContext.Provider value={{
      settings,
      updateSettings,
      formatDate,
      formatTime,
      formatDateTime,
      formatCurrency
    }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};