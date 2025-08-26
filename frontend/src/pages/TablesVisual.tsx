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
  Eye
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

  useEffect(() => {
    loadTables();
    loadLayoutSettings();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tables`);
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
        await fetch(`${API_URL}/api/tables/${table.id}`, {
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map(table => (
          <div
            key={table.id}
            onClick={() => handleTableClick(table.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${getStatusColor(table.status)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">Mesa #{table.number}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                table.status === 'available' ? 'bg-green-200 text-green-800' :
                table.status === 'occupied' ? 'bg-red-200 text-red-800' :
                table.status === 'reserved' ? 'bg-yellow-200 text-yellow-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {table.status === 'available' ? 'Disponible' :
                 table.status === 'occupied' ? 'Ocupada' :
                 table.status === 'reserved' ? 'Reservada' :
                 'Mantenimiento'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>Capacidad: {table.capacity} personas</p>
              {table.location && <p>Ubicación: {table.location}</p>}
            </div>
            {table.status === 'occupied' && (
              <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
                Ver Orden
              </button>
            )}
            {table.status === 'available' && (
              <button className="mt-3 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors">
                Nueva Orden
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Gestión de Mesas"
        subtitle="Diseño visual y administración de mesas"
      />

      <div className="px-6 py-4">
        {/* Barra de herramientas superior */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'visual' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Map className="h-5 w-5" />
                Vista Visual
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Grid className="h-5 w-5" />
                Vista Cuadrícula
              </button>
            </div>

            <div className="flex gap-2">
              {viewMode === 'visual' && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isEditMode 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isEditMode ? <Settings className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  {isEditMode ? 'Modo Edición' : 'Modo Vista'}
                </button>
              )}
              <button
                onClick={loadTables}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-green-600 text-sm font-medium">Disponibles</div>
              <div className="text-2xl font-bold text-green-700">
                {tables.filter(t => t.status === 'available').length}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-red-600 text-sm font-medium">Ocupadas</div>
              <div className="text-2xl font-bold text-red-700">
                {tables.filter(t => t.status === 'occupied').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-yellow-600 text-sm font-medium">Reservadas</div>
              <div className="text-2xl font-bold text-yellow-700">
                {tables.filter(t => t.status === 'reserved').length}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Total Mesas</div>
              <div className="text-2xl font-bold text-blue-700">
                {tables.length}
              </div>
            </div>
          </div>
        </div>

        {/* Vista principal */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
          {viewMode === 'visual' ? (
            <TableLayoutDesigner
              tables={tables}
              onSave={handleSaveLayout}
              backgroundImage={backgroundImage || undefined}
              readOnly={!isEditMode}
            />
          ) : (
            <div className="p-6 overflow-auto h-full">
              <GridView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};