import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Package,
  Layers,
  Save,
  Eye,
  PlusCircle,
  Search,
  Filter,
  X,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as fas from '@fortawesome/free-solid-svg-icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002';

interface Category {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  subcategories?: Subcategory[];
  is_active?: boolean;
}

interface Subcategory {
  id?: number;
  category_id?: number;
  name: string;
  products?: Product[];
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

// Función para generar color aleatorio
const generateRandomColor = () => {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
    '#6366F1', '#84CC16', '#06B6D4', '#A855F7'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Función para obtener icono automático
const getAutoIcon = (name: string): string => {
  const nameLower = name.toLowerCase();
  const iconMap: { [key: string]: string } = {
    'entrada': 'utensils',
    'plato': 'plate-wheat',
    'principal': 'drumstick-bite',
    'carne': 'drumstick-bite',
    'pollo': 'drumstick-bite',
    'pescado': 'fish',
    'mariscos': 'fish',
    'pasta': 'bowl-food',
    'pizza': 'pizza-slice',
    'hamburguesa': 'hamburger',
    'sandwich': 'burger',
    'ensalada': 'leaf',
    'sopa': 'bowl-rice',
    'postre': 'ice-cream',
    'bebida': 'glass-water',
    'cerveza': 'beer',
    'vino': 'wine-glass',
    'café': 'mug-hot'
  };

  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (nameLower.includes(keyword)) {
      return icon;
    }
  }
  return 'utensils';
};

// Componente para renderizar iconos
const RenderIcon = ({ icon }: { icon: string }) => {
  const iconName = icon.replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/ /g, '');
  const faIconName = `fa${iconName}` as keyof typeof fas;
  const faIcon = fas[faIconName] || fas.faUtensils;
  return <FontAwesomeIcon icon={faIcon} className="text-xl" />;
};

export const ProductsCompleteNew: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Estados para creación
  const [createMode, setCreateMode] = useState<'category' | 'subcategory' | 'product'>('category');
  const [currentCategory, setCurrentCategory] = useState<Category>({ name: '', icon: '', color: '' });
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory>({ name: '' });
  const [currentProduct, setCurrentProduct] = useState<Product>({ name: '', price: 0, description: '' });
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [selectedParentSubcategory, setSelectedParentSubcategory] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, subRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/subcategories`),
        fetch(`${API_URL}/api/products`)
      ]);

      const [catData, subData, prodData] = await Promise.all([
        catRes.json(),
        subRes.json(),
        prodRes.json()
      ]);

      setCategories(catData || []);
      setSubcategories(subData || []);
      setProducts(prodData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subcategories.some(sub =>
      sub.category_id === cat.id &&
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calcular estadísticas
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const activeProducts = products.filter(p => p.available !== false).length;
  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  const DataView = () => {
    return (
      <div className="h-full flex flex-col">
        {/* Header Moderno */}
        <div className="bg-white shadow-lg rounded-2xl mx-6 mt-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex justify-between items-start">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Stock Existentes
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-blue-100"
                >
                  Gestiona tu inventario de manera eficiente
                </motion.p>
              </div>

              {/* Barra de búsqueda elegante */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en inventario..."
                  className="pl-10 pr-4 py-3 w-80 bg-white/90 backdrop-blur rounded-xl focus:ring-2 focus:ring-white focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </motion.div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/20 backdrop-blur rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-white/80" />
                  <div>
                    <p className="text-xs text-white/80">Total Productos</p>
                    <p className="text-xl font-bold text-white">{totalProducts}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/20 backdrop-blur rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-white/80" />
                  <div>
                    <p className="text-xs text-white/80">Valor Total</p>
                    <p className="text-xl font-bold text-white">${totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/20 backdrop-blur rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-white/80" />
                  <div>
                    <p className="text-xs text-white/80">Activos</p>
                    <p className="text-xl font-bold text-white">{activeProducts}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-white/20 backdrop-blur rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-white/80" />
                  <div>
                    <p className="text-xs text-white/80">Precio Promedio</p>
                    <p className="text-xl font-bold text-white">${avgPrice.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Área de contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => {
              const catSubs = subcategories.filter(s => s.category_id === category.id);
              const catProds = products.filter(p => p.category_id === category.id);
              const isExpanded = expandedCategory === category.id;

              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${isExpanded ? 'col-span-full' : ''}`}
                >
                  <motion.div
                    whileHover={{ y: -5 }}
                    onMouseEnter={() => setHoveredCard(category.id!)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden ${
                      isExpanded ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleCategoryClick(category.id!)}
                  >
                    {/* Header del Card */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: (category.color || '#3B82F6') + '20',
                              color: category.color || '#3B82F6'
                            }}
                          >
                            {category.icon && <RenderIcon icon={category.icon} />}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{category.name}</h3>
                            <p className="text-xs text-gray-500">
                              {catSubs.length} subcategorías · {catProds.length} productos
                            </p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </motion.div>
                      </div>

                      {/* Vista previa rápida */}
                      {!isExpanded && catSubs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {catSubs.slice(0, 3).map(sub => (
                            <span
                              key={sub.id}
                              className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-600"
                            >
                              {sub.name}
                            </span>
                          ))}
                          {catSubs.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-500">
                              +{catSubs.length - 3} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contenido Expandido */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100"
                        >
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {catSubs.map((sub, subIndex) => {
                                const subProds = products.filter(p => p.subcategory_id === sub.id);
                                return (
                                  <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIndex * 0.05 }}
                                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-gray-700">{sub.name}</h4>
                                      <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-500">
                                        {subProds.length} items
                                      </span>
                                    </div>
                                    
                                    {/* Productos de la subcategoría */}
                                    <div className="space-y-1">
                                      {subProds.slice(0, 3).map(prod => (
                                        <div
                                          key={prod.id}
                                          className="flex items-center justify-between text-xs"
                                        >
                                          <span className="text-gray-600 truncate">{prod.name}</span>
                                          <span className="text-gray-500">${prod.price}</span>
                                        </div>
                                      ))}
                                      {subProds.length > 3 && (
                                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                          Ver {subProds.length - 3} más...
                                        </button>
                                      )}
                                    </div>

                                    {/* Botón de agregar producto */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('create');
                                        setCreateMode('product');
                                        setSelectedParentCategory(category.id!);
                                        setSelectedParentSubcategory(sub.id!);
                                      }}
                                      className="mt-3 w-full py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                                    >
                                      + Agregar Producto
                                    </button>
                                  </motion.div>
                                );
                              })}

                              {/* Card para agregar subcategoría */}
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: catSubs.length * 0.05 }}
                                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('create');
                                  setCreateMode('subcategory');
                                  setSelectedParentCategory(category.id!);
                                }}
                              >
                                <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
                                  <PlusCircle className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                                  <span className="text-sm font-medium text-gray-700">Nueva Subcategoría</span>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Card para agregar nueva categoría */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: filteredCategories.length * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-dashed border-blue-300"
              onClick={() => {
                setActiveTab('create');
                setCreateMode('category');
              }}
            >
              <div className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <PlusCircle className="h-12 w-12 text-blue-500 mb-3" />
                </motion.div>
                <p className="text-gray-700 font-semibold">Nueva Categoría</p>
                <p className="text-xs text-gray-500 mt-1">Click para crear</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Gestión de Productos"
        subtitle="Control completo de tu inventario"
      />

      <div className="flex-1 overflow-hidden">
        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 py-3 px-6 font-medium transition-all ${
                  activeTab === 'view'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista de Inventario
                </div>
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 px-6 font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Crear Nuevo
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'view' ? (
            <DataView />
          ) : (
            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Crear Nuevo Elemento</h3>
                {/* Aquí iría el formulario de creación */}
                <p className="text-gray-500">Formulario de creación en desarrollo...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};