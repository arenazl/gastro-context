import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { GlassPanel, FloatingButton, GradientText } from '../components/AnimatedComponents';
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export const LoginModern: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Usar el método login del contexto directamente
      await login(email, password);
      setSuccess(true);
      
      // Navegar inmediatamente después del login exitoso
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Credenciales inválidas. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { role: 'Admin', email: 'admin@restaurant.com', password: 'admin123' },
    { role: 'Waiter', email: 'waiter@restaurant.com', password: 'waiter123' },
    { role: 'Kitchen', email: 'kitchen@restaurant.com', password: 'kitchen123' }
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: theme.colors.background,
        backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}10 0%, ${theme.colors.secondary}10 100%)`
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              backgroundColor: theme.colors.primary,
              width: `${Math.random() * 400 + 100}px`,
              height: `${Math.random() * 400 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <GlassPanel>
          {/* Logo and Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-4"
              style={{ backgroundColor: theme.colors.primary + '20' }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="h-10 w-10" style={{ color: theme.colors.primary }} />
            </motion.div>
            <GradientText className="text-3xl mb-2">Bienvenido</GradientText>
            <p style={{ color: theme.colors.textMuted }}>
              Accede al Sistema de Gestión Gastronómica
            </p>
          </motion.div>

          {/* Success Animation */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: theme.colors.success + '20' }}
              >
                <CheckCircleIcon className="h-5 w-5" style={{ color: theme.colors.success }} />
                <span style={{ color: theme.colors.success }}>¡Acceso exitoso! Redirigiendo...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: theme.colors.error + '20' }}
              >
                <ExclamationCircleIcon className="h-5 w-5" style={{ color: theme.colors.error }} />
                <span style={{ color: theme.colors.error }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Correo Electrónico
              </label>
              <div className="relative">
                <UserIcon 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: theme.colors.textMuted }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Contraseña
              </label>
              <div className="relative">
                <LockClosedIcon 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                  style={{ color: theme.colors.textMuted }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  placeholder="Enter your password"
                  required
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  ) : (
                    <EyeIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  )}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <FloatingButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="h-5 w-5 border-2 rounded-full mr-2"
                      style={{
                        borderColor: 'rgba(255,255,255,0.3)',
                        borderTopColor: 'white'
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <ArrowRightIcon className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </FloatingButton>
            </motion.div>
          </form>

          {/* Quick Login Options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t"
            style={{ borderColor: theme.colors.border }}
          >
            <p className="text-sm text-center mb-4" style={{ color: theme.colors.textMuted }}>
              Quick login for demo
            </p>
            <div className="grid grid-cols-3 gap-2">
              {quickLogins.map((quick, index) => (
                <motion.button
                  key={quick.role}
                  type="button"
                  onClick={() => {
                    setEmail(quick.email);
                    setPassword(quick.password);
                  }}
                  className="p-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: theme.colors.primary + '10',
                    color: theme.colors.primary,
                    border: `1px solid ${theme.colors.primary}30`
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: theme.colors.primary + '20'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {quick.role}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Restaurant Management System v2.0
            </p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
              © 2024 All rights reserved
            </p>
          </motion.div>
        </GlassPanel>
      </motion.div>
    </div>
  );
};