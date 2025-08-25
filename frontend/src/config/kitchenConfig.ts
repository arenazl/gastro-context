import {
  BellAlertIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Configuración centralizada de estados y colores
export const statusConfig = {
  pending: {
    title: 'Pendientes',
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    headerBg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-600',
    icon: BellAlertIcon,
    textColor: 'text-amber-700',
    // Tiempo objetivo en minutos para pasar al siguiente estado
    targetTime: 5,
    nextStatus: 'preparing' as const
  },
  preparing: {
    title: 'Preparando',
    gradient: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerBg: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-600',
    icon: FireIcon,
    textColor: 'text-blue-700',
    targetTime: 15,
    nextStatus: 'ready' as const
  },
  ready: {
    title: 'Listos',
    gradient: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerBg: 'bg-gradient-to-r from-green-400 to-emerald-500',
    buttonBg: 'bg-green-500',
    buttonHover: 'hover:bg-green-600',
    icon: CheckCircleIcon,
    textColor: 'text-green-700',
    targetTime: 5,
    nextStatus: null
  }
} as const;

// Función para obtener el color del tiempo basado en el estado actual y tiempo transcurrido
export const getTimeUrgency = (status: string, elapsedMinutes: number): string => {
  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return 'text-gray-600 bg-gray-100';
  
  const targetTime = config.targetTime;
  
  if (elapsedMinutes < targetTime * 0.5) {
    // Menos del 50% del tiempo objetivo - Verde
    return 'text-green-600 bg-green-100';
  } else if (elapsedMinutes < targetTime) {
    // Entre 50% y 100% del tiempo objetivo - Amarillo
    return 'text-yellow-600 bg-yellow-100';
  } else if (elapsedMinutes < targetTime * 1.5) {
    // Entre 100% y 150% del tiempo objetivo - Naranja
    return 'text-orange-600 bg-orange-100';
  } else {
    // Más del 150% del tiempo objetivo - Rojo
    return 'text-red-600 bg-red-100 animate-pulse';
  }
};

// Función para calcular minutos restantes para el cambio de estado
export const getMinutesRemaining = (status: string, elapsedMinutes: number): number => {
  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return 0;
  return Math.max(0, config.targetTime - elapsedMinutes);
};

// Imágenes de productos reales
export const productImages: Record<string, string> = {
  'Hamburguesa Clásica': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
  'Pizza Margherita': 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=100&h=100&fit=crop',
  'Pizza Pepperoni': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=100&h=100&fit=crop',
  'Ensalada César': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&h=100&fit=crop',
  'Pasta Carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=100&h=100&fit=crop',
  'Milanesa Napolitana': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=100&h=100&fit=crop',
  'Bife de Chorizo': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&h=100&fit=crop',
  'Salmón Grillado': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100&h=100&fit=crop',
  'Risotto de Hongos': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=100&h=100&fit=crop',
  'Papas Fritas': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=100&h=100&fit=crop',
  'Puré de Papas': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=100&h=100&fit=crop',
  'Coca Cola': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=100&h=100&fit=crop',
  'Agua Mineral': 'https://images.unsplash.com/photo-1560023907-5f339617ea55?w=100&h=100&fit=crop',
  'Cerveza': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=100&h=100&fit=crop',
  'Vino Tinto': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=100&h=100&fit=crop',
  'Tiramisú': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=100&h=100&fit=crop',
  'Helado': 'https://images.unsplash.com/photo-1633933358116-a27b902fad35?w=100&h=100&fit=crop',
  'Flan': 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=100&h=100&fit=crop',
  'Brownie': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=100&h=100&fit=crop'
};