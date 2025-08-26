import React from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { 
  faUtensils, 
  faBowlFood, 
  faLeaf, 
  faDrumstickBite, 
  faFish, 
  faWheatAwn, 
  faPizzaSlice, 
  faSeedling, 
  faCakeCandles, 
  faGlassWater, 
  faWineGlass,
  faSnowflake,
  faFire,
  faGlobe,
  faBowlRice,
  faCircle,
  faIceCream,
  faStar,
  faMugHot,
  faGlasses,
  faShrimp,
  faCow,
  faCookie,
  faEgg
} from '@fortawesome/free-solid-svg-icons';

// Mapeo de nombres de íconos a objetos de Font Awesome
const iconMap = {
  'utensils': faUtensils,
  'bowl-food': faBowlFood,
  'leaf': faLeaf,
  'drumstick-bite': faDrumstickBite,
  'fish': faFish,
  'wheat-awn': faWheatAwn,
  'pizza-slice': faPizzaSlice,
  'seedling': faSeedling,
  'cake-candles': faCakeCandles,
  'glass-water': faGlassWater,
  'wine-glass': faWineGlass,
  'snowflake': faSnowflake,
  'fire': faFire,
  'globe': faGlobe,
  'bowl-hot': faBowlFood, // Usando bowl-food como alternativa
  'bowl-rice': faBowlRice,
  'circle': faCircle,
  'ice-cream': faIceCream,
  'star': faStar,
  'mug-hot': faMugHot,
  'glass': faGlasses, // Usando glasses como alternativa
  'shrimp': faShrimp,
  'cow': faCow,
  'chicken': faEgg, // Usando egg como alternativa
  'cookie': faCookie
};

interface CategoryIconProps {
  icon: string;
  className?: string;
  size?: 'xs' | 'sm' | 'lg' | '1x' | '2x' | '3x';
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  icon, 
  className = '', 
  size = '1x' 
}) => {
  const iconObject = iconMap[icon as keyof typeof iconMap];
  
  if (!iconObject) {
    // Fallback a ícono genérico si no se encuentra
    return <FontAwesomeIcon icon={faUtensils} className={className} size={size} />;
  }
  
  return <FontAwesomeIcon icon={iconObject} className={className} size={size} />;
};