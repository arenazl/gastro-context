import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    accent: string;
    background: string;
    surface: string;
    surfaceHover: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    glass: string;
    glassBorder: string;
    gradient: string;
    shadow: string;
  };
}

const themes: Record<string, Theme> = {
  ocean: {
    name: 'ocean',
    displayName: '🌊 Ocean Blue',
    colors: {
      primary: '#0891b2',
      primaryDark: '#0e7490',
      primaryLight: '#06b6d4',
      secondary: '#7c3aed',
      secondaryDark: '#6d28d9',
      accent: '#10b981',
      background: '#f0f9ff',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      glass: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(255, 255, 255, 0.5)',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
  },
  sunset: {
    name: 'sunset',
    displayName: '🌅 Sunset Orange',
    colors: {
      primary: '#ea580c',
      primaryDark: '#c2410c',
      primaryLight: '#fb923c',
      secondary: '#be123c',
      secondaryDark: '#9f1239',
      accent: '#a21caf',
      background: '#fef3c7',
      surface: '#ffffff',
      surfaceHover: '#fffbeb',
      text: '#1c1917',
      textMuted: '#78716c',
      border: '#fde68a',
      success: '#65a30d',
      warning: '#d97706',
      error: '#dc2626',
      info: '#2563eb',
      glass: 'rgba(255, 255, 255, 0.75)',
      glassBorder: 'rgba(251, 146, 60, 0.3)',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      shadow: 'rgba(234, 88, 12, 0.15)',
    },
  },
  forest: {
    name: 'forest',
    displayName: '🌲 Forest Green',
    colors: {
      primary: '#16a34a',
      primaryDark: '#15803d',
      primaryLight: '#22c55e',
      secondary: '#0d9488',
      secondaryDark: '#0f766e',
      accent: '#84cc16',
      background: '#f0fdf4',
      surface: '#ffffff',
      surfaceHover: '#f7fee7',
      text: '#14532d',
      textMuted: '#4b5563',
      border: '#bbf7d0',
      success: '#22c55e',
      warning: '#eab308',
      error: '#f87171',
      info: '#06b6d4',
      glass: 'rgba(255, 255, 255, 0.8)',
      glassBorder: 'rgba(34, 197, 94, 0.3)',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: 'rgba(22, 163, 74, 0.15)',
    },
  },
  midnight: {
    name: 'midnight',
    displayName: '🌙 Midnight Dark',
    colors: {
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      primaryLight: '#818cf8',
      secondary: '#ec4899',
      secondaryDark: '#db2777',
      accent: '#8b5cf6',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      glass: 'rgba(30, 41, 59, 0.8)',
      glassBorder: 'rgba(99, 102, 241, 0.5)',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: 'rgba(0, 0, 0, 0.5)',
    },
  },
  lavender: {
    name: 'lavender',
    displayName: '💜 Lavender Dreams',
    colors: {
      primary: '#9333ea',
      primaryDark: '#7e22ce',
      primaryLight: '#a855f7',
      secondary: '#e11d48',
      secondaryDark: '#be123c',
      accent: '#f43f5e',
      background: '#faf5ff',
      surface: '#f9f5ff',
      surfaceHover: '#f3e8ff',
      text: '#1e1b4b',
      textMuted: '#6b7280',
      border: '#e9d5ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#8b5cf6',
      glass: 'rgba(249, 245, 255, 0.85)',
      glassBorder: 'rgba(147, 51, 234, 0.3)',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadow: 'rgba(147, 51, 234, 0.15)',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>(() => {
    return localStorage.getItem('theme') || 'ocean';
  });

  const theme = themes[themeName] || themes.ocean;

  useEffect(() => {
    localStorage.setItem('theme', themeName);
    
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply theme class to body
    document.body.className = `theme-${themeName}`;
  }, [themeName, theme]);

  const setTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
    }
  };

  const availableThemes = Object.keys(themes);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};