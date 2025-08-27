import React from 'react';
import { X, Sparkles, Upload } from 'lucide-react';
import { IngredientsExpander } from './IngredientsExpander';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface SimpleProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSave: (product: any) => void;
  categoryName?: string;
  subcategoryName?: string;
}

export const SimpleProductModal: React.FC<SimpleProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  categoryName,
  subcategoryName
}) => {
  // Estado local para el formulario
  const [formData, setFormData] = React.useState(product || {});
  const [isDragging, setIsDragging] = React.useState(false);

  // Actualizar formData cuando cambie el producto
  React.useEffect(() => {
    if (product) {
      setFormData(product);
      console.log('Producto recibido en modal:', product);
    }
  }, [product]);

  // Manejador para subir archivo
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        processImageFile(file);
      }
    };
    input.click();
  };

  // Procesar archivo de imagen
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, image_url: result }));
      console.log('Imagen cargada:', file.name);
    };
    reader.readAsDataURL(file);
  };

  // Manejadores de drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        alert('Por favor, arrastra solo archivos de imagen');
      }
    }
  };

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="absolute right-0 top-0 bottom-0 w-[800px] bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {formData.id ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          {/* Breadcrumb */}
          {(categoryName || subcategoryName || formData.name) && (
            <div className="flex items-center text-sm text-gray-600">
              {categoryName && (
                <>
                  <span className="font-medium">{categoryName}</span>
                  {(subcategoryName || formData.name) && <span className="mx-2">›</span>}
                </>
              )}
              {subcategoryName && (
                <>
                  <span className="font-medium">{subcategoryName}</span>
                  {formData.name && <span className="mx-2">›</span>}
                </>
              )}
              {formData.name && (
                <span className="text-gray-800 font-semibold">{formData.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Form con scroll */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-24">
          {/* Nombre y Precio en la misma fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('Nombre cambiando a:', newValue);
                setFormData(prev => ({ ...prev, name: newValue }));
              }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del producto"
              />
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  console.log('Precio cambiando a:', newValue);
                  setFormData(prev => ({ ...prev, price: newValue }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('Descripción cambiando a:', newValue);
                setFormData(prev => ({ ...prev, description: newValue }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del producto"
              rows={3}
            />
          </div>

          {/* Disponibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disponibilidad
            </label>
            <select
              value={formData.available !== false ? 'true' : 'false'}
              onChange={(e) => {
                const newValue = e.target.value === 'true';
                console.log('Disponibilidad cambiando a:', newValue);
                setFormData(prev => ({ ...prev, available: newValue }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Disponible</option>
              <option value="false">No disponible</option>
            </select>
          </div>

          {/* URL de Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen del Producto
            </label>
            <input
              type="text"
              value={formData.image_url || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('URL de imagen cambiando a:', newValue);
                setFormData(prev => ({ ...prev, image_url: newValue }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            <div className="flex gap-2 w-[90%]">
              <button
                type="button"
                onClick={() => {
                  // Generar URL de imagen basada en el nombre del producto
                  const productName = formData.name || 'food';
                  const searchTerm = encodeURIComponent(productName);
                  const randomId = Math.floor(Math.random() * 1000);
                  const newImageUrl = `https://source.unsplash.com/400x300/?${searchTerm},food&sig=${randomId}`;
                  console.log('Generando imagen con IA:', newImageUrl);
                  setFormData(prev => ({ ...prev, image_url: newImageUrl }));
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Generar con IA</span>
              </button>
              <button
                type="button"
                onClick={handleFileUpload}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all font-medium"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">Examinar</span>
              </button>
            </div>
          </div>

          {/* Vista previa de la imagen con drag & drop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vista previa
            </label>
            <div 
              className={`relative w-full h-56 bg-gray-100 rounded-lg overflow-hidden transition-all cursor-pointer
                ${isDragging ? 'ring-4 ring-blue-400 bg-blue-50' : 'hover:ring-2 hover:ring-gray-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileUpload}
            >
              {!formData.image_url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Arrastra una imagen aquí</p>
                  <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
                </div>
              )}
              <ImageWithSkeleton
                src={formData.image_url || ''}
                alt="Vista previa del producto"
                fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"
                className="absolute inset-0"
                skeletonClassName="w-full h-full rounded-lg"
              />
            </div>
          </div>

          {/* Sección de Ingredientes */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Ingredientes</h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <IngredientsExpander
                productId={formData.id || 0}
                productName={formData.name || ''}
                productCategory={formData.category_name || 'General'}
                isOpen={true}
                onToggle={() => {}}
                hideHeader={true}
              />
            </div>
          </div>

          </div>
          
          {/* Botones fijos al fondo */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex gap-2 w-[90%]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 font-medium transition-all shadow-sm hover:shadow-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all shadow-sm hover:shadow-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};