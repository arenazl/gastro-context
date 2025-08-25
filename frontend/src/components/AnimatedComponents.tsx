import React, { type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', delay = 0, style }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
      className={`rounded-2xl p-6 mt-4 ${className}`}
      style={{
        background: theme.colors.glass,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.colors.glassBorder}`,
        boxShadow: `0 8px 32px ${theme.colors.shadow}`,
        ...style, // Merge the passed style prop
      }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  whileHover?: any;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  delay = 0,
  whileHover = { scale: 1.02, y: -5 }
}) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={whileHover}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        backgroundColor: theme.colors.surface,
        boxShadow: `0 4px 20px ${theme.colors.shadow}`,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative'
      }}
    >
      {children}
    </motion.div>
  );
};

interface FloatingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}) => {
  const { theme } = useTheme();

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  const colors = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    success: theme.colors.success,
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${sizes[size]} rounded-lg font-medium text-white shadow-lg flex items-center justify-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: colors[variant],
        boxShadow: `0 10px 30px ${colors[variant]}40`,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 15px 40px ${colors[variant]}50`,
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.button>
  );
};

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
};

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({ children, className = '' }) => {
  const { theme } = useTheme();

  return (
    <motion.span
      className={`font-bold ${className}`}
      style={{
        background: theme.colors.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.span>
  );
};

interface PulseIconProps {
  children: React.ReactNode;
  className?: string;
}

export const PulseIcon: React.FC<PulseIconProps> = ({ children, className = '' }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: theme.colors.primary,
          opacity: 0.3,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      {children}
    </motion.div>
  );
};
