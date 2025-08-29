import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Users, Clock, CheckCircle, AlertCircle, Utensils, Coffee, Wine, ChefHat,
  Eye, Layers, Grid, Map, Maximize2, TreePine, Flame, Lamp, Menu, X,
  ChevronDown, ZoomIn, ZoomOut, ChevronUp, ChevronLeft, ChevronRight,
  Maximize, Minimize, Edit3, Settings, RotateCw, RotateCcw, Trash2,
  Plus, Save, Move, Square, Circle, Lock, Unlock,
  Copy, ArrowLeft, ArrowRight, DollarSign, DoorOpen, Bath
} from 'lucide-react';

interface Table {
  id: number;
  type: 'table';
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'paying' | 'cleaning';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: 'square' | 'circle' | 'rectangle';
  orderTime?: string;
  orderTotal?: number;
  currentGuests?: number;
  serverName?: string;
}

interface DecorativeObject {
  id: string;
  type: 'plant' | 'bar' | 'kitchen' | 'entrance' | 'wall' | 'column' | 'divider' | 'door' | 'bathroom' | 'restroom';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked?: boolean;
}

type FloorElement = Table | DecorativeObject;

const Tables3DImproved: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [decorativeObjects, setDecorativeObjects] = useState<DecorativeObject[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('main');

  // Ambientes disponibles
  const environments = [
    {
      id: 'main',
      name: 'Salón Principal',
      icon: '🏛️',
      bgColor: 'from-amber-900 to-amber-800',
      floorPattern: 'wood',
      description: 'Comedor principal interior con piso de madera'
    },
    {
      id: 'terrace', 
      name: 'Terraza',
      icon: '🌿',
      bgColor: 'from-yellow-400 to-yellow-600',
      floorPattern: 'golden',
      description: 'Terraza dorada con detalles elegantes'
    },
    {
      id: 'park',
      name: 'Parque',
      icon: '🌳',
      bgColor: 'from-green-400 to-green-600', 
      floorPattern: 'grass',
      description: 'Parque con césped natural'
    }
  ];

  const currentEnvironment = environments.find(env => env.id === selectedEnvironment) || environments[0];
  const [selectedElement, setSelectedElement] = useState<FloorElement | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'table' | 'object'>('select');
  const [preciseSelectionMode, setPreciseSelectionMode] = useState<boolean>(false);
  const [selectedShape, setSelectedShape] = useState<'square' | 'circle' | 'rectangle'>('square');
  const [selectedCapacity, setSelectedCapacity] = useState<number>(4);
  const [selectedObjectType, setSelectedObjectType] = useState<DecorativeObject['type']>('plant');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [view3D, setView3D] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

  // Cargar datos al iniciar
  useEffect(() => {
    loadTablesFromDB();
    loadDecorativeObjects();
  }, []);

  const loadTablesFromDB = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/tables`);
      if (response.ok) {
        const tablesData = await response.json();
        const convertedTables: Table[] = tablesData.map((table: any) => ({
          ...table,
          type: 'table',
          rotation: table.rotation || 0,
          width: table.width || 80,
          height: table.height || 80
        }));
        setTables(convertedTables);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const loadDecorativeObjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decorative-objects`);
      if (response.ok) {
        const objects = await response.json();
        setDecorativeObjects(objects);
      }
    } catch (error) {
      console.error('Error loading decorative objects:', error);
    }
  };

  // Snap to grid helper
  const snapValue = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Agregar nueva mesa
  const addNewTable = () => {
    if (!editMode) {
      toast.warning('Activa el modo edición para agregar mesas');
      return;
    }

    // Calcular tamaño basado en capacidad
    // 2 personas = 60px base, cada persona adicional +12px
    const baseSize = 60;
    const sizePerPerson = 12;
    const calculatedSize = baseSize + Math.max(0, selectedCapacity - 2) * sizePerPerson;
    
    const newTable: Table = {
      id: Date.now(),
      type: 'table',
      number: Math.max(...tables.map(t => t.number), 0) + 1,
      capacity: selectedCapacity,
      status: 'available',
      x: snapValue(400),
      y: snapValue(300),
      width: selectedShape === 'rectangle' ? calculatedSize * 1.4 : calculatedSize,
      height: calculatedSize,
      rotation: 0,
      shape: selectedShape
    };

    setTables([...tables, newTable]);
    saveHistory();
    toast.success(`Mesa ${newTable.number} agregada - ${selectedCapacity} personas`);
  };

  // Agregar objeto decorativo
  const addDecorativeObject = () => {
    if (!editMode) {
      toast.warning('Activa el modo edición para agregar objetos');
      return;
    }

    const dimensions = getObjectDimensions(selectedObjectType);
    const newObject: DecorativeObject = {
      id: `obj_${Date.now()}`,
      type: selectedObjectType,
      x: snapValue(500),
      y: snapValue(300),
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
      locked: false
    };

    setDecorativeObjects([...decorativeObjects, newObject]);
    saveHistory();
    toast.success('Objeto agregado');
  };

  // Obtener dimensiones predeterminadas para objetos
  const getObjectDimensions = (type: DecorativeObject['type']) => {
    const dimensions: Record<DecorativeObject['type'], { width: number; height: number }> = {
      plant: { width: 40, height: 40 },
      bar: { width: 280, height: 80 },
      kitchen: { width: 180, height: 120 },
      entrance: { width: 100, height: 20 },
      wall: { width: 200, height: 10 },
      column: { width: 30, height: 30 },
      divider: { width: 150, height: 10 },
      door: { width: 80, height: 15 },
      bathroom: { width: 100, height: 100 },
      restroom: { width: 120, height: 100 }
    };
    return dimensions[type];
  };

  // Manejar el drag de elementos
  const handleElementDrag = (element: FloorElement, newX: number, newY: number) => {
    if (!editMode) return;
    
    const snappedX = snapToGrid ? snapValue(newX) : newX;
    const snappedY = snapToGrid ? snapValue(newY) : newY;

    if (element.type === 'table') {
      setTables(tables.map(t => 
        t.id === element.id ? { ...t, x: snappedX, y: snappedY } : t
      ));
    } else {
      setDecorativeObjects(decorativeObjects.map(obj => 
        obj.id === element.id ? { ...obj, x: snappedX, y: snappedY } : obj
      ));
    }
  };

  // Rotar elemento seleccionado
  const rotateSelectedElement = (angle: number) => {
    if (!selectedElement || !editMode) return;

    const newRotation = (selectedElement.rotation + angle) % 360;
    
    if (selectedElement.type === 'table') {
      setTables(tables.map(t => 
        t.id === selectedElement.id ? { ...t, rotation: newRotation } : t
      ));
    } else {
      setDecorativeObjects(decorativeObjects.map(obj => 
        obj.id === selectedElement.id ? { ...obj, rotation: newRotation } : obj
      ));
    }
    
    setSelectedElement({ ...selectedElement, rotation: newRotation });
    saveHistory();
  };

  // Eliminar elemento seleccionado
  const deleteSelectedElement = () => {
    if (!selectedElement || !editMode) return;
    
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

    if (selectedElement.type === 'table') {
      setTables(tables.filter(t => t.id !== selectedElement.id));
    } else {
      setDecorativeObjects(decorativeObjects.filter(obj => obj.id !== selectedElement.id));
    }
    
    setSelectedElement(null);
    saveHistory();
    toast.success('Elemento eliminado');
  };

  // Duplicar elemento seleccionado
  const duplicateSelectedElement = () => {
    if (!selectedElement || !editMode) return;

    if (selectedElement.type === 'table') {
      const newTable: Table = {
        ...selectedElement,
        id: Date.now(),
        number: Math.max(...tables.map(t => t.number), 0) + 1,
        x: selectedElement.x + 100,
        y: selectedElement.y + 50
      };
      setTables([...tables, newTable]);
      setSelectedElement(newTable);
    } else {
      const newObject: DecorativeObject = {
        ...selectedElement,
        id: `obj_${Date.now()}`,
        x: selectedElement.x + 100,
        y: selectedElement.y + 50
      };
      setDecorativeObjects([...decorativeObjects, newObject]);
      setSelectedElement(newObject);
    }
    
    saveHistory();
    toast.success('Elemento duplicado');
  };

  // Sistema de historial (undo/redo)
  const saveHistory = () => {
    const state = {
      tables: [...tables],
      decorativeObjects: [...decorativeObjects]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setTables(prevState.tables);
      setDecorativeObjects(prevState.decorativeObjects);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setTables(nextState.tables);
      setDecorativeObjects(nextState.decorativeObjects);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Guardar layout completo
  const saveLayout = async () => {
    try {
      const layout = {
        tables,
        decorativeObjects,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/layouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout)
      });

      if (response.ok) {
        toast.success('Layout guardado exitosamente');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Error al guardar el layout');
    }
  };

  // Manejo de zoom con rueda del mouse
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
      }
    };

    const floorEl = floorRef.current;
    if (floorEl) {
      floorEl.addEventListener('wheel', handleWheel, { passive: false });
      return () => floorEl.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Renderizar patrón de piso específico por ambiente
  const renderFloorPattern = (environment: typeof environments[0]) => {
    if (environment.floorPattern === 'wood') {
      return (
        <div className="absolute inset-0 opacity-15">
          <div className="w-full h-full">
            {/* Tablones de madera */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i}
                className="h-8 border-b border-amber-700/30 bg-gradient-to-r from-amber-800/40 via-amber-700/30 to-amber-800/40"
                style={{
                  backgroundImage: `linear-gradient(90deg, 
                    rgba(139, 69, 19, 0.3) 0%, 
                    rgba(160, 82, 45, 0.2) 20%, 
                    rgba(139, 69, 19, 0.3) 40%,
                    rgba(160, 82, 45, 0.2) 60%,
                    rgba(139, 69, 19, 0.3) 80%,
                    rgba(160, 82, 45, 0.2) 100%)`
                }}
              />
            ))}
          </div>
        </div>
      );
    } else if (environment.floorPattern === 'golden') {
      return (
        <div className="absolute inset-0 opacity-12">
          <div className="grid grid-cols-12 grid-rows-8 h-full">
            {Array.from({ length: 96 }).map((_, i) => (
              <div 
                key={i} 
                className={`border border-yellow-600/40 ${
                  i % 2 === 0 
                    ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/40' 
                    : 'bg-gradient-to-br from-yellow-400/20 to-yellow-500/30'
                }`}
                style={{
                  boxShadow: 'inset 0 0 10px rgba(255, 215, 0, 0.2)'
                }}
              />
            ))}
          </div>
        </div>
      );
    } else if (environment.floorPattern === 'grass') {
      return (
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full bg-gradient-to-br from-green-500/30 to-green-600/40"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.3) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(22, 163, 74, 0.2) 1px, transparent 1px),
                radial-gradient(circle at 50% 10%, rgba(34, 197, 94, 0.1) 1.5px, transparent 1.5px),
                radial-gradient(circle at 20% 80%, rgba(22, 163, 74, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 60px 60px, 30px 30px, 50px 50px'
            }}
          />
        </div>
      );
    }
  };

  // Renderizar mesa
  const renderTable = (table: Table) => {
    const isSelected = selectedElement?.id === table.id;
    const isHovered = hoveredElement === `table_${table.id}`;
    
    const statusColors = {
      available: 'from-amber-600 to-amber-700',
      occupied: 'from-amber-800 to-amber-900', 
      reserved: 'from-amber-500 to-amber-600',
      maintenance: 'from-amber-400 to-amber-500',
      paying: 'from-amber-700 to-amber-800',
      cleaning: 'from-amber-500 to-amber-600'
    };

    return (
      <motion.div
        key={table.id}
        className={`absolute cursor-${editMode ? 'move' : 'pointer'} ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
        style={{
          width: `${table.width}px`,
          height: `${table.height}px`,
          transform: `rotate(${table.rotation}deg)`,
          zIndex: isSelected ? 1000 : table.y,
          ...(preciseSelectionMode && !isSelected && {
            opacity: 0.8,
            filter: 'brightness(1.1)',
            border: '2px dashed rgba(255, 165, 0, 0.6)'
          })
        }}
        initial={{ x: table.x, y: table.y }}
        animate={{ x: table.x, y: table.y }}
        whileHover={{ scale: editMode ? 1.05 : 1.02 }}
        drag={editMode}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(e, info) => {
          const newX = table.x + info.offset.x;
          const newY = table.y + info.offset.y;
          handleElementDrag(table, newX, newY);
          saveHistory();
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(table);
        }}
        onMouseEnter={() => setHoveredElement(`table_${table.id}`)}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {/* Sombra 3D base */}
        <div className="absolute inset-0 bg-black/25 blur-lg transform translate-y-4" 
             style={{ borderRadius: table.shape === 'circle' ? '50%' : '8px' }} />
        
        {/* Patas de la mesa */}
        <div className="absolute inset-0">
          {/* Pata trasera izquierda */}
          <div className="absolute w-3 h-8 bg-gradient-to-b from-amber-700 to-amber-800 rounded-sm shadow-md"
               style={{ 
                 left: '15%', 
                 top: '15%', 
                 transform: 'translateZ(-15px) rotateX(45deg)',
                 transformStyle: 'preserve-3d'
               }} />
          {/* Pata trasera derecha */}
          <div className="absolute w-3 h-8 bg-gradient-to-b from-amber-700 to-amber-800 rounded-sm shadow-md"
               style={{ 
                 right: '15%', 
                 top: '15%', 
                 transform: 'translateZ(-15px) rotateX(45deg)',
                 transformStyle: 'preserve-3d'
               }} />
          {/* Pata delantera izquierda */}
          <div className="absolute w-3 h-8 bg-gradient-to-b from-amber-600 to-amber-700 rounded-sm shadow-lg"
               style={{ 
                 left: '15%', 
                 bottom: '15%', 
                 transform: 'translateZ(-5px) rotateX(45deg)',
                 transformStyle: 'preserve-3d'
               }} />
          {/* Pata delantera derecha */}
          <div className="absolute w-3 h-8 bg-gradient-to-b from-amber-600 to-amber-700 rounded-sm shadow-lg"
               style={{ 
                 right: '15%', 
                 bottom: '15%', 
                 transform: 'translateZ(-5px) rotateX(45deg)',
                 transformStyle: 'preserve-3d'
               }} />
        </div>
        
        {/* Sillas alrededor de la mesa */}
        {Array.from({ length: table.capacity }).map((_, i) => {
          const angle = (360 / table.capacity) * i;
          const radius = (Math.max(table.width, table.height) / 2) + 25;
          const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
          const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
          
          return (
            <div key={`chair-${i}`} className="absolute" 
                 style={{ left: `calc(50% + ${x}px - 8px)`, top: `calc(50% + ${y}px - 8px)` }}>
              {/* Base de la silla */}
              <div className="absolute w-4 h-4 bg-gray-200 rounded-sm"
                   style={{ transform: 'translateZ(2px) rotate(${angle}deg)', transformStyle: 'preserve-3d' }} />
              {/* Silla principal */}
              <div className="absolute w-4 h-4 bg-gradient-to-b from-white to-gray-100 rounded-sm shadow-lg border border-gray-300"
                   style={{
                     transform: `translateZ(12px) rotate(${angle}deg)`,
                     transformStyle: 'preserve-3d',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                   }} />
              {/* Respaldo de la silla */}
              <div className="absolute w-4 h-1 bg-gradient-to-b from-gray-100 to-gray-200 rounded-sm border border-gray-300"
                   style={{
                     transform: `translateZ(12px) translateY(-6px) rotate(${angle}deg)`,
                     transformStyle: 'preserve-3d'
                   }} />
            </div>
          );
        })}

        {/* Base del tablero (más grueso) */}
        <div 
          className={`
            absolute inset-0 bg-gradient-to-b from-amber-900 to-amber-950
            ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
          `}
          style={{
            transform: 'translateZ(5px)',
            transformStyle: 'preserve-3d'
          }}
        />
        
        {/* Tablero de la mesa */}
        <div 
          className={`
            absolute inset-0 bg-gradient-to-br ${statusColors[table.status]}
            border-2 border-white/50 shadow-xl
            ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
          `}
          style={{
            transform: 'translateZ(20px)',
            transformStyle: 'preserve-3d',
            boxShadow: '0 15px 35px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {/* Número de mesa */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white/90 rounded-full w-10 h-10 flex items-center justify-center font-bold text-gray-800">
              {table.number}
            </div>
          </div>

          {/* Capacidad */}
          {(isHovered || isSelected) && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Mesa {table.number} • {table.capacity} personas
            </div>
          )}
        </div>

        {/* Controles de edición */}
        {isSelected && editMode && (
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); rotateSelectedElement(-45); }}
              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); rotateSelectedElement(45); }}
              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); duplicateSelectedElement(); }}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  // Renderizar objeto decorativo
  const renderDecorativeObject = (obj: DecorativeObject) => {
    const isSelected = selectedElement?.id === obj.id;
    const isHovered = hoveredElement === obj.id;
    
    const objectIcons: Record<DecorativeObject['type'], React.ReactNode> = {
      plant: (
        <div className="relative w-full h-full overflow-visible">
          {/* Sombra de planta */}
          <div className="absolute inset-0 bg-black/30 blur-md transform translate-y-2" />
          {/* Maceta */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-1/3 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-lg"
               style={{ transform: 'translateZ(-5px) translateX(-50%)', transformStyle: 'preserve-3d' }} />
          {/* Planta */}
          <TreePine className="absolute inset-0 text-green-500 drop-shadow-lg" 
                   style={{ 
                     transform: 'translateZ(5px) scale(4.5)', 
                     transformStyle: 'preserve-3d',
                     transformOrigin: 'bottom center',
                     pointerEvents: 'none'
                   }} />
          {/* Área de arrastre invisible expandida */}
          <div className="absolute inset-0 transform scale-150" style={{ transformOrigin: 'center' }} />
        </div>
      ),
      bar: (
        <div className="relative w-full h-full">
          {/* Sombra de barra */}
          <div className="absolute inset-0 bg-black/40 blur-lg transform translate-y-3" />
          {/* Base de barra */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black rounded-lg shadow-xl border border-gray-700"
               style={{ 
                 transform: 'translateZ(-8px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 15px 30px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(0,0,0,0.2)'
               }} />
          {/* Superficie de barra */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border-2 border-gray-600"
               style={{ 
                 transform: 'translateZ(3px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 8px 20px rgba(0,0,0,0.2), inset 0 -1px 4px rgba(0,0,0,0.1)'
               }}>
            <Wine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-300 w-1/2 h-1/2" />
            
            {/* Botellas y vasos encima de la barra */}
            <div className="absolute inset-0 flex items-center justify-around px-4"
                 style={{ transform: 'translateZ(8px)', transformStyle: 'preserve-3d' }}>
              {/* Botella 1 */}
              <div className="w-1 h-6 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full shadow-sm" />
              {/* Vaso */}
              <div className="w-1.5 h-3 bg-gradient-to-t from-gray-200 to-white rounded-b-sm shadow-sm" />
              {/* Botella 2 */}
              <div className="w-1 h-6 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-full shadow-sm" />
              {/* Vaso 2 */}
              <div className="w-1.5 h-3 bg-gradient-to-t from-gray-200 to-white rounded-b-sm shadow-sm" />
              {/* Botella 3 */}
              <div className="w-1 h-6 bg-gradient-to-t from-red-700 to-red-500 rounded-t-full shadow-sm" />
            </div>
          </div>
        </div>
      ),
      kitchen: (
        <div className="relative w-full h-full">
          {/* Sombra de cocina */}
          <div className="absolute inset-0 bg-black/35 blur-lg transform translate-y-2" />
          {/* Base de cocina */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg"
               style={{ 
                 transform: 'translateZ(-6px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 12px 25px rgba(0,0,0,0.3)'
               }} />
          {/* Superficie de cocina */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg border border-gray-300"
               style={{ 
                 transform: 'translateZ(2px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
               }}>
            <ChefHat className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-800 w-1/2 h-1/2" />
          </div>
        </div>
      ),
      entrance: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/20 blur-sm transform translate-y-1" />
          <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-500 to-transparent rounded shadow-lg"
               style={{ 
                 transform: 'translateZ(1px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
               }} />
        </div>
      ),
      wall: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/30 blur-md transform translate-y-2" />
          <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded border border-gray-400"
               style={{ 
                 transform: 'translateZ(8px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 10px 20px rgba(0,0,0,0.25), inset 0 -2px 6px rgba(0,0,0,0.1)'
               }} />
        </div>
      ),
      column: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/30 blur-md transform translate-y-2" />
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border border-gray-500"
               style={{ 
                 transform: 'translateZ(12px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 15px 30px rgba(0,0,0,0.3), inset 0 -3px 8px rgba(0,0,0,0.2)'
               }} />
        </div>
      ),
      divider: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/20 blur-sm transform translate-y-1" />
          <div className="w-full h-full bg-gradient-to-b from-gray-400 to-gray-600 shadow-lg"
               style={{ 
                 transform: 'translateZ(3px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
               }} />
        </div>
      ),
      door: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/25 blur-sm transform translate-y-1" />
          {/* Marco de la puerta */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-800 rounded"
               style={{ transform: 'translateZ(2px)', transformStyle: 'preserve-3d' }} />
          {/* Puerta */}
          <div className="absolute inset-1 bg-gradient-to-br from-amber-600 to-amber-700 rounded flex items-center justify-center"
               style={{ transform: 'translateZ(5px)', transformStyle: 'preserve-3d' }}>
            <DoorOpen className="text-amber-900 w-4 h-4" />
          </div>
        </div>
      ),
      bathroom: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/30 blur-md transform translate-y-2" />
          {/* Base del baño */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-800 rounded-lg"
               style={{ transform: 'translateZ(5px)', transformStyle: 'preserve-3d' }} />
          {/* Superficie */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg border border-blue-300 flex items-center justify-center"
               style={{ 
                 transform: 'translateZ(10px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
               }}>
            <Bath className="text-blue-900 w-8 h-8" />
            <div className="absolute top-2 right-2 text-white text-xs font-bold">WC</div>
          </div>
        </div>
      ),
      restroom: (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-black/30 blur-md transform translate-y-2" />
          {/* Base del baño */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg"
               style={{ transform: 'translateZ(5px)', transformStyle: 'preserve-3d' }} />
          {/* Superficie */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg border border-purple-300 flex items-center justify-center"
               style={{ 
                 transform: 'translateZ(10px)', 
                 transformStyle: 'preserve-3d',
                 boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
               }}>
            <Bath className="text-purple-900 w-6 h-6" />
            <Users className="text-purple-900 w-4 h-4 ml-1" />
            <div className="absolute top-2 right-2 text-white text-xs font-bold">♿</div>
          </div>
        </div>
      )
    };

    return (
      <motion.div
        key={obj.id}
        className={`absolute cursor-${editMode && !obj.locked ? 'move' : 'default'} ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
        style={{
          width: `${obj.width}px`,
          height: `${obj.height}px`,
          transform: `rotate(${obj.rotation}deg)`,
          zIndex: isSelected ? 1000 : (isHovered ? 999 : obj.y),
          ...(preciseSelectionMode && !isSelected && {
            opacity: 0.7,
            filter: 'brightness(1.1)',
            border: '2px dashed rgba(255, 165, 0, 0.5)'
          })
        }}
        initial={{ x: obj.x, y: obj.y }}
        animate={{ x: obj.x, y: obj.y }}
        whileHover={{ scale: editMode && !obj.locked ? 1.05 : 1 }}
        drag={editMode && !obj.locked}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(e, info) => {
          if (!obj.locked) {
            const newX = obj.x + info.offset.x;
            const newY = obj.y + info.offset.y;
            handleElementDrag(obj, newX, newY);
            saveHistory();
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(obj);
        }}
        onMouseEnter={() => setHoveredElement(obj.id)}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {/* Objeto */}
        <div className={`relative w-full h-full ${obj.locked ? 'opacity-50' : ''}`}>
          {objectIcons[obj.type]}
          
          {/* Indicador de bloqueado */}
          {obj.locked && (
            <Lock className="absolute top-0 right-0 w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Tooltip */}
        {(isHovered || isSelected) && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {obj.type} {obj.locked ? '(bloqueado)' : ''}
          </div>
        )}

        {/* Controles de edición */}
        {isSelected && editMode && !obj.locked && (
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); rotateSelectedElement(-45); }}
              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); rotateSelectedElement(45); }}
              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); duplicateSelectedElement(); }}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteSelectedElement(); }}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con controles */}
      <div className="bg-white shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Mesas 3D</h1>
            
            {/* Paneles de ambientes */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvironment(env.id)}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                    selectedEnvironment === env.id
                      ? 'bg-white text-gray-800 shadow-sm border'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg">{env.icon}</span>
                  <span className="text-sm">{env.name}</span>
                </button>
              ))}
            </div>
            
            {/* Modo edición */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                editMode 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {editMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {editMode ? 'Modo Edición' : 'Modo Vista'}
            </button>

            {/* Botón de Selección Precisa */}
            <button
              onClick={() => setPreciseSelectionMode(!preciseSelectionMode)}
              className={`px-3 py-2 rounded transition-colors ${
                preciseSelectionMode
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Modo de selección precisa para objetos superpuestos"
            >
              🎯 {preciseSelectionMode ? 'Selección Precisa ON' : 'Selección Precisa'}
            </button>
          </div>

          {/* Controles de zoom y vista */}
          <div className="flex items-center gap-2">
            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg ${showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>

            {/* Snap to grid */}
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded-lg ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>

            {/* Toggle 3D/2D */}
            <button
              onClick={() => setView3D(!view3D)}
              className={`p-2 rounded-lg flex items-center gap-1 ${view3D ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}
              title={view3D ? 'Cambiar a vista 2D (mejor para editar)' : 'Cambiar a vista 3D'}
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs font-medium">{view3D ? '3D' : '2D'}</span>
            </button>

            {/* Guardar */}
            {editMode && (
              <button
                onClick={saveLayout}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
          </div>
        </div>

        {/* Barra de herramientas de edición */}
        {editMode && (
          <div className="mt-4 flex items-center gap-4 border-t pt-4">
            {/* Herramientas */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTool('select')}
                className={`px-3 py-2 rounded ${selectedTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Move className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedTool('table')}
                className={`px-3 py-2 rounded ${selectedTool === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedTool('object')}
                className={`px-3 py-2 rounded ${selectedTool === 'object' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                <TreePine className="w-4 h-4" />
              </button>
            </div>

            {/* Opciones de mesa */}
            {selectedTool === 'table' && (
              <>
                <div className="flex gap-2">
                  <select 
                    value={selectedShape}
                    onChange={(e) => setSelectedShape(e.target.value as any)}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="square">Cuadrada</option>
                    <option value="circle">Redonda</option>
                    <option value="rectangle">Rectangular</option>
                  </select>
                  
                  <select
                    value={selectedCapacity}
                    onChange={(e) => setSelectedCapacity(Number(e.target.value))}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="2">2 personas</option>
                    <option value="4">4 personas</option>
                    <option value="6">6 personas</option>
                    <option value="8">8 personas</option>
                  </select>
                  
                  <button
                    onClick={addNewTable}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Mesa
                  </button>
                </div>
              </>
            )}

            {/* Opciones de objeto */}
            {selectedTool === 'object' && (
              <>
                <div className="flex gap-2">
                  <select
                    value={selectedObjectType}
                    onChange={(e) => setSelectedObjectType(e.target.value as any)}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="plant">🌿 Planta</option>
                    <option value="bar">🍷 Barra</option>
                    <option value="kitchen">👨‍🍳 Cocina</option>
                    <option value="door">🚪 Puerta</option>
                    <option value="bathroom">🚽 Baño</option>
                    <option value="restroom">♿ Baño Accesible</option>
                    <option value="entrance">🚪 Entrada</option>
                    <option value="wall">🧱 Pared</option>
                    <option value="column">⚫ Columna</option>
                    <option value="divider">➖ Divisor</option>
                  </select>
                  
                  <button
                    onClick={addDecorativeObject}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Objeto
                  </button>
                </div>
              </>
            )}

            {/* Undo/Redo */}
            <div className="flex gap-1 ml-auto">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Área del plano con perspectiva 3D */}
      <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200"
           style={{
             perspective: '800px',
             perspectiveOrigin: 'center 25%'
           }}>
        <div 
          ref={floorRef}
          className="absolute inset-0 overflow-auto"
          onMouseDown={(e) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
              setIsPanning(true);
              setPanStartPos({ x: e.clientX - panX, y: e.clientY - panY });
            }
          }}
          onClick={(e) => {
            // Si el clic es directamente en el área vacía y no fue un drag, deseleccionar
            if (e.target === e.currentTarget && !isPanning) {
              setSelectedElement(null);
            }
          }}
          onMouseMove={(e) => {
            if (isPanning) {
              setPanX(e.clientX - panStartPos.x);
              setPanY(e.clientY - panStartPos.y);
            }
          }}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => setIsPanning(false)}
        >
          <div 
            className="relative"
            style={{
              width: '2000px',
              height: '1000px',
              transform: view3D 
                ? `scale(${zoomLevel}) translate(${panX}px, ${panY}px) rotateX(45deg) rotateY(-15deg)`
                : `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'center center',
              transformStyle: view3D ? 'preserve-3d' : 'flat',
              cursor: isPanning ? 'grabbing' : 'default'
            }}
          >
            {/* Grid */}
            {showGrid && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="gray" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            {/* Piso del restaurante - plano para mejor drag & drop */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentEnvironment.bgColor} rounded-xl shadow-inner`} 
                 style={{ 
                   margin: '20px',
                   transform: 'translateZ(0px)', // Plano para drag & drop
                   boxShadow: '0 10px 20px rgba(0,0,0,0.1), inset 0 0 30px rgba(139, 69, 19, 0.1)'
                 }}>
              {/* Patrón de piso específico por ambiente */}
              {renderFloorPattern(currentEnvironment)}
            </div>

            {/* Renderizar objetos decorativos primero (están detrás) */}
            {decorativeObjects.map(obj => renderDecorativeObject(obj))}

            {/* Renderizar mesas */}
            {tables.map(table => renderTable(table))}
          </div>
        </div>

        {/* Panel de información */}
        {selectedElement && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800">
                {selectedElement.type === 'table' ? `Mesa ${(selectedElement as Table).number}` : 'Objeto Decorativo'}
              </h3>
              <button 
                onClick={() => setSelectedElement(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Posición:</span>
                <span>X: {selectedElement.x}, Y: {selectedElement.y}</span>
              </div>
              <div className="flex justify-between">
                <span>Tamaño:</span>
                <span>{selectedElement.width} x {selectedElement.height}</span>
              </div>
              <div className="flex justify-between">
                <span>Rotación:</span>
                <span>{selectedElement.rotation}°</span>
              </div>
              {selectedElement.type === 'table' && (
                <>
                  <div className="flex justify-between items-center">
                    <span>Capacidad:</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={(selectedElement as Table).capacity}
                      onChange={(e) => {
                        const newCapacity = parseInt(e.target.value);
                        const table = selectedElement as Table;
                        
                        // Calcular nuevo tamaño basado en capacidad
                        const baseSize = 60;
                        const sizePerPerson = 12;
                        const calculatedSize = baseSize + Math.max(0, newCapacity - 2) * sizePerPerson;
                        
                        const updatedTable = {
                          ...table,
                          capacity: newCapacity,
                          width: table.shape === 'rectangle' ? calculatedSize * 1.4 : calculatedSize,
                          height: calculatedSize
                        };
                        
                        setTables(tables.map(t => t.id === table.id ? updatedTable : t));
                        setSelectedElement(updatedTable);
                        saveHistory();
                      }}
                      className="w-16 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <span className="capitalize">{(selectedElement as Table).status}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Indicador de estado */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Reservada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Pagando</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tables3DImproved;