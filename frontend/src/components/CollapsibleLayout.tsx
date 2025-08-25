import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { TopBar } from './TopBar';
import {
  HomeIcon,
  CubeIcon,
  TableCellsIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  FireIcon as ChefHatIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOffice2Icon,
  CogIcon,
  UserGroupIcon,
  ChartPieIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  translationKey: string;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, color: '#4ECDC4', translationKey: 'menu.dashboard' },
  { name: 'Mesas', path: '/tables', icon: TableCellsIcon, color: '#FF6B6B', translationKey: 'menu.tables' },
  { name: 'Nueva Orden', path: '/orders/new', icon: ShoppingCartIcon, color: '#FFD93D', translationKey: 'menu.newOrder' },
  { name: 'POS', path: '/pos', icon: CreditCardIcon, color: '#6BCF7F', translationKey: 'menu.pos' },
  { name: 'Cocina', path: '/kitchen', icon: ChefHatIcon, color: '#FF8C42', translationKey: 'menu.kitchen' },
  { name: 'Cocina Drag', path: '/kitchen-drag', icon: ChefHatIcon, color: '#10B981', translationKey: 'menu.kitchenDrag' },
  { name: 'Productos', path: '/products', icon: CubeIcon, color: '#A8E6CF', translationKey: 'menu.products' },
  { name: 'Clientes', path: '/customers', icon: UserGroupIcon, color: '#9333EA', translationKey: 'menu.customers' },
  { name: 'Menú QR', path: '/qr-manager', icon: QrCodeIcon, color: '#EC4899', translationKey: 'menu.qrMenu' },
  { name: 'Analytics IA', path: '/analytics', icon: ChartPieIcon, color: '#3B82F6', translationKey: 'menu.analytics' },
  // { name: 'Reportes', path: '/reports', icon: ChartBarIcon, color: '#C7A8FF', translationKey: 'menu.reports' },
  { name: 'Empresas', path: '/companies', icon: BuildingOffice2Icon, color: '#8B5CF6', translationKey: 'menu.companies' },
  { name: 'Configuración', path: '/settings', icon: CogIcon, color: '#6B7280', translationKey: 'menu.settings' },
];

export const CollapsibleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Toggles the collapsed state of the sidebar.
   */
  /*******  db2aa75a-f7c2-4244-8d8c-0a2c6ff26390  *******/
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
      {/* TopBar - Fijo en la parte superior */}
      <TopBar restaurantName="Gastro Premium" />

      {/* Container con sidebar y content */}
      <div className="flex h-full" style={{ paddingTop: '56px' }}>
        {/* Sidebar Desktop */}
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? '80px' : '240px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:flex flex-col shadow-2xl relative"
          style={{
            backgroundColor: theme.colors.glass,
            backdropFilter: 'blur(20px)',
            borderRight: `1px solid ${theme.colors.glassBorder}`,
            height: 'calc(100vh - 56px)',
            marginTop: '20px',
            marginBottom: '20px'
          }}
        >
          {/* Toggle Button */}
          <motion.button
            onClick={toggleCollapse}
            className="absolute -right-2 top-8 z-10 w-4 h-12 rounded-r-lg shadow-md flex items-center justify-center"
            style={{
              backgroundColor: theme.colors.surface,
              borderTop: `1px solid ${theme.colors.border}`,
              borderRight: `1px solid ${theme.colors.border}`,
              borderBottom: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted
            }}
            whileHover={{
              backgroundColor: theme.colors.primary + '20',
              color: theme.colors.primary
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-3 w-3" />
            ) : (
              <ChevronLeftIcon className="h-3 w-3" />
            )}
          </motion.button>

          {/* Navigation */}
          <nav className="flex-1 pt-4">
            <ul className={`${isCollapsed ? 'px-2' : 'px-4'} space-y-2`}>
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-3 py-3 rounded-lg transition-all group relative`}
                      style={{
                        backgroundColor: isActive ? item.color + '20' : 'transparent',
                        color: isActive ? item.color : theme.colors.textMuted
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ color: isActive ? item.color : theme.colors.textMuted }}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>

                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-3 font-medium whitespace-nowrap overflow-hidden"
                          >
                            {t(item.translationKey)}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          className="absolute left-full ml-2 px-2 py-1 rounded-lg text-sm whitespace-nowrap pointer-events-none z-50"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        >
                          {item.name}
                        </motion.div>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-8 rounded-r-lg"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>
        </motion.aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black lg:hidden z-40"
                onClick={() => setIsSidebarOpen(false)}
                style={{ top: '48px' }}
              />
              <motion.aside
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed w-60 flex flex-col shadow-2xl lg:hidden z-50"
                style={{
                  left: '30px',
                  top: '68px',
                  bottom: '20px',
                  backgroundColor: theme.colors.glass,
                  backdropFilter: 'blur(20px)',
                  marginLeft: '10px'
                }}
              >
                <nav className="flex-1 overflow-y-auto px-4 pt-4">
                  <ul className="space-y-2">
                    {menuItems.map((item, index) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;

                      return (
                        <motion.li
                          key={item.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center px-3 py-3 rounded-lg transition-all"
                            style={{
                              backgroundColor: isActive ? item.color + '20' : 'transparent',
                              color: isActive ? item.color : theme.colors.textMuted
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="ml-3 font-medium">{t(item.translationKey)}</span>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden fixed top-14 z-30 p-2 rounded-lg shadow-md"
            style={{
              left: '24px',
              backgroundColor: theme.colors.primary,
              color: 'white'
            }}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Page Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};