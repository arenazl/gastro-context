import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/animations.css'
import './i18n/config'
import App from './App.tsx'
import { ensureSpanishDefault } from './utils/clearLanguageCache'

// Ensure Spanish is set as default language
ensureSpanishDefault();

createRoot(document.getElementById('root')!).render(
  <App />
)
