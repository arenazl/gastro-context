import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronRight,
  Package,
  Layers,
  Grid3x3,
  Save,
  ArrowRight,
  Eye,
  PlusCircle,
  List,
  Grid,
  ChevronDown,
  Search,
  Filter,
  Wand2,
  Upload
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


// Función para obtener icono automático basado en el nombre
const getAutoIcon = (name: string): string => {
  const nameLower = name.toLowerCase();

  // Mapeo de palabras clave a iconos FontAwesome
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
    'café': 'mug-hot',
    'desayuno': 'bacon',
    'almuerzo': 'utensils',
    'cena': 'utensils',
    'vegetariano': 'leaf',
    'vegano': 'seedling',
    'infantil': 'child',
    'niños': 'child'
  };

  // Buscar coincidencias
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (nameLower.includes(keyword)) {
      return icon;
    }
  }

  // Icono por defecto
  return 'utensils';
};

// Componente para renderizar iconos
const RenderIcon = ({ icon }: { icon: string }) => {
  const iconName = icon.replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/ /g, '');

  const faIconName = `fa${iconName}` as keyof typeof fas;
  const faIcon = fas[faIconName] || fas.faUtensils;

  return <FontAwesomeIcon icon={faIcon} className="text-2xl text-gray-800" />;
};

export const ProductsComplete: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const [createMode, setCreateMode] = useState<'category' | 'subcategory' | 'product'>('category');
  const [step, setStep] = useState(1);

  // Estados para datos existentes
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedCategoryView, setSelectedCategoryView] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Funciones para formateo de precio
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const parsePrice = (priceString: string): number => {
    const cleanString = priceString.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanString) || 0;
  };

  // Función para buscar imagen en Internet de comida real
  const searchImageFromInternet = async (productName: string, subIndex: number, prodIndex: number) => {
    try {
      if (!productName || productName.trim() === '') {
        console.warn('Nombre de producto vacío');
        return;
      }

      // Banco de imágenes predefinidas de comida de alta calidad
      const foodImages: { [key: string]: string } = {
        // Pastas y fideos
        'fideo': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=300&fit=crop',
        'fideos': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=300&fit=crop',
        'pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=300&fit=crop',
        'spaghetti': 'https://images.unsplash.com/photo-1589227365533-cee630bd59bd?w=300&h=300&fit=crop',
        'lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=300&h=300&fit=crop',
        'lasaña': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=300&h=300&fit=crop',
        'ravioli': 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=300&h=300&fit=crop',
        'ñoquis': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=300&h=300&fit=crop',

        // Empanadas
        'empanada': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=300&fit=crop',
        'empanadilla': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=300&fit=crop',

        // Pizzas
        'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop',
        'margarita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop',
        'pepperoni': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&h=300&fit=crop',

        // Hamburguesas
        'hamburguesa': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
        'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
        'cheeseburger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',

        // Carnes
        'carne': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=300&fit=crop',
        'asado': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=300&fit=crop',
        'milanesa': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&h=300&fit=crop',
        'pollo': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&h=300&fit=crop',
        'pescado': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&h=300&fit=crop',

        // Ensaladas
        'ensalada': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop',

        // Sopas
        'sopa': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=300&fit=crop',

        // Sandwiches
        'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop',
        'tostado': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop',

        // Postres
        'helado': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop',
        'torta': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop',
        'pastel': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop',
        'flan': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=300&h=300&fit=crop',
        'brownie': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=300&h=300&fit=crop',
        'cheesecake': 'https://images.unsplash.com/photo-1533134242066-d6b27ea21a70?w=300&h=300&fit=crop',
        'tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=300&fit=crop',

        // Bebidas
        'cafe': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop',
        'café': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop',
        'jugo': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop',
        'batido': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=300&fit=crop',
        'cerveza': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop',
        'vino': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop',
        'agua': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop',

        // Desayunos
        'tostada': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&h=300&fit=crop',
        'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop',
        'medialunas': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop',

        // Comida mexicana
        'taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop',
        'tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop',
        'burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=300&fit=crop',
        'nachos': 'https://images.unsplash.com/photo-1570466199120-80bba1eabad7?w=300&h=300&fit=crop',

        // Arroces
        'arroz': 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=300&h=300&fit=crop',
        'paella': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=300&h=300&fit=crop',
        'risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=300&h=300&fit=crop'
      };

      // Buscar coincidencia exacta o parcial en el banco de imágenes
      const lowerName = productName.toLowerCase();

      // Buscar coincidencia exacta primero
      for (const [keyword, imageUrl] of Object.entries(foodImages)) {
        if (lowerName === keyword) {
          handleProductChange(subIndex, prodIndex, 'image_url', imageUrl);
          return;
        }
      }

      // Buscar coincidencia parcial
      for (const [keyword, imageUrl] of Object.entries(foodImages)) {
        if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
          handleProductChange(subIndex, prodIndex, 'image_url', imageUrl);
          return;
        }
      }

      // Si no hay coincidencia, usar imagen genérica de comida
      const genericFoodImages = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop'
      ];

      // Seleccionar una imagen genérica basada en el hash del nombre
      const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const genericImage = genericFoodImages[hash % genericFoodImages.length];

      handleProductChange(subIndex, prodIndex, 'image_url', genericImage);

    } catch (error) {
      console.error('Error buscando imagen:', error);
      // Fallback con imagen genérica de Unsplash
      const fallbackUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop';
      handleProductChange(subIndex, prodIndex, 'image_url', fallbackUrl);
    }
  };

  // Función para subir imagen
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, subIndex: number, prodIndex: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        handleProductChange(subIndex, prodIndex, 'image_url', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para asignar icono automático según el nombre de la categoría
  const getAutoIcon = (name: string): string => {
    const lowerName = name.toLowerCase();

    // Mapeo de palabras clave a iconos
    const iconMap: { [key: string]: string } = {
      // Comidas principales
      'plato': '🍽️',
      'principal': '🍽️',
      'entrada': '🥗',
      'ensalada': '🥗',
      'sopa': '🍲',

      // Carnes
      'carne': '🥩',
      'pollo': '🍗',
      'pescado': '🐟',
      'mariscos': '🦐',

      // Fast food
      'pizza': '🍕',
      'hamburguesa': '🍔',
      'sandwich': '🥪',
      'empanada': '🥟',

      // Pastas
      'pasta': '🍝',
      'fideos': '🍝',
      'lasagna': '🍝',
      'lasaña': '🍝',

      // Postres
      'postre': '🍰',
      'dulce': '🍬',
      'helado': '🍨',
      'torta': '🎂',
      'pastel': '🧁',

      // Bebidas
      'bebida': '🥤',
      'cafe': '☕',
      'café': '☕',
      'cerveza': '🍺',
      'vino': '🍷',
      'jugo': '🧃',
      'coctel': '🍹',
      'cocktail': '🍹',

      // Desayunos
      'desayuno': '🥐',
      'croissant': '🥐',
      'tostada': '🍞',
      'pan': '🥖',

      // Otros
      'vegano': '🥬',
      'vegetariano': '🥦',
      'kids': '🧸',
      'niños': '🧸',
      'promocion': '⭐',
      'especial': '✨'
    };

    // Buscar coincidencia
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(keyword)) {
        return icon;
      }
    }

    // Icono por defecto
    return '🍴';
  };

  // Función para obtener icono de subcategoría
  const getSubcategoryIcon = (name: string): string => {
    return getAutoIcon(name); // Usa la misma lógica
  };

  // Estados para creación
  const [categoryNameInput, setCategoryNameInput] = useState(''); // Estado separado para el input
  const [currentCategory, setCurrentCategory] = useState<Category>({
    name: '',
    icon: '',
    color: '',
    subcategories: []
  });
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory>({
    name: '',
    products: []
  });
  const [currentProduct, setCurrentProduct] = useState<{
    name: string;
    description: string;
    price: number;
    image_url: string;
  }>({
    name: '',
    description: '',
    price: 0,
    image_url: ''
  });
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [selectedParentSubcategory, setSelectedParentSubcategory] = useState<number | null>(null);

  // Cargar datos existentes
  useEffect(() => {
    loadData();
  }, []);

  // Auto-generar icono y color cuando cambia el nombre
  useEffect(() => {
    if (currentCategory.name && !currentCategory.icon) {
      setCurrentCategory(prev => ({
        ...prev,
        icon: getAutoIcon(prev.name),
        color: generateRandomColor()
      }));
    }
  }, [currentCategory.name]);

  // Precargar valores cuando se cambia de tab con valores seleccionados
  useEffect(() => {
    // Si estamos en modo producto y tenemos valores preseleccionados
    if (createMode === 'product' && selectedParentCategory && selectedParentSubcategory) {
      // Los valores ya están configurados, solo asegurarnos de que los dropdowns los muestren
      console.log('Precargando producto con categoría:', selectedParentCategory, 'y subcategoría:', selectedParentSubcategory);
    }
    // Si estamos en modo subcategoría y tenemos categoría preseleccionada
    else if (createMode === 'subcategory' && selectedParentCategory) {
      console.log('Precargando subcategoría con categoría:', selectedParentCategory);
    }
  }, [createMode, selectedParentCategory, selectedParentSubcategory]);

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

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddSubcategory = () => {
    if (currentSubcategory.name.trim()) {
      setCurrentCategory({
        ...currentCategory,
        subcategories: [...(currentCategory.subcategories || []), { ...currentSubcategory }]
      });
      setCurrentSubcategory({ name: '', products: [] });
    }
  };

  const handleAddProduct = (subIndex: number) => {
    const newProduct: Product = {
      name: '',
      price: 0,
      description: ''
    };

    const updatedSubs = [...(currentCategory.subcategories || [])];
    if (!updatedSubs[subIndex].products) {
      updatedSubs[subIndex].products = [];
    }
    updatedSubs[subIndex].products!.push(newProduct);
    setCurrentCategory({
      ...currentCategory,
      subcategories: updatedSubs
    });
  };

  const handleProductChange = (subIndex: number, prodIndex: number, field: string, value: any) => {
    const updatedSubs = [...(currentCategory.subcategories || [])];
    if (updatedSubs[subIndex].products) {
      updatedSubs[subIndex].products[prodIndex] = {
        ...updatedSubs[subIndex].products[prodIndex],
        [field]: value
      };
      setCurrentCategory({
        ...currentCategory,
        subcategories: updatedSubs
      });
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);

      // Actualizar el nombre de la categoría con el valor del input
      const finalCategory = { ...currentCategory, name: categoryNameInput || currentCategory.name };

      // 1. Crear la categoría principal
      const categoryResponse = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalCategory.name,
          icon: finalCategory.icon || 'utensils',
          color: finalCategory.color || '#3B82F6',
          is_active: true
        })
      });

      if (!categoryResponse.ok) {
        throw new Error('Error al crear la categoría');
      }

      const createdCategory = await categoryResponse.json();
      const categoryId = createdCategory.id;

      // 2. Crear las subcategorías y productos
      if (finalCategory.subcategories && finalCategory.subcategories.length > 0) {
        for (const subcategory of finalCategory.subcategories) {
          // Crear subcategoría
          const subcategoryResponse = await fetch(`${API_URL}/api/subcategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: subcategory.name,
              category_id: categoryId,
              is_active: true
            })
          });

          if (!subcategoryResponse.ok) {
            console.error('Error al crear subcategoría:', subcategory.name);
            continue;
          }

          const createdSubcategory = await subcategoryResponse.json();
          const subcategoryId = createdSubcategory.id;

          // 3. Crear los productos de esta subcategoría
          if (subcategory.products && subcategory.products.length > 0) {
            for (const product of subcategory.products) {
              if (product.name && product.price) {
                const productResponse = await fetch(`${API_URL}/api/products`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: product.name,
                    price: product.price || 0,
                    description: product.description || '',
                    category_id: categoryId,
                    subcategory_id: subcategoryId,
                    available: true,
                    image_url: product.image_url || ''
                  })
                });

                if (!productResponse.ok) {
                  console.error('Error al crear producto:', product.name);
                }
              }
            }
          }
        }
      }

      toast.success(`¡Categoría "${finalCategory.name}" creada exitosamente con ${finalCategory.subcategories?.length || 0} subcategorías!`);

      // Recargar datos para mostrar los nuevos elementos
      await loadData();

      // Reset todos los estados
      setCurrentCategory({
        name: '',
        icon: '',
        color: '',
        subcategories: []
      });
      setCategoryNameInput('');
      setCurrentSubcategory({ name: '', products: [] });
      setStep(1);
      setActiveTab('view'); // Cambiar a la vista para ver los nuevos datos

    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para generar descripción automática basada en el nombre del producto
  const generateProductDescription = (productName: string, subcategoryName: string): string => {
    if (!productName) return '';

    const descriptions: { [key: string]: string[] } = {
      // Postres
      'torta': ['Deliciosa torta artesanal', 'preparada con ingredientes frescos', 'perfecta para cualquier ocasión'],
      'helado': ['Cremoso helado artesanal', 'elaborado con frutas naturales', 'ideal para refrescarse'],
      'flan': ['Suave flan casero', 'con caramelo natural', 'textura perfecta y sabor único'],
      'brownie': ['Intenso brownie de chocolate', 'con chocolate belga', 'húmedo y esponjoso'],
      'cheesecake': ['Cremoso cheesecake', 'base de galleta crujiente', 'con frutos del bosque'],

      // Bebidas
      'café': ['Café de origen seleccionado', 'tostado medio', 'aroma intenso y sabor equilibrado'],
      'jugo': ['Jugo natural recién exprimido', 'sin azúcar añadida', 'lleno de vitaminas'],
      'batido': ['Batido cremoso y nutritivo', 'con frutas frescas', 'perfecto para cualquier momento'],
      'té': ['Té premium de hojas selectas', 'infusión aromática', 'relajante y reconfortante'],

      // Platos principales
      'pasta': ['Pasta al dente', 'con salsa casera', 'preparada al momento'],
      'pizza': ['Pizza artesanal de masa madre', 'ingredientes frescos', 'horneada en horno de piedra'],
      'hamburguesa': ['Jugosa hamburguesa gourmet', 'carne 100% res', 'con vegetales frescos'],
      'ensalada': ['Ensalada fresca y saludable', 'vegetales orgánicos', 'aderezo de la casa'],
      'sopa': ['Sopa casera reconfortante', 'preparada diariamente', 'con ingredientes naturales'],

      // Carnes
      'pollo': ['Pollo tierno y jugoso', 'marinado con especias', 'cocción perfecta'],
      'carne': ['Corte premium de res', 'término al gusto', 'acompañado de guarnición'],
      'pescado': ['Pescado fresco del día', 'preparación a elección', 'rico en omega 3'],
      'cerdo': ['Cerdo marinado especial', 'cocción lenta', 'tierno y sabroso'],

      // Entradas
      'croqueta': ['Croquetas doradas y crujientes', 'relleno cremoso', 'receta tradicional'],
      'empanada': ['Empanadas caseras', 'masa crujiente', 'relleno abundante y sabroso'],
      'tostada': ['Tostadas crocantes', 'ingredientes frescos', 'perfectas para compartir'],

      // Salsas
      'salsa': ['Salsa casera especial', 'receta de la casa', 'el complemento perfecto'],
      'mayonesa': ['Mayonesa artesanal', 'preparada diariamente', 'sabor único'],
      'chimichurri': ['Chimichurri tradicional', 'hierbas frescas', 'ideal para carnes'],

      // Default
      'default': ['Delicioso', 'preparado con dedicación', 'sabor único']
    };

    const nameLower = productName.toLowerCase();

    // Buscar coincidencias en las palabras clave
    for (const [keyword, descOptions] of Object.entries(descriptions)) {
      if (nameLower.includes(keyword)) {
        const randomDesc = descOptions[Math.floor(Math.random() * descOptions.length)];
        return `${productName}, ${randomDesc}`;
      }
    }

    // Si no hay coincidencia, generar una descripción genérica basada en la subcategoría
    const subcatLower = subcategoryName.toLowerCase();
    if (subcatLower.includes('postre') || subcatLower.includes('dulce')) {
      return `Delicioso ${productName}, perfecto para los amantes de los postres`;
    } else if (subcatLower.includes('bebida') || subcatLower.includes('drink')) {
      return `Refrescante ${productName}, ideal para acompañar tus comidas`;
    } else if (subcatLower.includes('entrada') || subcatLower.includes('appetizer')) {
      return `Exquisito ${productName}, perfecto para comenzar tu experiencia gastronómica`;
    } else if (subcatLower.includes('principal') || subcatLower.includes('plato')) {
      return `${productName} preparado con los mejores ingredientes, una experiencia única`;
    }

    // Descripción por defecto
    return `${productName}, preparado especialmente para ti con los mejores ingredientes`;
  };

  // Componente para Vista Detallada de Productos
  const ProductDetailView = ({ categoryId }: { categoryId: number }) => {
    const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const category = categories.find(c => c.id === categoryId);
    const categorySubcategories = subcategories.filter(s => s.category_id === categoryId);
    const categoryProducts = products.filter(p => {
      if (selectedSubcategory) {
        return p.subcategory_id === selectedSubcategory;
      }
      return p.category_id === categoryId;
    });
    const filteredProducts = categoryProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg p-8"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Productos de {category?.name}
          </h3>
          <button
            onClick={() => setSelectedCategoryView(null)}
            className="p-2 hover:bg-gray-200 "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border  focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border  flex items-center gap-2 transition-colors ${showFilters ? 'bg-blue-100 border-blue-500 text-blue-700' : 'hover:bg-gray-100'
              }`}
          >
            <Filter className="h-5 w-5" />
            Filtros
          </button>
        </div>

        {/* Filtros de Subcategorías */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-gray-50 "
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Subcategorías:</span>
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-3 py-1  text-sm transition-colors ${selectedSubcategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
                  }`}
              >
                Todas
              </button>
              {categorySubcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id!)}
                  className={`px-3 py-1  text-sm transition-colors ${selectedSubcategory === sub.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:bg-gray-50'
                    }`}
                >
                  {sub.name}
                  <span className="ml-1 opacity-60">
                    ({products.filter(p => p.subcategory_id === sub.id).length})
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-6 gap-3">
          {filteredProducts.map(product => (
            <motion.div
              key={product.id}
              className="bg-white border  overflow-hidden hover:shadow-lg transition-shadow group"
              whileHover={{ scale: 1.02 }}
            >
              {/* Imagen del producto */}
              <div className="relative h-32 bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center text-gray-400 ${product.image_url ? 'hidden' : ''}`}>
                  <Package className="h-10 w-10" />
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setActiveTab('create');
                    setCreateMode('product');
                    setSelectedParentCategory(product.category_id!);
                    setSelectedParentSubcategory(product.subcategory_id!);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white  shadow-md hover:bg-gray-100"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>

              {/* Información del producto */}
              <div className="p-2">
                <h4 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h4>
                <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                  {product.description || 'Sin descripción'}
                </p>
                <p className="text-base font-bold text-blue-600">${product.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Componente de Vista de Datos Existentes - Rediseñado
  const DataView = () => {
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
    const [hoveredSubcategory, setHoveredSubcategory] = useState<number | null>(null);
    
    // Filtrar categorías basado en búsqueda
    const filteredCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      subcategories.some(sub => 
        sub.category_id === cat.id && 
        sub.name.toLowerCase().includes(searchFilter.toLowerCase())
      ) ||
      products.some(prod => 
        prod.category_id === cat.id && 
        prod.name.toLowerCase().includes(searchFilter.toLowerCase())
      )
    );
    
    const handleCategoryClick = (categoryId: number) => {
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header elegante */}
        <div className="bg-white shadow-lg border-b px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Stock Existentes
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 mt-1"
              >
                {categories.length} categorías · {subcategories.length} subcategorías · {products.length} productos
              </motion.p>
            </div>
            <div className="flex gap-3">
              {/* Búsqueda con animación */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar productos, categorías..."
                  className="pl-10 pr-4 py-3 w-96 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchFilter && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </motion.button>
                )}
              </motion.div>
              
              {/* Botón de vista */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2.5 bg-white border rounded-xl hover:bg-gray-50 transition-colors"
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Valor Total</p>
              <p className="text-xl font-bold text-blue-900">
                ${products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Productos Activos</p>
              <p className="text-xl font-bold text-green-900">
                {products.filter(p => p.available).length}
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Categorías</p>
              <p className="text-xl font-bold text-purple-900">{categories.length}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg">
              <p className="text-xs text-orange-600 font-medium">Precio Promedio</p>
              <p className="text-xl font-bold text-orange-900">
                ${(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-500">Cargando inventario...</p>
            </div>
          ) : viewMode === 'grid' ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
            {categories.map(category => {
              const catSubs = subcategories.filter(s => s.category_id === category.id);
              const catProds = products.filter(p => p.category_id === category.id);
              const isExpanded = expandedCategories.has(category.id!);

              return (
                <motion.div
                  key={category.id}
                  layout
                  className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-500 ${
                    isExpanded ? 'col-span-full shadow-2xl z-10' : 'shadow-lg hover:shadow-xl'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    scale: hoveredCategory === category.id && !isExpanded ? 1.02 : 1
                  }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredCategory(category.id!)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  {/* Gradient Background */}
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: `linear-gradient(135deg, ${category.color}20 0%, transparent 100%)`
                    }}
                  />
                  
                  <div
                    onClick={() => toggleCategory(category.id!)}
                    className="relative p-6 cursor-pointer"
                  >
                    {/* Header de Categoría */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {/* Icono con animación */}
                          <motion.div
                            className="relative"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                              style={{ 
                                backgroundColor: (category.color || '#gray') + '20',
                                border: `2px solid ${category.color}30`
                              }}
                            >
                              {category.icon && <RenderIcon icon={category.icon} />}
                            </div>
                            {/* Badge de número */}
                            <div 
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                              style={{ backgroundColor: category.color }}
                            >
                              {catProds.length}
                            </div>
                          </motion.div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {catSubs.length} subcategorías
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {catProds.length} productos
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mini preview de subcategorías cuando está contraído */}
                        {!isExpanded && catSubs.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {catSubs.slice(0, 3).map(sub => (
                              <span 
                                key={sub.id}
                                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                              >
                                {sub.name}
                              </span>
                            ))}
                            {catSubs.length > 3 && (
                              <span className="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-700 font-medium">
                                +{catSubs.length - 3} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Botón de acción */}
                      <div className="flex flex-col gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronDown 
                            className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryView(category.id!);
                          }}
                          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="h-5 w-5 text-blue-600" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="border-t border-gray-100"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                          {/* Grid de subcategorías mejorado */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {catSubs.map((sub, index) => {
                              const subProds = products.filter(p => p.subcategory_id === sub.id);
                              return (
                                <motion.div
                                  key={sub.id}
                                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group/sub cursor-pointer"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ scale: 1.02 }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                          <Layers className="h-4 w-4 text-gray-600" />
                                        </div>
                                        <h4 className="font-semibold text-gray-800">{sub.name}</h4>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <Package className="h-3 w-3" />
                                          {subProds.length} productos
                                        </span>
                                        {subProds.length > 0 && (
                                          <span className="flex items-center gap-1">
                                            <span className="text-green-600">$</span>
                                            {Math.min(...subProds.map(p => p.price || 0)).toFixed(0)}-
                                            {Math.max(...subProds.map(p => p.price || 0)).toFixed(0)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Mini preview de productos */}
                                      {subProds.length > 0 && (
                                        <div className="flex gap-1 mt-2">
                                          {subProds.slice(0, 4).map(prod => (
                                            <div 
                                              key={prod.id}
                                              className="w-8 h-8 rounded bg-gray-100 overflow-hidden"
                                              title={prod.name}
                                            >
                                              {prod.image_url ? (
                                                <img 
                                                  src={prod.image_url} 
                                                  alt={prod.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <Package className="h-3 w-3 text-gray-400" />
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {subProds.length > 4 && (
                                            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                              +{subProds.length - 4}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="ml-2 p-2 bg-blue-500 text-white rounded-lg opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('create');
                                        setCreateMode('product');
                                        setSelectedParentCategory(category.id!);
                                        setSelectedParentSubcategory(sub.id!);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </motion.button>
                                  </div>
                                </motion.div>
                              );
                            })}
                            
                            {/* Botón para agregar nueva subcategoría */}
                            <motion.button
                              className="col-span-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl p-4 flex items-center justify-center gap-2 text-blue-600 hover:from-blue-100 hover:to-indigo-100 transition-all group"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: catSubs.length * 0.05 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('create');
                                setCreateMode('subcategory');
                                setSelectedParentCategory(category.id!);
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                              <span className="font-medium">Agregar Nueva Subcategoría</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            </motion.div>
          ) : (
            // Vista de Lista Mejorada
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredCategories.map((category, index) => {
                const catSubs = subcategories.filter(s => s.category_id === category.id);
                const catProds = products.filter(p => p.category_id === category.id);
                const isExpanded = expandedCategories.has(category.id!);

                return (
                <div key={category.id} className="border  p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10  flex items-center justify-center"
                        style={{ backgroundColor: (category.color || '#gray') + '20' }}
                      >
                        {category.icon && <RenderIcon icon={category.icon} />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {catSubs.length} subcategorías · {catProds.length} productos
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 transition-colors flex items-center justify-center">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-red-100 text-red-600 transition-colors flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </motion.div>
          )}
      </div>

        </div>
        
        {/* Vista detallada de productos cuando se selecciona una categoría */}
        {selectedCategoryView && <ProductDetailView categoryId={selectedCategoryView} />}
      </div>
    );
  };

  // CreateWizard eliminado - el contenido está directamente en el render
  // IconSelector componente
  const IconSelector = () => (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600">El icono se generará automáticamente basado en el nombre</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <PageHeader
        title="Gestión de Productos"
        subtitle="Vista completa y creación unificada"
      />

      {/* Container con padding y scroll */}
      <div className="flex-1 overflow-y-auto px-6 py-12">
        <div className="max-w-full">
          {/* Tabs */}
          <div className="bg-white shadow-lg mb-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 py-3 px-6 font-medium transition-all ${activeTab === 'view'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista de Datos
                </div>
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 px-6 font-medium transition-all ${activeTab === 'create'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Crear Nuevo
                </div>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="">
            {activeTab === 'view' ? (
              <DataView />
            ) : (
              <div className="bg-white shadow-lg p-8">
                {/* Selector de nivel de creación */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">¿Qué deseas crear?</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setCreateMode('category');
                        setStep(1);
                      }}
                      className={`p-4  border-2 transition-all ${createMode === 'category'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Grid3x3 className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">Categoría Completa</div>
                      <div className="text-xs text-gray-500">Con subcategorías y productos</div>
                    </button>

                    <button
                      onClick={() => {
                        setCreateMode('subcategory');
                        setStep(1);
                      }}
                      className={`p-4  border-2 transition-all ${createMode === 'subcategory'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Layers className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">Subcategoría</div>
                      <div className="text-xs text-gray-500">En categoría existente</div>
                    </button>

                    <button
                      onClick={() => {
                        setCreateMode('product');
                        setStep(1);
                      }}
                      className={`p-4  border-2 transition-all ${createMode === 'product'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">Producto Individual</div>
                      <div className="text-xs text-gray-500">En subcategoría existente</div>
                    </button>
                  </div>
                </div>

                {/* Aquí continúa el resto del contenido de CreateWizard */}
                {createMode === 'category' && (
                  <div>
                    {/* Steps Indicator */}
                    <div className="flex items-center justify-between mb-8">
                      {[
                        { num: 1, label: 'Categoría' },
                        { num: 2, label: 'Subcategorías' },
                        { num: 3, label: 'Productos' },
                        { num: 4, label: 'Resumen' }
                      ].map((s, index) => (
                        <React.Fragment key={s.num}>
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10  flex items-center justify-center font-bold text-sm transition-all ${step >= s.num
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                              {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                            </div>
                            <span className={`mt-1 text-xs ${step >= s.num ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                              {s.label}
                            </span>
                          </div>
                          {index < 3 && (
                            <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                              }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Contenido de los pasos */}
                    <div>
                      {/* Step 1: Categoría */}
                      {step === 1 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4">{t('products.newCategory')}</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">{t('products.name')}</label>
                              <div className="relative">
                                {categoryNameInput && (
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl">
                                    {getAutoIcon(categoryNameInput)}
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={categoryNameInput}
                                  onChange={(e) => {
                                    setCategoryNameInput(e.target.value);
                                    // Asignar icono automáticamente
                                    if (e.target.value) {
                                      setCurrentCategory(prev => ({
                                        ...prev,
                                        name: e.target.value,
                                        icon: getAutoIcon(e.target.value)
                                      }));
                                    }
                                  }}
                                  onBlur={() => setCurrentCategory(prev => ({
                                    ...prev,
                                    name: categoryNameInput,
                                    icon: getAutoIcon(categoryNameInput)
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && categoryNameInput.trim()) {
                                      e.preventDefault();
                                      setCurrentCategory(prev => ({
                                        ...prev,
                                        name: categoryNameInput,
                                        icon: getAutoIcon(categoryNameInput)
                                      }));
                                      setStep(2);
                                    }
                                  }}
                                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${categoryNameInput ? 'pl-12' : ''}`}
                                  placeholder="Ej: Platos Principales"
                                  autoComplete="off"
                                />
                              </div>
                            </div>

                            {currentCategory.icon && (
                              <div className="p-4 bg-gray-50 ">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-12 h-12  flex items-center justify-center"
                                      style={{ backgroundColor: currentCategory.color + '20' }}
                                    >
                                      <RenderIcon icon={currentCategory.icon} />
                                    </div>
                                    <span className="font-medium">{currentCategory.icon}</span>
                                  </div>
                                  <button
                                    onClick={() => setCurrentCategory({ ...currentCategory, icon: '' })}
                                    className="text-red-600 hover:bg-red-50 p-2 "
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            <IconSelector />
                          </div>

                          <div className="flex justify-end mt-6">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (categoryNameInput.trim() && step === 1) {
                                  setCurrentCategory(prev => ({ ...prev, name: categoryNameInput.trim() }));
                                  setStep(2);
                                }
                              }}
                              disabled={!categoryNameInput.trim() || step !== 1}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                            >
                              Siguiente
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Subcategorías */}
                      {step === 2 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <h3 className="text-xl font-bold mb-4">{t('products.addSubcategories')}</h3>

                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              Agregando subcategorías a: <strong>{currentCategory.name}</strong>
                            </p>
                          </div>

                          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                            {currentCategory.subcategories?.map((sub, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{getSubcategoryIcon(sub.name)}</span>
                                  <span className="font-medium">{sub.name}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const updatedSubs = currentCategory.subcategories?.filter((_, i) => i !== index);
                                    setCurrentCategory({ ...currentCategory, subcategories: updatedSubs });
                                  }}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            {(!currentCategory.subcategories || currentCategory.subcategories.length === 0) && (
                              <div className="text-center py-8 text-gray-400">
                                <Layers className="h-12 w-12 mx-auto mb-2" />
                                <p>No hay subcategorías aún</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              {currentSubcategory.name && (
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
                                  {getSubcategoryIcon(currentSubcategory.name)}
                                </span>
                              )}
                              <input
                                type="text"
                                value={currentSubcategory.name}
                                onChange={(e) => setCurrentSubcategory({ ...currentSubcategory, name: e.target.value })}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${currentSubcategory.name ? 'pl-10' : ''}`}
                                placeholder="Nueva subcategoría..."
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                                autoComplete="off"
                              />
                            </div>
                            <button
                              onClick={handleAddSubcategory}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="flex justify-between mt-6">
                            <button
                              onClick={() => setStep(1)}
                              className="px-6 py-2 border-2 rounded-lg hover:bg-gray-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (step === 2) {
                                  setStep(3);
                                }
                              }}
                              disabled={step !== 2}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                            >
                              Siguiente
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 3: Productos */}
                      {step === 3 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <h3 className="text-xl font-bold mb-4">{t('products.addProducts')}</h3>

                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {currentCategory.subcategories?.map((sub, subIndex) => (
                              <div key={subIndex} className="border rounded-lg p-3">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-700">
                                  <span className="text-lg">{currentCategory.icon || getAutoIcon(currentCategory.name)}</span>
                                  <span>{currentCategory.name}</span>
                                  <span className="text-gray-400">›</span>
                                  <span className="text-lg">{getSubcategoryIcon(sub.name)}</span>
                                  <span className="text-blue-600">{sub.name}</span>
                                </h4>

                                <div className="space-y-2">
                                  {sub.products?.map((product, prodIndex) => (
                                    <div key={prodIndex} className="p-4 bg-gray-50 rounded-lg border">
                                      <div className="flex gap-4">
                                        {/* Columna izquierda: Formulario */}
                                        <div className="flex-1">
                                          <div className="space-y-2">
                                            {/* Primera fila: Nombre y Precio */}
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                placeholder="Nombre del producto"
                                                value={product.name}
                                                onChange={(e) => handleProductChange(subIndex, prodIndex, 'name', e.target.value)}
                                                className="flex-1 h-10 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                autoComplete="off"
                                              />
                                              <div className="w-32 relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-bold">$</span>
                                                <input
                                                  type="text"
                                                  placeholder="0.00"
                                                  value={product.price ? formatPrice(product.price) : ''}
                                                  onChange={(e) => {
                                                    const numericValue = parsePrice(e.target.value);
                                                    handleProductChange(subIndex, prodIndex, 'price', numericValue);
                                                  }}
                                                  className="w-full h-10 pl-6 pr-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                              </div>
                                            </div>

                                            {/* Segunda fila: Descripción y botón IA */}
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                placeholder="Descripción del producto"
                                                value={product.description}
                                                onChange={(e) => handleProductChange(subIndex, prodIndex, 'description', e.target.value)}
                                                className="flex-1 h-10 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                autoComplete="off"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const description = generateProductDescription(product.name, sub.name);
                                                  handleProductChange(subIndex, prodIndex, 'description', description);
                                                }}
                                                className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 hover:scale-110 hover:shadow-lg transition-all duration-300 transform group"
                                                title="Generar descripción automática con IA"
                                              >
                                                <Wand2 className="h-4 w-4 group-hover:animate-bounce" />
                                              </button>
                                            </div>

                                            {/* Tercera fila: Imagen y botones */}
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                placeholder="URL de la imagen"
                                                value={product.image_url || ''}
                                                onChange={(e) => handleProductChange(subIndex, prodIndex, 'image_url', e.target.value)}
                                                className="flex-1 h-10 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                autoComplete="off"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => searchImageFromInternet(product.name, subIndex, prodIndex)}
                                                className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 hover:scale-110 hover:shadow-lg transition-all duration-300 transform group"
                                                title="Buscar imagen automáticamente con IA"
                                              >
                                                <Wand2 className="h-4 w-4 group-hover:animate-bounce" />
                                              </button>
                                              <label className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-110 hover:shadow-lg transition-all duration-300 transform cursor-pointer group"
                                                title="Subir imagen desde tu computadora"
                                              >
                                                <Upload className="h-4 w-4 group-hover:animate-bounce" />
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleImageUpload(e, subIndex, prodIndex)}
                                                  className="hidden"
                                                />
                                              </label>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Columna derecha: Vista previa de imagen y botón eliminar */}
                                        <div className="w-28 flex-shrink-0 flex flex-col gap-2">
                                          {product.image_url && product.image_url.trim() ? (
                                            <div className="w-full h-28 rounded-lg overflow-hidden border-2 border-gray-200 bg-white relative">
                                              <img
                                                src={product.image_url}
                                                alt={product.name || 'Producto'}
                                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const parent = target.parentElement;
                                                  if (parent && !parent.querySelector('.error-placeholder')) {
                                                    const placeholder = document.createElement('div');
                                                    placeholder.className = 'error-placeholder absolute inset-0 flex flex-col items-center justify-center bg-gray-100';
                                                    placeholder.innerHTML = '<svg class="h-6 w-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs text-gray-400">Error</span>';
                                                    parent.appendChild(placeholder);
                                                  }
                                                }}
                                              />
                                            </div>
                                          ) : (
                                            <div className="w-full h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
                                              <Package className="h-6 w-6 text-gray-400 mb-1" />
                                              <span className="text-xs text-gray-400">Sin imagen</span>
                                            </div>
                                          )}

                                          {/* Botón eliminar debajo de la imagen */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedSubs = [...(currentCategory.subcategories || [])];
                                              if (updatedSubs[subIndex].products) {
                                                updatedSubs[subIndex].products = updatedSubs[subIndex].products!.filter((_, i) => i !== prodIndex);
                                                setCurrentCategory({
                                                  ...currentCategory,
                                                  subcategories: updatedSubs
                                                });
                                              }
                                            }}
                                            className="w-full py-2 flex items-center justify-center bg-red-600/[0.82] text-white rounded-lg hover:bg-red-700/[0.82] hover:scale-105 hover:shadow-lg transition-all duration-300 transform group"
                                            title="Eliminar producto"
                                          >
                                            <X className="h-4 w-4 group-hover:animate-bounce" />
                                            <span className="ml-1 text-xs">Eliminar</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => handleAddProduct(subIndex)}
                                  className="w-full mt-2 py-1 border-2 border-dashed rounded text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500"
                                >
                                  + Producto
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between mt-6">
                            <button
                              onClick={() => setStep(2)}
                              className="px-6 py-2 border-2 rounded-lg hover:bg-gray-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (step === 3) {
                                  setStep(4);
                                }
                              }}
                              disabled={step !== 3}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                            >
                              Siguiente
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 4: Resumen */}
                      {step === 4 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <h3 className="text-xl font-bold mb-4">{t('products.finalSummary')}</h3>

                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: currentCategory.color + '20' }}
                                >
                                  {currentCategory.icon && <RenderIcon icon={currentCategory.icon} />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{currentCategory.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {currentCategory.subcategories?.length || 0} {t('products.subcategories')}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {currentCategory.subcategories?.map((sub, index) => (
                                  <div key={index} className="ml-8 p-2 bg-white rounded">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{sub.name}</span>
                                        <span className="text-sm text-gray-500">
                                          ({sub.products?.length || 0} {t('products.products')})
                                        </span>
                                      </div>
                                    </div>
                                    {sub.products && sub.products.length > 0 && (
                                      <div className="ml-6 mt-1 text-sm text-gray-600">
                                        {sub.products.slice(0, 3).map((p, i) => p.name).join(', ')}
                                        {sub.products.length > 3 && '...'}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-700">
                                <strong>{t('common.total')}:</strong> {
                                  currentCategory.subcategories?.reduce((acc, sub) =>
                                    acc + (sub.products?.length || 0), 0
                                  ) || 0
                                } {t('products.products')}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between mt-6">
                            <button
                              onClick={() => setStep(3)}
                              className="px-6 py-2 border-2 rounded-lg hover:bg-gray-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={handleSaveAll}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {t('products.saveAll')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modo Subcategoría - Agregar subcategoría a categoría existente */}
                {createMode === 'subcategory' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Agregando nueva subcategoría a una categoría existente
                      </p>
                    </div>

                    {/* Seleccionar categoría padre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría Padre
                      </label>
                      <select
                        value={selectedParentCategory || ''}
                        onChange={(e) => setSelectedParentCategory(Number(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedParentCategory && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la Nueva Subcategoría
                          </label>
                          <input
                            type="text"
                            value={currentSubcategory.name}
                            onChange={(e) => setCurrentSubcategory({...currentSubcategory, name: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Pastas Caseras"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setCreateMode('');
                              setSelectedParentCategory(null);
                              setCurrentSubcategory({ name: '', products: [] });
                            }}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={async () => {
                              if (!currentSubcategory.name || !selectedParentCategory) return;
                              
                              try {
                                const response = await fetch(`${API_URL}/api/subcategories`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name: currentSubcategory.name,
                                    category_id: selectedParentCategory
                                  })
                                });
                                
                                if (response.ok) {
                                  toast.success('Subcategoría creada exitosamente');
                                  loadSubcategories();
                                  setCurrentSubcategory({ name: '', products: [] });
                                  setCreateMode('');
                                  setSelectedParentCategory(null);
                                }
                              } catch (error) {
                                toast.error('Error al crear subcategoría');
                              }
                            }}
                            disabled={!currentSubcategory.name || !selectedParentCategory}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            Crear Subcategoría
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Modo Producto - Agregar producto a subcategoría existente */}
                {createMode === 'product' && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        Agregando nuevo producto a una subcategoría existente
                      </p>
                    </div>

                    {/* Seleccionar categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <select
                        value={selectedParentCategory || ''}
                        onChange={(e) => {
                          setSelectedParentCategory(Number(e.target.value));
                          setSelectedParentSubcategory(null);
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Seleccionar subcategoría */}
                    {selectedParentCategory && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subcategoría
                        </label>
                        <select
                          value={selectedParentSubcategory || ''}
                          onChange={(e) => setSelectedParentSubcategory(Number(e.target.value))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecciona una subcategoría</option>
                          {subcategories
                            .filter(sub => sub.category_id === selectedParentCategory)
                            .map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                        </select>
                      </motion.div>
                    )}

                    {/* Formulario del producto */}
                    {selectedParentSubcategory && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Producto
                          </label>
                          <input
                            type="text"
                            value={currentProduct.name}
                            onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Ravioles de Ricota"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                          </label>
                          <textarea
                            value={currentProduct.description}
                            onChange={(e) => setCurrentProduct({...currentProduct, description: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Descripción del producto..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio
                          </label>
                          <input
                            type="number"
                            value={currentProduct.price}
                            onChange={(e) => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL de Imagen
                          </label>
                          <input
                            type="text"
                            value={currentProduct.image_url}
                            onChange={(e) => setCurrentProduct({...currentProduct, image_url: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://..."
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setCreateMode('');
                              setSelectedParentCategory(null);
                              setSelectedParentSubcategory(null);
                              setCurrentProduct({ name: '', description: '', price: 0, image_url: '' });
                            }}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={async () => {
                              if (!currentProduct.name || !selectedParentCategory || !selectedParentSubcategory) return;
                              
                              try {
                                const response = await fetch(`${API_URL}/api/products`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    ...currentProduct,
                                    category_id: selectedParentCategory,
                                    subcategory_id: selectedParentSubcategory,
                                    available: true
                                  })
                                });
                                
                                if (response.ok) {
                                  toast.success('Producto creado exitosamente');
                                  loadProducts();
                                  setCurrentProduct({ name: '', description: '', price: 0, image_url: '' });
                                  setCreateMode('');
                                  setSelectedParentCategory(null);
                                  setSelectedParentSubcategory(null);
                                }
                              } catch (error) {
                                toast.error('Error al crear producto');
                              }
                            }}
                            disabled={!currentProduct.name || !selectedParentCategory || !selectedParentSubcategory || currentProduct.price <= 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Crear Producto
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
