import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { GlassPanel, AnimatedCard, AnimatedList, FloatingButton, GradientText } from '../components/AnimatedComponents';
import { CategoryIcon } from '../components/CategoryIcon';
import { PageHeader } from '../components/PageHeader';
import { PaymentModal } from '../components/PaymentModal';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CreditCardIcon,
  Squares2X2Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  subcategory_id?: number;
  image_url?: string;
  available: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  notes?: string;
}

interface Table {
  id: number;
  number: number;
  location: string;
  capacity: number;
  status: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
  icon?: string;
}

// Cache global para productos y subcategorías
const productsCache: Map<number | 'all', Product[]> = new Map();
const subcategoriesCache: Map<number | 'all', Subcategory[]> = new Map();


export const NewOrderWithCache: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Estados principales
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Estados de UI
  const [selectedCategory, setSelectedCategory] = useState<number | 'all' | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | 'all'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cacheIndicator, setCacheIndicator] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number>(1);
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Cargar datos iniciales (solo categorías y mesas)
  useEffect(() => {
    loadInitialData();
    loadActiveOrders();
    const interval = setInterval(loadActiveOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cargar productos cuando cambia la categoría (pero NO al inicio)
  useEffect(() => {
    // Solo cargar si hay una categoría seleccionada Y no es el render inicial
    if (selectedCategory !== null && categories.length > 0) {
      loadCategoryData(selectedCategory);
    }
  }, [selectedCategory]);

  // Búsqueda de clientes con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length >= 2) {
        searchCustomers(customerSearch);
      } else {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar solo categorías y mesas, NO productos
      const [categoriesRes, tablesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categories`),
        fetch(`${API_BASE_URL}/api/tables`)
      ]);

      const [categoriesData, tablesData] = await Promise.all([
        categoriesRes.json(),
        tablesRes.json()
      ]);

      setCategories(categoriesData);
      setTables(tablesData);

      // Seleccionar "Todos" automáticamente para cargar todos los productos
      setSelectedCategory('all');
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async (categoryId: number | 'all' | null) => {
    if (categoryId === null) return;

    // Verificar si ya tenemos los datos en caché ANTES de limpiar
    if (productsCache.has(categoryId) && subcategoriesCache.has(categoryId)) {
      setProducts(productsCache.get(categoryId) || []);
      setSubcategories(subcategoriesCache.get(categoryId) || []);

      // Mostrar indicador de cache
      setCacheIndicator('⚡ desde cache');
      setTimeout(() => setCacheIndicator(null), 2000);
      return;
    }

    // Solo limpiar si no hay cache (para evitar flash)
    setProducts([]);
    setSubcategories([]);
    setLoadingProducts(true);

    try {
      if (categoryId === 'all') {
        // Cargar todos los productos y subcategorías
        const [subcatRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/subcategories`),
          fetch(`${API_BASE_URL}/api/products`)
        ]);

        const [subcatData, productsData] = await Promise.all([
          subcatRes.json(),
          productsRes.json()
        ]);

        const allSubcategories = subcatData.subcategories || subcatData || [];
        const allProducts = productsData || [];

        // Guardar en caché
        productsCache.set('all', allProducts);
        subcategoriesCache.set('all', allSubcategories);

        setSubcategories(allSubcategories);
        setProducts(allProducts);

        // Indicador de datos frescos
        setCacheIndicator('✓ actualizado');
        setTimeout(() => setCacheIndicator(null), 2000);
      } else {
        // Cargar subcategorías y productos de la categoría específica
        const [subcatRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/subcategories?category_id=${categoryId}`),
          fetch(`${API_BASE_URL}/api/products?category_id=${categoryId}`)
        ]);

        const [subcatData, productsData] = await Promise.all([
          subcatRes.json(),
          productsRes.json()
        ]);

        const categorySubcategories = subcatData.subcategories || subcatData || [];
        const categoryProducts = productsData || [];

        // Guardar en caché
        productsCache.set(categoryId, categoryProducts);
        subcategoriesCache.set(categoryId, categorySubcategories);

        setSubcategories(categorySubcategories);
        setProducts(categoryProducts);

        // Indicador de datos frescos
        setCacheIndicator('✓ actualizado');
        setTimeout(() => setCacheIndicator(null), 2000);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error cargando productos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/active`);
      if (response.ok) {
        const orders = await response.json();
        setActiveOrders(orders);
      }
    } catch (error) {
      console.error('Error cargando órdenes activas:', error);
    }
  };

  const searchCustomers = async (query: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      setCustomers(data);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      toast.error('Error buscando clientes');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * product.price }
          : item
      ));
      toast.info(`${product.name} cantidad: ${newQuantity}`, { autoClose: 1500 });
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        subtotal: product.price,
        notes: ''
      }]);
      toast.success(`✅ ${product.name} agregado al carrito`, { autoClose: 1500 });
    }

    // Show cart animation
    setShowCart(true);
    setTimeout(() => setShowCart(false), 2000);
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (item) {
      setCart(cart.filter(item => item.product.id !== productId));
      toast.warning(`${item.product.name} eliminado del carrito`, { autoClose: 1500 });
    }
  };

  const updateCartItemNotes = (productId: number, notes: string) => {
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, notes }
        : item
    ));
  };

  // Cálculos del carrito
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTax = cartSubtotal * 0.21;
  const cartTotal = cartSubtotal + cartTax;

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'all' || product.category_id === selectedCategory;
    const subcategoryMatch = selectedSubcategory === 'all' || product.subcategory_id === selectedSubcategory;
    const searchMatch = productSearch === '' ||
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.description.toLowerCase().includes(productSearch.toLowerCase());
    return categoryMatch && subcategoryMatch && searchMatch && product.available;
  });

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      await Swal.fire({
        title: 'Datos incompletos',
        text: 'Por favor selecciona una mesa y agrega productos al carrito',
        icon: 'error',
        confirmButtonColor: theme.colors.primary
      });
      return;
    }

    // Primero crear la orden
    try {
      const orderData = {
        table_number: selectedTable.number,
        customer_id: selectedCustomer?.id || null,
        items: cart,
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        status: 'pending',
        payment_status: 'pending'
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Error al crear la orden');

      const createdOrder = await response.json();
      setCurrentOrderId(createdOrder.id);

      // Abrir modal de pago
      setShowPaymentModal(true);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la orden');
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    // Limpiar carrito y navegar al dashboard
    setCart([]);
    setSelectedTable(null);
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    
    // Incrementar número de orden para la próxima
    setOrderNumber(prev => prev + 1);
    loadActiveOrders(); // Recargar órdenes activas

    toast.success('¡Pago procesado exitosamente!');

    // Navegar al dashboard o a la vista de órdenes
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <>
      <style>{`
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
      `}</style>

      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <div className="">
          {/* Page Header with Actions */}
          <PageHeader
            title={`Nueva Orden #${orderNumber.toString().padStart(3, '0')}`}
            subtitle={cart.length > 0 ? `${cart.length} items • $${cartTotal.toFixed(2)}` : 'Selecciona productos para agregar'}
            actions={[
              {
                label: showOrdersPanel ? 'Ocultar órdenes' : 'Ver órdenes',
                onClick: () => setShowOrdersPanel(!showOrdersPanel),
                variant: 'secondary',
                icon: showOrdersPanel ? ChevronUpIcon : ChevronDownIcon
              },
              {
                label: t('orders.viewCart'),
                onClick: () => setShowCart(true),
                variant: cart.length > 0 ? 'primary' : 'secondary',
                icon: ShoppingCartIcon
              },
              {
                label: t('orders.clear'),
                onClick: () => setCart([]),
                variant: 'danger',
                icon: TrashIcon
              }
            ]}
          />

          {/* Panel de Órdenes Activas - Colapsable */}
          <AnimatePresence>
            {showOrdersPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-3">
                  <div className="flex items-center gap-4 overflow-x-auto">
                    {activeOrders.length > 0 ? (
                      activeOrders.map((order) => {
                        const getStatusColor = () => {
                          const timeInKitchen = order.time_in_kitchen || 0;
                          if (timeInKitchen < 10) return 'from-green-500 to-emerald-500';
                          if (timeInKitchen < 20) return 'from-yellow-500 to-orange-500';
                          return 'from-red-500 to-rose-500';
                        };
                        
                        return (
                          <motion.div
                            key={order.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 min-w-max`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor()}`} />
                            <span className="text-sm font-medium text-gray-700">
                              Mesa {order.table_number}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.time_in_kitchen || 0}min
                            </span>
                          </motion.div>
                        );
                      })
                    ) : (
                      <>
                        {/* Tarjetas dummy cuando no hay órdenes */}
                        <motion.div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 min-w-max opacity-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                          <span className="text-sm font-medium text-gray-500">Mesa 5</span>
                          <span className="text-xs text-gray-400">3min</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 min-w-max opacity-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
                          <span className="text-sm font-medium text-gray-500">Mesa 12</span>
                          <span className="text-xs text-gray-400">15min</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-200 min-w-max opacity-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
                          <span className="text-sm font-medium text-gray-500">Mesa 3</span>
                          <span className="text-xs text-gray-400">22min</span>
                        </motion.div>
                        <span className="text-xs text-gray-400 ml-2">Ejemplo - No hay órdenes activas</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Panel Principal - Productos */}
              <div className="lg:col-span-2 space-y-4">

                {/* Selección de Mesa y Cliente - Sticky y compacto */}
                <div className="sticky top-20" style={{ zIndex: 5 }}>
                  <GlassPanel delay={0.1}>
                    <div className="p-3">
                      <h2 className="text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        {t('orders.tableAndCustomer')}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>

                          <select
                            value={selectedTable?.id || ''}
                            onChange={(e) => {
                              const table = tables.find(t => t.id === parseInt(e.target.value));
                              setSelectedTable(table || null);
                            }}
                            className="block w-full rounded-lg px-3 py-1.5 text-sm"
                            style={{
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                              color: theme.colors.text
                            }}
                          >
                            <option value="">Seleccionar mesa...</option>
                            {tables.filter(table => table.status === 'available').map((table) => (
                              <option key={table.id} value={table.id}>
                                Mesa {table.number} - {table.location} ({table.capacity} personas)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative">

                          <div className="relative">
                            <UserIcon className="absolute left-2 top-2 h-4 w-4" style={{ color: theme.colors.textMuted }} />
                            <input
                              type="text"
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              onFocus={() => setShowCustomerDropdown(true)}
                              className="block w-full pl-8 pr-3 py-1.5 rounded-lg text-sm"
                              style={{
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border,
                                color: theme.colors.text
                              }}
                              placeholder="Buscar cliente..."
                            />

                            <AnimatePresence>
                              {showCustomerDropdown && customers.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden max-h-32 overflow-y-auto"
                                  style={{ backgroundColor: theme.colors.surface }}
                                >
                                  {customers.map((customer) => (
                                    <motion.button
                                      key={customer.id}
                                      onClick={() => {
                                        setSelectedCustomer(customer);
                                        setCustomerSearch(customer.name);
                                        setShowCustomerDropdown(false);
                                        toast.info(`Cliente: ${customer.name}`, { autoClose: 1500 });
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-opacity-10 text-sm"
                                      style={{ color: theme.colors.text }}
                                      whileHover={{ backgroundColor: theme.colors.primaryLight + '20' }}
                                    >
                                      <div className="font-medium text-sm">{customer.name}</div>
                                      <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                                        {customer.email} - {customer.phone}
                                      </div>
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                </div>

                {/* Productos */}
                <GlassPanel delay={0.2}>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-medium" style={{ color: theme.colors.text }}>
                          Productos
                        </h2>
                        <motion.button
                          onClick={async () => {
                            // Si no hay caché, mostrar notificación de carga
                            if (!productsCache.has('all')) {
                              // Mostrar toast con mensaje de carga
                              const toastId = toast.info(
                                <div>
                                  <div className="mb-2">Cargando todos los productos...</div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: '0%',
                                        animation: 'progress 2s ease-out forwards'
                                      }}
                                    />
                                  </div>
                                  <style>{`
                                  @keyframes progress {
                                    0% { width: 0%; }
                                    50% { width: 70%; }
                                    100% { width: 100%; }
                                  }
                                `}</style>
                                </div>,
                                {
                                  autoClose: false,
                                  closeButton: false,
                                  hideProgressBar: true
                                }
                              );

                              // Cambiar categoría para iniciar la carga
                              setSelectedCategory('all');
                              setSelectedSubcategory('all');

                              // El toast se cerrará cuando los datos realmente se carguen
                              // Usamos un timeout de seguridad por si la carga es muy rápida
                              const checkLoaded = setInterval(() => {
                                if (productsCache.has('all')) {
                                  clearInterval(checkLoaded);
                                  toast.dismiss(toastId);
                                  toast.success('✓ Todos los productos cargados', {
                                    autoClose: 1500,
                                    position: 'bottom-center'
                                  });
                                }
                              }, 100);

                              // Timeout de seguridad después de 5 segundos
                              setTimeout(() => {
                                clearInterval(checkLoaded);
                                toast.dismiss(toastId);
                              }, 5000);
                            } else {
                              // Ya está en caché, cambiar instantáneamente
                              setSelectedCategory('all');
                              setSelectedSubcategory('all');
                            }
                          }}
                          className="px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-1"
                          style={{
                            backgroundColor: selectedCategory === 'all' ? theme.colors.primary + '10' : 'transparent',
                            borderColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.border,
                            color: selectedCategory === 'all' ? theme.colors.primary : theme.colors.textMuted
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Squares2X2Icon className="h-4 w-4" />
                          <span>Ver Todos</span>
                        </motion.button>

                        {/* Botón Limpiar - solo mostrar cuando hay una categoría seleccionada */}
                        <AnimatePresence>
                          {selectedCategory !== null && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => {
                                // Volver al estado inicial
                                setSelectedCategory(null);
                                setSelectedSubcategory('all');
                                setProducts([]);
                                setSubcategories([]);
                                toast.info('Vista restablecida', { autoClose: 1500 });
                              }}
                              className="px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-1"
                              style={{
                                backgroundColor: 'transparent',
                                borderColor: theme.colors.error,
                                color: theme.colors.error
                              }}
                              whileHover={{
                                scale: 1.05,
                                backgroundColor: theme.colors.error + '10'
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <XMarkIcon className="h-4 w-4" />
                              <span>Limpiar</span>
                            </motion.button>
                          )}
                        </AnimatePresence>

                        {/* Badge de cache */}
                        <AnimatePresence>
                          {cacheIndicator && selectedCategory === 'all' && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.3 }}
                              className="ml-2 px-2 py-1 text-xs rounded-full"
                              style={{
                                backgroundColor: cacheIndicator === 'desde cache'
                                  ? theme.colors.warning + '20'
                                  : theme.colors.success + '20',
                                color: cacheIndicator === 'desde cache'
                                  ? theme.colors.warning
                                  : theme.colors.success,
                                border: `1px solid ${cacheIndicator === 'desde cache'
                                  ? theme.colors.warning + '40'
                                  : theme.colors.success + '40'}`
                              }}
                            >
                              {cacheIndicator === 'desde cache' ? '⚡ desde cache' : '✓ actualizado'}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: theme.colors.textMuted }} />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 rounded-lg"
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            color: theme.colors.text
                          }}
                          placeholder="Buscar productos..."
                        />
                      </div>
                    </div>

                    {/* Categorías - Siempre en una línea */}
                    {selectedCategory !== 'all' && (
                      <div className="mb-6">
                        <div
                          className="flex gap-1"
                          style={{
                            display: 'flex',
                            flexWrap: 'nowrap',
                            width: '100%'
                          }}
                        >
                          {loading ? (
                            <div className="flex items-center gap-2 col-span-full">
                              <motion.div
                                className="h-6 w-6 border-2 rounded-full"
                                style={{
                                  borderColor: theme.colors.primary + '20',
                                  borderTopColor: theme.colors.primary
                                }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              <span style={{ color: theme.colors.textMuted }}>Cargando categorías...</span>
                            </div>
                          ) : (
                            categories.slice(0, 12).map((category, index) => {
                              // Función para truncar texto inteligentemente
                              const truncateText = (text: string, maxLength: number = 10) => {
                                if (text.length <= maxLength) return text;

                                // Si tiene espacios, usar la primera palabra + punto
                                const words = text.split(' ');
                                if (words.length > 1) {
                                  return words[0].charAt(0).toUpperCase() + words[0].slice(1, 3) + '.';
                                }

                                // Si es una palabra larga, truncar con puntos
                                return text.charAt(0).toUpperCase() + text.slice(1, maxLength - 1) + '.';
                              };

                              return (
                                <motion.button
                                  key={category.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  onClick={() => {
                                    setSelectedCategory(category.id);
                                    setSelectedSubcategory('all');
                                  }}
                                  className="rounded-lg font-medium flex items-center justify-center gap-1"
                                  style={{
                                    backgroundColor: selectedCategory === category.id ? category.color : theme.colors.surface,
                                    color: selectedCategory === category.id ? 'white' : theme.colors.text,
                                    border: `2px solid ${selectedCategory === category.id ? category.color : theme.colors.border}`,
                                    height: '40px',
                                    padding: '4px 6px',
                                    flex: '1 1 0',
                                    minWidth: '0',
                                    overflow: 'hidden',
                                    fontSize: categories.length > 10 ? '10px' : '12px'
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  title={category.name}
                                >
                                  {category.icon && <CategoryIcon icon={category.icon} size={categories.length > 10 ? "xs" : "sm"} />}
                                  <span className="truncate font-semibold" style={{ maxWidth: '100%' }}>
                                    {categories.length > 8 ? truncateText(category.name, 6) : category.name}
                                  </span>
                                </motion.button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subcategorías - SOLO mostrar cuando hay una categoría específica seleccionada (NO "all") */}
                    <AnimatePresence>
                      {subcategories.length > 0 && selectedCategory !== 'all' && selectedCategory !== null && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 flex gap-2 flex-wrap"
                        >
                          {subcategories.map((subcategory, index) => (
                            <motion.button
                              key={subcategory.id}
                              onClick={() => setSelectedSubcategory(subcategory.id)}
                              className="px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                              style={{
                                backgroundColor: selectedSubcategory === subcategory.id
                                  ? theme.colors.secondary
                                  : theme.colors.surface,
                                color: selectedSubcategory === subcategory.id
                                  ? 'white'
                                  : theme.colors.text
                              }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {subcategory.icon && <CategoryIcon icon={subcategory.icon} size="xs" />}
                              <span>{subcategory.name}</span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Grid de productos con scroll */}
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-12">
                        <motion.div
                          className="h-12 w-12 border-4 rounded-full"
                          style={{
                            borderColor: theme.colors.primary + '20',
                            borderTopColor: theme.colors.primary
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 28rem)', paddingBottom: '100px' }}>
                        <AnimatedList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8">
                          {filteredProducts.map((product, index) => (
                            <AnimatedCard
                              key={product.id}
                              delay={index * 0.02}
                              onClick={() => addToCart(product)}
                              className="p-4 hover-lift cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      img.style.display = 'none';
                                      if (img.parentElement) {
                                        img.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center" style="background-color: ' + theme.colors.surface + '"><span style="color: ' + theme.colors.textMuted + '">Sin imagen</span></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ backgroundColor: theme.colors.surface }}
                                  >
                                    <span style={{ color: theme.colors.textMuted }}>Sin imagen</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h3 className="font-medium text-sm mb-1" style={{ color: theme.colors.text }}>
                                  {product.name}
                                </h3>
                                <p className="text-xs mb-2 line-clamp-2" style={{ color: theme.colors.textMuted }}>
                                  {product.description}
                                </p>
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                                    ${product.price}
                                  </span>

                                  {(() => {
                                    const cartItem = cart.find(item => item.product.id === product.id);
                                    if (cartItem) {
                                      return (
                                        <div
                                          className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border"
                                          style={{
                                            backgroundColor: theme.colors.primary + '10',
                                            borderColor: theme.colors.primary
                                          }}
                                        >
                                          <span className="font-bold text-sm" style={{ color: theme.colors.primary }}>
                                            {cartItem.quantity}
                                          </span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <motion.div
                                          className="w-8 h-8 rounded-full flex items-center justify-center"
                                          style={{ backgroundColor: theme.colors.primary }}
                                          whileHover={{
                                            rotate: 90,
                                            scale: 1.1
                                          }}
                                          transition={{ duration: 0.2 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                          }}
                                        >
                                          <PlusIcon className="h-4 w-4" style={{ color: 'white' }} />
                                        </motion.div>
                                      );
                                    }
                                  })()}
                                </div>
                              </div>
                            </AnimatedCard>
                          ))}
                        </AnimatedList>
                      </div>
                    ) : selectedCategory === null ? (
                      <div className="text-center py-12">
                        <div className="max-w-sm mx-auto">
                          <div className="mb-4">
                            <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center"
                              style={{ backgroundColor: theme.colors.primary + '10' }}>
                              <ShoppingCartIcon className="h-8 w-8" style={{ color: theme.colors.primary }} />
                            </div>
                          </div>
                          <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.text }}>
                            No hay productos cargados
                          </h3>
                          <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                            Selecciona una categoría arriba para cargar y ver sus productos
                          </p>
                          <div className="text-xs space-y-1" style={{ color: theme.colors.textMuted }}>
                            <p>🚀 Carga rápida bajo demanda</p>
                            <p>📱 Optimizado para tablets y móviles</p>
                            <p>💾 Los productos se guardan en caché</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p style={{ color: theme.colors.textMuted }}>
                          No hay productos en esta categoría
                        </p>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </div>

              {/* Panel del Carrito - Simplificado */}
              <div className="sticky top-20" style={{ height: 'calc(100vh - 10rem)', marginBottom: '2rem' }}>
                <GlassPanel delay={0.3} className="h-full flex flex-col relative">
                  {/* Badge de número de orden - flotante en la esquina */}
                  <div className="absolute -top-3 -right-3 z-10">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-2xl shadow-lg font-bold text-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      ORDEN #{orderNumber.toString().padStart(3, '0')}
                    </motion.div>
                  </div>
                  
                  {/* Header del carrito - fijo arriba */}
                  <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.border, flexShrink: 0 }}>
                    <h2 className="text-lg font-medium flex items-center gap-2" style={{ color: theme.colors.text }}>
                      <ShoppingCartIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
                      {t('orders.cart')} ({cart.length})
                    </h2>
                    {cart.length > 0 && (
                      <motion.button
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: '¿Vaciar carrito?',
                            text: 'Se eliminarán todos los productos del carrito',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: theme.colors.error,
                            cancelButtonColor: theme.colors.textMuted,
                            confirmButtonText: 'Sí, vaciar',
                            cancelButtonText: 'Cancelar'
                          });

                          if (result.isConfirmed) {
                            setCart([]);
                            toast.info(t('orders.cartCleared'));
                          }
                        }}
                        className="text-sm"
                        style={{ color: theme.colors.error }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Vaciar
                      </motion.button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                        <p style={{ color: theme.colors.textMuted }}>{t('orders.empty')}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Lista de items - con scroll */}
                      <div className="overflow-y-auto p-4 space-y-3" style={{ flex: '1 1 0', minHeight: 0, maxHeight: 'calc(100vh - 24.2rem)' }}>
                        <AnimatePresence>
                          {cart.map((item) => (
                            <motion.div
                              key={item.product.id}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="p-3"
                              style={{ backgroundColor: theme.colors.surface }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm" style={{ color: theme.colors.text }}>
                                    {item.product.name}
                                  </h4>
                                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                    ${item.product.price} c/u
                                  </p>
                                </div>
                                <motion.button
                                  onClick={() => removeFromCart(item.product.id)}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.8 }}
                                >
                                  <TrashIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                                </motion.button>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm border-2"
                                    style={{
                                      backgroundColor: 'white',
                                      borderColor: theme.colors.primary
                                    }}
                                    whileHover={{
                                      scale: 1.1,
                                      backgroundColor: theme.colors.primary + '10'
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <MinusIcon className="h-3 w-3" style={{ color: theme.colors.primary }} />
                                  </motion.button>

                                  <div className="min-w-[24px] text-center">
                                    <span className="font-bold text-sm" style={{ color: theme.colors.primary }}>
                                      {item.quantity}
                                    </span>
                                  </div>

                                  <motion.button
                                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                                    style={{ backgroundColor: theme.colors.primary }}
                                    whileHover={{
                                      scale: 1.1,
                                      backgroundColor: theme.colors.primaryDark || theme.colors.primary
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <PlusIcon className="h-3 w-3" style={{ color: 'white' }} />
                                  </motion.button>
                                </div>
                                <span className="font-bold text-sm" style={{ color: theme.colors.primary }}>
                                  ${item.subtotal.toFixed(2)}
                                </span>
                              </div>

                              <input
                                type="text"
                                placeholder="Notas..."
                                value={item.notes}
                                onChange={(e) => updateCartItemNotes(item.product.id, e.target.value)}
                                className="w-full mt-2 px-2 py-1 text-xs"
                                style={{
                                  backgroundColor: theme.colors.background,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text
                                }}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Botón único con toda la información */}
                      <motion.button
                        onClick={submitOrder}
                        className="w-full p-3 text-white font-bold rounded-lg relative"
                        style={{
                          backgroundColor: theme.colors.primary,
                          flexShrink: 0,
                          minHeight: '80px'
                        }}
                        whileHover={{ scale: 1.02, backgroundColor: theme.colors.primaryDark }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          {/* Impuestos a la izquierda */}
                          <div className="text-left">
                            <div className="text-xs opacity-80">Subtotal: ${cartSubtotal.toFixed(2)}</div>
                            <div className="text-xs opacity-80">IVA 21%: ${cartTax.toFixed(2)}</div>
                          </div>

                          {/* Total centrado grande */}
                          <div className="text-center flex-1">
                            <div className="text-3xl font-bold">${cartTotal.toFixed(2)}</div>
                            <div className="text-xs opacity-90 flex items-center justify-center gap-1">
                              <ShoppingCartIcon className="h-4 w-4" />
                              PROCESAR
                            </div>
                          </div>

                          {/* Ícono a la derecha */}
                          <div>
                            <CreditCardIcon className="h-8 w-8 opacity-90" />
                          </div>
                        </div>
                      </motion.button>
                    </>
                  )}
                </GlassPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pago con MercadoPago */}
      {showPaymentModal && currentOrderId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderData={{
            order_id: currentOrderId,
            items: cart.map(item => ({
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              description: item.product.description || ''
            })),
            total: cartTotal,
            table_number: selectedTable?.number || 1,
            customer_name: selectedCustomer?.name,
            customer_email: selectedCustomer?.email
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};