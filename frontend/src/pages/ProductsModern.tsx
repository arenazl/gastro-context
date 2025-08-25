import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton, GradientText } from '../components/AnimatedComponents';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckIcon,
  Squares2X2Icon,
  ListBulletIcon
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
  category_name: string;
  subcategory_id?: number;
  subcategory_name?: string;
  image_url?: string;
  available: boolean;
}

export const ProductsModern: React.FC = () => {
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    available: true,
    image_url: ''
  });

  useEffect(() => {
    if (!dataLoaded) {
      loadData();
    }

    // Cleanup function
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [dataLoaded, abortController]);

  const loadData = async () => {
    try {
      // Cancelar request anterior si existe
      if (abortController) {
        abortController.abort();
      }

      // Crear nuevo controller
      const newController = new AbortController();
      setAbortController(newController);
      setLoading(true);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'}/api/products`, {
          signal: newController.signal
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'}/api/categories`, {
          signal: newController.signal
        })
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setDataLoaded(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading data:', error);
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = async () => {
    try {
      const url = editingProduct
        ? `${import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'}/api/products/${editingProduct.id}`
        : `${import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'}/api/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          category_id: parseInt(formData.category_id)
        })
      });

      if (response.ok) {
        loadData();
        setShowAddModal(false);
        setEditingProduct(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'}/api/products/${id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      available: true,
      image_url: ''
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category_id: product.category_id.toString(),
      available: product.available,
      image_url: product.image_url || ''
    });
    setShowAddModal(true);
  };

  return (
    <div>
      {/* Page Header with Actions */}
      <PageHeader
        title="Productos"
        subtitle={`${filteredProducts.length} productos • ${products.filter(p => p.available).length} disponibles • ${categories.length} categorías`}
        actions={[
          {
            label: 'Nuevo Producto',
            onClick: () => setShowAddModal(true),
            variant: 'primary',
            icon: PlusIcon
          },
          {
            label: viewMode === 'grid' ? 'Lista' : 'Grilla',
            onClick: () => setViewMode(viewMode === 'grid' ? 'list' : 'grid'),
            variant: 'secondary',
            icon: viewMode === 'grid' ? ListBulletIcon : Squares2X2Icon
          }
        ]}
      />

      {/* Filters Bar */}
      <GlassPanel delay={0.1} className="mt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
              style={{ color: theme.colors.textMuted }}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <motion.button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all`}
              style={{
                backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.surface,
                color: selectedCategory === 'all' ? 'white' : theme.colors.text
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All
            </motion.button>
            {categories.slice(0, 5).map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : theme.colors.surface,
                  color: selectedCategory === category.id ? 'white' : theme.colors.text
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CategoryIcon icon={category.icon} size="sm" />
                <span className="hidden sm:inline">{category.name}</span>
              </motion.button>
            ))}
          </div>

        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
          <div>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>Total Products</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>{products.length}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>Active</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
              {products.filter(p => p.available).length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>Categories</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>{categories.length}</p>
          </div>
        </div>
      </GlassPanel>

      {/* Products Grid/List */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const category = categories.find(c => c.id === product.category_id);

              return (
                <AnimatedCard
                  key={product.id}
                  delay={index * 0.05}
                  className="overflow-hidden group"
                  whileHover={{ y: -8 }}
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden">
                    {product.image_url ? (
                      <motion.img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        <PhotoIcon className="h-12 w-12" style={{ color: theme.colors.textMuted }} />
                      </div>
                    )}

                    {/* Actions Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
                    >
                      <motion.button
                        onClick={() => openEditModal(product)}
                        className="p-2 rounded-lg bg-white/90"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <PencilIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 rounded-lg bg-white/90"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <TrashIcon className="h-5 w-5" style={{ color: theme.colors.error }} />
                      </motion.button>
                    </motion.div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: product.available ? theme.colors.success + '90' : theme.colors.error + '90',
                          color: 'white'
                        }}
                      >
                        {product.available ? 'Available' : 'Unavailable'}
                      </motion.span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                        {product.name}
                      </h3>
                      <span className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                        ${product.price}
                      </span>
                    </div>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.colors.textMuted }}>
                      {product.description}
                    </p>
                    {category && (
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: category.color + '20',
                          color: category.color
                        }}
                      >
                        <CategoryIcon icon={category.icon} size="xs" />
                        <span>{category.name}</span>
                      </div>
                    )}
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        ) : (
          <GlassPanel>
            <div className="space-y-3">
              {filteredProducts.map((product, index) => {
                const category = categories.find(c => c.id === product.category_id);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg flex items-center justify-between hover:shadow-md transition-all"
                    style={{ backgroundColor: theme.colors.surface }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: theme.colors.background }}
                          >
                            <PhotoIcon className="h-6 w-6" style={{ color: theme.colors.textMuted }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                            {product.name}
                          </h3>
                          {category && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: category.color + '20',
                                color: category.color
                              }}
                            >
                              <CategoryIcon icon={category.icon} size="xs" />
                              {category.name}
                            </span>
                          )}
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: product.available ? theme.colors.success + '20' : theme.colors.error + '20',
                              color: product.available ? theme.colors.success : theme.colors.error
                            }}
                          >
                            {product.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                        ${product.price}
                      </span>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => openEditModal(product)}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: theme.colors.primary + '20' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: theme.colors.error + '20' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddModal(false);
                setEditingProduct(null);
                resetForm();
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <motion.button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Price
                      </label>
                      <div className="relative">
                        <CurrencyDollarIcon
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                          style={{ color: theme.colors.textMuted }}
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            border: `1px solid ${theme.colors.border}`
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                        Category
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                      Image URL
                    </label>
                    <div className="relative">
                      <PhotoIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                        style={{ color: theme.colors.textMuted }}
                      />
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.border}`
                        }}
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <label htmlFor="available" className="text-sm font-medium" style={{ color: theme.colors.text }}>
                      Product is available
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <FloatingButton
                    onClick={handleSaveProduct}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {editingProduct ? 'Update' : 'Create'} Product
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};