// Utility to ensure Spanish is set as default language
export const ensureSpanishDefault = () => {
  const currentLang = localStorage.getItem('i18nextLng');
  const localizationSettings = localStorage.getItem('localizationSettings');
  
  // Solo establecer español si no hay ningún idioma configurado
  if (!currentLang && !localizationSettings) {
    localStorage.setItem('i18nextLng', 'es');
    localStorage.setItem('localizationSettings', JSON.stringify({
      language: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'ARS',
      currencySymbol: '$'
    }));
  }
};