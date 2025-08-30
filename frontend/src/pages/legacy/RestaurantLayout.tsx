import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton } from '../components/AnimatedComponents';
import { toast } from '../../lib/toast';
import {
  LayoutGridIcon,
  SquareIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  MapIcon,
  SunIcon,
  HomeIcon,
  EyeIcon,
  EyeOffIcon,
  WifiIcon,
  BoltIcon,
  WheelchairAccessibilityIcon,
  BabyIcon,
  ArmChairIcon,
  WindowIcon
} from '@heroicons/react/24/outline';


interface Area {
  id?: number;
  company_id: number;
  name: string;
  description?: string;
  capacity: number;
  outdoor: boolean;
  smoking_allowed: boolean;
  color: string;
  icon: string;
  is_active: boolean;
  created_at?: string;
}

interface Table {
  id?: number;
  number: number;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  company_id: number;
  area_id?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: string;
  area_name?: string;
}

const statusColors = {
  available: '#10B981',
  occupied: '#EF4444', 
  reserved: '#F59E0B',
  cleaning: '#6B7280',
  maintenance: '#8B5CF6',
  blocked: '#DC2626',
};

const statusTranslations = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada', 
  cleaning: 'Limpieza',
  maintenance: 'Mantenimiento',
  blocked: 'Bloqueada',
};

export const RestaurantLayout: React.FC = () => {
  const { theme } = useTheme();
  
  // Data states
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  
  // Editing states
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'areas' | 'tables'>('areas');
  
  // View mode for tables
  const [viewMode, setViewMode] = useState<'grid' | 'visual'>('grid');
  
  // Form states
  const [areaForm, setAreaForm] = useState<Area>({
    company_id: 1,
    name: '',
    description: '',
    capacity: 0,
    outdoor: false,
    smoking_allowed: false,
    color: '#3B82F6',
    icon: 'home',
    is_active: true
  });
  
  const [tableForm, setTableForm] = useState<Table>({
    number: 1,
    capacity: 4,
    location: '',
    status: 'available',
    company_id: 1,
    area_id: undefined,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    shape: 'square'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadAreaTables(selectedArea.id!);
    }
  }, [selectedArea]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAreas(), loadTables()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAreas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/areas?company_id=1`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data);
        if (data.length > 0 && !selectedArea) {
          setSelectedArea(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading areas:', error);
      toast.error('Error cargando áreas');
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tables-enhanced?company_id=1`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Error cargando mesas');
    }
  };

  const loadAreaTables = async (areaId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/tables-enhanced?company_id=1&area_id=${areaId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error loading area tables:', error);
    }
  };

  const handleSaveArea = async () => {
    if (!areaForm.name) {
      toast.error('El nombre del área es requerido');
      return;
    }

    try {
      const url = editingArea 
        ? `${API_URL}/api/areas/${editingArea.id}`
        : `${API_URL}/api/areas`;
      
      const response = await fetch(url, {
        method: editingArea ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(areaForm)
      });

      if (response.ok) {
        toast.success(editingArea ? 'Área actualizada' : 'Área creada');
        loadAreas();
        setShowAreaModal(false);
        resetAreaForm();
      }
    } catch (error) {
      console.error('Error saving area:', error);
      toast.error('Error al guardar área');
    }
  };

  const handleSaveTable = async () => {
    if (!tableForm.number || tableForm.capacity < 1) {
      toast.error('Número de mesa y capacidad son requeridos');
      return;
    }

    try {
      const tableData = {
        ...tableForm,
        area_id: selectedArea?.id
      };
      
      const url = editingTable 
        ? `${API_URL}/api/tables-enhanced/${editingTable.id}`
        : `${API_URL}/api/tables-enhanced`;
      
      const response = await fetch(url, {
        method: editingTable ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData)
      });

      if (response.ok) {
        toast.success(editingTable ? 'Mesa actualizada' : 'Mesa creada');
        if (selectedArea) {
          loadAreaTables(selectedArea.id!);
        } else {
          loadTables();
        }
        setShowTableModal(false);
        resetTableForm();
      }
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error('Error al guardar mesa');
    }
  };

  const resetAreaForm = () => {
    setAreaForm({
      company_id: 1, name: '', description: '', capacity: 0,
      outdoor: false, smoking_allowed: false, color: '#3B82F6',
      icon: 'home', is_active: true
    });
    setEditingArea(null);
  };

  const resetTableForm = () => {
    setTableForm({
      number: 1, capacity: 4, location: '', status: 'available',
      company_id: 1, area_id: selectedArea?.id, x: 0, y: 0,
      width: 100, height: 100, rotation: 0, shape: 'square'
    });
    setEditingTable(null);
  };

  const openAreaModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setAreaForm(area);
    } else {
      resetAreaForm();
    }
    setShowAreaModal(true);
  };

  const openTableModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setTableForm(table);
    } else {
      resetTableForm();
    }
    setShowTableModal(true);
  };

  const getAreaIcon = (iconName: string) => {
    const icons: { [key: string]: React.ElementType } = {
      home: HomeIcon,
      sun: SunIcon,
      users: UsersIcon,
      grid: LayoutGridIcon,
      star: SunIcon
    };
    return icons[iconName] || LayoutGridIcon;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Layout del Restaurante"
        subtitle="Gestiona las áreas y mesas de tu restaurante"
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'areas', label: 'Áreas', icon: LayoutGridIcon, count: areas.length },
            { key: 'tables', label: 'Mesas', icon: SquareIcon, count: tables.length }
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Areas Tab */}
          {activeTab === 'areas' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <LayoutGridIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Áreas del Restaurante
                  </h2>
                  <FloatingButton
                    onClick={() => openAreaModal()}
                    variant="primary"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </FloatingButton>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <motion.div
                      className="h-12 w-12 border-4 rounded-full"
                      style={{
                        borderColor: theme.colors.primary + '20',
                        borderTopColor: theme.colors.primary
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {areas.map((area) => {
                      const IconComponent = getAreaIcon(area.icon);
                      return (
                        <AnimatedCard
                          key={area.id}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedArea?.id === area.id 
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedArea(area)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: area.color + '20' }}
                              >
                                <IconComponent className="h-6 w-6" style={{ color: area.color }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                                    {area.name}
                                  </h3>
                                  {area.outdoor && (
                                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-600">
                                      Exterior
                                    </span>
                                  )}
                                  {area.smoking_allowed && (
                                    <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-600">
                                      Fumadores
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                                  {area.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <UsersIcon className="h-4 w-4" style={{ color: theme.colors.textMuted }} />
                                    <span style={{ color: theme.colors.textMuted }}>
                                      Cap: {area.capacity}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <SquareIcon className="h-4 w-4" style={{ color: theme.colors.textMuted }} />
                                    <span style={{ color: theme.colors.textMuted }}>
                                      {tables.filter(t => t.area_id === area.id).length} mesas
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAreaModal(area);
                                }}
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: theme.colors.primary + '10' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                              </motion.button>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // handleDeleteArea(area);
                                }}
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: theme.colors.error + '10' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <TrashIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                              </motion.button>
                            </div>
                          </div>
                        </AnimatedCard>
                      );
                    })}
                  </div>
                )}
              </GlassPanel>

              <GlassPanel delay={0.2}>
                {selectedArea ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                        {selectedArea.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className="rounded-lg p-4 text-white"
                          style={{ backgroundColor: selectedArea.color }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <UsersIcon className="h-5 w-5" />
                            <span className="font-semibold">Capacidad</span>
                          </div>
                          <p className="text-2xl font-bold">{selectedArea.capacity}</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <SquareIcon className="h-5 w-5" />
                            <span className="font-semibold">Mesas</span>
                          </div>
                          <p className="text-2xl font-bold">
                            {tables.filter(t => t.area_id === selectedArea.id).length}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2" style={{ color: theme.colors.text }}>
                          Características
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedArea.outdoor && (
                            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                              🌤️ Exterior
                            </span>
                          )}
                          {selectedArea.smoking_allowed && (
                            <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
                              🚬 Fumadores
                            </span>
                          )}
                          {!selectedArea.outdoor && (
                            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                              🏠 Interior
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {selectedArea.description && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2" style={{ color: theme.colors.text }}>
                            Descripción
                          </h4>
                          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                            {selectedArea.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LayoutGridIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      Selecciona un área para ver los detalles
                    </p>
                  </div>
                )}
              </GlassPanel>
            </>
          )}

          {/* Tables Tab */}
          {activeTab === 'tables' && (
            <>
              <GlassPanel delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                    <SquareIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
                    Mesas {selectedArea && `del ${selectedArea.name}`}
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                      >
                        <SquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('visual')}
                        className={`p-2 rounded-lg ${viewMode === 'visual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                      >
                        <MapIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <FloatingButton
                      onClick={() => openTableModal()}
                      variant="primary"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </FloatingButton>
                  </div>
                </div>

                {!selectedArea ? (
                  <div className="text-center py-12">
                    <SquareIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      Selecciona un área para ver sus mesas
                    </p>
                  </div>
                ) : tables.length === 0 ? (
                  <div className="text-center py-12">
                    <SquareIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                    <p style={{ color: theme.colors.textMuted }}>
                      No hay mesas en esta área
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {tables.map((table) => (
                      <AnimatedCard key={table.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: statusColors[table.status] }}
                            >
                              {table.number}
                            </div>
                            <div>
                              <h4 className="font-semibold" style={{ color: theme.colors.text }}>
                                Mesa {table.number}
                              </h4>
                              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                                {table.area_name || selectedArea.name}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <UsersIcon className="h-4 w-4" style={{ color: theme.colors.textMuted }} />
                                  <span style={{ color: theme.colors.textMuted }}>
                                    {table.capacity} personas
                                  </span>
                                </div>
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: statusColors[table.status] + '20',
                                    color: statusColors[table.status]
                                  }}
                                >
                                  {statusTranslations[table.status]}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => openTableModal(table)}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: theme.colors.primary + '10' }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                            </motion.button>
                            <motion.button
                              onClick={() => {/* handleDeleteTable(table) */}}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: theme.colors.error + '10' }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                            </motion.button>
                          </div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                ) : (
                  // Visual Layout Mode
                  <div className="bg-gray-100 rounded-lg p-6 min-h-[400px] relative">
                    <p className="text-center text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                      Vista Visual del {selectedArea.name}
                    </p>
                    <div className="grid grid-cols-6 gap-4">
                      {tables.map((table, index) => (
                        <motion.div
                          key={table.id}
                          className="aspect-square rounded-lg flex items-center justify-center text-white font-bold cursor-pointer shadow-md"
                          style={{
                            backgroundColor: statusColors[table.status],
                            gridColumn: `span ${Math.min(2, Math.max(1, Math.floor(table.capacity / 2)))}`
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openTableModal(table)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="text-center">
                            <div className="text-lg">{table.number}</div>
                            <div className="text-xs opacity-75">{table.capacity}p</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs">
                      {Object.entries(statusTranslations).map(([status, label]) => (
                        <div key={status} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                          />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassPanel>

              <GlassPanel delay={0.2}>
                <div className="text-center py-12">
                  <MapIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                  <p style={{ color: theme.colors.textMuted }}>
                    Estadísticas y configuración avanzada
                  </p>
                </div>
              </GlassPanel>
            </>
          )}
        </div>
      </div>

      {/* Area Modal */}
      <AnimatePresence>
        {showAreaModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAreaModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    {editingArea ? 'Editar Área' : 'Nueva Área'}
                  </h2>
                  <motion.button
                    onClick={() => setShowAreaModal(false)}
                    className="p-2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Nombre del Área
                    </label>
                    <input
                      type="text"
                      value={areaForm.name}
                      onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Ej: Salón Principal, Terraza"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Descripción
                    </label>
                    <textarea
                      value={areaForm.description}
                      onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      rows={2}
                      placeholder="Descripción del área..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Capacidad
                    </label>
                    <input
                      type="number"
                      value={areaForm.capacity}
                      onChange={(e) => setAreaForm({ ...areaForm, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Color
                    </label>
                    <div className="flex gap-2">
                      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setAreaForm({ ...areaForm, color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            areaForm.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="outdoor"
                        checked={areaForm.outdoor}
                        onChange={(e) => setAreaForm({ ...areaForm, outdoor: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="outdoor" className="text-sm" style={{ color: theme.colors.text }}>
                        Área exterior
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="smoking"
                        checked={areaForm.smoking_allowed}
                        onChange={(e) => setAreaForm({ ...areaForm, smoking_allowed: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="smoking" className="text-sm" style={{ color: theme.colors.text }}>
                        Permitir fumar
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowAreaModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                  <FloatingButton
                    onClick={handleSaveArea}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingArea ? 'Actualizar' : 'Crear'}
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Table Modal */}
      <AnimatePresence>
        {showTableModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTableModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    {editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
                  </h2>
                  <motion.button
                    onClick={() => setShowTableModal(false)}
                    className="p-2"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Número de Mesa
                      </label>
                      <input
                        type="number"
                        value={tableForm.number}
                        onChange={(e) => setTableForm({ ...tableForm, number: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        min="1"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Capacidad
                      </label>
                      <input
                        type="number"
                        value={tableForm.capacity}
                        onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        min="1"
                        placeholder="4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Estado
                    </label>
                    <select
                      value={tableForm.status}
                      onChange={(e) => setTableForm({ ...tableForm, status: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      {Object.entries(statusTranslations).map(([status, label]) => (
                        <option key={status} value={status}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Forma
                    </label>
                    <select
                      value={tableForm.shape}
                      onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      <option value="square">Cuadrada</option>
                      <option value="rectangle">Rectangular</option>
                      <option value="round">Redonda</option>
                      <option value="oval">Ovalada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Ubicación/Notas
                    </label>
                    <input
                      type="text"
                      value={tableForm.location}
                      onChange={(e) => setTableForm({ ...tableForm, location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Ej: Junto a la ventana, esquina norte"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowTableModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                  <FloatingButton
                    onClick={handleSaveTable}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingTable ? 'Actualizar' : 'Crear'}
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};