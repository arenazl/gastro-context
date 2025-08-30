import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Utensils,
  Coffee,
  Wine,
  ChefHat,
  Eye,
  Layers,
  Grid,
  Map,
  Maximize2,
  TreePine,
  Flame,
  Lamp,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location?: string;
  x: number;
  y: number;
  orderTime?: string;
  orderTotal?: number;
}

interface FloorPlan {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  layout: {
    tables: { x: number; y: number; shape: string; size: string }[];
    features: { type: string; x: number; y: number }[];
  };
}

export const Tables3D: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('main');
  const [viewMode, setViewMode] = useState<'isometric' | 'top' | 'grid'>('isometric');
  const [loading, setLoading] = useState(false);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedShape, setSelectedShape] = useState<'square' | 'circle' | 'rectangle'>('square');
  const [selectedCapacity, setSelectedCapacity] = useState<number>(4);
  const [showAreaSelector, setShowAreaSelector] = useState(false);

  // Planos predefinidos
  const floorPlans: FloorPlan[] = [
    {
      id: 'main',
      name: 'Salón Principal',
      description: 'Vista isométrica del comedor principal',
      thumbnail: '🏛️',
      layout: {
        tables: [
          { x: 20, y: 20, shape: 'square', size: 'medium' },
          { x: 40, y: 20, shape: 'round', size: 'large' },
          { x: 60, y: 20, shape: 'square', size: 'medium' },
          { x: 20, y: 40, shape: 'round', size: 'small' },
          { x: 40, y: 40, shape: 'rectangle', size: 'large' },
          { x: 60, y: 40, shape: 'round', size: 'small' },
          { x: 20, y: 60, shape: 'square', size: 'medium' },
          { x: 40, y: 60, shape: 'round', size: 'medium' },
          { x: 60, y: 60, shape: 'square', size: 'large' },
        ],
        features: [
          { type: 'entrance', x: 10, y: 50 },
          { type: 'cashier', x: 20, y: 10 },
          { type: 'bar', x: 80, y: 20 },
          { type: 'kitchen', x: 80, y: 60 },
          { type: 'restroom', x: 10, y: 80 },
          { type: 'plant', x: 15, y: 30 },
          { type: 'plant', x: 50, y: 10 },
          { type: 'plant', x: 70, y: 45 },
          { type: 'heater', x: 35, y: 35 },
          { type: 'heater', x: 55, y: 55 },
        ]
      }
    },
    {
      id: 'terrace',
      name: 'Terraza',
      description: 'Area exterior con vista al jardín',
      thumbnail: '🌿',
      layout: {
        tables: [
          { x: 25, y: 25, shape: 'round', size: 'small' },
          { x: 50, y: 25, shape: 'round', size: 'small' },
          { x: 25, y: 50, shape: 'round', size: 'medium' },
          { x: 50, y: 50, shape: 'round', size: 'medium' },
        ],
        features: [
          { type: 'garden', x: 70, y: 40 },
          { type: 'bar', x: 10, y: 70 },
          { type: 'heater', x: 20, y: 20 },
          { type: 'heater', x: 55, y: 35 },
          { type: 'plant', x: 15, y: 40 },
          { type: 'plant', x: 60, y: 20 },
          { type: 'plant', x: 35, y: 60 },
          { type: 'lights', x: 40, y: 10 },
        ]
      }
    },
    {
      id: 'vip',
      name: 'Salón VIP',
      description: 'Area privada para eventos especiales',
      thumbnail: '👑',
      layout: {
        tables: [
          { x: 30, y: 30, shape: 'rectangle', size: 'large' },
          { x: 60, y: 30, shape: 'rectangle', size: 'large' },
        ],
        features: [
          { type: 'stage', x: 45, y: 60 },
          { type: 'bar', x: 10, y: 30 },
        ]
      }
    }
  ];

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tables`);
      const data = await response.json();
      
      // Simular algunos datos adicionales para demo
      const enhancedTables = data.map((table: any, index: number) => ({
        ...table,
        x: table.x || (20 + (index % 3) * 20),
        y: table.y || (20 + Math.floor(index / 3) * 20),
        orderTime: table.status === 'occupied' ? `${Math.floor(Math.random() * 60)} min` : undefined,
        orderTotal: table.status === 'occupied' ? Math.floor(Math.random() * 500) + 50 : undefined,
      }));
      
      setTables(enhancedTables);
    } catch (error) {
      console.error('Error cargando mesas:', error);
      // Datos de demo si falla la API
      setTables([
        { id: 1, number: 1, capacity: 4, status: 'available', x: 20, y: 20, location: 'Window' },
        { id: 2, number: 2, capacity: 2, status: 'occupied', x: 40, y: 20, location: 'Center', orderTime: '25 min', orderTotal: 156 },
        { id: 3, number: 3, capacity: 6, status: 'available', x: 60, y: 20, location: 'Corner' },
        { id: 4, number: 4, capacity: 4, status: 'reserved', x: 20, y: 40, location: 'Window' },
        { id: 5, number: 5, capacity: 8, status: 'occupied', x: 40, y: 40, location: 'Center', orderTime: '45 min', orderTotal: 342 },
        { id: 6, number: 6, capacity: 2, status: 'available', x: 60, y: 40, location: 'Bar' },
        { id: 7, number: 7, capacity: 4, status: 'available', x: 20, y: 60, location: 'Patio' },
        { id: 8, number: 8, capacity: 4, status: 'occupied', x: 40, y: 60, location: 'Center', orderTime: '10 min', orderTotal: 89 },
        { id: 9, number: 9, capacity: 6, status: 'maintenance', x: 60, y: 60, location: 'Corner' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (table && table.status === 'occupied') {
      navigate(`/orders/table/${table.number}`);
    } else if (table && table.status === 'available') {
      navigate(`/orders/new?table=${table.number}`);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      available: {
        color: 'from-green-400 to-emerald-500',
        shadowColor: 'shadow-green-500/50',
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Disponible',
        pulseColor: 'bg-green-500'
      },
      occupied: {
        color: 'from-red-400 to-rose-500',
        shadowColor: 'shadow-red-500/50',
        icon: <Users className="h-4 w-4" />,
        label: 'Ocupada',
        pulseColor: 'bg-red-500'
      },
      reserved: {
        color: 'from-yellow-400 to-amber-500',
        shadowColor: 'shadow-yellow-500/50',
        icon: <Clock className="h-4 w-4" />,
        label: 'Reservada',
        pulseColor: 'bg-yellow-500'
      },
      maintenance: {
        color: 'from-gray-400 to-slate-500',
        shadowColor: 'shadow-gray-500/50',
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Mantenimiento',
        pulseColor: 'bg-gray-500'
      }
    };
    return configs[status as keyof typeof configs] || configs.available;
  };

  const IsometricView = () => {
    const currentPlan = floorPlans.find(p => p.id === selectedPlan) || floorPlans[0];
    
    return (
      <div className="relative w-full h-[800px] bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl overflow-visible">
        {/* Piso de madera con perspectiva */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Patrón de madera */}
              <pattern id="wood" width="20" height="100" patternUnits="userSpaceOnUse">
                <rect width="20" height="100" fill="#8B4513" />
                <rect x="0" y="0" width="19" height="100" fill="#A0522D" />
                <rect x="0" y="0" width="18" height="100" fill="#8B4513" opacity="0.8" />
                <line x1="0" y1="0" x2="0" y2="100" stroke="#654321" strokeWidth="0.5" />
                <line x1="20" y1="0" x2="20" y2="100" stroke="#654321" strokeWidth="0.5" />
                {/* Vetas de madera */}
                <path d="M 5 0 Q 10 50 5 100" fill="none" stroke="#654321" strokeWidth="0.2" opacity="0.5" />
                <path d="M 15 0 Q 10 30 15 100" fill="none" stroke="#654321" strokeWidth="0.2" opacity="0.5" />
              </pattern>
              <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D2691E" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#8B4513" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#wood)" transform="skewY(-5) scale(1.2)" />
            <rect width="100" height="100" fill="url(#woodGradient)" transform="skewY(-5)" />
          </svg>
        </div>

        {/* Contenedor con perspectiva 3D */}
        <div className="absolute inset-0" style={{ perspective: '1000px' }}>
          <div 
            className="relative w-full h-full"
            style={{
              transform: 'rotateX(55deg) rotateZ(-45deg) scale(0.6)',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center'
            }}
          >
            {/* Features del plano (bar, cocina, etc) */}
            {currentPlan.layout.features.map((feature, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${feature.x}%`,
                  top: `${feature.y}%`,
                  transform: 'translateZ(20px)'
                }}
              >
                <div className="relative">
                  {feature.type === 'bar' && (
                    <div className="relative" style={{ transform: 'translateZ(30px)' }}>
                      <div className="w-32 h-16 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 rounded-lg shadow-2xl flex flex-col items-center justify-center text-white border-2 border-amber-900">
                        <Wine className="h-6 w-6 mb-1" />
                        <span className="text-xs font-bold">BARRA</span>
                      </div>
                      {/* Botellas en la barra */}
                      <div className="absolute -top-2 flex gap-1 left-2">
                        <span className="text-lg">🍷</span>
                        <span className="text-lg">🍺</span>
                        <span className="text-lg">🥃</span>
                      </div>
                      {/* Sombra */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-3 bg-black opacity-30 blur-md rounded-full" />
                    </div>
                  )}
                  {feature.type === 'cashier' && (
                    <div className="relative" style={{ transform: 'translateZ(25px)' }}>
                      <div className="w-24 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-lg shadow-2xl flex flex-col items-center justify-center text-white border-2 border-green-900">
                        <span className="text-2xl mb-1">💵</span>
                        <span className="text-xs font-bold">CAJA</span>
                      </div>
                      {/* Monitor de caja */}
                      <div className="absolute -top-3 w-16 h-10 bg-gray-800 rounded-t-lg left-1/2 transform -translate-x-1/2" />
                      <div className="absolute -bottom-2 w-20 h-3 bg-black opacity-40 blur-md rounded-full left-1/2 transform -translate-x-1/2" />
                    </div>
                  )}
                  {feature.type === 'restroom' && (
                    <div className="relative" style={{ transform: 'translateZ(20px)' }}>
                      <div className="w-20 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-2xl flex flex-col items-center justify-center text-white border-2 border-blue-800">
                        <div className="flex gap-2 mb-1">
                          <span className="text-xl">🚹</span>
                          <span className="text-xl">🚺</span>
                        </div>
                        <span className="text-xs font-bold">BAÑOS</span>
                      </div>
                      <div className="absolute -bottom-2 w-16 h-3 bg-black opacity-40 blur-md rounded-full left-1/2 transform -translate-x-1/2" />
                    </div>
                  )}
                  {feature.type === 'kitchen' && (
                    <div className="relative" style={{ transform: 'translateZ(35px)' }}>
                      <div className="w-28 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-2xl flex flex-col items-center justify-center text-white border-2 border-gray-800">
                        <ChefHat className="h-6 w-6 mb-1" />
                        <span className="text-xs font-bold">COCINA</span>
                      </div>
                      {/* Humo de cocina */}
                      <motion.div
                        className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                        animate={{ y: [-10, -20, -10], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <span className="text-3xl opacity-50">💨</span>
                      </motion.div>
                      <div className="absolute -bottom-2 w-24 h-3 bg-black opacity-40 blur-md rounded-full left-1/2 transform -translate-x-1/2" />
                    </div>
                  )}
                  {feature.type === 'entrance' && (
                    <div className="relative" style={{ transform: 'translateZ(40px)' }}>
                      <div className="w-20 h-28 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg shadow-2xl flex flex-col items-center justify-center text-white border-4 border-emerald-900">
                        <span className="text-3xl mb-2">🚪</span>
                        <span className="text-xs font-bold">ENTRADA</span>
                      </div>
                      {/* Marco de puerta */}
                      <div className="absolute inset-0 border-4 border-emerald-900 rounded-lg" />
                      <div className="absolute -bottom-3 w-16 h-4 bg-black opacity-50 blur-md rounded-full left-1/2 transform -translate-x-1/2" />
                    </div>
                  )}
                  {feature.type === 'garden' && (
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-xl flex items-center justify-center text-white opacity-80">
                      🌳
                    </div>
                  )}
                  {feature.type === 'stage' && (
                    <div className="w-24 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-xl flex items-center justify-center text-white">
                      🎤
                    </div>
                  )}
                  {feature.type === 'plant' && (
                    <motion.div 
                      className="relative"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      style={{ transform: 'translateZ(30px)' }}
                    >
                      <div className="w-20 h-28 flex flex-col items-center">
                        {/* Maceta más grande */}
                        <div className="absolute bottom-0 w-16 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg shadow-2xl border-2 border-orange-900" 
                          style={{ transform: 'perspective(100px) rotateX(10deg)' }}
                        />
                        {/* Planta más grande */}
                        <div className="absolute bottom-6 text-5xl animate-pulse filter drop-shadow-lg">
                          🌿
                        </div>
                        {/* Sombra de la planta */}
                        <div className="absolute -bottom-2 w-14 h-4 bg-black opacity-30 blur-md rounded-full" />
                      </div>
                    </motion.div>
                  )}
                  {feature.type === 'heater' && (
                    <div className="relative" style={{ transform: 'translateZ(20px)' }}>
                      {/* Base de la estufa más grande */}
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-2xl" />
                      {/* Poste más visible */}
                      <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 w-2 h-20 bg-gradient-to-b from-gray-600 to-gray-800 shadow-lg" />
                      {/* Cabeza tipo hongo más grande */}
                      <motion.div 
                        className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-20 h-10 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-t-full shadow-2xl flex items-center justify-center">
                          <Flame className="h-6 w-6 text-yellow-200 animate-pulse" />
                        </div>
                        {/* Efecto de calor mejorado */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="w-24 h-24 bg-gradient-to-t from-orange-400 to-transparent rounded-full opacity-30 animate-ping" />
                        </div>
                      </motion.div>
                      {/* Sombra de la estufa */}
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-black opacity-40 blur-md rounded-full" />
                    </div>
                  )}
                  {feature.type === 'divider' && (
                    <div className="w-1 h-20 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-lg opacity-60" 
                      style={{ transform: 'rotateZ(45deg)' }}
                    />
                  )}
                  {feature.type === 'lights' && (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="relative">
                        <Lamp className="h-8 w-8 text-yellow-500" />
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-yellow-300 rounded-full opacity-30 blur-xl" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}

            {/* Mesas */}
            {tables.map((table, index) => {
              const config = getStatusConfig(table.status);
              const planTable = currentPlan.layout.tables[index % currentPlan.layout.tables.length];
              
              return (
                <motion.div
                  key={table.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${planTable.x}%`,
                    top: `${planTable.y}%`,
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{ scale: 0, rotateZ: -180 }}
                  animate={{ 
                    scale: hoveredTable === table.id ? 1.2 : 1,
                    rotateZ: 0,
                    translateZ: hoveredTable === table.id ? '30px' : '0px'
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05
                  }}
                  onHoverStart={() => setHoveredTable(table.id)}
                  onHoverEnd={() => setHoveredTable(null)}
                  onClick={() => handleTableClick(table.id)}
                >
                  {/* Mesa 3D */}
                  <div className="relative">
                    {/* Top de la mesa */}
                    <div
                      className={`
                        ${planTable.shape === 'round' ? 'w-14 h-14 rounded-full' : 
                          planTable.shape === 'rectangle' ? 'w-16 h-10 rounded-lg' : 
                          'w-12 h-12 rounded-lg'}
                        bg-gradient-to-br ${config.color} shadow-2xl ${config.shadowColor}
                        flex items-center justify-center text-white font-bold text-lg
                        transform transition-all duration-300
                      `}
                      style={{
                        transform: 'translateZ(40px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                      }}
                    >
                      {table.number}
                      
                      {/* Indicador de estado animado */}
                      {table.status === 'occupied' && (
                        <div className="absolute -top-2 -right-2">
                          <span className="flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${config.pulseColor}`}></span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Patas de la mesa (efecto 3D) */}
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900 opacity-30"
                      style={{
                        transform: 'translateZ(-20px) scaleY(0.5)',
                        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'
                      }}
                    />

                    {/* Sombra de la mesa */}
                    <div
                      className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2
                        ${planTable.shape === 'round' ? 'w-12 h-12 rounded-full' : 
                          planTable.shape === 'rectangle' ? 'w-14 h-8 rounded-lg' : 
                          'w-10 h-10 rounded-lg'}
                        bg-black opacity-20 blur-md
                      `}
                      style={{
                        transform: 'translateZ(-40px) rotateX(90deg)'
                      }}
                    />
                  </div>

                  {/* Tooltip con información */}
                  {hoveredTable === table.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl p-3 z-50 min-w-[150px]"
                      style={{ transform: 'rotateX(-60deg) rotateZ(45deg) translateX(-50%)' }}
                    >
                      <div className="text-sm font-semibold text-gray-800">Mesa {table.number}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          <span>{table.capacity} personas</span>
                        </div>
                        {table.orderTime && (
                          <div className="flex items-center gap-1 mt-1 text-red-600">
                            <Clock className="h-3 w-3" />
                            <span>{table.orderTime}</span>
                          </div>
                        )}
                        {table.orderTotal && (
                          <div className="font-semibold mt-1 text-green-600">
                            ${table.orderTotal}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Controles de vista */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setViewMode('isometric')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'isometric' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('top')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'top' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Grid className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const TopView = () => {
    return (
      <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <div className="grid grid-cols-5 gap-6 h-full">
          {tables.map((table) => {
            const config = getStatusConfig(table.status);
            return (
              <motion.div
                key={table.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleTableClick(table.id)}
                className={`relative bg-gradient-to-br ${config.color} rounded-2xl shadow-xl ${config.shadowColor} cursor-pointer p-4 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl font-bold text-white">#{table.number}</span>
                    <div className="bg-white/20 backdrop-blur rounded-lg p-2">
                      {config.icon}
                    </div>
                  </div>
                  <div className="text-white/80 text-sm">
                    {table.capacity} personas
                  </div>
                </div>
                
                {table.status === 'occupied' && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {table.orderTime}
                      </span>
                      <span className="font-semibold">${table.orderTotal}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <button className="w-full bg-white/20 backdrop-blur text-white py-2 rounded-lg hover:bg-white/30 transition-colors font-medium">
                    {table.status === 'occupied' ? 'Ver Orden' : 'Nueva Orden'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vista 3D del Restaurante
              </h1>
              <p className="text-gray-500 mt-1">Gestión visual avanzada de mesas</p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tables.filter(t => t.status === 'available').length}
                </div>
                <div className="text-xs text-gray-500">Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tables.filter(t => t.status === 'occupied').length}
                </div>
                <div className="text-xs text-gray-500">Ocupadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {tables.filter(t => t.status === 'reserved').length}
                </div>
                <div className="text-xs text-gray-500">Reservadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plan Selector Colapsable */}
      <div className="px-6 py-2">
        <div className="bg-white rounded-xl shadow-lg">
          <button
            onClick={() => setShowAreaSelector(!showAreaSelector)}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">Área Actual:</span>
              <span className="text-lg font-bold text-blue-600">
                {floorPlans.find(p => p.id === selectedPlan)?.thumbnail} {floorPlans.find(p => p.id === selectedPlan)?.name}
              </span>
            </div>
            <motion.div
              animate={{ rotate: showAreaSelector ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </motion.div>
          </button>
          
          <AnimatePresence>
            {showAreaSelector && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 flex gap-3">
                  {floorPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setShowAreaSelector(false);
                      }}
                      className={`flex-1 p-3 rounded-xl transition-all ${
                        selectedPlan === plan.id
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{plan.thumbnail}</div>
                      <div className="font-semibold text-sm">{plan.name}</div>
                      <div className="text-xs opacity-80 mt-1">{plan.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main View */}
      <div className="px-6 pb-6 relative">
        {/* Botón Flotante para Abrir Panel */}
        {!showSidePanel && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSidePanel(true)}
            className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl"
          >
            <Menu className="h-6 w-6" />
          </motion.button>
        )}

        {/* Panel Lateral de Herramientas Flotante */}
        <AnimatePresence>
          {showSidePanel && (
            <>
              {/* Overlay oscuro */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSidePanel(false)}
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
              />
              
              {/* Panel Modal */}
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 z-50 overflow-y-auto"
              >
                {/* Header con botón de cerrar */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Herramientas de Edición
                  </h2>
                  <button
                    onClick={() => setShowSidePanel(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

              {/* Modo Edición Toggle */}
              <div className="mb-6">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    editMode 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {editMode ? '✏️ Modo Edición Activo' : '👁️ Modo Visualización'}
                </button>
              </div>

              {editMode && (
                <>
                  {/* Agregar Nueva Mesa */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Agregar Nueva Mesa</h3>
                    
                    {/* Selector de Forma */}
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-2 block">Forma:</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedShape('square')}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            selectedShape === 'square'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          ⬜ Cuadrada
                        </button>
                        <button
                          onClick={() => setSelectedShape('circle')}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            selectedShape === 'circle'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          ⭕ Redonda
                        </button>
                        <button
                          onClick={() => setSelectedShape('rectangle')}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            selectedShape === 'rectangle'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          ▬ Rectangular
                        </button>
                      </div>
                    </div>

                    {/* Selector de Capacidad */}
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-2 block">Capacidad:</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 4, 6, 8, 10, 12].map(cap => (
                          <button
                            key={cap}
                            onClick={() => setSelectedCapacity(cap)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedCapacity === cap
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {cap} 👥
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Botón Agregar */}
                    <button
                      onClick={() => {
                        const newTable = {
                          id: tables.length + 1,
                          number: tables.length + 1,
                          capacity: selectedCapacity,
                          status: 'available' as const,
                          x: 30 + Math.random() * 40,
                          y: 30 + Math.random() * 40,
                          shape: selectedShape
                        };
                        setTables([...tables, newTable]);
                        toast.success(`Mesa ${newTable.number} agregada`);
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      ➕ Agregar Mesa
                    </button>
                  </div>

                  {/* Lista de Mesas */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-semibold mb-4">Mesas Actuales ({tables.length})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {tables.map(table => (
                        <div 
                          key={table.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <span className="font-medium">Mesa {table.number}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({table.capacity} personas)
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setTables(tables.filter(t => t.id !== table.id));
                              toast.info(`Mesa ${table.number} eliminada`);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Vista Principal - Ahora usa todo el ancho */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {viewMode === 'isometric' && <IsometricView key="iso" />}
            {viewMode === 'top' && <TopView key="top" />}
            {viewMode === 'grid' && (
              <div key="grid" className="bg-white rounded-2xl shadow-xl p-6">
                <div className="grid grid-cols-3 gap-4">
                  {tables.map((table) => {
                    const config = getStatusConfig(table.status);
                    return (
                      <div
                        key={table.id}
                        onClick={() => handleTableClick(table.id)}
                        className={`p-4 rounded-xl bg-gradient-to-br ${config.color} text-white cursor-pointer hover:scale-105 transition-transform`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xl">Mesa {table.number}</span>
                          {config.icon}
                        </div>
                        <div className="mt-2 text-white/80 text-sm">
                          {config.label} • {table.capacity} personas
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};