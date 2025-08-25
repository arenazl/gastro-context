import React from 'react';

export const UnifiedSettingsSimple: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Configuración ABM - Prueba</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Empresas</h2>
          <div className="space-y-2">
            <button className="w-full p-2 bg-blue-500 text-white rounded">Empresas</button>
            <button className="w-full p-2 bg-gray-200 rounded">Usuarios</button>
            <button className="w-full p-2 bg-gray-200 rounded">Roles</button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Clientes</h2>
          <div className="space-y-2">
            <button className="w-full p-2 bg-green-500 text-white rounded">Clientes</button>
            <button className="w-full p-2 bg-gray-200 rounded">Direcciones</button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Áreas y Mesas</h2>
          <div className="space-y-2">
            <button className="w-full p-2 bg-orange-500 text-white rounded">Áreas</button>
            <button className="w-full p-2 bg-gray-200 rounded">Mesas</button>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Configuración</h2>
          <div className="space-y-2">
            <button className="w-full p-2 bg-purple-500 text-white rounded">Idioma</button>
            <button className="w-full p-2 bg-gray-200 rounded">Pagos</button>
            <button className="w-full p-2 bg-gray-200 rounded">Datos</button>
          </div>
        </div>
      </div>
    </div>
  );
};