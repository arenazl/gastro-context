// Utility to ensure Spanish is set as default language
export const ensureSpanishDefault = () => {
  const currentLang = localStorage.getItem('i18nextLng');
  if (!currentLang || currentLang !== 'es') {
    localStorage.setItem('i18nextLng', 'es');
    window.location.reload();
  }
};