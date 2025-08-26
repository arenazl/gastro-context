import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  BellIcon,
  HomeIcon,
  TableCellsIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  FireIcon,
  CubeIcon,
  ChartBarIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

interface TopBarProps {
  restaurantName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ restaurantName = 'Gastro Restaurant' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { settings, formatTime } = useLocalization();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3); // Ejemplo de notificaciones
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mapeo de rutas a nombres de páginas e iconos
  const getPageInfo = () => {
    const path = location.pathname;
    switch(path) {
      case '/dashboard': return { name: t('menu.dashboard'), icon: HomeIcon, color: '#4ECDC4' };
      case '/tables': return { name: t('menu.tables'), icon: TableCellsIcon, color: '#FF6B6B' };
      case '/orders/new': return { name: t('menu.newOrder'), icon: ShoppingCartIcon, color: '#FFD93D' };
      case '/kitchen': return { name: t('menu.kitchen'), icon: FireIcon, color: '#FF8C42' };
      case '/pos': return { name: t('menu.pos'), icon: CreditCardIcon, color: '#6BCF7F' };
      case '/products': return { name: t('menu.products'), icon: CubeIcon, color: '#A8E6CF' };
      case '/reports': return { name: t('menu.reports'), icon: ChartBarIcon, color: '#C7A8FF' };
      case '/companies': return { name: t('menu.companies'), icon: BuildingOffice2Icon, color: '#8B5CF6' };
      case '/settings': return { name: t('menu.settings'), icon: Cog6ToothIcon, color: '#6B7280' };
      case '/unified-settings': return { name: 'Configuración ABM', icon: Cog6ToothIcon, color: '#3B82F6' };
      default: return { name: t('menu.dashboard'), icon: HomeIcon, color: '#4ECDC4' };
    }
  };

  const pageInfo = getPageInfo();

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  const handleProfile = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-md border-b"
      style={{
        backgroundColor: theme.colors.glass + '95',
        borderColor: theme.colors.glassBorder + '40',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Sección Izquierda - Empresa/Restaurante */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <BuildingStorefrontIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                {restaurantName}
              </span>
              <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                Sistema Gastronómico
              </span>
            </div>
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-medium ml-2"
              style={{
                backgroundColor: theme.colors.success + '20',
                color: theme.colors.success
              }}
            >
              Online
            </span>
          </motion.div>
        </div>

        {/* Sección Central - Página Actual */}
        <div className="flex-1 flex justify-center">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className="flex items-center gap-2"
          >
            <motion.div 
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl shadow-sm"
              style={{ 
                backgroundColor: pageInfo.color + '15',
                border: `1px solid ${pageInfo.color}30`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1
                }}
              >
                <pageInfo.icon 
                  className="h-4 w-4" 
                  style={{ color: pageInfo.color }}
                />
              </motion.div>
              <motion.span 
                className="text-sm font-semibold"
                style={{ color: pageInfo.color }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {pageInfo.name}
              </motion.span>
            </motion.div>
          </motion.div>
        </div>

        {/* Sección Derecha - Usuario y Configuración */}
        <div className="flex items-center gap-3">
          {/* Notificaciones */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: theme.colors.textMuted
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <BellIcon className="h-5 w-5" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: theme.colors.error, display: 'none' }}
              >
                {notifications}
              </motion.span>
            )}
          </motion.button>

          {/* Configuración */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSettings}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: theme.colors.textMuted
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </motion.button>

          {/* Reloj y Zona Horaria */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-end ml-2"
          >
            <span 
              className="text-sm font-bold leading-tight"
              style={{ color: theme.colors.primary }}
            >
              {formatTime(currentTime)}
            </span>
            <span 
              className="text-xs leading-tight"
              style={{ color: theme.colors.textMuted }}
            >
              {settings.timezone.split('/').pop()?.replace('_', ' ')}
            </span>
          </motion.div>

          {/* Separador */}
          <div 
            className="h-8 w-px"
            style={{ backgroundColor: theme.colors.border }}
          />

          {/* Dropdown de Usuario */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: showUserMenu ? theme.colors.surface : 'transparent',
                color: theme.colors.text
              }}
              onMouseEnter={(e) => {
                if (!showUserMenu) {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                }
              }}
              onMouseLeave={(e) => {
                if (!showUserMenu) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <UserCircleIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium hidden sm:block">
                  {user?.first_name || 'Usuario'} {user?.last_name || ''}
                </span>
                <span className="text-xs hidden sm:block" style={{ color: theme.colors.textMuted }}>
                  {user?.role || 'Admin'}
                </span>
              </div>
              <ChevronDownIcon 
                className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                style={{ color: theme.colors.textMuted }}
              />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`
                  }}
                >
                  {/* Header del menu */}
                  <div 
                    className="px-4 py-3 border-b"
                    style={{ 
                      backgroundColor: theme.colors.glass,
                      borderColor: theme.colors.border 
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                      {user?.email || 'usuario@restaurant.com'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                      ID: {user?.id || '1'} • {user?.role || 'Administrador'}
                    </p>
                  </div>

                  {/* Opciones del menu */}
                  <div className="py-2">
                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={handleProfile}
                      className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 transition-colors"
                      style={{ color: theme.colors.text }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.glass;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      Mi Perfil
                    </motion.button>

                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={handleSettings}
                      className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 transition-colors"
                      style={{ color: theme.colors.text }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.glass;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Configuración
                    </motion.button>

                    <div 
                      className="my-2 mx-4 border-t"
                      style={{ borderColor: theme.colors.border }}
                    />

                    <motion.button
                      whileHover={{ x: 5 }}
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 transition-colors"
                      style={{ color: theme.colors.error }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.error + '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Cerrar Sesión
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};