import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import {
  X,
  Plus,
  Save,
  Upload,
  Maximize2,
  Minimize2,
  Move,
  RotateCw,
  Trash2,
  Edit2,
  Users,
  Grid,
  Eye,
  EyeOff,
  Square,
  Circle,
  RectangleHorizontal,
  ZoomIn,
  ZoomOut,
  Image,
  Layers
} from 'lucide-react';
import { toast } from '../lib/toast';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: 'square' | 'circle' | 'rectangle';
  type?: 'table' | 'decoration';
  decorationType?: 'plant' | 'column' | 'divider' | 'bar' | 'entrance' | 'kitchen';
}

interface TableLayoutDesignerProps {
  tables: Table[];
  onSave: (tables: Table[], backgroundImage?: string) => void;
  backgroundImage?: string;
  readOnly?: boolean;
}


export const TableLayoutDesigner: React.FC<TableLayoutDesignerProps> = ({
  tables: initialTables,
  onSave,
  backgroundImage: initialBackground,
  readOnly = false
}) => {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(initialBackground || null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTable, setDraggedTable] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(0.8);
  const [editMode, setEditMode] = useState(!readOnly);
  const [backgroundOffsetY, setBackgroundOffsetY] = useState(50); // Offset inicial de 50px hacia abajo
  const [backgroundOffsetX, setBackgroundOffsetX] = useState(0); // Offset horizontal
  const [addMode, setAddMode] = useState<'table' | 'decoration'>('table');
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const [bgDragStart, setBgDragStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const designAreaRef = useRef<HTMLDivElement>(null);

  // Manejo de subida de imagen
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBackgroundImage(result);

        // Guardar inmediatamente en localStorage
        const layoutSettings = {
          backgroundImage: result,
          backgroundOffsetY: backgroundOffsetY,
          backgroundOffsetX: backgroundOffsetX
        };
        localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));

        toast.success('Imagen cargada y guardada correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejo de drag & drop
  const handleMouseDown = (e: React.MouseEvent, tableId: number) => {
    if (!editMode) return;

    e.preventDefault();
    setIsDragging(true);
    setDraggedTable(tableId);
    setSelectedTable(tableId);

    const table = tables.find(t => t.id === tableId);
    if (table && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) / zoom - table.x,
        y: (e.clientY - rect.top) / zoom - table.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Si estamos arrastrando el fondo
    if (isDraggingBackground && backgroundImage && editMode) {
      const deltaX = e.clientX - bgDragStart.x;
      const deltaY = e.clientY - bgDragStart.y;
      
      setBackgroundOffsetX(bgDragStart.offsetX + deltaX);
      setBackgroundOffsetY(bgDragStart.offsetY + deltaY);
      return;
    }

    // Si estamos arrastrando una mesa
    if (!isDragging || draggedTable === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top) / zoom - dragOffset.y;

    // Snap to grid si está activado
    const snapToGrid = (value: number, gridSize: number = 20) => {
      return showGrid ? Math.round(value / gridSize) * gridSize : value;
    };

    setTables(prev => prev.map(table =>
      table.id === draggedTable
        ? { ...table, x: snapToGrid(x), y: snapToGrid(y) }
        : table
    ));
  };

  const handleMouseUp = () => {
    // Si estábamos arrastrando el fondo, guardar la posición
    if (isDraggingBackground && backgroundImage) {
      const layoutSettings = {
        backgroundImage,
        backgroundOffsetX,
        backgroundOffsetY
      };
      localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));
    }
    
    setIsDragging(false);
    setDraggedTable(null);
    setIsDraggingBackground(false);
  };

  // Agregar nueva mesa
  const addTable = () => {
    const tableCount = tables.filter(t => t.type !== 'decoration').length;
    const newTable: Table = {
      id: Date.now(),
      number: tableCount + 1,
      capacity: 4,
      status: 'available',
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      shape: 'square',
      rotation: 0,
      type: 'table'
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable.id);
  };

  // Agregar decoración
  const addDecoration = (decorationType: Table['decorationType']) => {
    const sizes = {
      plant: { width: 40, height: 40 },
      column: { width: 50, height: 50 },
      divider: { width: 100, height: 20 },
      bar: { width: 150, height: 60 },
      entrance: { width: 80, height: 30 },
      kitchen: { width: 120, height: 80 }
    };

    const newDecoration: Table = {
      id: Date.now(),
      number: 0,
      capacity: 0,
      status: 'available',
      x: 150,
      y: 150,
      width: sizes[decorationType!].width,
      height: sizes[decorationType!].height,
      shape: decorationType === 'plant' ? 'circle' : 'rectangle',
      rotation: 0,
      type: 'decoration',
      decorationType
    };
    setTables([...tables, newDecoration]);
    setSelectedTable(newDecoration.id);
  };

  // Eliminar mesa
  const deleteTable = (tableId: number) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
    setSelectedTable(null);
  };

  // Rotar mesa
  const rotateTable = (tableId: number, angle: number) => {
    setTables(prev => prev.map(table =>
      table.id === tableId
        ? { ...table, rotation: ((table.rotation || 0) + angle) % 360 }
        : table
    ));
  };

  // Cambiar forma de mesa
  const changeTableShape = (tableId: number, shape: 'square' | 'circle' | 'rectangle') => {
    setTables(prev => prev.map(table =>
      table.id === tableId
        ? {
          ...table,
          shape,
          width: shape === 'rectangle' ? 120 : 80,
          height: shape === 'rectangle' ? 60 : 80
        }
        : table
    ));
  };

  // Actualizar capacidad de mesa
  const updateTableCapacity = (tableId: number, capacity: number) => {
    setTables(prev => prev.map(table =>
      table.id === tableId
        ? { ...table, capacity }
        : table
    ));
  };

  // Guardar layout
  const handleSave = async () => {
    try {
      // Guardar también la posición del fondo en localStorage
      if (backgroundImage) {
        const layoutSettings = {
          backgroundImage,
          backgroundOffsetY,
          backgroundOffsetX
        };
        localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));
      }

      // Guardar configuración del mapa en la base de datos
      const mapSettings = {
        map_x_position: backgroundOffsetX,
        map_y_position: backgroundOffsetY,
        global_zoom: zoom,
        grid_enabled: showGrid,
        snap_to_grid: showGrid,
        grid_color: '#E5E7EB',
        canvas_width: containerRef.current?.offsetWidth || 1200,
        canvas_height: containerRef.current?.offsetHeight || 800,
        auto_save: true,
        company_id: 1
      };

      // Guardar configuración del mapa
      await fetch(`${API_BASE_URL}/api/map-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapSettings)
      });

      // Si hay un área seleccionada, guardar configuración del área
      // Por ahora usamos área 1 como default
      const areaId = 1; // TODO: Obtener área actual del contexto
      const areaSettings = {
        final_x_position: backgroundOffsetX,
        final_y_position: backgroundOffsetY,
        zoom_level: zoom,
        grid_size: 20,
        show_grid: showGrid,
        background_color: '#F3F4F6',
        company_id: 1
      };

      await fetch(`${API_BASE_URL}/api/area-settings/${areaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(areaSettings)
      });

      // Llamar a la función onSave original
      await onSave(tables, backgroundImage || undefined);
      toast.success('Layout y configuración guardados correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar el layout');
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Ajustar zoom para que todo sea visible
  const fitToScreen = () => {
    if (!containerRef.current || tables.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height - 60; // Restar altura de toolbar

    // Encontrar los límites del contenido
    let maxX = 0;
    let maxY = 0;

    tables.forEach(table => {
      const tableRight = table.x + (table.width || 80);
      const tableBottom = table.y + (table.height || 80);
      if (tableRight > maxX) maxX = tableRight;
      if (tableBottom > maxY) maxY = tableBottom;
    });

    // Agregar padding
    maxX += 100;
    maxY += 100;

    // Calcular el zoom necesario para que todo quepa
    const zoomX = containerWidth / maxX;
    const zoomY = containerHeight / maxY;
    const newZoom = Math.min(zoomX, zoomY, 1.5); // Máximo 150%

    setZoom(Math.max(0.3, newZoom)); // Mínimo 30%
  };

  // Auto ajustar al cargar
  useEffect(() => {
    setTimeout(() => {
      fitToScreen();
    }, 100);
  }, [tables.length]);

  // Cargar configuración del fondo al iniciar
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Cargar configuración del mapa desde la base de datos
        const mapResponse = await fetch(`${API_BASE_URL}/api/map-settings?company_id=1`);
        if (mapResponse.ok) {
          const mapSettings = await mapResponse.json();
          if (mapSettings) {
            setZoom(mapSettings.global_zoom || 0.8);
            setShowGrid(mapSettings.grid_enabled || true);
            if (mapSettings.map_x_position !== undefined) {
              setBackgroundOffsetX(mapSettings.map_x_position);
            }
            if (mapSettings.map_y_position !== undefined) {
              setBackgroundOffsetY(mapSettings.map_y_position);
            }
          }
        }

        // Cargar configuración del área
        const areaId = 1; // TODO: Obtener área actual del contexto
        const areaResponse = await fetch(`${API_BASE_URL}/api/area-settings/${areaId}?company_id=1`);
        if (areaResponse.ok) {
          const areaSettings = await areaResponse.json();
          if (areaSettings) {
            if (areaSettings.zoom_level) {
              setZoom(areaSettings.zoom_level);
            }
            if (areaSettings.show_grid !== undefined) {
              setShowGrid(areaSettings.show_grid);
            }
            if (areaSettings.final_x_position !== undefined) {
              setBackgroundOffsetX(areaSettings.final_x_position);
            }
            if (areaSettings.final_y_position !== undefined) {
              setBackgroundOffsetY(areaSettings.final_y_position);
            }
          }
        }

        // También cargar desde localStorage para la imagen
        const savedLayout = localStorage.getItem('restaurant_layout');
        if (savedLayout) {
          const layout = JSON.parse(savedLayout);
          // Siempre cargar la imagen si existe en localStorage
          if (layout.backgroundImage) {
            setBackgroundImage(layout.backgroundImage);
          }
          if (layout.backgroundOffsetX !== undefined) {
            setBackgroundOffsetX(layout.backgroundOffsetX);
          }
          if (layout.backgroundOffsetY !== undefined) {
            setBackgroundOffsetY(layout.backgroundOffsetY);
          }
        }
      } catch (error) {
        console.error('Error cargando configuración del layout:', error);
      }
    };

    loadConfiguration();
  }, []);

  // Renderizar elemento decorativo
  const renderDecoration = (item: Table) => {
    const isSelected = selectedTable === item.id;

    const decorationStyles = {
      plant: {
        background: 'radial-gradient(circle, #228B22 0%, #006400 100%)',
        border: '2px solid #654321',
        content: '🌿'
      },
      column: {
        background: 'linear-gradient(180deg, #D3D3D3 0%, #A9A9A9 50%, #808080 100%)',
        border: '2px solid #696969',
        content: '◼'
      },
      divider: {
        background: 'linear-gradient(90deg, #8B4513 0%, #654321 50%, #8B4513 100%)',
        border: '1px solid #4A2C17',
        content: ''
      },
      bar: {
        background: 'linear-gradient(180deg, #2C1810 0%, #1A0E08 100%)',
        border: '2px solid #8B4513',
        content: '🍸'
      },
      entrance: {
        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
        border: '2px solid #B8860B',
        content: '🚪'
      },
      kitchen: {
        background: 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 50%, #C0C0C0 100%)',
        border: '2px solid #696969',
        content: '🍳'
      }
    };

    const style = decorationStyles[item.decorationType!] || decorationStyles.plant;

    return (
      <motion.div
        key={item.id}
        className="absolute cursor-pointer select-none"
        style={{
          left: item.x,
          top: item.y,
          width: item.width || 40,
          height: item.height || 40,
          transform: `rotate(${item.rotation || 0}deg)`,
          zIndex: isSelected ? 100 : 5
        }}
        animate={{
          scale: isSelected ? 1.1 : 1,
          transition: { type: 'spring', stiffness: 300 }
        }}
        whileHover={{ scale: editMode ? 1.05 : 1 }}
        onMouseDown={(e) => handleMouseDown(e, item.id)}
        onClick={() => !isDragging && setSelectedTable(item.id)}
      >
        <div
          className={`relative w-full h-full flex items-center justify-center ${
            item.decorationType === 'plant' || item.decorationType === 'column' 
              ? 'rounded-full' 
              : 'rounded-lg'
          }`}
          style={{
            background: style.background,
            border: style.border,
            boxShadow: isSelected 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <span className="text-2xl" style={{ fontSize: item.decorationType === 'plant' ? '24px' : '20px' }}>
            {style.content}
          </span>
        </div>

        {/* Controles de edición */}
        {isSelected && editMode && (
          <motion.div 
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full shadow-xl px-2 py-1 flex gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                rotateTable(item.id, 45);
              }}
              className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              title="Rotar"
            >
              <RotateCw className="h-3 w-3 text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTable(item.id);
              }}
              className="p-1 hover:bg-red-100 rounded-full transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Renderizar mesa
  const renderTable = (table: Table) => {
    if (table.type === 'decoration') {
      return renderDecoration(table);
    }

    const isSelected = selectedTable === table.id;
    
    // Estilos según el estado
    const getTableStyle = () => {
      const baseStyle = {
        backgroundImage: table.shape === 'circle' 
          ? 'radial-gradient(ellipse at center, #8B4513 0%, #654321 50%, #4A2C17 100%)'
          : 'linear-gradient(135deg, #8B4513 0%, #654321 25%, #8B4513 50%, #654321 75%, #8B4513 100%)',
        backgroundSize: table.shape === 'circle' ? '100% 100%' : '20px 20px',
        boxShadow: isSelected 
          ? '0 8px 32px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)' 
          : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)'
      };

      // Overlay según estado
      let overlay = '';
      let borderColor = '#654321';
      let statusIcon = null;
      
      switch(table.status) {
        case 'occupied':
          overlay = 'rgba(239, 68, 68, 0.3)';
          borderColor = '#DC2626';
          break;
        case 'reserved':
          overlay = 'rgba(245, 158, 11, 0.3)';
          borderColor = '#D97706';
          break;
        case 'maintenance':
          overlay = 'rgba(107, 114, 128, 0.5)';
          borderColor = '#4B5563';
          break;
        default:
          overlay = 'rgba(34, 197, 94, 0.15)';
          borderColor = isSelected ? '#3B82F6' : '#8B6331';
      }

      return { baseStyle, overlay, borderColor };
    };

    const { baseStyle, overlay, borderColor } = getTableStyle();

    return (
      <motion.div
        key={table.id}
        className="absolute cursor-pointer select-none"
        style={{
          left: table.x,
          top: table.y,
          width: table.width || 80,
          height: table.height || 80,
          transform: `rotate(${table.rotation || 0}deg)`,
          zIndex: isSelected ? 100 : 10
        }}
        animate={{
          scale: isSelected ? 1.08 : 1,
          transition: { type: 'spring', stiffness: 300 }
        }}
        whileHover={{ scale: editMode ? 1.05 : 1.02 }}
        onMouseDown={(e) => handleMouseDown(e, table.id)}
        onClick={() => !isDragging && setSelectedTable(table.id)}
      >
        {/* Mesa con aspecto de madera */}
        <div
          className={`relative w-full h-full ${table.shape === 'circle' ? 'rounded-full' : table.shape === 'rectangle' ? 'rounded-xl' : 'rounded-xl'}`}
          style={{
            ...baseStyle,
            border: `3px solid ${borderColor}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Overlay de estado */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: overlay,
              borderRadius: 'inherit'
            }}
          />
          
          {/* Efecto de vetas de madera */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)',
              borderRadius: 'inherit'
            }}
          />

          {/* Contenido de la mesa */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Número de mesa - grande y visible */}
            <div className="text-white font-bold text-3xl drop-shadow-lg">
              {table.number}
            </div>
            
            {/* Capacidad - más pequeño abajo */}
            <div className="text-white/90 text-sm font-medium drop-shadow mt-1">
              {table.capacity} 👥
            </div>

            {/* Indicador de estado */}
            {table.status !== 'available' && (
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse ${
                table.status === 'occupied' ? 'bg-red-500' :
                table.status === 'reserved' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
            )}
          </div>
        </div>

        {/* Controles de edición mejorados */}
        {isSelected && editMode && (
          <motion.div 
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full shadow-xl px-2 py-1 flex gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                rotateTable(table.id, 45);
              }}
              className="p-1.5 hover:bg-blue-100 rounded-full transition-colors"
              title="Rotar mesa"
            >
              <RotateCw className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTable(table.id);
              }}
              className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
              title="Eliminar mesa"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'} bg-gray-100 overflow-hidden`}>
      {/* Barra de herramientas */}
      {!readOnly && (
        <div className="absolute top-2 left-2 right-2 z-50 flex justify-between items-center bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2">
            {/* Subir imagen */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 flex items-center gap-1.5 transition-all shadow-md font-medium"
            >
              <Upload className="h-4 w-4" />
              {backgroundImage ? 'Cambiar' : 'Plano'}
            </button>

            {/* Botón para limpiar imagen */}
            {backgroundImage && (
              <button
                onClick={() => {
                  setBackgroundImage(null);
                  localStorage.removeItem('restaurant_layout');
                  toast.info('Imagen de fondo eliminada');
                }}
                className="px-2 py-1.5 text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-md"
                title="Eliminar imagen de fondo"
              >
                ✕
              </button>
            )}

            {/* Menú de agregar elementos mejorado */}
            <div className="flex items-center gap-2">
              {/* Selector de modo */}
              <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
                <button
                  onClick={() => setAddMode('table')}
                  className={`px-3 py-1.5 text-sm font-medium transition-all ${
                    addMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Mesas
                </button>
                <button
                  onClick={() => setAddMode('decoration')}
                  className={`px-3 py-1.5 text-sm font-medium transition-all ${
                    addMode === 'decoration' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Decoración
                </button>
              </div>

              {/* Botones según el modo */}
              {addMode === 'table' ? (
                <button
                  onClick={addTable}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 font-medium shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Mesa
                </button>
              ) : (
                <div className="flex gap-1 bg-white rounded-lg p-1 shadow-md border border-gray-200">
                  <button
                    onClick={() => addDecoration('plant')}
                    className="p-1.5 text-green-700 bg-green-50 hover:bg-green-100 rounded transition-all"
                    title="Agregar planta"
                  >
                    <Trees className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => addDecoration('column')}
                    className="p-1.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-all"
                    title="Agregar columna"
                  >
                    <Columns className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => addDecoration('divider')}
                    className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-all"
                    title="Agregar divisor"
                  >
                    <SplitSquareVertical className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => addDecoration('bar')}
                    className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-all"
                    title="Agregar barra"
                  >
                    <Wine className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => addDecoration('entrance')}
                    className="p-1.5 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded transition-all"
                    title="Agregar entrada"
                  >
                    <Home className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => addDecoration('kitchen')}
                    className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded transition-all"
                    title="Agregar cocina"
                  >
                    <ChefHat className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Toggle grid */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-md font-medium ${showGrid ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Grilla</span>
            </button>

            {/* Toggle edit mode */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${editMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
            >
              {editMode ? <Edit2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span className="hidden sm:inline">{editMode ? 'Edición' : 'Vista'}</span>
            </button>

            {/* Indicador de arrastre de fondo */}
            {backgroundImage && editMode && (
              <div className="flex items-center gap-2 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl px-3 py-1.5 border border-yellow-200">
                <Move className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">
                  {isDraggingBackground ? 'Arrastrando fondo...' : 'Arrastra el fondo para moverlo'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom mejorado */}
            <div className="flex items-center gap-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl px-3 py-1 border border-blue-200">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="w-8 h-8 bg-white rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center text-blue-600 border border-blue-200"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-blue-700 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="w-8 h-8 bg-white rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center text-blue-600 border border-blue-200"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 flex items-center gap-1.5 transition-all shadow-md font-medium"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Min' : 'Max'}</span>
            </button>

            {/* Guardar */}
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 flex items-center gap-1.5 transition-all shadow-md font-medium"
            >
              <Save className="h-4 w-4" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}

      {/* Panel lateral de propiedades */}
      {selectedTable && editMode && (
        <div className="absolute top-16 right-2 w-56 bg-white rounded-lg shadow-lg p-3 z-40 max-h-[calc(100%-80px)] overflow-y-auto">
          <h3 className="font-bold mb-4">Propiedades de Mesa #{tables.find(t => t.id === selectedTable)?.number}</h3>

          <div className="space-y-3">
            {/* Número de mesa */}
            <div>
              <label className="block text-sm font-medium mb-1">Número</label>
              <input
                type="number"
                value={tables.find(t => t.id === selectedTable)?.number || 0}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  setTables(prev => prev.map(t =>
                    t.id === selectedTable ? { ...t, number: num } : t
                  ));
                }}
                className="w-full px-3 py-1 border rounded"
              />
            </div>

            {/* Capacidad */}
            <div>
              <label className="block text-sm font-medium mb-1">Capacidad</label>
              <input
                type="number"
                min="1"
                max="20"
                value={tables.find(t => t.id === selectedTable)?.capacity || 0}
                onChange={(e) => updateTableCapacity(selectedTable, parseInt(e.target.value))}
                className="w-full px-3 py-1 border rounded"
              />
            </div>

            {/* Forma */}
            <div>
              <label className="block text-sm font-medium mb-1">Forma</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => changeTableShape(selectedTable, 'square')}
                  className={`p-2 border rounded ${tables.find(t => t.id === selectedTable)?.shape === 'square'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white'
                    }`}
                >
                  Cuadrada
                </button>
                <button
                  onClick={() => changeTableShape(selectedTable, 'circle')}
                  className={`p-2 border rounded ${tables.find(t => t.id === selectedTable)?.shape === 'circle'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white'
                    }`}
                >
                  Redonda
                </button>
                <button
                  onClick={() => changeTableShape(selectedTable, 'rectangle')}
                  className={`p-2 border rounded ${tables.find(t => t.id === selectedTable)?.shape === 'rectangle'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white'
                    }`}
                >
                  Rectangular
                </button>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={tables.find(t => t.id === selectedTable)?.status || 'available'}
                onChange={(e) => {
                  const status = e.target.value as Table['status'];
                  setTables(prev => prev.map(t =>
                    t.id === selectedTable ? { ...t, status } : t
                  ));
                }}
                className="w-full px-3 py-1 border rounded"
              >
                <option value="available">Disponible</option>
                <option value="occupied">Ocupada</option>
                <option value="reserved">Reservada</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Área de diseño */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          top: readOnly ? 0 : 50,
          bottom: 0,
          left: 0,
          right: 0,
          cursor: isDragging ? 'grabbing' : 'default',
          overflow: 'hidden'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative min-w-full min-h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: `${backgroundOffsetX}px ${backgroundOffsetY}px`,
            backgroundRepeat: 'no-repeat',
            cursor: isDraggingBackground ? 'grabbing' : (backgroundImage && editMode && !isDragging ? 'grab' : 'default')
          }}
          onMouseDown={(e) => {
            // Solo iniciar drag del fondo si:
            // 1. Hay imagen de fondo
            // 2. Estamos en modo edición
            // 3. No hay elemento clickeado (e.target === e.currentTarget)
            if (backgroundImage && editMode && e.target === e.currentTarget && !isDragging) {
              e.preventDefault();
              setIsDraggingBackground(true);
              setBgDragStart({
                x: e.clientX,
                y: e.clientY,
                offsetX: backgroundOffsetX,
                offsetY: backgroundOffsetY
              });
            }
          }}
        >
          {/* Grid */}
          {showGrid && editMode && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent 19px, rgba(0,0,0,0.05) 20px), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent 19px, rgba(0,0,0,0.05) 20px)',
                backgroundSize: '20px 20px'
              }}
            />
          )}

          {/* Renderizar mesas */}
          {tables.map(renderTable)}
        </div>
      </div>

      {/* Indicador de modo */}
      {!readOnly && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">
              Modo: {editMode ? 'Edición' : 'Vista'} | Mesas: {tables.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};