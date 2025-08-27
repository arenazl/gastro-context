// Diagnóstico de capacidades del browser
export const checkBrowserCapabilities = () => {
  console.log('🔍 === DIAGNÓSTICO DE BROWSER ===');
  
  // 1. Información básica
  console.log(`🌐 User Agent: ${navigator.userAgent}`);
  console.log(`🔒 Protocol: ${window.location.protocol}`);
  console.log(`🏠 Host: ${window.location.host}`);
  console.log(`📍 Origin: ${window.location.origin}`);
  
  // 2. Verificar APIs disponibles
  const capabilities = {
    caches: typeof caches !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    localStorage: typeof localStorage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    webWorkers: typeof Worker !== 'undefined'
  };
  
  console.log('🔧 APIs Disponibles:');
  Object.entries(capabilities).forEach(([api, available]) => {
    console.log(`   ${available ? '✅' : '❌'} ${api}: ${available}`);
  });
  
  // 3. Contexto de seguridad
  const isSecureContext = window.isSecureContext;
  console.log(`🔐 Secure Context: ${isSecureContext ? '✅' : '❌'} ${isSecureContext}`);
  
  // 4. Recomendaciones
  if (!capabilities.caches) {
    console.log('📋 === SOLUCIONES PARA CACHE API ===');
    if (!isSecureContext) {
      console.log('🔑 CAUSA: Contexto no seguro');
      console.log('✅ SOLUCIÓN 1: Usar https://localhost:5173 en lugar de http://');
      console.log('✅ SOLUCIÓN 2: Usar http://localhost:5173 (localhost es excepción)');
      console.log('✅ SOLUCIÓN 3: Implementar fallback con IndexedDB o localStorage');
    }
    
    if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
      console.log('🌐 CAUSA: IP externa sin HTTPS');
      console.log('✅ SOLUCIÓN: Cambiar a localhost:5173 para desarrollo');
    }
  }
  
  return capabilities;
};

// Alternativas de almacenamiento
export const getAvailableStorageOptions = () => {
  const options = [];
  
  if (typeof caches !== 'undefined') {
    options.push({ name: 'Cache API', priority: 1, description: 'Ideal para imágenes' });
  }
  
  if ('indexedDB' in window) {
    options.push({ name: 'IndexedDB', priority: 2, description: 'Base de datos local' });
  }
  
  if (typeof localStorage !== 'undefined') {
    options.push({ name: 'localStorage', priority: 3, description: 'Almacenamiento básico (limitado)' });
  }
  
  console.log('💾 === OPCIONES DE ALMACENAMIENTO DISPONIBLES ===');
  options.forEach(option => {
    console.log(`${option.priority}. ${option.name}: ${option.description}`);
  });
  
  return options;
};