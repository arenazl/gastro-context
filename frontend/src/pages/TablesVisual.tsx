import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { TableLayoutDesigner } from '../components/TableLayoutDesigner';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-toastify';
import {
  Grid,
  Map,
  Save,
  RefreshCw,
  Settings,
  Eye,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Layers,
  Lock,
  Unlock
} from 'lucide-react';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: 'square' | 'circle' | 'rectangle';
}


export const TablesVisual: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'grid'>('visual');
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // CSS para animación de rotación lenta
  const animationStyles = `
    @keyframes spin-slow {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    
    .animate-spin-slow {
      animation: spin-slow 3s linear infinite;
    }
  `;

  useEffect(() => {
    loadTables();
    loadLayoutSettings();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tables`);
      const data = await response.json();
      
      // Convertir los datos del backend al formato del componente visual
      const tablesWithPosition = data.map((table: any, index: number) => ({
        ...table,
        x: table.x || (100 + (index % 5) * 150),
        y: table.y || (100 + Math.floor(index / 5) * 150),
        width: table.width || 80,
        height: table.height || 80,
        shape: table.shape || 'square',
        rotation: table.rotation || 0,
        status: table.status || 'available'
      }));
      
      setTables(tablesWithPosition);
    } catch (error) {
      console.error('Error cargando mesas:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const loadLayoutSettings = async () => {
    try {
      // Cargar la imagen de fondo guardada (si existe)
      const savedLayout = localStorage.getItem('restaurant_layout');
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        if (layout.backgroundImage) {
          setBackgroundImage(layout.backgroundImage);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleSaveLayout = async (updatedTables: Table[], bgImage?: string) => {
    setLoading(true);
    try {
      // Guardar posiciones de las mesas en el backend
      for (const table of updatedTables) {
        await fetch(`${API_BASE_URL}/api/tables/${table.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...table,
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
            rotation: table.rotation,
            shape: table.shape
          })
        });
      }

      // Guardar imagen de fondo en localStorage
      if (bgImage !== undefined) {
        const layout = { backgroundImage: bgImage };
        localStorage.setItem('restaurant_layout', JSON.stringify(layout));
        setBackgroundImage(bgImage);
      }

      setTables(updatedTables);
      toast.success('Layout guardado correctamente');
    } catch (error) {
      console.error('Error guardando layout:', error);
      toast.error('Error al guardar el layout');
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (table && table.status === 'occupied') {
      // Navegar a la orden de la mesa
      navigate(`/orders/table/${table.number}`);
    } else if (table && table.status === 'available') {
      // Crear nueva orden para la mesa
      navigate(`/orders/new?table=${table.number}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-500 text-green-900';
      case 'occupied':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'maintenance':
        return 'bg-gray-100 border-gray-500 text-gray-900';
      default:
        return 'bg-white border-gray-300 text-gray-900';
    }
  };

  const GridView = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {tables.filter(t => t.type !== 'decoration').map(table => {
          const statusConfig = {
            available: {
              bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
              borderColor: 'border-green-300',
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600',
              icon: <CheckCircle className="h-5 w-5" />,
              label: 'Disponible',
              buttonBg: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            },
            occupied: {
              bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
              borderColor: 'border-red-300',
              iconBg: 'bg-red-100',
              iconColor: 'text-red-600',
              icon: <Users className="h-5 w-5" />,
              label: 'Ocupada',
              buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
            },
            reserved: {
              bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
              borderColor: 'border-yellow-300',
              iconBg: 'bg-yellow-100',
              iconColor: 'text-yellow-600',
              icon: <Clock className="h-5 w-5" />,
              label: 'Reservada',
              buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
            },
            maintenance: {
              bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
              borderColor: 'border-gray-300',
              iconBg: 'bg-gray-100',
              iconColor: 'text-gray-600',
              icon: <AlertCircle className="h-5 w-5" />,
              label: 'Mantenimiento',
              buttonBg: 'bg-gradient-to-r from-gray-500 to-slate-500'
            }
          };

          const config = statusConfig[table.status] || statusConfig.available;

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table.id)}
              className={`relative group cursor-pointer transition-all duration-300 hover:scale-105`}
            >
              <div className={`relative overflow-hidden border ${config.borderColor} rounded-xl shadow-lg hover:shadow-2xl transition-all bg-white`}>
                {/* Gradient overlay basado en estado */}
                <div className={`absolute inset-0 opacity-10 ${config.bgColor}`} />
                <div className="relative p-4">
                  {/* Status indicator bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${config.buttonBg}`} />
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Mesa {table.number}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Capacidad: {table.capacity}
                      </p>
                    </div>
                    <div className={`${config.iconBg} ${config.iconColor} p-3 rounded-xl shadow-sm`}>
                      {config.icon}
                    </div>
                  </div>

                  {/* Status Badge con animación */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      config.iconBg
                    } ${config.iconColor} ${
                      table.status === 'occupied' ? 'animate-pulse' : ''
                    }`}>
                      {table.status === 'occupied' && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                      {config.label}
                    </span>
                  </div>

                  {/* Mesa visual mejorada */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className={`w-20 h-20 ${
                        table.shape === 'circle' ? 'rounded-full' : 
                        table.shape === 'rectangle' ? 'rounded-lg w-24' : 'rounded-lg'
                      } bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-xl flex items-center justify-center text-white font-bold text-2xl transform transition-transform group-hover:rotate-3`}>
                        {table.number}
                      </div>
                      {/* Sombra de la mesa */}
                      <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-black opacity-20 blur-md ${
                        table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
                      }`} />
                    </div>
                  </div>

                  {/* Action Button mejorado */}
                  {(table.status === 'available' || table.status === 'occupied') && (
                    <button className={`w-full py-3 px-4 ${config.buttonBg} text-white rounded-lg font-semibold transition-all transform hover:scale-[1.02] shadow-md hover:shadow-xl flex items-center justify-center gap-2`}>
                      {table.status === 'occupied' ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Ver Orden
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Nueva Orden
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{animationStyles}</style>
      <PageHeader
        title="Gestión de Mesas"
        subtitle="Administración visual del salón del restaurante"
      />

      <div className="px-6 py-4">
        {/* Barra de herramientas superior mejorada */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Selector de vista con candado integrado */}
              <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1">
                <button
                  onClick={() => {
                    setViewMode('visual');
                    if (viewMode !== 'visual') setIsEditMode(true);
                  }}
                  className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-medium ${
                    viewMode === 'visual' 
                      ? 'bg-white text-blue-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Layers className="h-5 w-5" />
                  <span>Diseño Visual</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-medium ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                  <span>Vista Tarjetas</span>
                </button>
                
                {/* Botón de candado solo cuando está en vista visual */}
                {viewMode === 'visual' && (
                  <div className="border-l border-gray-300 ml-1 pl-1">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`p-2 rounded-lg transition-all ${
                        isEditMode 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={isEditMode ? 'Bloquear diseño' : 'Desbloquear diseño'}
                    >
                      {isEditMode ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Solo mostrar botón de refrescar en vista de tarjetas */}
              {viewMode === 'grid' && (
                <button
                  onClick={loadTables}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 transition-all font-medium"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              )}
            </div>
          </div>

          {/* Estadísticas rápidas mejoradas */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-600 text-sm font-medium">Disponibles</div>
                  <div className="text-3xl font-bold text-green-700 mt-1">
                    {tables.filter(t => t.status === 'available' && t.type !== 'decoration').length}
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-red-600 text-sm font-medium">Ocupadas</div>
                  <div className="text-3xl font-bold text-red-700 mt-1">
                    {tables.filter(t => t.status === 'occupied' && t.type !== 'decoration').length}
                  </div>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-yellow-700 text-sm font-medium">Reservadas</div>
                  <div className="text-3xl font-bold text-yellow-800 mt-1">
                    {tables.filter(t => t.status === 'reserved' && t.type !== 'decoration').length}
                  </div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-700" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-blue-600 text-sm font-medium">Total Mesas</div>
                  <div className="text-3xl font-bold text-blue-700 mt-1">
                    {tables.filter(t => t.type !== 'decoration').length}
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Layers className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vista principal mejorada */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100" style={{ height: 'calc(100vh - 320px)' }}>
          {viewMode === 'visual' ? (
            <TableLayoutDesigner
              tables={tables}
              onSave={handleSaveLayout}
              backgroundImage={backgroundImage || undefined}
              readOnly={!isEditMode}
            />
          ) : (
            <div className="overflow-auto h-full bg-gradient-to-br from-gray-50 to-white">
              <GridView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};