import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../lib/toast';
import {
  Users, Clock, CheckCircle, AlertCircle, Utensils, Coffee, Wine, ChefHat,
  Eye, Layers, Grid, Map, Maximize2, TreePine, Flame, Lamp, Menu, X,
  ChevronDown, ZoomIn, ZoomOut, ChevronUp, ChevronLeft, ChevronRight,
  Maximize, Minimize, Edit3, Settings, RotateCw, RotateCcw, Trash2,
  Plus, Save, Move, Square, Circle, Lock, Unlock, Expand,
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
  const { theme } = useTheme();
  const [tables, setTables] = useState<Table[]>([]);
  const [decorativeObjects, setDecorativeObjects] = useState<DecorativeObject[]>([
    // Barra en la parte superior izquierda
    {
      id: 'bar-1',
      type: 'bar',
      x: 100,
      y: 50,  // Parte superior
      width: 200,
      height: 80,
      rotation: 0,
      locked: false
    },
    // Cocina en la parte superior derecha
    {
      id: 'kitchen-1', 
      type: 'kitchen',
      x: 400,
      y: 50,  // Parte superior
      width: 180,
      height: 80,
      rotation: 0,
      locked: false
    }
  ]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('main');

  // Ambientes disponibles
  const environments = [
    {
      id: 'main',
      name: 'Salón Principal',
      icon: '🏛️',
      bgColor: 'from-yellow-100 to-amber-100',
      floorPattern: 'ceramic-gold',
      description: 'Comedor principal con piso cerámico dorado'
    },
    {
      id: 'terrace', 
      name: 'Terraza',
      icon: '🌿',
      bgColor: 'from-stone-300 to-stone-400',
      floorPattern: 'tiles',
      description: 'Terraza con piso de baldosas'
    },
    {
      id: 'park',
      name: 'Parque',
      icon: '🌳',
      bgColor: 'from-green-500 to-green-600', 
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
  const [doorTilt, setDoorTilt] = useState(0);
  const [wallTilt, setWallTilt] = useState(0);
  const [doorRotation, setDoorRotation] = useState(0);
  const [wallRotation, setWallRotation] = useState(0);
  const [barRotation, setBarRotation] = useState(0);
  // Eliminado modo de selección precisa - unificado en modo edición
  const [selectedShape, setSelectedShape] = useState<'square' | 'circle' | 'rectangle'>('square');
  const [selectedCapacity, setSelectedCapacity] = useState<number>(4);
  const [selectedObjectType, setSelectedObjectType] = useState<DecorativeObject['type']>('plant');
  const [zoomLevel, setZoomLevel] = useState(0.6); // Zoom inicial para ver todo el viewport
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [view3D, setView3D] = useState(false); // Vista 2D por defecto
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEditControls, setShowEditControls] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [floorDimensions, setFloorDimensions] = useState({ width: 2000, height: 1000 });
  const [isResizingFloor, setIsResizingFloor] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Función para ajustar el plano al viewport
  const fitToViewport = () => {
    if (!floorRef.current) return;
    
    // Obtener dimensiones del contenedor disponible
    const containerElement = floorRef.current.parentElement;
    if (!containerElement) return;
    
    const containerWidth = containerElement.clientWidth - 100; // Margen de seguridad
    const containerHeight = containerElement.clientHeight - 100;
    
    // Calcular el zoom óptimo para que el plano actual quepa en el viewport
    const scaleX = containerWidth / floorDimensions.width;
    const scaleY = containerHeight / floorDimensions.height;
    const optimalZoom = Math.min(scaleX, scaleY, 1.5); // Máximo 150% de zoom
    
    // Centrar el plano
    setZoomLevel(optimalZoom);
    setPanX(0);
    setPanY(0);
    
    // Opcionalmente, ajustar las dimensiones del plano si es muy pequeño
    if (optimalZoom > 1.2) {
      // Si necesitamos hacer zoom in mucho, mejor agrandar el plano
      const newWidth = Math.min(containerWidth / 0.8, 3000);
      const newHeight = Math.min(containerHeight / 0.8, 2000);
      setFloorDimensions({ 
        width: Math.max(floorDimensions.width, newWidth),
        height: Math.max(floorDimensions.height, newHeight)
      });
      setZoomLevel(0.8);
    }
    
    toast.success('Plano ajustado al viewport');
  };

  // Manejar eventos globales de mouse para redimensión
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizingFloor) {
        const deltaX = (e.clientX - resizeStart.x) / zoomLevel;
        const deltaY = (e.clientY - resizeStart.y) / zoomLevel;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        
        // Ajustar según el punto de redimensión
        switch(isResizingFloor) {
          case 'se': // Esquina inferior derecha
            newWidth = resizeStart.width + deltaX;
            newHeight = resizeStart.height + deltaY;
            break;
          case 'e': // Borde derecho
            newWidth = resizeStart.width + deltaX;
            newHeight = resizeStart.height;
            break;
          case 's': // Borde inferior
            newWidth = resizeStart.width;
            newHeight = resizeStart.height + deltaY;
            break;
        }
        
        // Aplicar límites
        newWidth = Math.max(800, Math.min(3000, newWidth));
        newHeight = Math.max(600, Math.min(2000, newHeight));
        
        setFloorDimensions({ width: newWidth, height: newHeight });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isResizingFloor) {
        setIsResizingFloor(null);
      }
    };

    if (isResizingFloor) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isResizingFloor, resizeStart, zoomLevel]);

  // Cargar datos al iniciar
  useEffect(() => {
    loadTablesFromDB();
    loadDecorativeObjects();
    
    // Ajustar zoom para ver todo el viewport
    const adjustInitialZoom = () => {
      if (floorRef.current) {
        const containerWidth = window.innerWidth - 300; // Restamos el ancho del sidebar
        const containerHeight = window.innerHeight - 200; // Restamos headers
        const floorWidth = 2000; // Ancho del plano
        const floorHeight = 1000; // Alto del plano
        
        const scaleX = containerWidth / floorWidth;
        const scaleY = containerHeight / floorHeight;
        const optimalZoom = Math.min(scaleX, scaleY) * 0.9; // 90% para tener margen
        
        setZoomLevel(Math.max(0.3, Math.min(optimalZoom, 1))); // Entre 0.3 y 1
        setPanX(0);
        setPanY(0);
      }
    };
    
    // Ejecutar después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(adjustInitialZoom, 100);
    
    // Ajustar al cambiar el tamaño de la ventana
    window.addEventListener('resize', adjustInitialZoom);
    return () => window.removeEventListener('resize', adjustInitialZoom);
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
        if (objects.length > 0) {
          setDecorativeObjects(objects);
        }
      }
    } catch (error) {
      console.error('Error loading decorative objects:', error);
    }
  };

  const saveDecorativeObject = async (obj: DecorativeObject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decorative-objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj)
      });
      
      if (!response.ok) {
        throw new Error('Error saving decorative object');
      }
    } catch (error) {
      console.error('Error saving decorative object:', error);
      toast.error('Error al guardar objeto decorativo');
    }
  };

  const updateDecorativeObject = async (obj: DecorativeObject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decorative-objects/${obj.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj)
      });
      
      if (!response.ok) {
        throw new Error('Error updating decorative object');
      }
    } catch (error) {
      console.error('Error updating decorative object:', error);
      toast.error('Error al actualizar objeto decorativo');
    }
  };

  const deleteDecorativeObjectFromDB = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decorative-objects/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error deleting decorative object');
      }
    } catch (error) {
      console.error('Error deleting decorative object:', error);
      toast.error('Error al eliminar objeto decorativo');
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
  const addDecorativeObject = async () => {
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
    await saveDecorativeObject(newObject);
    saveHistory();
    toast.success('Objeto agregado');
  };

  // Obtener dimensiones predeterminadas para objetos
  const getObjectDimensions = (type: DecorativeObject['type']) => {
    const dimensions: Record<DecorativeObject['type'], { width: number; height: number }> = {
      plant: { width: 40, height: 40 },
      bar: { width: 200, height: 80 },       // TAMAÑO MODERADO
      kitchen: { width: 180, height: 80 },    // TAMAÑO MODERADO
      entrance: { width: 100, height: 20 },
      wall: { width: 200, height: 20 },  // Pared más gruesa para verse mejor
      column: { width: 30, height: 30 },
      divider: { width: 150, height: 10 },
      door: { width: 80, height: 60 },  // ALTURA AUMENTADA para puertas importantes
      bathroom: { width: 100, height: 70 },   // ALTURA REDUCIDA: 70
      restroom: { width: 120, height: 70 }    // ALTURA REDUCIDA: 70
    };
    return dimensions[type];
  };

  // Manejar el drag de elementos con límites
  const handleElementDrag = async (element: FloorElement, newX: number, newY: number) => {
    if (!editMode) return;
    
    // Aplicar límites del plano (con margen de 20px)
    const margin = 20;
    const maxX = floorDimensions.width - element.width - margin;
    const maxY = floorDimensions.height - element.height - margin;
    
    const constrainedX = Math.max(margin, Math.min(newX, maxX));
    const constrainedY = Math.max(margin, Math.min(newY, maxY));
    
    const snappedX = snapToGrid ? snapValue(constrainedX) : constrainedX;
    const snappedY = snapToGrid ? snapValue(constrainedY) : constrainedY;

    if (element.type === 'table') {
      setTables(tables.map(t => 
        t.id === element.id ? { ...t, x: snappedX, y: snappedY } : t
      ));
    } else {
      const updatedObject = { ...element, x: snappedX, y: snappedY } as DecorativeObject;
      setDecorativeObjects(decorativeObjects.map(obj => 
        obj.id === element.id ? updatedObject : obj
      ));
      await updateDecorativeObject(updatedObject);
    }
  };

  // Rotar elemento seleccionado
  const rotateSelectedElement = async (angle: number) => {
    if (!selectedElement || !editMode) return;

    const newRotation = (selectedElement.rotation + angle) % 360;
    
    if (selectedElement.type === 'table') {
      const table = selectedElement as Table;
      
      // Si es una mesa rectangular y estamos rotando 90 grados, intercambiar dimensiones
      let newWidth = table.width;
      let newHeight = table.height;
      
      if (table.shape === 'rectangle' && (angle === 90 || angle === -90)) {
        // Intercambiar ancho y alto
        newWidth = table.height;
        newHeight = table.width;
      }
      
      const updatedTable = {
        ...table,
        rotation: newRotation,
        width: newWidth,
        height: newHeight
      };
      
      setTables(tables.map(t => 
        t.id === table.id ? updatedTable : t
      ));
      setSelectedElement(updatedTable);
    } else {
      const updatedObject = { ...selectedElement, rotation: newRotation } as DecorativeObject;
      setDecorativeObjects(decorativeObjects.map(obj => 
        obj.id === selectedElement.id ? updatedObject : obj
      ));
      setSelectedElement(updatedObject);
      await updateDecorativeObject(updatedObject);
    }
    
    saveHistory();
  };

  // Eliminar elemento seleccionado
  const deleteSelectedElement = async () => {
    if (!selectedElement || !editMode) return;
    
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

    if (selectedElement.type === 'table') {
      setTables(tables.filter(t => t.id !== selectedElement.id));
    } else {
      setDecorativeObjects(decorativeObjects.filter(obj => obj.id !== selectedElement.id));
      await deleteDecorativeObjectFromDB(selectedElement.id);
    }
    
    setSelectedElement(null);
    saveHistory();
    toast.success('Elemento eliminado');
  };

  // Duplicar elemento seleccionado
  const duplicateSelectedElement = async () => {
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
      await saveDecorativeObject(newObject);
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

  // Manejo de zoom con rueda del mouse - funciona en ambos modos
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Zoom con Shift + Scroll o Ctrl/Cmd + Scroll
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => Math.max(0.3, Math.min(2, prev + delta)));
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
    if (environment.floorPattern === 'ceramic-gold') {
      // Cerámicos dorados cuadriculados para salón principal
      return (
        <div className="absolute inset-0">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  #D4AF37 0px,
                  #D4AF37 2px,
                  #F4E4C1 2px,
                  #F4E4C1 80px
                ),
                repeating-linear-gradient(
                  90deg,
                  #D4AF37 0px,
                  #D4AF37 2px,
                  #F4E4C1 2px,
                  #F4E4C1 80px
                )
              `,
              opacity: 0.3
            }}
          />
          {/* Efecto de brillo dorado en cada baldosa */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 40px 40px, rgba(255, 215, 0, 0.15) 0%, transparent 30%),
                radial-gradient(circle at 120px 120px, rgba(255, 215, 0, 0.15) 0%, transparent 30%),
                radial-gradient(circle at 200px 40px, rgba(255, 215, 0, 0.15) 0%, transparent 30%),
                radial-gradient(circle at 40px 200px, rgba(255, 215, 0, 0.15) 0%, transparent 30%)
              `,
              backgroundSize: '160px 160px',
              opacity: 0.5
            }}
          />
        </div>
      );
    } else if (environment.floorPattern === 'tiles') {
      // Baldosas cuadriculadas para terraza
      return (
        <div className="absolute inset-0">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  #8B8B8B 0px,
                  #8B8B8B 3px,
                  #D3D3D3 3px,
                  #D3D3D3 60px
                ),
                repeating-linear-gradient(
                  90deg,
                  #8B8B8B 0px,
                  #8B8B8B 3px,
                  #D3D3D3 3px,
                  #D3D3D3 60px
                )
              `,
              opacity: 0.4
            }}
          />
          {/* Patrón de desgaste en las baldosas */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30px 30px, rgba(0, 0, 0, 0.05) 0%, transparent 20%),
                radial-gradient(circle at 90px 90px, rgba(0, 0, 0, 0.05) 0%, transparent 20%)
              `,
              backgroundSize: '120px 120px',
              opacity: 0.6
            }}
          />
        </div>
      );
    } else if (environment.floorPattern === 'grass') {
      // Césped granulado realista para parque
      return (
        <div className="absolute inset-0">
          {/* Capa base verde */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              backgroundImage: `
                radial-gradient(ellipse at top left, rgba(34, 197, 94, 0.3), transparent 50%),
                radial-gradient(ellipse at bottom right, rgba(22, 163, 74, 0.3), transparent 50%)
              `
            }}
          />
          {/* Textura granulada densa */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle, rgba(34, 197, 94, 0.8) 1px, transparent 1px),
                radial-gradient(circle, rgba(22, 163, 74, 0.6) 1px, transparent 1px),
                radial-gradient(circle, rgba(34, 197, 94, 0.7) 0.5px, transparent 0.5px),
                radial-gradient(circle, rgba(22, 163, 74, 0.5) 0.5px, transparent 0.5px)
              `,
              backgroundSize: '8px 8px, 12px 12px, 5px 5px, 7px 7px',
              backgroundPosition: '0 0, 6px 6px, 3px 3px, 9px 2px',
              opacity: 0.6
            }}
          />
          {/* Variaciones y sombras del césped */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(45deg, transparent 40%, rgba(0, 100, 0, 0.1) 50%, transparent 60%),
                linear-gradient(-45deg, transparent 40%, rgba(0, 80, 0, 0.1) 50%, transparent 60%),
                radial-gradient(ellipse at center, transparent 30%, rgba(22, 163, 74, 0.1) 70%)
              `,
              backgroundSize: '80px 80px, 80px 80px, 200% 200%',
              opacity: 0.7
            }}
          />
          {/* Textura adicional tipo noise para más realismo */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                repeating-conic-gradient(from 0deg at 50% 50%, 
                  rgba(34, 197, 94, 0.2) 0deg,
                  transparent 1deg,
                  transparent 2deg,
                  rgba(22, 163, 74, 0.2) 3deg
                )
              `,
              backgroundSize: '15px 15px',
              opacity: 0.3,
              mixBlendMode: 'multiply'
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
        }}
        initial={{ x: table.x, y: table.y }}
        animate={{ x: table.x, y: table.y }}
        whileHover={{ scale: editMode ? 1.05 : 1.02 }}
        drag={editMode} // Permitir arrastrar cualquier mesa en modo edición
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          left: 20,
          top: 20,
          right: floorDimensions.width - table.width - 20,
          bottom: floorDimensions.height - table.height - 20
        }}
        onDragEnd={(e, info) => {
          const newX = table.x + info.offset.x;
          const newY = table.y + info.offset.y;
          handleElementDrag(table, newX, newY);
          saveHistory();
        }}
        onDragStart={() => {
          // Seleccionar automáticamente la mesa al empezar a arrastrarla
          if (!isSelected) {
            setSelectedElement(table);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(table);
        }}
        onMouseEnter={() => setHoveredElement(`table_${table.id}`)}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {/* Sombra 3D base - Más dramática en 3D */}
        <div className="absolute inset-0 bg-black blur-lg" 
             style={{ 
               borderRadius: table.shape === 'circle' ? '50%' : '8px',
               transform: view3D ? 'translateZ(-80px) scale(1.2)' : 'translateY(4px)',  // Sombra más profunda
               opacity: view3D ? 0.4 : 0.25
             }} />
        
        {/* Patas de la mesa - Solo visibles en 3D */}
        {view3D && (
          <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
            {[
              { x: '20%', y: '20%' },
              { x: '80%', y: '20%' },
              { x: '20%', y: '80%' },
              { x: '80%', y: '80%' }
            ].map((pos, i) => (
              <div 
                key={i}
                className="absolute"
                style={{ 
                  left: pos.x,
                  top: pos.y,
                  transform: 'translateX(-50%) translateY(-50%)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Pata vertical bien alta */}
                <div 
                  style={{
                    position: 'absolute',
                    width: '20px',
                    height: '120px',
                    background: 'linear-gradient(to bottom, #d97706 0%, #92400e 50%, #451a03 100%)',
                    transform: 'translateX(-10px) translateY(-60px) translateZ(-40px) rotateX(90deg)',
                    transformOrigin: 'center bottom',
                    borderRadius: '8px',
                    boxShadow: `
                      inset -3px 0 6px rgba(0,0,0,0.4),
                      inset 3px 0 6px rgba(255,255,255,0.1),
                      0 0 20px rgba(0,0,0,0.3)
                    `,
                    border: '1px solid #78350f'
                  }}
                />
                {/* Base de la pata en el suelo */}
                <div 
                  style={{
                    position: 'absolute',
                    width: '24px',
                    height: '24px',
                    background: 'radial-gradient(circle, #451a03, #1c0a00)',
                    transform: 'translateX(-12px) translateY(-12px) translateZ(-80px)',
                    borderRadius: '50%',
                    boxShadow: '0 0 15px rgba(0,0,0,0.6)'
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
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

        {/* Base del tablero (más grueso) - Solo visible en 3D */}
        {view3D && (
          <>
            {/* Laterales de la mesa para dar volumen */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-amber-800 to-amber-950"
              style={{
                width: '100%',
                height: '25px',
                bottom: '-25px',
                transform: 'rotateX(90deg) translateZ(12.5px)',
                transformOrigin: 'bottom',
                transformStyle: 'preserve-3d',
                borderRadius: table.shape === 'circle' ? '50%' : '8px'
              }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-r from-amber-700 to-amber-900"
              style={{
                width: '25px',
                height: '100%',
                right: '-25px',
                transform: 'rotateY(90deg) translateZ(12.5px)',
                transformOrigin: 'right',
                transformStyle: 'preserve-3d',
                borderRadius: table.shape === 'circle' ? '50%' : '8px'
              }}
            />
          </>
        )}
        
        {/* Base del tablero */}
        <div 
          className={`
            absolute inset-0 bg-gradient-to-b from-amber-900 to-amber-950
            ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
          `}
          style={{
            transform: view3D ? 'translateZ(100px)' : 'translateZ(5px)',  // Base más alta
            transformStyle: 'preserve-3d',
            boxShadow: view3D 
              ? '0 50px 100px rgba(0,0,0,0.5)'
              : '0 10px 20px rgba(0,0,0,0.3)'
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
            transform: view3D ? 'translateZ(120px)' : 'translateZ(20px)',  // Superficie más alta como cocina
            transformStyle: 'preserve-3d',
            boxShadow: view3D 
              ? '0 40px 60px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.2)'
              : '0 15px 35px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {/* Número de mesa */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white/90 rounded-full w-10 h-10 flex items-center justify-center font-bold text-gray-800">
              {table.number}
            </div>
          </div>

          {/* Capacidad - Solo mostrar en hover si no está seleccionada */}
          {isHovered && !isSelected && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Mesa {table.number} • {table.capacity} personas
            </div>
          )}
        </div>
        
        {/* Mini botones flotantes cuando está seleccionada en modo edición */}
        {isSelected && editMode && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-1 z-50">
            {/* Botón de información */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                toast.info(`Mesa ${table.number}: ${table.capacity} personas`, {
                  position: "top-center",
                  autoClose: 2000
                });
              }}
              className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.info || '#3B82F6',
                color: 'white'
              }}
              title="Información de la mesa"
            >
              <Users className="w-4 h-4" />
            </motion.button>
            
            {/* Botón de rotación - Para mesas rectangulares y cuadradas */}
            {table.shape !== 'circle' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  rotateSelectedElement(90); // Cambiar a 90 grados para rotar de vertical a horizontal
                }}
                className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: theme.colors.primary || '#10B981',
                  color: 'white'
                }}
                title="Rotar mesa 90°"
              >
                <RotateCw className="w-4 h-4" />
              </motion.button>
            )}
            
            {/* Botón de duplicar */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                duplicateSelectedElement();
              }}
              className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.success || '#10B981',
                color: 'white'
              }}
              title="Duplicar mesa"
            >
              <Copy className="w-4 h-4" />
            </motion.button>
            
            {/* Botón de eliminar */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                deleteSelectedElement();
              }}
              className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.error || '#EF4444',
                color: 'white'
              }}
              title="Eliminar mesa"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
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
      plant: view3D ? (
        // Versión 3D - Planta con altura menor pero consistente
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Sombra de la planta */}
          <div className="absolute inset-0 bg-black/30 blur-md"
               style={{ 
                 transform: 'translateZ(-5px) scale(1.1)',
                 borderRadius: '50%'
               }} />
          {/* Maceta - base */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #92400e, #78350f)',
                 transform: 'translateZ(20px)',
                 borderRadius: '50%'
               }} />
          {/* Follaje de la planta */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'radial-gradient(circle, #22c55e, #15803d)',
                 transform: 'translateZ(60px) scale(0.9)',  // Menor altura que objetos grandes
                 borderRadius: '50%',
                 border: '2px solid #16a34a',
                 boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)'
               }}>
            {/* Símbolo centrado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <TreePine className="text-green-900 w-6 h-6" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
            </div>
          </div>
        </div>
      ) : (
        // Versión 2D - Vista desde arriba
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-green-500 rounded-full opacity-80" />
          <TreePine className="absolute inset-0 text-green-700 p-2" />
        </div>
      ),
      bar: view3D ? (
        // Versión 3D - Barra con altura visible
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Sombra de la barra */}
          <div className="absolute inset-0 bg-black/40 blur-md"
               style={{ 
                 transform: 'translateZ(-10px) scale(1.1)',
                 borderRadius: '8px'
               }} />
          {/* Laterales de la barra (efecto 3D) */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #2d3748, #1a202c)',
                 transform: `translateZ(45px) rotateY(${barRotation}deg) scale(0.95)`,
                 borderRadius: '8px'
               }} />
          {/* Superficie de la barra - más alta y visible */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(135deg, #4a5568, #2d3748)',
                 transform: `translateZ(120px) scale(0.95) rotateY(${barRotation}deg)`,
                 borderRadius: '8px',
                 border: '3px solid #718096',
                 boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)'
               }}>
            {/* Ícono centrado de barra */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Wine className="text-gray-300 w-10 h-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
            </div>
          </div>
          {/* Botellitas ENCIMA de la superficie de la barra */}
          {view3D && (
            <div className="absolute inset-0 flex items-center justify-evenly px-4"
                 style={{ transform: `translateZ(125px) rotateY(${barRotation}deg)` }}> {/* Por encima de 120px de la superficie */}
              {/* Botellas proporcionales al tamaño de la barra */}
              {[...Array(4)].map((_, i) => {
                const types = [
                  { height: '25px', color: 'linear-gradient(to top, #047857, #10b981, #34d399)' },
                  { height: '15px', color: 'linear-gradient(to top, #e5e7eb, #f9fafb)', isGlass: true },
                  { height: '23px', color: 'linear-gradient(to top, #92400e, #f59e0b, #fbbf24)' },
                  { height: '27px', color: 'linear-gradient(to top, #1e40af, #3b82f6, #60a5fa)' }
                ];
                const bottle = types[i % types.length];
                return (
                  <div key={i} style={{
                    position: 'relative',
                    width: bottle.isGlass ? '12px' : '10px',
                    height: bottle.height,
                    background: bottle.color,
                    borderRadius: bottle.isGlass ? '0 0 3px 3px' : '3px 3px 6px 6px',
                    boxShadow: '0 -2px 4px rgba(0,0,0,0.5)', // Sombra hacia abajo
                    border: bottle.isGlass ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.3)'
                  }} />
                );
              })}
            </div>
          )}
          
          {/* Controles de rotación para la barra */}
          {editMode && (
            <div className="absolute -top-8 left-0 flex gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setBarRotation(0); }}
                className="w-6 h-6 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                title="Horizontal"
              >H</button>
              <button 
                onClick={(e) => { e.stopPropagation(); setBarRotation(90); }}
                className="w-6 h-6 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                title="Vertical"
              >V</button>
              <button 
                onClick={(e) => { e.stopPropagation(); setBarRotation(barRotation - 15); }}
                className="w-6 h-6 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                title="Rotar izquierda"
              >←</button>
              <button 
                onClick={(e) => { e.stopPropagation(); setBarRotation(barRotation + 15); }}
                className="w-6 h-6 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                title="Rotar derecha"
              >→</button>
            </div>
          )}
        </div>
      ) : (
        // Versión 2D - Vista desde arriba (MISMO COLOR QUE 3D)
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg border-2 border-gray-500" />
          <Wine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-300 w-1/2 h-1/2" />
        </div>
      ),
      kitchen: view3D ? (
        // Versión 3D - Cocina ESTANDARIZADA con misma altura que bar y baño
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Sombra de la cocina */}
          <div className="absolute inset-0 bg-black/40 blur-md"
               style={{ 
                 transform: 'translateZ(-10px) scale(1.1)',
                 borderRadius: '8px'
               }} />
          {/* Laterales de la cocina (efecto 3D) */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #ef4444, #dc2626)',
                 transform: 'translateZ(45px) scale(0.95)',
                 borderRadius: '8px'
               }} />
          {/* Superficie con hornallas - MISMA ALTURA QUE BAR Y BAÑO */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                 transform: 'translateZ(120px) scale(0.95)',  // ESTANDARIZADO A 120px
                 borderRadius: '8px',
                 border: '3px solid #fca5a5',
                 boxShadow: 'inset 0 2px 4px rgba(239,68,68,0.2), 0 4px 8px rgba(0,0,0,0.3)'
               }}>
            {/* Grid de hornallas */}
            <div className="absolute inset-0 p-3 grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} 
                     className="relative"
                     style={{
                       background: 'radial-gradient(circle, #1f2937, #374151)',
                       borderRadius: '50%',
                       boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)'
                     }}>
                  {/* Llama simulada con variación */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame 
                      className={`w-5 h-5 ${i % 3 === 0 ? 'text-orange-400' : 'text-blue-400'} opacity-80`} 
                      style={{ 
                        filter: `drop-shadow(0 0 3px rgba(${i % 3 === 0 ? '251,146,60' : '59,130,246'},0.5))`,
                        transform: `scale(${0.8 + (i % 4) * 0.1})`
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Ícono de chef centrado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-red-800" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
            </div>
          </div>
        </div>
      ) : (
        // Versión 2D - Vista desde arriba (MISMO COLOR QUE 3D)
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200 rounded-lg border-2 border-red-300" />
          <ChefHat className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-800 w-1/2 h-1/2" />
        </div>
      ),
      entrance: view3D ? (
        // Versión 3D - Entrada con arco
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Arco de entrada */}
          <div className="absolute inset-x-0 top-0"
               style={{ 
                 height: '80%',
                 background: 'linear-gradient(to bottom, transparent, #6b7280 20%, #6b7280 80%, transparent)',
                 transform: 'rotateX(90deg) translateZ(100px)',  // Arco más alto
                 transformOrigin: 'bottom',
                 borderRadius: '50% 50% 0 0',
                 boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
               }} />
          {/* Piso de entrada */}
          <div className="absolute inset-x-0 bottom-0"
               style={{ 
                 height: '20%',
                 background: 'linear-gradient(to right, #fbbf24, #f59e0b, #fbbf24)',
                 transform: 'translateZ(5px)',
                 boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
               }} />
        </div>
      ) : (
        // Versión 2D - Vista desde arriba
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-gray-500 to-transparent rounded" />
        </div>
      ),
      wall: (
        // Pared igual en 2D y 3D
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded border border-gray-400" />
        </div>
      ),
      column: view3D ? (
        // Versión 3D - Columna estructural alta
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Sombra de la columna */}
          <div className="absolute inset-0 bg-black/50 blur-sm"
               style={{ 
                 transform: 'translateZ(-5px) scale(1.2)',
                 borderRadius: '50%'
               }} />
          {/* Cuerpo de la columna - se extiende verticalmente */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #d4d4d8, #a1a1aa)',
                 transform: 'translateZ(80px)',
                 borderRadius: '50%'
               }} />
          {/* Tope de la columna - altura estructural alta */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
                 transform: 'translateZ(150px) scale(0.95)',  // MÁS ALTA que otros objetos
                 borderRadius: '50%',
                 border: '3px solid #6b7280',
                 boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.4)'
               }}>
            {/* Centro oscuro para dar profundidad */}
            <div className="absolute inset-2 bg-gray-800 rounded-full opacity-30" />
          </div>
        </div>
      ) : (
        // Versión 2D - Vista desde arriba
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border border-gray-500" />
        </div>
      ),
      divider: view3D ? (
        // Versión 3D - Divisor/Biombo
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Panel del divisor */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #d4d4d8, #71717a)',
                 transform: 'rotateX(85deg) translateZ(100px)',  // Divisor más alto
                 transformOrigin: 'bottom',
                 borderRadius: '4px',
                 boxShadow: '0 -10px 25px rgba(0,0,0,0.3)'
               }}>
            {/* Líneas decorativas */}
            <div className="absolute inset-0 flex flex-col justify-around p-1">
              <div className="h-0.5 bg-gray-600 opacity-30" />
              <div className="h-0.5 bg-gray-600 opacity-30" />
              <div className="h-0.5 bg-gray-600 opacity-30" />
            </div>
          </div>
        </div>
      ) : (
        // Versión 2D - Vista desde arriba  
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gradient-to-b from-gray-400 to-gray-600" />
        </div>
      ),
      door: (
        // Puerta igual en 2D y 3D
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-700 rounded" />
          <DoorOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-900 w-6 h-6" />
        </div>
      ),
      bathroom: view3D ? (
        // Versión 3D - Baño con efecto de altura visible
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Sombra del baño */}
          <div className="absolute inset-0 bg-black/40 blur-md"
               style={{ 
                 transform: 'translateZ(-10px) scale(1.1)',
                 borderRadius: '8px'
               }} />
          {/* Paredes laterales del baño (efecto 3D) */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #60a5fa, #3b82f6)',
                 transform: 'translateZ(45px) scale(0.95)',
                 borderRadius: '8px'
               }} />
          {/* Superficie del baño - elevada y visible */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                 transform: 'translateZ(120px) scale(0.95)',
                 borderRadius: '8px',
                 border: '3px solid #93c5fd',
                 boxShadow: 'inset 0 2px 4px rgba(59,130,246,0.2), 0 4px 8px rgba(0,0,0,0.3)'
               }}>
            {/* Símbolo centrado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Bath className="text-blue-700 w-12 h-12" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </div>
            {/* Indicador WC */}
            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-blue-900 text-xs font-bold shadow-md">WC</div>
          </div>
          {/* Efecto de puerta */}
          <div className="absolute right-0 top-1/4 bottom-1/4"
               style={{
                 width: '4px',
                 background: 'linear-gradient(to bottom, #1e40af, #2563eb)',
                 transform: 'translateZ(120px)',
                 borderRadius: '2px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
               }} />
        </div>
      ) : (
        // Versión 2D - Vista desde arriba (MISMO COLOR QUE 3D)
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300" />
          <Bath className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-700 w-8 h-8" />
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-blue-900 text-xs font-bold">WC</div>
        </div>
      ),
      restroom: view3D ? (
        // Versión 3D - Baño familiar con altura visible
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Sombra del restroom */}
          <div className="absolute inset-0 bg-black/40 blur-md"
               style={{ 
                 transform: 'translateZ(-10px) scale(1.1)',
                 borderRadius: '8px'
               }} />
          {/* Paredes laterales del restroom (efecto 3D) */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(to bottom, #a78bfa, #8b5cf6)',
                 transform: 'translateZ(45px)',
                 borderRadius: '8px'
               }} />
          {/* Superficie del restroom - elevada y visible */}
          <div className="absolute inset-0"
               style={{ 
                 background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                 transform: 'translateZ(120px) scale(0.95)',
                 borderRadius: '8px',
                 border: '3px solid #c4b5fd',
                 boxShadow: 'inset 0 2px 4px rgba(139,92,246,0.2), 0 4px 8px rgba(0,0,0,0.3)'
               }}>
            {/* Símbolos centrados */}
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <Bath className="text-purple-700 w-10 h-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              <Users className="text-purple-700 w-8 h-8" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </div>
            {/* Indicador de accesibilidad */}
            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-purple-900 text-lg font-bold shadow-md">♿</div>
          </div>
          {/* Efecto de puerta doble */}
          <div className="absolute right-0 top-1/4 bottom-1/4 flex gap-1"
               style={{ transform: 'translateZ(120px)' }}>
            <div style={{
              width: '3px',
              height: '100%',
              background: 'linear-gradient(to bottom, #6b21a8, #7c3aed)',
              borderRadius: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }} />
            <div style={{
              width: '3px',
              height: '100%',
              background: 'linear-gradient(to bottom, #6b21a8, #7c3aed)',
              borderRadius: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }} />
          </div>
        </div>
      ) : (
        // Versión 2D - Vista desde arriba (MISMO COLOR QUE 3D)
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg border-2 border-purple-300" />
          <Bath className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-700 w-6 h-6" />
          <Users className="absolute top-1/2 left-1/2 transform translate-x-2 -translate-y-1/2 text-purple-700 w-4 h-4" />
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-purple-900 text-xs font-bold">♿</div>
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
          transformStyle: view3D ? 'preserve-3d' : 'flat'
        }}
        initial={{ x: obj.x, y: obj.y }}
        animate={{ x: obj.x, y: obj.y }}
        whileHover={{ scale: editMode && !obj.locked ? 1.05 : 1 }}
        drag={editMode && !obj.locked}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{
          left: 20,
          top: 20,
          right: floorDimensions.width - obj.width - 20,
          bottom: floorDimensions.height - obj.height - 20
        }}
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
        <div 
          className={`relative w-full h-full ${obj.locked ? 'opacity-50' : ''}`}
          style={{ transformStyle: view3D ? 'preserve-3d' : 'flat' }}
        >
          {objectIcons[obj.type]}
          
          {/* Indicador de bloqueado */}
          {obj.locked && (
            <Lock className="absolute top-0 right-0 w-4 h-4 text-red-500" />
          )}
          
          {/* Controles de objeto decorativo - girar, clonar, eliminar */}
          {editMode && isSelected && !obj.locked && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-1">
              <button 
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  const updatedObj = { ...obj, rotation: (obj.rotation + 45) % 360 };
                  setDecorativeObjects(decorativeObjects.map(o => 
                    o.id === obj.id ? updatedObj : o
                  ));
                  await updateDecorativeObject(updatedObj);
                }}
                className="w-5 h-5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                title="Girar 45°"
              >↻</button>
              <button 
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  const newObj = { ...obj, id: `obj_${Date.now()}`, x: obj.x + 20, y: obj.y + 20 };
                  setDecorativeObjects([...decorativeObjects, newObj]);
                  await saveDecorativeObject(newObj);
                }}
                className="w-5 h-5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                title="Clonar"
              >⎘</button>
              <button 
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  setDecorativeObjects(decorativeObjects.filter(o => o.id !== obj.id));
                  await deleteDecorativeObjectFromDB(obj.id);
                  setSelectedElement(null);
                }}
                className="w-5 h-5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                title="Eliminar"
              >✕</button>
            </div>
          )}
        </div>

        {/* Tooltip */}
        {(isHovered || isSelected) && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {obj.type} {obj.locked ? '(bloqueado)' : ''}
          </div>
        )}

      </motion.div>
    );
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} flex flex-col`} style={{ backgroundColor: theme.colors.background }}>
      {/* Header unificado con título y controles */}
      <div 
        className={`border-b px-6 py-3 ${isFullscreen ? 'absolute top-0 left-0 right-0 z-10' : ''}`}
        style={{ 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.glassBorder
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Título */}
            {!isFullscreen && (
              <div>
                <h1 className="text-xl font-semibold" style={{ color: theme.colors.text }}>Gestión de Mesas</h1>
                <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>Administra la distribución del restaurante</p>
              </div>
            )}
            
            {/* Paneles de ambientes */}
            <div className="flex items-center gap-2 rounded-lg p-1" style={{ backgroundColor: theme.colors.glass || 'rgba(0,0,0,0.05)' }}>
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvironment(env.id)}
                  className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2`}
                  style={{
                    backgroundColor: selectedEnvironment === env.id ? theme.colors.surface : 'transparent',
                    color: selectedEnvironment === env.id ? theme.colors.text : theme.colors.textMuted,
                    borderColor: selectedEnvironment === env.id ? theme.colors.glassBorder : 'transparent',
                    borderWidth: selectedEnvironment === env.id ? '1px' : '0'
                  }}
                >
                  <span className="text-lg">{env.icon}</span>
                  <span className="text-sm">{env.name}</span>
                </button>
              ))}
            </div>
            
            {/* Modo edición con menús desplegables */}
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  setShowEditControls(!editMode);
                  if (editMode) {
                    setShowTableMenu(false);
                    setShowObjectMenu(false);
                  }
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: editMode ? theme.colors.primary : theme.colors.glass,
                  color: editMode ? 'white' : theme.colors.text
                }}
              >
                {editMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {editMode ? 'Modo Edición' : 'Modo Vista'}
              </button>
              
              {/* Botones de agregar con menús desplegables */}
              <AnimatePresence>
                {showEditControls && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    {/* Botón Agregar Mesa */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowTableMenu(!showTableMenu);
                          setShowObjectMenu(false);
                        }}
                        className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1 ml-1"
                        style={{
                          backgroundColor: showTableMenu ? theme.colors.primary : theme.colors.glass,
                          color: showTableMenu ? 'white' : theme.colors.text
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <Square className="w-4 h-4" />
                        <ChevronDown className={`w-3 h-3 transition-transform ${showTableMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Menú desplegable de mesas */}
                      <AnimatePresence>
                        {showTableMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute top-full left-0 mt-2 p-2 rounded-xl shadow-xl border z-50 min-w-[220px]"
                            style={{
                              backgroundColor: theme.colors.surface || theme.colors.background,
                              borderColor: theme.colors.glassBorder,
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <div className="space-y-1">
                              {/* Mesas predefinidas rápidas */}
                              {[
                                { type: 'Redonda 2', shape: 'circle', capacity: 2, icon: '○' },
                                { type: 'Redonda 4', shape: 'circle', capacity: 4, icon: '○' },
                                { type: 'Cuadrada 2', shape: 'square', capacity: 2, icon: '□' },
                                { type: 'Cuadrada 4', shape: 'square', capacity: 4, icon: '□' },
                                { type: 'Rectangular 6', shape: 'rectangle', capacity: 6, icon: '▭' },
                                { type: 'Rectangular 8', shape: 'rectangle', capacity: 8, icon: '▭' },
                              ].map((preset) => (
                                <motion.button
                                  key={preset.type}
                                  whileHover={{ x: 4, backgroundColor: theme.colors.glass }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all text-sm group"
                                  style={{ color: theme.colors.text }}
                                  onClick={() => {
                                    setSelectedShape(preset.shape);
                                    setSelectedCapacity(preset.capacity);
                                    addNewTable();
                                    setShowTableMenu(false);
                                  }}
                                >
                                  <span 
                                    className="text-lg opacity-60 group-hover:opacity-100 transition-opacity"
                                    style={{ color: theme.colors.primary }}
                                  >
                                    {preset.icon}
                                  </span>
                                  <div className="flex-1">
                                    <div className="font-medium">{preset.type}</div>
                                    <div className="text-xs opacity-60">
                                      {preset.capacity} personas
                                    </div>
                                  </div>
                                  <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.button>
                              ))}
                              
                              {/* Separador */}
                              <div className="my-2 border-t" style={{ borderColor: theme.colors.glassBorder }} />
                              
                              {/* Mesa personalizada */}
                              <div className="p-2">
                                <div className="text-xs font-medium mb-2" style={{ color: theme.colors.textMuted }}>
                                  Personalizar Mesa
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <select 
                                    value={selectedShape}
                                    onChange={(e) => setSelectedShape(e.target.value as any)}
                                    className="px-2 py-1 rounded border text-xs"
                                    style={{
                                      backgroundColor: theme.colors.background,
                                      borderColor: theme.colors.glassBorder,
                                      color: theme.colors.text
                                    }}
                                  >
                                    <option value="square">□ Cuadrada</option>
                                    <option value="circle">○ Redonda</option>
                                    <option value="rectangle">▭ Rectangular</option>
                                  </select>
                                  
                                  <select
                                    value={selectedCapacity}
                                    onChange={(e) => setSelectedCapacity(Number(e.target.value))}
                                    className="px-2 py-1 rounded border text-xs"
                                    style={{
                                      backgroundColor: theme.colors.background,
                                      borderColor: theme.colors.glassBorder,
                                      color: theme.colors.text
                                    }}
                                  >
                                    {[2, 4, 6, 8, 10, 12].map(cap => (
                                      <option key={cap} value={cap}>{cap} pers.</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    addNewTable();
                                    setShowTableMenu(false);
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg text-white font-medium text-xs transition-all mt-2"
                                  style={{
                                    backgroundColor: theme.colors.primary,
                                    boxShadow: `0 2px 8px ${theme.colors.primary}40`
                                  }}
                                >
                                  Crear Mesa Personalizada
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Botón Agregar Objeto */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowObjectMenu(!showObjectMenu);
                          setShowTableMenu(false);
                        }}
                        className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1 ml-1"
                        style={{
                          backgroundColor: showObjectMenu ? theme.colors.primary : theme.colors.glass,
                          color: showObjectMenu ? 'white' : theme.colors.text
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <TreePine className="w-4 h-4" />
                        <ChevronDown className={`w-3 h-3 transition-transform ${showObjectMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Menú desplegable de objetos */}
                      <AnimatePresence>
                        {showObjectMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-1 p-3 rounded-lg shadow-lg border z-50 min-w-[200px]"
                            style={{
                              backgroundColor: theme.colors.surface || theme.colors.background,
                              borderColor: theme.colors.glassBorder
                            }}
                          >
                            <div className="space-y-2">
                              <label className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>Tipo de Objeto</label>
                              <select
                                value={selectedObjectType}
                                onChange={(e) => setSelectedObjectType(e.target.value as any)}
                                className="w-full px-2 py-1 rounded border text-sm"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  borderColor: theme.colors.glassBorder,
                                  color: theme.colors.text
                                }}
                              >
                                <option value="plant">🌿 Planta</option>
                                <option value="bar">🍷 Barra</option>
                                <option value="kitchen">👨‍🍳 Cocina</option>
                                <option value="entrance">🚪 Entrada</option>
                                <option value="wall">🧱 Pared</option>
                                <option value="column">⚫ Columna</option>
                                <option value="divider">➖ Divisor</option>
                                <option value="door">🚪 Puerta</option>
                                <option value="bathroom">🚽 Baño</option>
                                <option value="restroom">♿ Baño Accesible</option>
                              </select>
                              
                              <button
                                onClick={() => {
                                  addDecorativeObject();
                                  setShowObjectMenu(false);
                                }}
                                className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm transition-colors"
                                style={{
                                  backgroundColor: theme.colors.primary
                                }}
                              >
                                Agregar Objeto
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Controles de zoom y vista */}
          <div className="flex items-center gap-2">
            {/* Zoom */}
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: theme.colors.glass || 'rgba(0,0,0,0.05)' }}>
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

            {/* Botón de ajustar al viewport */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fitToViewport}
              className="p-2 rounded-lg transition-colors group relative"
              style={{
                backgroundColor: theme.colors.glass,
                color: theme.colors.text
              }}
              title="Ajustar plano al espacio disponible"
            >
              <Expand className="w-5 h-5" />
              
              {/* Tooltip mejorado */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Ajustar al viewport
              </div>
            </motion.button>

            {/* Botón de pantalla completa */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isFullscreen ? `${theme.colors.primary}20` : theme.colors.glass,
                color: isFullscreen ? theme.colors.primary : theme.colors.text
              }}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Toggle 3D/2D con animación */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const newView3D = !view3D;
                console.log('Cambiando a modo 3D:', newView3D);
                setView3D(newView3D);
                // Ajustar zoom automáticamente para mejor vista 3D
                if (newView3D) {
                  setZoomLevel(0.6); // Zoom reducido para mayor inclinación
                  setPanX(0);
                  setPanY(-120); // Más compensación para 50 grados
                } else {
                  fitToViewport(); // Volver a ajustar al viewport en 2D
                }
              }}
              className="p-2 rounded-lg flex items-center gap-1 relative overflow-hidden"
              style={{
                backgroundColor: view3D ? theme.colors.primary : theme.colors.glass,
                color: view3D ? 'white' : theme.colors.text,
                boxShadow: view3D ? `0 4px 12px ${theme.colors.primary}40` : 'none'
              }}
              title={view3D ? 'Cambiar a vista 2D (plana)' : 'Cambiar a vista 3D (perspectiva)'}
            >
              <motion.div
                animate={{ rotateY: view3D ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Layers className="w-5 h-5" />
              </motion.div>
              <span className="text-xs font-medium">{view3D ? '3D' : '2D'}</span>
              
              {/* Efecto de brillo animado cuando está en 3D */}
              {view3D && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                />
              )}
            </motion.button>

            {/* Guardar */}
            {editMode && (
              <button
                onClick={saveLayout}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: theme.colors.secondary || theme.colors.primary,
                  color: 'white'
                }}
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Área del plano con perspectiva 3D */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center"
           style={{
             perspective: view3D ? '1200px' : 'none',
             perspectiveOrigin: 'center center',
             transformStyle: 'preserve-3d'
           }}>
        <div 
          ref={floorRef}
          className="absolute inset-0 overflow-hidden flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d'
          }}
          onMouseDown={(e) => {
            // Pan con botón medio o Ctrl + Click (funciona en ambos modos)
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
              e.preventDefault();
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
          onMouseUp={() => {
            setIsPanning(false);
          }}
          onMouseLeave={() => {
            setIsPanning(false);
          }}
        >
          <motion.div 
            className="relative"
            initial={false}
            transition={{
              duration: 0.8,
              ease: "easeInOut"
            }}
            style={{
              width: `${floorDimensions.width}px`,
              height: `${floorDimensions.height}px`,
              transformOrigin: 'center center',
              transformStyle: 'preserve-3d',
              cursor: isPanning ? 'grabbing' : 'default',
              transform: view3D 
                ? `translateX(${panX}px) translateY(${panY}px) scale(${zoomLevel}) rotateX(50deg)` 
                : `translateX(${panX}px) translateY(${panY}px) scale(${zoomLevel})`
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
                   transform: 'translateZ(0px)', // Plano para drag & drop
                   boxShadow: '0 10px 20px rgba(0,0,0,0.1), inset 0 0 30px rgba(139, 69, 19, 0.1)'
                 }}>
              {/* Patrón de piso específico por ambiente */}
              {renderFloorPattern(currentEnvironment)}
              
              {/* Manijas de redimensión - Solo esquina inferior derecha y bordes */}
              {editMode && (
                <>
                  {/* Borde derecho */}
                  <motion.div
                    className="absolute top-1/4 bottom-1/4 right-0 w-1 cursor-ew-resize hover:bg-opacity-100 transition-all"
                    style={{ 
                      right: -5,
                      backgroundColor: theme.colors.primary + '40',
                      zIndex: 999
                    }}
                    whileHover={{ 
                      backgroundColor: theme.colors.primary,
                      width: 3
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizingFloor('e');
                      setResizeStart({ 
                        x: e.clientX, 
                        y: e.clientY, 
                        width: floorDimensions.width, 
                        height: floorDimensions.height 
                      });
                    }}
                  />
                  
                  {/* Borde inferior */}
                  <motion.div
                    className="absolute left-1/4 right-1/4 bottom-0 h-1 cursor-ns-resize hover:bg-opacity-100 transition-all"
                    style={{ 
                      bottom: -5,
                      backgroundColor: theme.colors.primary + '40',
                      zIndex: 999
                    }}
                    whileHover={{ 
                      backgroundColor: theme.colors.primary,
                      height: 3
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizingFloor('s');
                      setResizeStart({ 
                        x: e.clientX, 
                        y: e.clientY, 
                        width: floorDimensions.width, 
                        height: floorDimensions.height 
                      });
                    }}
                  />
                  
                  {/* Esquina inferior derecha - Principal */}
                  <motion.div
                    className="absolute w-8 h-8 cursor-se-resize shadow-lg group"
                    style={{ 
                      bottom: -12, 
                      right: -12,
                      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primary}DD 100%)`,
                      borderRadius: '50%',
                      zIndex: 1000,
                      border: `3px solid ${theme.colors.background}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizingFloor('se');
                      setResizeStart({ 
                        x: e.clientX, 
                        y: e.clientY, 
                        width: floorDimensions.width, 
                        height: floorDimensions.height 
                      });
                    }}
                    title="Arrastra para redimensionar el plano"
                  >
                    <Maximize2 className="w-4 h-4 text-white transform rotate-45" />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Redimensionar plano
                    </div>
                  </motion.div>
                  
                  {/* Indicador de dimensiones */}
                  <motion.div 
                    className="absolute top-2 left-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md"
                    initial={{ opacity: 0.7 }}
                    animate={{ 
                      opacity: isResizingFloor ? 1 : 0.7,
                      scale: isResizingFloor ? 1.05 : 1
                    }}
                    style={{ 
                      backgroundColor: isResizingFloor 
                        ? theme.colors.primary + 'F0' 
                        : theme.colors.surface + 'EE',
                      color: isResizingFloor ? 'white' : theme.colors.text,
                      border: `1px solid ${isResizingFloor ? theme.colors.primary : theme.colors.glassBorder}`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-3 h-3" />
                      <span>{Math.round(floorDimensions.width)} x {Math.round(floorDimensions.height)} px</span>
                    </div>
                  </motion.div>
                  
                  {/* Líneas guía durante redimensión */}
                  {isResizingFloor && (
                    <>
                      <div 
                        className="absolute top-0 left-0 right-0 h-px opacity-50"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-px opacity-50"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 left-0 w-px opacity-50"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 right-0 w-px opacity-50"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Renderizar objetos decorativos primero (están detrás) */}
            {decorativeObjects.map(obj => renderDecorativeObject(obj))}

            {/* Renderizar mesas */}
            {tables.map(table => renderTable(table))}
          </motion.div>
        </div>


        {/* Indicador de estado */}
        <div className="absolute bottom-4 left-4 rounded-lg shadow-lg p-2 flex items-center gap-4"
             style={{ 
               backgroundColor: theme.colors.surface || theme.colors.background,
               borderColor: theme.colors.glassBorder || '#e5e7eb'
             }}>
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