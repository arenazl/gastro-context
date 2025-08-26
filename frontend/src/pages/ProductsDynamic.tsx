import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  Package,
  Coffee,
  Pizza,
  Wine,
  Cake,
  Beef,
  Fish,
  Apple,
  IceCream,
  Cookie,
  Search,
  Save,
  X,
  ShoppingBag,
  ChefHat,
  Utensils,
  Layers,
  Tag,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Camera,
  MapPin,
  User,
  Home,
  Building
} from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../components/PageHeader';
import { SlideDrawer } from '../components/SlideDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { styles, getListItemClasses, combineClasses } from '../styles/SharedStyles';


interface Category {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

interface Subcategory {
  id?: number;
  category_id?: number;
  name: string;
  is_active?: boolean;
}

interface Product {
  id?: number;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category_id?: number;
  subcategory_id?: number;
  available?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// Iconos para categorías
const categoryIcons: { [key: string]: any } = {
  'bebida': Wine,
  'comida': Utensils,
  'postre': Cake,
  'entrada': ChefHat,
  'plato': Pizza,
  'carne': Beef,
  'pescado': Fish,
  'fruta': Apple,
  'helado': IceCream,
  'cafe': Coffee,
  'default': ShoppingBag
};

const getCategoryIcon = (name: string) => {
  const nameLower = name.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (nameLower.includes(key)) return icon;
  }
  return categoryIcons.default;
};

export const ProductsDynamic: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFromCache, setLoadingFromCache] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | 'all' | null>('all'); // Por defecto "todos"
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para la barra superior
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in');
  const [customerSearch, setCustomerSearch] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<NominatimResult | null>(null);

  // Estados para edición
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<'category' | 'subcategory' | 'product' | null>(null);

  useEffect(() => {
    loadData();
  }, []);
  
  // Búsqueda de direcciones con Nominatim (OpenStreetMap)
  const searchAddressWithNominatim = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=ar,mx,es,cl,co,pe,ec,uy,py,bo`
      );
      
      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setAddressSuggestions(data);
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
    } finally {
      setSearchingAddress(false);
    }
  };
  
  // Debounce para búsqueda de direcciones
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressSearch && addressSearch.length >= 3) {
        searchAddressWithNominatim(addressSearch);
      } else {
        setAddressSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressSearch]);
  
  const selectAddressSuggestion = (suggestion: NominatimResult) => {
    setSelectedAddress(suggestion);
    setAddressSearch(suggestion.display_name);
    setAddressSuggestions([]);
  };

  // Función de búsqueda mejorada - Movida aquí para evitar error de inicialización
  const getSearchResults = () => {
    if (!searchTerm) return null;

    const searchLower = searchTerm.toLowerCase();

    // Buscar en categorías
    const matchedCategories = categories.filter(cat =>
      cat.name.toLowerCase().includes(searchLower)
    );

    // Buscar en subcategorías
    const matchedSubcategories = subcategories.filter(sub =>
      sub.name.toLowerCase().includes(searchLower)
    );

    // Buscar en productos
    const matchedProducts = products.filter(prod =>
      prod.name.toLowerCase().includes(searchLower) ||
      (prod.description && prod.description.toLowerCase().includes(searchLower))
    );

    return {
      categories: matchedCategories,
      subcategories: matchedSubcategories,
      products: matchedProducts,
      total: matchedCategories.length + matchedSubcategories.length + matchedProducts.length
    };
  };

  const searchResults = getSearchResults();
  const showSearchResults = searchTerm.length >= 3 && searchResults;

  // Auto-seleccionar cuando hay búsqueda
  useEffect(() => {
    if (showSearchResults && searchResults && searchResults.total > 0) {
      // Si hay resultados, seleccionar basado en prioridad
      if (searchResults.products.length > 0) {
        // Si hay productos, seleccionar la categoría del primer producto
        const prod = searchResults.products[0];
        setSelectedCategory(prod.category_id!);
        setSelectedSubcategory('all'); // Mostrar todos los productos de esa categoría
      } else if (searchResults.subcategories.length > 0) {
        // Si no hay productos pero sí subcategorías
        const sub = searchResults.subcategories[0];
        setSelectedCategory(sub.category_id!);
        setSelectedSubcategory(sub.id!);
      } else if (searchResults.categories.length > 0) {
        // Si solo hay categorías
        setSelectedCategory(searchResults.categories[0].id!);
        setSelectedSubcategory('all');
      }
    } else if (searchTerm.length === 0 && categories.length > 0) {
      // Si no hay búsqueda, seleccionar la primera categoría
      if (!selectedCategory) {
        setSelectedCategory(categories[0].id!);
        setSelectedSubcategory('all');
      }
    }
  }, [searchTerm, searchResults, showSearchResults]);

  const loadData = async () => {
    // Verificar si hay datos en caché
    const cachedData = localStorage.getItem('products_cache');
    if (cachedData) {
      const { categories: cachedCat, subcategories: cachedSub, products: cachedProd, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;

      // Si el caché tiene menos de 5 minutos, usarlo
      if (cacheAge < 5 * 60 * 1000) {
        setLoadingFromCache(true);
        setCategories(cachedCat || []);
        setSubcategories(cachedSub || []);
        setProducts(cachedProd || []);

        // Seleccionar primera categoría por defecto
        if (cachedCat && cachedCat.length > 0 && !selectedCategory) {
          setSelectedCategory(cachedCat[0].id);
        }

        toast.info('📦 Cargando desde caché local', {
          position: 'bottom-right',
          autoClose: 2000
        });

        setTimeout(() => setLoadingFromCache(false), 500);
        return;
      }
    }

    setLoading(true);
    try {
      const [catRes, subRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categories`),
        fetch(`${API_BASE_URL}/api/subcategories`),
        fetch(`${API_BASE_URL}/api/products`)
      ]);

      const [catData, subData, prodData] = await Promise.all([
        catRes.json(),
        subRes.json(),
        prodRes.json()
      ]);

      setCategories(catData || []);
      setSubcategories(subData || []);
      setProducts(prodData || []);

      // Guardar en caché
      localStorage.setItem('products_cache', JSON.stringify({
        categories: catData,
        subcategories: subData,
        products: prodData,
        timestamp: Date.now()
      }));

      // Seleccionar primera categoría por defecto
      if (catData && catData.length > 0 && !selectedCategory) {
        setSelectedCategory(catData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem || !editingType) return;

    try {
      let endpoint = '';
      let method = 'POST';
      let body: any = {};

      if (editingType === 'category') {
        endpoint = editingItem.id ? `/api/categories/${editingItem.id}` : '/api/categories';
        method = editingItem.id ? 'PUT' : 'POST';
        body = {
          name: editingItem.name,
          icon: editingItem.icon || 'utensils',
          color: editingItem.color || '#3B82F6',
          is_active: true
        };
      } else if (editingType === 'subcategory') {
        endpoint = editingItem.id ? `/api/subcategories/${editingItem.id}` : '/api/subcategories';
        method = editingItem.id ? 'PUT' : 'POST';
        body = {
          name: editingItem.name,
          category_id: selectedCategory,
          is_active: true
        };
      } else if (editingType === 'product') {
        endpoint = editingItem.id ? `/api/products/${editingItem.id}` : '/api/products';
        method = editingItem.id ? 'PUT' : 'POST';
        body = {
          name: editingItem.name,
          price: editingItem.price,
          description: editingItem.description || '',
          category_id: selectedCategory,
          subcategory_id: selectedSubcategory,
          available: true
        };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success('Guardado exitosamente');
        // Invalidar caché
        localStorage.removeItem('products_cache');
        await loadData();
        setEditingItem(null);
        setEditingType(null);
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: number, type: 'category' | 'subcategory' | 'product') => {
    if (!confirm('¿Estás seguro de eliminar?')) return;

    try {
      const endpoint = type === 'category' ? `/api/categories/${id}` :
        type === 'subcategory' ? `/api/subcategories/${id}` :
          `/api/products/${id}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Eliminado exitosamente');
        // Invalidar caché
        localStorage.removeItem('products_cache');
        await loadData();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  // Obtener datos filtrados
  const getFilteredSubcategories = () => {
    // Si hay búsqueda activa, mostrar solo las subcategorías que coinciden o tienen productos que coinciden
    if (showSearchResults && searchResults) {
      return subcategories.filter(sub => {
        if (sub.category_id !== selectedCategory) return false;

        // Incluir si la subcategoría misma coincide con la búsqueda
        if (searchResults.subcategories.some(s => s.id === sub.id)) return true;

        // O si tiene productos que coinciden con la búsqueda
        return searchResults.products.some(p => p.subcategory_id === sub.id);
      });
    }

    // Comportamiento normal sin búsqueda
    return subcategories.filter(sub => sub.category_id === selectedCategory);
  };

  const getFilteredProducts = () => {
    // Si hay búsqueda activa, mostrar TODOS los productos que coinciden con la búsqueda
    if (showSearchResults && searchResults) {
      // Si hay una categoría seleccionada, filtrar por ella
      if (selectedCategory) {
        // Si es 'all', mostrar todos los productos de esa categoría que coinciden
        if (selectedSubcategory === 'all') {
          return searchResults.products.filter(prod =>
            prod.category_id === selectedCategory
          );
        }
        // Si hay subcategoría específica, filtrar por ella
        return searchResults.products.filter(prod =>
          prod.subcategory_id === selectedSubcategory
        );
      }
      // Si no hay categoría seleccionada, mostrar todos los resultados
      return searchResults.products;
    }

    // Comportamiento normal sin búsqueda
    if (selectedSubcategory === 'all') {
      // Mostrar todos los productos de la categoría seleccionada
      return products.filter(prod =>
        prod.category_id === selectedCategory
      );
    }
    // Mostrar productos de la subcategoría específica
    return products.filter(prod =>
      prod.subcategory_id === selectedSubcategory
    );
  };

  // Slide Drawer para edición con breadcrumb dinámico
  const EditDrawer = () => {
    if (!editingItem || !editingType) return null;

    // Construir breadcrumb según el contexto
    const getBreadcrumb = () => {
      const items = [];
      
      if (editingType === 'product' && selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory);
        if (category) {
          const CategoryIcon = getCategoryIcon(category.name);
          items.push({
            label: category.name,
            icon: <CategoryIcon className="h-4 w-4" />
          });
        }
        
        if (editingItem.subcategory_id && editingItem.subcategory_id !== 'all') {
          const subcategory = subcategories.find(s => s.id === editingItem.subcategory_id);
          if (subcategory) {
            items.push({
              label: subcategory.name,
              icon: <Layers className="h-3 w-3" />
            });
          }
        }
        
        if (editingItem.id) {
          items.push({ label: editingItem.name });
        }
      } else if (editingType === 'subcategory' && selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory);
        if (category) {
          const CategoryIcon = getCategoryIcon(category.name);
          items.push({
            label: category.name,
            icon: <CategoryIcon className="h-4 w-4" />
          });
        }
        if (editingItem.id) {
          items.push({ label: editingItem.name });
        }
      } else if (editingType === 'category' && editingItem.id) {
        items.push({ label: editingItem.name });
      }
      
      return items.length > 0 ? items : undefined;
    };

    const getTitle = () => {
      const action = editingItem.id ? 'Editar' : 'Nueva';
      const type = editingType === 'category' ? 'Categoría' :
                   editingType === 'subcategory' ? 'Subcategoría' : 
                   editingType === 'product' ? 'Producto' : '';
      return `${action} ${type}`;
    };

    const getSubtitle = () => {
      if (editingItem.id) {
        return `ID: #${editingItem.id}`;
      }
      return editingType === 'product' ? 'Complete todos los campos requeridos' :
             editingType === 'subcategory' ? 'Agregar nueva subcategoría' :
             'Configurar nueva categoría';
    };

    return (
      <SlideDrawer
        isOpen={true}
        onClose={() => {
          setEditingItem(null);
          setEditingType(null);
        }}
        title={getTitle()}
        subtitle={getSubtitle()}
        breadcrumb={getBreadcrumb()}
        width="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setEditingItem(null);
                setEditingType(null);
              }}
              className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Save className="h-4 w-4" />
              {editingItem.id ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-800">Información Básica</h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-3 w-3 mr-1 text-gray-500" />
                Nombre {editingType === 'product' && '*'}
              </label>
              <input
                type="text"
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={`Nombre del ${editingType === 'category' ? 'categoría' : editingType === 'subcategory' ? 'subcategoría' : 'producto'}`}
                autoFocus
              />
            </div>

            {editingType === 'product' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="inline h-3 w-3 mr-1 text-gray-500" />
                      Precio *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={editingItem.price || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                        className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disponibilidad
                    </label>
                    <select
                      value={editingItem.available !== false ? 'true' : 'false'}
                      onChange={(e) => setEditingItem({ ...editingItem, available: e.target.value === 'true' })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="true">Disponible</option>
                      <option value="false">No disponible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-3 w-3 mr-1 text-gray-500" />
                    Descripción
                  </label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Descripción detallada del producto"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          {/* Personalización Visual */}
          {(editingType === 'category' || editingType === 'product') && (
            <div className={`rounded-xl p-6 space-y-4 ${
              editingType === 'category' ? 'bg-blue-50' : 'bg-gradient-to-br from-purple-50 to-pink-50'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                {editingType === 'category' ? (
                  <>
                    <Layers className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-800">Personalización</h4>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-purple-600" />
                    <h4 className="text-lg font-semibold text-gray-800">Imagen del Producto</h4>
                  </>
                )}
              </div>

              {editingType === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color de la categoría
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'].map(color => (
                      <button
                        key={color}
                        onClick={() => setEditingItem({ ...editingItem, color })}
                        className={`w-12 h-12 rounded-xl transition-all transform hover:scale-110 ${
                          editingItem.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {editingType === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="inline h-3 w-3 mr-1 text-gray-500" />
                    URL de imagen
                  </label>
                  <input
                    type="text"
                    value={editingItem.image_url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  {editingItem.image_url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa</p>
                      <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={editingItem.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Error+al+cargar';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Estado activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={editingItem.is_active !== false}
              onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              {editingType === 'product' ? 'Producto activo y visible' : 
               editingType === 'subcategory' ? 'Subcategoría activa' : 
               'Categoría activa'}
            </label>
          </div>
        </div>
      </SlideDrawer>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header con controles de pedido - En dos filas para mejor visualización */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-3 space-y-3">
          {/* Primera fila: Título y búsqueda de productos */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Gestión de Productos</h1>
            
            {/* Búsqueda de productos */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos, categorías o subcategorías..."
                className="w-full pl-11 pr-11 py-2 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Indicador de resultados */}
            {showSearchResults && (
              <span className="text-sm text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-blue-600">{searchResults.total}</span> resultados
              </span>
            )}
          </div>
          
          {/* Segunda fila: Controles de pedido */}
          <div className="flex items-center gap-3">
            {/* Tipo de pedido */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tipo:</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'dine-in' | 'takeout' | 'delivery')}
                className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300 text-sm"
              >
                <option value="dine-in">🍽️ Mesa</option>
                <option value="takeout">🥡 Para Llevar</option>
                <option value="delivery">🚚 Delivery</option>
              </select>
            </div>

            {/* Búsqueda de cliente */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-56 pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
              />
            </div>

            {/* Búsqueda de dirección con autocomplete - Solo cuando es delivery */}
            {orderType === 'delivery' && (
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  placeholder="Buscar dirección de entrega..."
                  className="w-full pl-9 pr-9 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
                />
                {addressSearch && (
                  <button
                    onClick={() => {
                      setAddressSearch('');
                      setSelectedAddress(null);
                      setAddressSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                )}
                
                {/* Dropdown de sugerencias de dirección */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-50">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectAddressSuggestion(suggestion)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {suggestion.display_name.split(',')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {suggestion.display_name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Indicador de dirección seleccionada */}
            {selectedAddress && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-xs">📍 {selectedAddress.display_name.split(',')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Contenedor principal con 3 columnas - SIEMPRE VISIBLE */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna 1: Categorías - 20% */}
        <div className="border-r border-gray-200 bg-white" style={{ flexBasis: '20%', flexShrink: 0 }}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Categorías</h3>
              <button
                onClick={() => {
                  setEditingItem({ name: '', color: '#3B82F6' });
                  setEditingType('category');
                }}
                className={styles.button.addNewCategory}
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-full scrollbar-hide" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="p-2 space-y-2">
              {(showSearchResults ? searchResults.categories : categories).map((category) => {
                const Icon = getCategoryIcon(category.name);
                const isSelected = selectedCategory === category.id;
                const catCount = subcategories.filter(s => s.category_id === category.id).length;
                const catProds = products.filter(p => p.category_id === category.id).length;

                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory(category.id!);
                      setSelectedSubcategory('all'); // Por defecto mostrar todos los productos
                      setSearchTerm(''); // Limpiar búsqueda al seleccionar categoría
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-white/30' : ''
                          }`}
                          style={{ backgroundColor: !isSelected ? (category.color || '#3B82F6') + '25' : undefined }}
                        >
                          <Icon className="h-7 w-7" style={{ color: isSelected ? 'white' : category.color || '#3B82F6' }} />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                            {category.name}
                          </p>
                          <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            {catCount} subcategorías · {catProds} productos
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(category);
                              setEditingType('category');
                            }}
                            className={styles.button.actionEdit}
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(category.id!, 'category');
                            }}
                            className={styles.button.actionDelete}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna 2: Subcategorías - 20% */}
        <div className="border-r border-gray-200 bg-gray-50" style={{ flexBasis: '20%', flexShrink: 0 }}>
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Subcategorías</h3>
              {selectedCategory && (
                <button
                  onClick={() => {
                    setEditingItem({ name: '', category_id: selectedCategory });
                    setEditingType('subcategory');
                  }}
                  className={styles.button.addNewSubcategory}
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto h-full scrollbar-hide" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {selectedCategory ? (
              <div className="p-2 space-y-2">
                {/* Opción "Todos" */}
                <motion.div
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedSubcategory('all');
                    setSearchTerm(''); // Limpiar búsqueda
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all ${selectedSubcategory === 'all'
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                      : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                >
                  <div className="flex items-center">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedSubcategory === 'all' ? 'bg-white/30' : 'bg-green-100'
                        }`}>
                        <span className="text-xl font-bold">∞</span>
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${selectedSubcategory === 'all' ? 'text-white' : 'text-gray-800'}`}>
                          Todos los productos
                        </p>
                        <p className={`text-xs ${selectedSubcategory === 'all' ? 'text-white/80' : 'text-gray-500'}`}>
                          {products.filter(p => p.category_id === selectedCategory).length} productos
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Subcategorías */}
                {getFilteredSubcategories().map((subcategory, index) => {
                  const isSelected = selectedSubcategory === subcategory.id;
                  const prodCount = products.filter(p => p.subcategory_id === subcategory.id).length;
                  
                  // Rotar entre colores como las categorías
                  const colorSchemes = [
                    { gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-100', color: '#3B82F6' },
                    { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-100', color: '#A855F7' },
                    { gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-100', color: '#F97316' },
                    { gradient: 'from-green-500 to-teal-500', bg: 'bg-green-100', color: '#10B981' },
                    { gradient: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-100', color: '#F59E0B' },
                    { gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-100', color: '#06B6D4' },
                    { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-100', color: '#F43F5E' },
                    { gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-100', color: '#6366F1' }
                  ];
                  const colorScheme = colorSchemes[index % colorSchemes.length];

                  return (
                    <motion.div
                      key={subcategory.id}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSubcategory(subcategory.id!);
                        setSearchTerm(''); // Limpiar búsqueda
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
                          ? `bg-gradient-to-r ${colorScheme.gradient} text-white shadow-lg`
                          : 'bg-white hover:bg-gray-50 border border-gray-100'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-white/30' : colorScheme.bg
                            }`}>
                            <Layers className="h-6 w-6" style={{ color: isSelected ? 'white' : colorScheme.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                              {subcategory.name}
                            </p>
                            <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              {prodCount} productos
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(subcategory);
                                setEditingType('subcategory');
                              }}
                              className={styles.button.actionEdit}
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(subcategory.id!, 'subcategory');
                              }}
                              className={styles.button.actionDelete}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-center">Selecciona una categoría</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Productos - el resto (70%) */}
        <div className="flex-1 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">
                Productos {selectedSubcategory === 'all' && selectedCategory && '(Todos)'}
              </h3>
              {selectedCategory && (
                <button
                  onClick={() => {
                    setEditingItem({
                      name: '',
                      price: 0,
                      description: '',
                      category_id: selectedCategory,
                      subcategory_id: selectedSubcategory
                    });
                    setEditingType('product');
                  }}
                  className={styles.button.addNewProduct}
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto h-full scrollbar-hide" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {selectedCategory ? (
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getFilteredProducts().map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 h-full flex flex-col"
                  >
                    {/* Imagen de fondo con gradiente */}
                    <div
                      className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 relative"
                      style={{
                        backgroundImage: product.image_url
                          ? `url(${product.image_url})`
                          : `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Badge de disponibilidad */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${product.available !== false
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                          }`}>
                          {product.available !== false ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>

                    {/* Contenido del producto */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="font-bold text-gray-800 text-base mb-1 h-12 line-clamp-2">{product.name}</h4>
                      <p className="text-xl font-bold text-green-600 mb-2">${product.price}</p>
                      <p className="text-xs text-gray-500 h-8 line-clamp-2 mb-3">
                        {product.description || '\u00A0'}
                      </p>

                      {/* Botones en la parte inferior */}
                      <div className="flex gap-2 mt-auto pt-4 pb-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setEditingItem(product);
                            setEditingType('product');
                          }}
                          className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id!, 'product')}
                          className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Borrar</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-center">Selecciona una categoría para ver productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Drawer de edición */}
      <AnimatePresence>
        {(editingItem && editingType) && <EditDrawer />}
      </AnimatePresence>

    </div>
  );
};