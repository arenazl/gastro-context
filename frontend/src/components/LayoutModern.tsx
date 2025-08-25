import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TopBar } from './TopBar';
import {
  HomeIcon,
  TableCellsIcon,
  ShoppingCartIcon,
  FireIcon,
  CreditCardIcon,
  CubeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

export const LayoutModern = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Tables', href: '/tables', icon: TableCellsIcon },
    { name: 'New Order', href: '/orders/new', icon: ShoppingCartIcon },
    { name: 'Kitchen', href: '/kitchen', icon: FireIcon },
    { name: 'POS', href: '/pos', icon: CreditCardIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
  ];


  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* TopBar */}
      <TopBar restaurantName="Gastro Premium" />
      
      {/* Mobile menu button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-16 left-6 z-40 p-2 rounded-lg"
        style={{ 
          backgroundColor: theme.colors.primary,
          color: 'white'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <>
            {/* Mobile backdrop */}
            {sidebarOpen && window.innerWidth < 1024 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
            )}

            {/* Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed z-30 w-72 lg:translate-x-0"
              style={{
                left: '40px',
                top: '56px',
                bottom: 0,
                background: theme.colors.glass,
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${theme.colors.glassBorder}`,
                marginLeft: '20px'
              }}
            >
              <div className="flex h-full flex-col">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-4 border-b"
                  style={{ borderColor: theme.colors.border }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.colors.textMuted }}>
                    Navegación
                  </p>
                </motion.div>

                {/* Navigation */}
                <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
                  {navigation.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <motion.div
                            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                            style={{
                              backgroundColor: active ? theme.colors.primary + '20' : 'transparent',
                              color: active ? theme.colors.primary : theme.colors.text,
                              borderLeft: active ? `3px solid ${theme.colors.primary}` : '3px solid transparent'
                            }}
                            whileHover={{ 
                              scale: 1.02,
                              backgroundColor: active ? theme.colors.primary + '30' : theme.colors.surface
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium">{item.name}</span>
                            {active && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="ml-auto w-1 h-4 rounded-full"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                            )}
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>


                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="px-6 py-4 border-t"
                  style={{ borderColor: theme.colors.border }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>Active Orders</p>
                      <p className="text-xl font-bold" style={{ color: theme.colors.success }}>12</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>Today's Sales</p>
                      <p className="text-xl font-bold" style={{ color: theme.colors.primary }}>$3,456</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        className="lg:pl-0"
        style={{ 
          paddingLeft: window.innerWidth >= 1024 ? 'calc(288px + 80px)' : '0px',
          paddingTop: '56px'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Page header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border
          }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                {navigation.find(n => n.href === location.pathname)?.name || 'Restaurant'}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Quick stats */}
              <motion.div
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: theme.colors.success + '20' }}
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>Tables Available</p>
                <p className="text-lg font-bold" style={{ color: theme.colors.success }}>8/12</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        {/* Page content with animation */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </motion.div>
    </div>
  );
};