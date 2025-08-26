import React from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion } from 'framer-motion';

import { Wand2, Sparkles } from 'lucide-react';

interface AISuggestButtonProps {
  onSuggest: () => void;
  label?: string;
  variant?: 'default' | 'icon-only' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AISuggestButton: React.FC<AISuggestButtonProps> = ({
  onSuggest,
  label = 'Sugerir',
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const baseClasses = `
    bg-gradient-to-r from-purple-500 to-pink-500 
    text-white rounded-lg 
    hover:from-purple-600 hover:to-pink-600 
    flex items-center gap-2 
    font-medium shadow-sm
    transition-all duration-200
    ${sizeClasses[size]}
    ${className}
  `;

  return (
    <motion.button
      onClick={onSuggest}
      className={baseClasses}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Wand2 className={iconSize[size]} />
      </motion.div>
      
      {variant !== 'icon-only' && (
        <>
          <span className={variant === 'default' ? 'hidden sm:inline' : ''}>
            {label}
          </span>
          <Sparkles className={`${iconSize[size]} opacity-70`} />
        </>
      )}
    </motion.button>
  );
};

// Hook personalizado para manejar sugerencias
// Función desactivada temporalmente
export const useAISuggestions = () => {
  const categorySuggestions = [
    'Especialidades de la Casa',
    'Menú Degustación',
    'Cocina Internacional',
    'Opciones Saludables',
    'Platos de Temporada',
    'Menú Ejecutivo',
    'Comida Rápida Gourmet',
    'Tapas y Compartir',
    'Mariscos y Pescados',
    'Carnes Premium',
    'Cocina Vegana',
    'Menú Infantil',
    'Desayunos y Brunch',
    'Bowls Saludables',
    'Street Food'
  ];
  
  const subcategorySuggestions: { [key: string]: string[] } = {
    'default': ['Clásicos', 'Novedades', 'Recomendados del Chef', 'Edición Limitada'],
    'entrada': ['Entradas Frías', 'Entradas Calientes', 'Sopas del Día', 'Ensaladas Gourmet'],
    'principal': ['Carnes Rojas', 'Aves', 'Pescados', 'Vegetarianos'],
    'postre': ['Postres Fríos', 'Postres Calientes', 'Helados Artesanales', 'Dulces de la Casa'],
    'bebida': ['Bebidas Frías', 'Bebidas Calientes', 'Cócteles', 'Jugos Naturales'],
    'desayuno': ['Tostadas Especiales', 'Bowls de Frutas', 'Huevos Preparados', 'Pancakes y Waffles'],
    'carne': ['Cortes Premium', 'Parrilla', 'Estofados', 'Carnes Blancas'],
    'pescado': ['Pescados del Día', 'Mariscos Frescos', 'Ceviches', 'Sushi y Sashimi']
  };

  const productSuggestions: { [key: string]: string[] } = {
    'default': ['Especial del Chef', 'Plato Signature', 'Recomendado', 'Favorito de la Casa'],
    'entrada': ['Carpaccio de Res', 'Tartar de Atún', 'Croquetas de Jamón', 'Bruschetta Mixta'],
    'principal': ['Lomo Saltado', 'Risotto de Hongos', 'Salmón Grillado', 'Pollo al Curry'],
    'postre': ['Tiramisú', 'Cheesecake', 'Brownie con Helado', 'Crème Brûlée'],
    'bebida': ['Limonada de Hierba Buena', 'Smoothie de Frutos Rojos', 'Café Especialidad', 'Mojito Clásico']
  };

  const getSuggestion = (type: 'category' | 'subcategory' | 'product', context?: string): string => {
    if (type === 'category') {
      return categorySuggestions[Math.floor(Math.random() * categorySuggestions.length)];
    } else if (type === 'subcategory') {
      const contextKey = context?.toLowerCase() || 'default';
      const suggestions = subcategorySuggestions[contextKey] || subcategorySuggestions['default'];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    } else {
      const contextKey = context?.toLowerCase() || 'default';
      const suggestions = productSuggestions[contextKey] || productSuggestions['default'];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
  };

  return { getSuggestion };
};