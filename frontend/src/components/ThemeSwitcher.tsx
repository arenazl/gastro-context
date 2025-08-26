import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { SwatchIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const ThemeSwitcher: React.FC = () => {
  const { themeName, setTheme, availableThemes, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeInfo = {
    ocean: { icon: '🌊', description: 'Cool and calming blue tones' },
    sunset: { icon: '🌅', description: 'Warm and vibrant orange hues' },
    forest: { icon: '🌲', description: 'Natural and refreshing greens' },
    midnight: { icon: '🌙', description: 'Dark mode with purple accents' },
    lavender: { icon: '💜', description: 'Soft and elegant purple theme' },
  };

  return (
    <>
      {/* Floating Theme Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl"
        style={{ 
          backgroundColor: theme.colors.primary,
          color: 'white'
        }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <SwatchIcon className="h-6 w-6" />
      </motion.button>

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div 
                className="rounded-2xl shadow-2xl overflow-hidden"
                style={{ 
                  background: theme.colors.glass,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.colors.glassBorder}`
                }}
              >
                {/* Header */}
                <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                      Choose Theme
                    </h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: theme.colors.textMuted }}>
                    Select a color theme that suits your style
                  </p>
                </div>

                {/* Theme Options */}
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {availableThemes.map((themeKey) => {
                    const themeOption = (themes as any)[themeKey];
                    const info = (themeInfo as any)[themeKey];
                    const isSelected = themeName === themeKey;

                    return (
                      <motion.button
                        key={themeKey}
                        onClick={() => {
                          setTheme(themeKey);
                          setTimeout(() => setIsOpen(false), 200);
                        }}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: isSelected ? themeOption.colors.primary + '20' : theme.colors.surface,
                          border: `2px solid ${isSelected ? themeOption.colors.primary : 'transparent'}`,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Color Preview */}
                          <div className="flex gap-1 mt-1">
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: themeOption.colors.primary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: themeOption.colors.secondary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: themeOption.colors.accent }}
                            />
                          </div>

                          {/* Theme Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{info.icon}</span>
                              <h3 
                                className="font-semibold"
                                style={{ color: isSelected ? themeOption.colors.primary : theme.colors.text }}
                              >
                                {themeOption.displayName}
                              </h3>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-auto px-2 py-1 text-xs rounded-full text-white"
                                  style={{ backgroundColor: themeOption.colors.primary }}
                                >
                                  Active
                                </motion.span>
                              )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Add themes type for TypeScript
const themes = {
  ocean: {
    colors: {
      primary: '#0891b2',
      secondary: '#7c3aed',
      accent: '#10b981',
    },
  },
  sunset: {
    colors: {
      primary: '#ea580c',
      secondary: '#be123c',
      accent: '#a21caf',
    },
  },
  forest: {
    colors: {
      primary: '#16a34a',
      secondary: '#0d9488',
      accent: '#84cc16',
    },
  },
  midnight: {
    colors: {
      primary: '#6366f1',
      secondary: '#ec4899',
      accent: '#8b5cf6',
    },
  },
  lavender: {
    colors: {
      primary: '#9333ea',
      secondary: '#e11d48',
      accent: '#f43f5e',
    },
  },
};