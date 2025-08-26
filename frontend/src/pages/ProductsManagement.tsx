import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  PlusCircle, 
  Edit2, 
  Trash2, 
  Search, 
  Filter,
  Grid,
  List,
  ChevronRight,
  Package,
  Tag,
  Layers,
  X,
  Save,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  Check,
  ChevronDown,
  Move,
  Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fas from '@fortawesome/free-solid-svg-icons';
import { PageHeader } from '../components/PageHeader';
import { FloatingButton } from '../components/AnimatedComponents';


// Helper para renderizar iconos de FontAwesome o emojis
const renderCategoryIcon = (icon: string | undefined) => {
  if (!icon) return '📦';
  
  // Si es un emoji (caracteres Unicode), devolverlo directamente
  if (icon.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(icon)) {
    return icon;
  }
  
  // Convertir nombres de FontAwesome a formato correcto
  const iconName = icon.replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/ /g, '');
  
  // Intentar obtener el icono de FontAwesome
  const faIconName = `fa${iconName}` as keyof typeof fas;
  const faIcon = fas[faIconName];
  
  // Si existe el icono, renderizarlo
  if (faIcon) {
    return <FontAwesomeIcon icon={faIcon} className="text-xl" />;
  }
  
  // Mapeo manual de iconos comunes
  const iconMap: { [key: string]: any } = {
    'drumstick-bite': fas.faDrumstickBite,
    'wine-glass': fas.faWineGlass,
    'coffee': fas.faCoffee,
    'ice-cream': fas.faIceCream,
    'fish': fas.faFish,
    'pizza-slice': fas.faPizzaSlice,
    'hamburger': fas.faHamburger,
    'utensils': fas.faUtensils,
    'beer': fas.faBeer,
    'cocktail': fas.faCocktail,
    'glass-water': fas.faGlassWater,
    'mug-hot': fas.faMugHot,
    'bowl-food': fas.faBowlFood,
    'plate-wheat': fas.faPlateWheat,
    'bacon': fas.faBacon,
    'cheese': fas.faCheese,
    'egg': fas.faEgg,
    'apple': fas.faAppleAlt || fas.faAppleWhole,
    'carrot': fas.faCarrot,
    'lemon': fas.faLemon,
    'pepper-hot': fas.faPepperHot,
    'leaf': fas.faLeaf,
    'seedling': fas.faSeedling
  };
  
  const mappedIcon = iconMap[icon];
  if (mappedIcon) {
    return <FontAwesomeIcon icon={mappedIcon} className="text-xl" />;
  }
  
  // Fallback a un icono genérico
  return <FontAwesomeIcon icon={fas.faUtensils} className="text-xl" />;
};

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  subcategory_id?: number;
  price: number;
  cost_price?: number;
  available: boolean;
  image_url?: string;
  preparation_time?: number;
  featured?: boolean;
}

// CSS para animaciones
const animationStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const ProductsManagement: React.FC = () => {
  // Estados principales
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('products');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Estados de modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estados para formularios laterales
  const [showSideForm, setShowSideForm] = useState<'category' | 'subcategory' | 'product' | null>(null);
  const [dynamicSubcategories, setDynamicSubcategories] = useState<string[]>([]);

  // Cargar datos - TODO precargado al inicio
  useEffect(() => {
    loadInitialData();
  }, []);

  // Funciones helper para contar
  const getSubcategoryCount = (categoryId: number) => {
    return subcategories.filter(sub => sub.category_id === categoryId && sub.is_active).length;
  };

  const getProductCount = (categoryId: number) => {
    return products.filter(p => p.category_id === categoryId).length;
  };
  
  const getSubcategoriesForCategory = (categoryId: number) => {
    return subcategories.filter(sub => sub.category_id === categoryId && sub.is_active);
  };

  // Función para cargar todos los datos al inicio
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar todo en paralelo para mayor velocidad
      const [categoriesRes, subcategoriesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/subcategories`),
        fetch(`${API_URL}/api/products`)
      ]);

      const [categoriesData, subcategoriesData, productsData] = await Promise.all([
        categoriesRes.json(),
        subcategoriesRes.json(),
        productsRes.json()
      ]);

      setCategories(categoriesData);
      setSubcategories(subcategoriesData || []);
      setProducts(productsData);
      setDataLoaded(true); // Marcar que los datos están cargados
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    // Toggle de expansión/contracción
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      // Si está expandida, contraer
      newExpanded.delete(categoryId);
      // Si estamos contrayendo la categoría seleccionada, mantener la selección
    } else {
      // Si está contraída, expandir
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
    
    // Seleccionar categoría sin recargar productos automáticamente
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    // Nota: Ya no recargamos productos aquí automáticamente
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Error cargando categorías');
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/subcategories?category_id=${categoryId}`);
      const data = await response.json();
      setSubcategories(prevSubs => {
        // Mantener subcategorías de otras categorías
        const otherSubs = prevSubs.filter(s => s.category_id !== categoryId);
        return [...otherSubs, ...data];
      });
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadAllSubcategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subcategories`);
      const data = await response.json();
      setSubcategories(data);
    } catch (error) {
      console.error('Error loading all subcategories:', error);
      // Mock data para desarrollo
      setSubcategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/products`;
      const params = new URLSearchParams();
      
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (selectedSubcategory) params.append('subcategory_id', selectedSubcategory.toString());
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para cargar productos de una categoría específica sin afectar las categorías
  const loadProductsForCategory = async (categoryId: number) => {
    try {
      setLoading(true);
      const url = `${API_URL}/api/products?category_id=${categoryId}`;
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
      setSelectedCategory(categoryId);
      setSelectedSubcategory(null);
    } catch (error) {
      console.error('Error loading products for category:', error);
      toast.error('Error cargando productos de categoría');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para categorías
  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `${API_URL}/api/categories/${editingCategory.id}`
        : `${API_URL}/api/categories`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
        loadCategories();
        setShowCategoryModal(false);
        setEditingCategory(null);
      }
    } catch (error) {
      toast.error('Error guardando categoría');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Categoría eliminada');
        loadCategories();
      }
    } catch (error) {
      toast.error('Error eliminando categoría');
    }
  };

  // Componente de Modal de Categoría
  const CategoryModal = () => {
    const [formData, setFormData] = useState<Partial<Category>>(
      editingCategory || { name: '', icon: '', color: '#4F46E5', is_active: true }
    );

    const iconOptions = [
      '🍔', '🍕', '🥗', '🍝', '🥤', '🍰', '☕', '🍷', '🍺', '🥘', '🍜', '🍱'
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <button onClick={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Entradas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icono</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormData({...formData, icon})}
                    className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                      formData.icon === icon 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="active">Categoría activa</label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => handleSaveCategory(formData)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
            <button
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
              }}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Panel Lateral de Categorías
  const CategoriesPanel = () => (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto shadow-sm">
      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-800">Categorías</h3>
            <p className="text-xs text-gray-500 mt-1">{categories.length} categorías activas</p>
          </div>
          <button
            onClick={() => {
              setShowSideForm('category');
              setDynamicSubcategories(['']);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Nueva Categoría</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
      <div className="p-2">
        {/* Opción "Todas las categorías" */}
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSelectedSubcategory(null);
          }}
          className={`w-full text-left p-3 rounded-lg mb-1 flex items-center justify-between group hover:bg-gray-50 ${
            !selectedCategory ? 'bg-blue-50 border-blue-200 border' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Grid className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Todos los productos</span>
          </div>
          <span className="text-sm text-gray-500">{products.length}</span>
        </button>

        {/* Lista de categorías */}
        {categories.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const isSelected = selectedCategory === category.id;
          const subCount = getSubcategoryCount(category.id);
          const prodCount = getProductCount(category.id);
          const categoryColor = category.color || '#6B7280';
          const categorySubs = getSubcategoriesForCategory(category.id);
          
          return (
            <div key={category.id} className="mb-1">
              <div
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'ring-2 shadow-sm' 
                    : 'hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: isSelected ? `${categoryColor}15` : 'white',
                  borderColor: isSelected ? categoryColor : 'transparent',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = `${categoryColor}08`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <span style={{ color: categoryColor }}>
                      {renderCategoryIcon(category.icon)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500">
                      {subCount > 0 ? (
                        <>
                          <span className="font-bold text-gray-700">{subCount} subcategorías</span>
                          <span> • </span>
                          <span>{prodCount} productos</span>
                        </>
                      ) : (
                        <span>{prodCount} productos</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Botón del ojo para cargar productos - APARECE SOLO EN HOVER */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadProductsForCategory(category.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded z-10 text-blue-600"
                    title="Ver productos de esta categoría"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(category);
                      setShowCategoryModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded z-10"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 z-10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  {subCount > 0 && (
                    <div className="p-1">
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`} />
                    </div>
                  )}
                </div>
              </div>

              {/* Subcategorías - siempre renderizadas pero ocultas/visibles con animación */}
              {categorySubs.length > 0 && (
                <div 
                  className="ml-4"
                  style={{
                    maxHeight: isExpanded ? '800px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div 
                    className="space-y-1 py-2"
                    style={{
                      transform: isExpanded ? 'translateY(0)' : 'translateY(-20px)',
                      transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {categorySubs.map((sub, index) => {
                      const subProdCount = products.filter(p => p.subcategory_id === sub.id).length;
                      return (
                        <div
                          key={sub.id}
                          style={{
                            opacity: isExpanded ? 1 : 0,
                            transform: isExpanded ? 'translateY(0) translateX(0)' : 'translateY(-15px) translateX(-10px)',
                            transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                            transitionDelay: isExpanded ? `${index * 0.06}s` : '0s'
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setSelectedSubcategory(sub.id);
                            }}
                            className={`w-full text-left p-2 pl-8 rounded-lg flex items-center justify-between transition-all duration-200 ${
                              selectedSubcategory === sub.id 
                                ? 'shadow-sm' 
                                : 'hover:bg-gray-50'
                            }`}
                            style={{
                              backgroundColor: selectedSubcategory === sub.id ? `${categoryColor}10` : 'white',
                              borderLeft: `3px solid ${categoryColor}40`
                            }}
                          >
                            <span className="text-sm">{sub.name}</span>
                            <span className="text-xs text-gray-500">{subProdCount} productos</span>
                          </button>
                        </div>
                      );
                    })}
                    <div
                      style={{
                        opacity: isExpanded ? 1 : 0,
                        transform: isExpanded ? 'translateY(0) translateX(0)' : 'translateY(-15px) translateX(-10px)',
                        transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                        transitionDelay: isExpanded ? `${categorySubs.length * 0.06}s` : '0s'
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSideForm('subcategory');
                        }}
                        className="w-full text-left p-2 pl-8 rounded-lg flex items-center gap-2 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        style={{ 
                          borderLeft: `3px solid ${categoryColor}40`
                        }}
                      >
                        <PlusCircle className="h-3 w-3" />
                        <span className="text-sm">Agregar subcategoría</span>
                      </button>
                    </div>
                    
                    {/* Botón de nuevo producto cuando la categoría está expandida */}
                    {isExpanded && (
                      <div
                        style={{
                          opacity: isExpanded ? 1 : 0,
                          transform: isExpanded ? 'translateY(0)' : 'translateY(-15px)',
                          transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                          transitionDelay: isExpanded ? `${(categorySubs.length + 1) * 0.06}s` : '0s'
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSideForm('product');
                          }}
                          className="w-full text-left p-2 pl-8 rounded-lg flex items-center gap-2 text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
                          style={{ 
                            borderLeft: `3px solid ${categoryColor}40`
                          }}
                        >
                          <Package className="h-3 w-3" />
                          <span className="text-sm">Nuevo Producto</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );

  // Componente de Grid de Productos
  const ProductsGrid = () => {
    const filteredProducts = products.filter(product => {
      if (searchTerm) {
        return product.name.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Gestión de Productos</h2>
              <p className="text-gray-600">
                {selectedCategory 
                  ? `${categories.find(c => c.id === selectedCategory)?.name} - ${filteredProducts.length} productos`
                  : `Todos los productos - ${filteredProducts.length} productos`
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setShowProductModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Nuevo Producto
              </button>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Grid/List de productos */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => {
                    setEditingProduct(product);
                    setShowProductModal(true);
                  }}
                >
                  <div className="aspect-square bg-gray-100 rounded-t-lg relative overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {product.featured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                        Destacado
                      </div>
                    )}
                    {!product.available && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">No disponible</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">${product.price}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(product);
                            setShowProductModal(true);
                          }}
                          className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // handleDeleteProduct(product.id);
                          }}
                          className="p-1 bg-red-100 rounded hover:bg-red-200 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Precio</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {categories.find(c => c.id === product.category_id)?.name}
                      </td>
                      <td className="p-3 font-semibold">${product.price}</td>
                      <td className="p-3">
                        <span className="text-green-600">En stock</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.available ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowProductModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1 hover:bg-red-100 rounded text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <style>{animationStyles}</style>
      
      {/* Header principal */}
      <PageHeader 
        title="Gestión de Productos"
        subtitle={`${products.length} productos en ${categories.length} categorías`}
        actions={[
          {
            label: 'Nuevo Producto',
            onClick: () => setShowSideForm('product'),
            variant: 'primary' as const,
            icon: Package
          }
        ]}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Panel lateral de categorías */}
        <CategoriesPanel />
        
        {/* Área principal de productos */}
        <ProductsGrid />
        
        {/* Formulario lateral dinámico */}
        {showSideForm && (
          <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto shadow-lg">
            {showSideForm === 'category' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Nueva Categoría</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre de Categoría</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Postres"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Icono</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['🍔', '🍕', '🥗', '🍝', '🥤', '🍰'].map(icon => (
                        <button
                          key={icon}
                          className="p-3 text-2xl rounded-lg border-2 hover:border-blue-500"
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Subcategorías</label>
                    {dynamicSubcategories.map((sub, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={sub}
                          onChange={(e) => {
                            const newSubs = [...dynamicSubcategories];
                            newSubs[index] = e.target.value;
                            setDynamicSubcategories(newSubs);
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="Nombre de subcategoría"
                        />
                        <button
                          onClick={() => {
                            const newSubs = dynamicSubcategories.filter((_, i) => i !== index);
                            setDynamicSubcategories(newSubs);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setDynamicSubcategories([...dynamicSubcategories, ''])}
                      className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
                    >
                      + Agregar subcategoría
                    </button>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Guardar Categoría
                    </button>
                    <button
                      onClick={() => setShowSideForm(null)}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {showSideForm === 'subcategory' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Nueva Subcategoría</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Helados"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría Padre</label>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Guardar
                    </button>
                    <button
                      onClick={() => setShowSideForm(null)}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {showSideForm === 'product' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Nuevo Producto</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Cheesecake"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Descripción del producto"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Guardar Producto
                    </button>
                    <button
                      onClick={() => setShowSideForm(null)}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modales */}
      {showCategoryModal && <CategoryModal />}
      
      {/* Modal de subcategoría (simplificado) */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nueva Subcategoría</h3>
            {/* Contenido del modal... */}
            <button onClick={() => setShowSubcategoryModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
      
      {/* Modal de producto (simplificado) */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            {/* Contenido del modal... */}
            <button onClick={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};