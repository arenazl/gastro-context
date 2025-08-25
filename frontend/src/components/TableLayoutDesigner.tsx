import React, { useState, useRef, useEffect } from 'react';
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
  EyeOff
} from 'lucide-react';
import { toast } from 'react-toastify';

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
}

interface TableLayoutDesignerProps {
  tables: Table[];
  onSave: (tables: Table[], backgroundImage?: string) => void;
  backgroundImage?: string;
  readOnly?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002';

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
    setIsDragging(false);
    setDraggedTable(null);
  };

  // Agregar nueva mesa
  const addTable = () => {
    const newTable: Table = {
      id: Date.now(),
      number: tables.length + 1,
      capacity: 4,
      status: 'available',
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      shape: 'square',
      rotation: 0
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable.id);
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
      await fetch(`${API_URL}/api/map-settings`, {
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

      await fetch(`${API_URL}/api/area-settings/${areaId}`, {
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
        const mapResponse = await fetch(`${API_URL}/api/map-settings?company_id=1`);
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
        const areaResponse = await fetch(`${API_URL}/api/area-settings/${areaId}?company_id=1`);
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

  // Renderizar mesa
  const renderTable = (table: Table) => {
    const isSelected = selectedTable === table.id;
    const statusColors = {
      available: '#10B981',
      occupied: '#EF4444',
      reserved: '#F59E0B',
      maintenance: '#6B7280'
    };

    return (
      <motion.div
        key={table.id}
        className={`absolute cursor-pointer select-none ${editMode ? 'cursor-move' : ''}`}
        style={{
          left: table.x,
          top: table.y,
          width: table.width || 80,
          height: table.height || 80,
          transform: `rotate(${table.rotation || 0}deg)`,
          zIndex: isSelected ? 100 : 10
        }}
        animate={{
          scale: isSelected ? 1.05 : 1
        }}
        onMouseDown={(e) => handleMouseDown(e, table.id)}
        onClick={() => !isDragging && setSelectedTable(table.id)}
      >
        {/* Forma de la mesa */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center text-white font-bold shadow-lg transition-all ${table.shape === 'circle' ? 'rounded-full' : table.shape === 'rectangle' ? 'rounded-lg' : 'rounded-lg'
            }`}
          style={{
            backgroundColor: statusColors[table.status],
            border: isSelected ? '3px solid #3B82F6' : '2px solid rgba(0,0,0,0.2)'
          }}
        >
          <div className="text-2xl">#{table.number}</div>
          <div className="text-xs flex items-center gap-1">
            <Users className="h-3 w-3" />
            {table.capacity}
          </div>
        </div>

        {/* Controles de edición */}
        {isSelected && editMode && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-1 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                rotateTable(table.id, 45);
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Rotar"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTable(table.id);
              }}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
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
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                title="Eliminar imagen de fondo"
              >
                ✕
              </button>
            )}

            {/* Agregar mesa */}
            <button
              onClick={addTable}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Mesa
            </button>

            {/* Toggle grid */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${showGrid ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
            >
              <Grid className="h-3 w-3" />
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

            {/* Ajuste de posición de fondo */}
            {backgroundImage && (
              <div className="flex items-center gap-1">
                <span className="text-xs px-1">Mover fondo:</span>
                <button
                  onClick={() => {
                    const newOffsetX = backgroundOffsetX - 10;
                    setBackgroundOffsetX(newOffsetX);
                    // Guardar automáticamente el nuevo offset
                    const layoutSettings = {
                      backgroundImage,
                      backgroundOffsetX: newOffsetX,
                      backgroundOffsetY
                    };
                    localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  title="Mover imagen hacia la izquierda"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    const newOffsetX = backgroundOffsetX + 10;
                    setBackgroundOffsetX(newOffsetX);
                    // Guardar automáticamente el nuevo offset
                    const layoutSettings = {
                      backgroundImage,
                      backgroundOffsetX: newOffsetX,
                      backgroundOffsetY
                    };
                    localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  title="Mover imagen hacia la derecha"
                >
                  →
                </button>
                <button
                  onClick={() => {
                    const newOffsetY = backgroundOffsetY - 10;
                    setBackgroundOffsetY(newOffsetY);
                    // Guardar automáticamente el nuevo offset
                    const layoutSettings = {
                      backgroundImage,
                      backgroundOffsetX,
                      backgroundOffsetY: newOffsetY
                    };
                    localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  title="Mover imagen hacia arriba"
                >
                  ↑
                </button>
                <button
                  onClick={() => {
                    const newOffsetY = backgroundOffsetY + 10;
                    setBackgroundOffsetY(newOffsetY);
                    // Guardar automáticamente el nuevo offset
                    const layoutSettings = {
                      backgroundImage,
                      backgroundOffsetX,
                      backgroundOffsetY: newOffsetY
                    };
                    localStorage.setItem('restaurant_layout', JSON.stringify(layoutSettings));
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  title="Mover imagen hacia abajo"
                >
                  ↓
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
            >
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Min' : 'Max'}</span>
            </button>

            {/* Guardar */}
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              <span className="hidden sm:inline">Guardar</span>
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
            backgroundRepeat: 'no-repeat'
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