import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { IngredientsExpander } from '../components/IngredientsExpander';
import { motion, AnimatePresence } from 'framer-motion';
import { styles, getListItemClasses, combineClasses } from '../styles/SharedStyles';
import dataFetchService from '../services/dataFetchService';
import imageCache from '../services/imageCache';
import { imageCacheService } from '../services/imageCache.service';
import LazyImage from '../components/LazyImage';
import { checkBrowserCapabilities, getAvailableStorageOptions } from '../utils/browserCapabilities';


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

// Cache de productos por categoría
const productsCache = new Map<number | 'all', Product[]>();
const subcategoriesCache = new Map<number | 'all', Subcategory[]>();

export const ProductsDynamic: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [preloadingBackground, setPreloadingBackground] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | 'all' | null>('all'); // Por defecto "todos"
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el modal de productos con pestañas
  const [activeProductTab, setActiveProductTab] = useState<'general' | 'ingredients'>('general');
  
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
  const [categoryImagesLoading, setCategoryImagesLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
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

  // Carga inicial optimizada con priorización de imágenes
  const loadInitialData = async () => {
    setLoading(true);
    
    try {
      // REQUEST ÚNICO: Cargar TODO de una vez para tener metadata completa
      const [catData, allSubData, allProdData] = await Promise.all([
        dataFetchService.fetch<Category[]>(`${API_BASE_URL}/api/categories`, {
          showNotification: false,
          cacheDuration: 10 * 60 * 1000
        }),
        dataFetchService.fetch<Subcategory[]>(`${API_BASE_URL}/api/subcategories`, {
          showNotification: false,
          cacheDuration: 10 * 60 * 1000
        }),
        dataFetchService.fetch<Product[]>(`${API_BASE_URL}/api/products`, {
          showNotification: false,
          cacheDuration: 10 * 60 * 1000
        })
      ]);

      setCategories(catData || []);
      
      if (catData && catData.length > 0 && allSubData && allProdData) {
        const firstCategoryId = catData[0].id;
        setSelectedCategory(firstCategoryId);
        
        // Organizar datos por categoría en cache
        catData.forEach(category => {
          const categoryId = category.id!;
          const categorySubs = allSubData.filter(sub => sub.category_id === categoryId);
          const categoryProds = allProdData.filter(prod => prod.category_id === categoryId);
          
          // Guardar en cache local
          subcategoriesCache.set(categoryId, categorySubs);
          productsCache.set(categoryId, categoryProds);
        });
        
        // Mostrar datos de la primera categoría inmediatamente
        const firstCategorySubcategories = subcategoriesCache.get(firstCategoryId) || [];
        const firstCategoryProducts = productsCache.get(firstCategoryId) || [];
        
        setSubcategories(firstCategorySubcategories);
        setProducts(firstCategoryProducts);
        
        console.log(`✅ Cargados: ${catData.length} categorías, ${allSubData.length} subcategorías, ${allProdData.length} productos`);
        
        // 🎯 PRIORIDAD: Cargar imágenes de la primera categoría inmediatamente
        setTimeout(() => startPriorityImageCaching(firstCategoryProducts, allProdData), 100);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Sistema de carga priorizada de imágenes
  const startPriorityImageCaching = async (priorityProducts: Product[], allProducts: Product[]) => {
    const startTime = performance.now();
    console.log('🚀 === INICIANDO CARGA PRIORITARIA DE IMÁGENES ===');
    console.log(`📅 Timestamp: ${new Date().toLocaleTimeString()}`);
    
    try {
      // 🔍 VERIFICAR CAPACIDADES DEL BROWSER
      const capabilities = checkBrowserCapabilities();
      if (!capabilities.caches || typeof caches === 'undefined') {
        console.log('⚠️ Cache API no disponible, usando solo lazy loading con proxy');
        console.log(`✅ Proxy está activo - las imágenes se cargarán bajo demanda`);
        return;
      }
      
      // 🎯 FASE 1: CARGAR IMÁGENES PRIORITARIAS (primera categoría visible)
      console.log(`🎯 FASE 1: Cargando imágenes prioritarias (${priorityProducts.length} productos)`);
      // En producción (HTTPS), usar proxy para evitar CORS
      const isProduction = window.location.protocol === 'https:';
      const priorityUrls = priorityProducts
        .filter(p => p.image_url)
        .map(p => isProduction && p.image_url?.includes('picsum.photos') 
          ? `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(p.image_url!)}` 
          : p.image_url!)
        .slice(0, 12); // Limitar a los primeros 12 productos visibles
      
      if (priorityUrls.length > 0) {
        await imageCacheService.precacheImages(priorityUrls);
        console.log(`✅ Fase 1 completada: ${priorityUrls.length} imágenes prioritarias cacheadas`);
      }
      
      // 🔄 FASE 2: BACKGROUND - Cargar el resto de imágenes en batches pequeños
      const remainingProducts = allProducts.filter(p => 
        p.image_url && !priorityProducts.some(pp => pp.id === p.id)
      );
      
      if (remainingProducts.length > 0) {
        console.log(`🔄 FASE 2: Iniciando carga background (${remainingProducts.length} productos restantes)`);
        setPreloadingBackground(true);
        
        // Usar setTimeout para no bloquear la UI
        setTimeout(() => startBackgroundImageCaching(remainingProducts), 2000);
      }
      
      const phase1Duration = Math.round(performance.now() - startTime);
      console.log(`🎉 Fase 1 completada en ${phase1Duration}ms`);
      
    } catch (error) {
      console.error('❌ Error en carga prioritaria:', error);
    }
  };

  // 🔄 Sistema de carga en background (no bloquea la UI)
  const startBackgroundImageCaching = async (products: Product[]) => {
    console.log('🔄 === INICIANDO CARGA BACKGROUND ===');
    
    try {
      const batchSize = 5; // Batches muy pequeños para no impactar UX
      const pauseBetweenBatches = 1000; // 1 segundo entre batches
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const isProduction = window.location.protocol === 'https:';
        const batchUrls = batch
          .filter(p => p.image_url)
          .map(p => isProduction && p.image_url?.includes('picsum.photos')
            ? `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(p.image_url!)}`
            : p.image_url!);
        
        if (batchUrls.length > 0) {
          console.log(`🔄 Background batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}: ${batchUrls.length} imágenes`);
          await imageCacheService.precacheImages(batchUrls);
        }
        
        // Pausa entre batches para no saturar
        await new Promise(resolve => setTimeout(resolve, pauseBetweenBatches));
      }
      
      console.log('🎉 === CARGA BACKGROUND COMPLETADA ===');
      setPreloadingBackground(false);
      
    } catch (error) {
      console.error('❌ Error en carga background:', error);
      setPreloadingBackground(false);
    }
  };


  // Función para cambiar de categoría con carga inteligente de imágenes
  const handleCategoryChange = async (categoryId: number) => {
    if (selectedCategory === categoryId) return;
    
    setSelectedCategory(categoryId);
    
    // Los datos ya están en cache desde el request inicial
    const categoryProducts = productsCache.get(categoryId) || [];
    const categorySubcategories = subcategoriesCache.get(categoryId) || [];
    
    setProducts(categoryProducts);
    setSubcategories(categorySubcategories);
    setCategoryImagesLoading(true);
    
    // Precargar imágenes de la categoría seleccionada
    if (categoryProducts.length > 0) {
      const imageUrls = categoryProducts
        .filter(p => p.image_url)
        .map(p => p.image_url!);
      
      // Precargar en paralelo pero sin bloquear el UI
      imageCache.preloadCategoryImages(categoryId, imageUrls)
        .finally(() => setCategoryImagesLoading(false));
    } else {
      setCategoryImagesLoading(false);
    }
  };

  // 🎯 Carga de imágenes específica para una categoría
  const startCategoryImageCaching = async (categoryProducts: Product[]) => {
    try {
      const imageUrls = categoryProducts
        .filter(p => p.image_url)
        .map(p => p.image_url!)
        .slice(0, 15); // Limitar a los primeros 15 productos de la categoría
      
      if (imageUrls.length === 0) return;
      
      // Verificar cuántas imágenes ya están cacheadas
      let alreadyCached = 0;
      for (const url of imageUrls) {
        const isCached = imageCache.isImageCached(url);
        if (isCached) alreadyCached++;
      }
      
      const needToCacheCount = imageUrls.length - alreadyCached;
      
      if (needToCacheCount > 0) {
        console.log(`🎯 Cacheando ${needToCacheCount} imágenes nuevas de categoría (${alreadyCached} ya en cache)`);
        
        // Filtrar solo las URLs que no están cacheadas
        const urlsToCache = [];
        for (const url of imageUrls) {
          const isCached = await imageCacheService.isImageCached(url);
          if (!isCached) {
            urlsToCache.push(url);
          }
        }
        
        // Cachear las imágenes faltantes
        if (urlsToCache.length > 0) {
          await imageCacheService.precacheImages(urlsToCache);
          console.log(`✅ ${urlsToCache.length} imágenes de categoría cacheadas exitosamente`);
        }
      } else {
        console.log(`✅ Todas las imágenes de la categoría ya están en cache`);
      }
      
    } catch (error) {
      console.error('❌ Error cacheando imágenes de categoría:', error);
    }
  };

  // Mantener loadData para compatibilidad
  const loadData = loadInitialData;

  const handleSave = useCallback(async () => {
    if (!editingItem || !editingType) return;

    console.log('handleSave called with:', { 
      editingItem, 
      editingType, 
      selectedCategory, 
      selectedSubcategory 
    });

    try {
      let endpoint = '';
      let method = 'POST';
      let body: any = {};

      if (editingType === 'category') {
        endpoint = editingItem.id ? `/api/categories/${editingItem.id}` : '/api/categories';
        method = editingItem.id ? 'PUT' : 'POST';
        body = {
          name: editingItem.name,
          description: editingItem.description || '',
          icon: editingItem.icon || 'utensils',
          color: editingItem.color || '#3B82F6',
          is_active: true
        };
      } else if (editingType === 'subcategory') {
        endpoint = editingItem.id ? `/api/subcategories/${editingItem.id}` : '/api/subcategories';
        method = editingItem.id ? 'PUT' : 'POST';
        body = {
          name: editingItem.name,
          description: editingItem.description || '',
          category_id: selectedCategory,
          icon: editingItem.icon || 'layers',
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

      console.log('Sending request:', {
        url: `${API_BASE_URL}${endpoint}`,
        method,
        body
      });

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Guardado exitosamente:', result);
        // Invalidar caché
        localStorage.removeItem('products_cache');
        await loadData();
        setEditingItem(null);
        setEditingType(null);
      } else {
        const errorData = await response.text();
        console.error('Error al guardar:', response.status, errorData);
        alert(`Error al guardar: ${errorData || response.statusText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al guardar: ${error.message}`);
    }
  }, [editingItem, editingType, loadData]);

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
        // Invalidar caché
        localStorage.removeItem('products_cache');
        await loadData();
      } else {
      }
    } catch (error) {
      console.error('Error:', error);
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
  const EditDrawer = useCallback(() => {
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
        <div className="space-y-6">
          {/* Header del Producto (solo para productos) */}
          {editingType === 'product' && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem?.name || 'Nuevo Producto'}
                </h3>
              </div>
            </div>
          )}
          
          {/* Pestañas para productos */}
          {editingType === 'product' && (
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveProductTab('general')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeProductTab === 'general'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="inline h-4 w-4 mr-2" />
                  Información General
                </button>
                <button
                  onClick={() => setActiveProductTab('ingredients')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeProductTab === 'ingredients'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ChefHat className="inline h-4 w-4 mr-2" />
                  Ingredientes
                </button>
              </nav>
            </div>
          )}
          
          {/* Contenido de pestaña Información General */}
          {(editingType !== 'product' || activeProductTab === 'general') && (
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              {editingType !== 'product' && (
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Información Básica</h4>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-3 w-3 mr-1 text-gray-500" />
                  Nombre {editingType === 'product' && '*'}
                </label>
                <input
                  type="text"
                  value={editingItem?.name || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditingItem(prev => ({ ...prev, name: newValue }));
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={`Nombre del ${editingType === 'category' ? 'categoría' : editingType === 'subcategory' ? 'subcategoría' : 'producto'}`}
                  autoFocus
                />
              </div>

            {editingType === 'category' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-3 w-3 mr-1 text-gray-500" />
                  Descripción
                </label>
                <textarea
                  value={editingItem?.description || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditingItem(prev => ({ ...prev, description: newValue }));
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Descripción de la categoría"
                  rows={2}
                />
              </div>
            )}

            {editingType === 'subcategory' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-3 w-3 mr-1 text-gray-500" />
                    Descripción
                  </label>
                  <textarea
                    value={editingItem?.description || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditingItem(prev => ({ ...prev, description: newValue }));
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Descripción de la subcategoría"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers className="inline h-3 w-3 mr-1 text-gray-500" />
                    Icono
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingItem?.icon || 'layers'}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditingItem(prev => ({ ...prev, icon: newValue }));
                      }}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nombre del icono de FontAwesome"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        // Aquí puedes llamar a una API o usar lógica para sugerir un icono
                        const suggestedIcon = editingItem.name ? 
                          editingItem.name.toLowerCase().includes('bebida') ? 'glass' :
                          editingItem.name.toLowerCase().includes('postre') ? 'ice-cream' :
                          editingItem.name.toLowerCase().includes('entrada') ? 'utensils' :
                          editingItem.name.toLowerCase().includes('carne') ? 'drumstick-bite' :
                          editingItem.name.toLowerCase().includes('vegeta') ? 'carrot' :
                          editingItem.name.toLowerCase().includes('pasta') ? 'pizza-slice' :
                          'layers' : 'layers';
                        setEditingItem({ ...editingItem, icon: suggestedIcon });
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center gap-2"
                    >
                      <ChefHat className="h-4 w-4" />
                      Sugerir con IA
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Usa nombres de iconos de Font Awesome o Lucide React
                  </p>
                </div>
              </>
            )}

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
                        value={editingItem?.price || ''}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setEditingItem(prev => ({ ...prev, price: newValue }));
                        }}
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
                      value={editingItem?.available !== false ? 'true' : 'false'}
                      onChange={(e) => {
                        const newValue = e.target.value === 'true';
                        setEditingItem(prev => ({ ...prev, available: newValue }));
                      }}
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
                    value={editingItem?.description || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditingItem(prev => ({ ...prev, description: newValue }));
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Descripción detallada del producto"
                    rows={3}
                  />
                </div>
              </>
            )}
            </div>
          )}

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
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Package className="inline h-3 w-3 mr-1 text-gray-500" />
                      Icono de la categoría
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingItem?.icon || 'utensils'}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditingItem(prev => ({ ...prev, icon: newValue }));
                        }}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nombre del icono (ej: coffee, pizza, wine)"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const suggestedIcon = editingItem.name ? 
                            editingItem.name.toLowerCase().includes('bebida') ? 'wine' :
                            editingItem.name.toLowerCase().includes('café') ? 'coffee' :
                            editingItem.name.toLowerCase().includes('postre') ? 'cake' :
                            editingItem.name.toLowerCase().includes('entrada') ? 'utensils' :
                            editingItem.name.toLowerCase().includes('plato') ? 'beef' :
                            editingItem.name.toLowerCase().includes('pizza') ? 'pizza' :
                            editingItem.name.toLowerCase().includes('pasta') ? 'pizza' :
                            editingItem.name.toLowerCase().includes('ensalada') ? 'apple' :
                            'utensils' : 'utensils';
                          setEditingItem({ ...editingItem, icon: suggestedIcon });
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2"
                      >
                        <ChefHat className="h-4 w-4" />
                        Sugerir con IA
                      </button>
                    </div>
                  </div>
                  
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
                </>
              )}

              {editingType === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="inline h-3 w-3 mr-1 text-gray-500" />
                    URL de imagen
                  </label>
                  <input
                    type="text"
                    value={editingItem?.image_url || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditingItem(prev => ({ ...prev, image_url: newValue }));
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  {editingItem.image_url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa</p>
                      <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                        <LazyImage
                          src={editingItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                          alt="Vista previa del producto"
                          className="w-full h-full object-cover rounded-xl"
                          priority={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pestaña de ingredientes */}
          {editingType === 'product' && activeProductTab === 'ingredients' && (
            <div className="bg-gray-50 rounded-xl p-6">
              <IngredientsExpander
                productId={editingItem?.id || 0}
                productName={editingItem?.name || ''}
                productCategory={categories.find(c => c.id === editingItem?.category_id)?.name}
                isOpen={true}
                onToggle={() => {}} // Siempre abierto en el modal
                hideHeader={true} // Ocultar header ya que el modal tiene el suyo
              />
            </div>
          )}

          {/* Estado activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={editingItem?.is_active !== false}
              onChange={(e) => {
                const newValue = e.target.checked;
                setEditingItem(prev => ({ ...prev, is_active: newValue }));
              }}
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
  }, [editingItem, editingType, categories, subcategories, selectedCategory, addressSearch, addressSuggestions, handleSave]);

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
            
            {/* Indicador de resultados y estado de cache */}
            <div className="flex items-center gap-3">
              {showSearchResults && (
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  <span className="font-semibold text-blue-600">{searchResults.total}</span> resultados
                </span>
              )}
              
              {/* Indicador de carga de imágenes en background */}
              {preloadingBackground && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>Optimizando imágenes...</span>
                </div>
              )}
            </div>
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
                // Usar datos del cache que tienen TODA la información
                const catCount = subcategoriesCache.get(category.id!) ? subcategoriesCache.get(category.id!)!.length : 0;
                const catProds = productsCache.get(category.id!) ? productsCache.get(category.id!)!.length : 0;

                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      // Prevenir cambio de categoría cuando se hace clic en botones de edición
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        return;
                      }
                      handleCategoryChange(category.id!);
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
                      onClick={(e) => {
                        // Prevent event propagation to avoid double clicks
                        const target = e.target as HTMLElement;
                        if (target.closest('button')) {
                          return;
                        }
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
                    <div className="h-32 relative">
                      <LazyImage
                        src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-t-xl"
                        priority={index < 6}
                      />
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
                            setActiveProductTab('general'); // Resetear a pestaña general
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