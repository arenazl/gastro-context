import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useTranslation } from 'react-i18next';

import { useNavigate } from 'react-router-dom';
import { tablesAPI } from '../services/api';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  location: string;
}

export const Tables: React.FC = () => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await tablesAPI.getTables();
      setTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-500 text-green-900 hover:bg-green-200';
      case 'occupied':
        return 'bg-red-100 border-red-500 text-red-900 hover:bg-red-200';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900 hover:bg-yellow-200';
      case 'cleaning':
        return 'bg-gray-100 border-gray-500 text-gray-900 hover:bg-gray-200';
      default:
        return 'bg-white border-gray-300 text-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'occupied':
        return '🍽️';
      case 'reserved':
        return '📅';
      case 'cleaning':
        return '🧹';
      default:
        return '?';
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'available') {
      // Navigate to create order for this table
      navigate(`/orders/new?table=${table.number}`);
    } else if (table.status === 'occupied') {
      // Navigate to view/edit existing order
      navigate(`/orders/table/${table.number}`);
    }
  };

  const locations = ['all', ...new Set(tables.map(t => t.location))];
  const filteredTables = selectedLocation === 'all' 
    ? tables 
    : tables.filter(t => t.location === selectedLocation);

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('tables.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Click on a table to manage orders
        </p>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow px-4 py-3">
          <div className="text-sm font-medium text-gray-500">Total Tables</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow px-4 py-3">
          <div className="text-sm font-medium text-green-600">Available</div>
          <div className="mt-1 text-2xl font-semibold text-green-900">{stats.available}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow px-4 py-3">
          <div className="text-sm font-medium text-red-600">Occupied</div>
          <div className="mt-1 text-2xl font-semibold text-red-900">{stats.occupied}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow px-4 py-3">
          <div className="text-sm font-medium text-yellow-600">Reserved</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-900">{stats.reserved}</div>
        </div>
      </div>

      {/* Location Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Location
        </label>
        <div className="flex gap-2">
          {locations.map((location) => (
            <button
              key={location}
              onClick={() => setSelectedLocation(location)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedLocation === location
                  ? 'bg-restaurant-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {location === 'all' ? 'All Locations' : location}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`
              relative p-6 rounded-lg border-2 transition-all duration-200
              ${getStatusColor(table.status)}
              min-h-[140px] flex flex-col items-center justify-center
              touch-manipulation active:scale-95 cursor-pointer
            `}
          >
            <div className="absolute top-2 right-2 text-2xl">
              {getStatusIcon(table.status)}
            </div>
            <div className="text-3xl font-bold mb-1">
              {table.number}
            </div>
            <div className="text-sm opacity-75">
              {table.capacity} seats
            </div>
            <div className="text-xs mt-2 font-medium uppercase">
              {table.status}
            </div>
            {table.location && (
              <div className="text-xs mt-1 opacity-75">
                {table.location}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">{t('common.legend')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-2"></span>
            Available
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-2"></span>
            Occupied
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded mr-2"></span>
            Reserved
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-gray-100 border border-gray-500 rounded mr-2"></span>
            Cleaning
          </div>
        </div>
      </div>
    </div>
  );
};