import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { productsAPI } from '../services/api';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id?: number;
  category_name?: string;
  available: boolean;
  image_url?: string;
  image_filename?: string;
}

export const ProductsEnhanced: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    available: true,
    image_url: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback a datos mock si falla la API
      const mockProducts = [
        {
          id: 1, name: 'Caesar Salad Premium', price: 12.99,
          category_id: 3, category_name: 'Ensaladas',
          description: 'Lechuga romana fresca con aderezo césar casero',
          image_url: '/uploads/products/sample_caesar.jpg',
          available: true
        }
      ];
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8003'}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback a categorías mock
      const mockCategories = [
        { id: 1, name: 'Entradas', icon: 'appetizer', color: '#10B981' },
        { id: 2, name: 'Sopas', icon: 'soup', color: '#F59E0B' },
        { id: 3, name: 'Ensaladas', icon: 'salad', color: '#22C55E' },
        { id: 4, name: 'Carnes', icon: 'meat', color: '#DC2626' },
        { id: 5, name: 'Postres', icon: 'dessert', color: '#EC4899' }
      ];
      setCategories(mockCategories);
    }
  };

  // Filtrar productos
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8003'}/api/products/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({ 
          ...prev, 
          image_url: result.url 
        }));
      } else {
        alert('Error subiendo la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error subiendo la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category_id: product.category_id?.toString() || '',
        available: product.available,
        image_url: product.image_url || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        available: true,
        image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      available: true,
      image_url: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      available: formData.available,
      image_url: formData.image_url
    };

    try {
      if (editingProduct) {
        await productsAPI.updateProduct(editingProduct.id, productData);
      } else {
        await productsAPI.createProduct(productData);
      }
      
      await loadProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error guardando el producto');
    }
  };

  const getCategoryBadgeColor = (category: Category) => {
    return {
      backgroundColor: category.color + '20',
      color: category.color,
      borderColor: category.color + '40'
    };
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra el menú del restaurante con categorías e imágenes
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filtros de categorías */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
            } border`}
          >
            Todas las categorías
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === category.id
                  ? 'text-white border-transparent'
                  : 'border-gray-200 hover:border-opacity-60'
              }`}
              style={{
                ...(selectedCategory === category.id 
                  ? { backgroundColor: category.color }
                  : { backgroundColor: category.color + '10', color: category.color }
                )
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{products.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Productos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {products.filter(p => p.available).length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Disponibles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => p.available).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {products.filter(p => !p.available).length}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    No Disponibles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products.filter(p => !p.available).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{categories.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Categorías
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {categories.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProducts.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No se encontraron productos
            </li>
          ) : (
            filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category_id);
              return (
                <li key={product.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0 h-16 w-16">
                        {product.image_url ? (
                          <img
                            className="h-16 w-16 rounded-lg object-cover"
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8003'}${product.image_url}`}
                            alt={product.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Información del producto */}
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-lg font-medium text-gray-900">{product.name}</div>
                          <div className="ml-2">
                            {product.available ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Disponible
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                No disponible
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                        <div className="flex items-center mt-1">
                          <div className="text-lg font-bold text-gray-900">${product.price}</div>
                          {category && (
                            <span
                              className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                              style={getCategoryBadgeColor(category)}
                            >
                              {category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openModal(product)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                            // TODO: Implementar eliminación
                            console.log('Delete product:', product.id);
                          }
                        }}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Modal para crear/editar producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Imagen del producto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Imagen</label>
                      <div className="mt-1 flex items-center space-x-4">
                        {formData.image_url ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8003'}${formData.image_url}`}
                            alt="Preview"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                            <PhotoIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {uploadingImage ? (
                              <>
                                <CloudArrowUpIcon className="h-4 w-4 mr-2 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                                Subir Imagen
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Precio</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoría</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Disponibilidad */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Disponible para pedidos
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'} Producto
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};