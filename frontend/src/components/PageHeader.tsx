import React from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: Action[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions = [] }) => {
  const { theme } = useTheme();

  const getButtonStyle = (variant: string = 'secondary') => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          color: 'white',
          hoverBg: theme.colors.primary + 'DD'
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error + '20',
          color: theme.colors.error,
          hoverBg: theme.colors.error + '30'
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          hoverBg: theme.colors.surface + 'DD'
        };
    }
  };

  return (
    <div 
      className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-3 backdrop-blur-sm border-b"
      style={{
        backgroundColor: theme.colors.background + 'F0',
        borderColor: theme.colors.glassBorder + '30'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Title */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side - Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              const style = getButtonStyle(action.variant);
              
              return (
                <motion.button
                  key={index}
                  onClick={action.onClick}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: style.backgroundColor,
                    color: style.color
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: style.hoverBg
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {action.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};