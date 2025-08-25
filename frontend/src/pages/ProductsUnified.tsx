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
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002';

interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id?: number;
  name: string;
  products: Product[];
}

interface Product {
  id?: number;
  name: string;
  price: number;
  description?: string;
}

export const ProductsUnified: React.FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Categoría, 2: Subcategorías, 3: Productos, 4: Resumen
  const [currentCategory, setCurrentCategory] = useState<Category>({
    name: '',
    icon: '🍽️',
    color: '#3B82F6',
    subcategories: []
  });
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory>({
    name: '',
    products: []
  });
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);

  const iconOptions = ['🍔', '🍕', '🥗', '🍝', '🥤', '🍰', '🍷', '🍺', '🥘', '🍜', '🍱', '☕'];
  const colorOptions = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  const handleAddSubcategory = () => {
    if (currentSubcategory.name.trim()) {
      setCurrentCategory({
        ...currentCategory,
        subcategories: [...currentCategory.subcategories, { ...currentSubcategory }]
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
    
    const updatedSubs = [...currentCategory.subcategories];
    updatedSubs[subIndex].products.push(newProduct);
    setCurrentCategory({
      ...currentCategory,
      subcategories: updatedSubs
    });
  };

  const handleProductChange = (subIndex: number, prodIndex: number, field: string, value: any) => {
    const updatedSubs = [...currentCategory.subcategories];
    updatedSubs[subIndex].products[prodIndex] = {
      ...updatedSubs[subIndex].products[prodIndex],
      [field]: value
    };
    setCurrentCategory({
      ...currentCategory,
      subcategories: updatedSubs
    });
  };

  const handleSaveAll = async () => {
    try {
      // Aquí iría la lógica para guardar todo
      toast.success('Categoría creada exitosamente!');
      // Reset
      setCurrentCategory({
        name: '',
        icon: '🍽️',
        color: '#3B82F6',
        subcategories: []
      });
      setStep(1);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader 
        title={t('products.createCategoryComplete')}
        subtitle={t('products.addCategory') + ', ' + t('products.subcategories') + ' y ' + t('products.products')}
      />

      {/* Progress Steps */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: t('products.category') },
            { num: 2, label: t('products.subcategories') },
            { num: 3, label: t('products.products') },
            { num: 4, label: t('products.finalSummary') }
          ].map((s, index) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s.num 
                      ? 'bg-blue-600 text-white scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? <Check className="h-6 w-6" /> : s.num}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  step >= s.num ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {index < 3 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Categoría */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">{t('products.categoryInfo')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('products.categoryName')}</label>
                  <input
                    type="text"
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentCategory.name.trim()) {
                        e.preventDefault();
                        setStep(2);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('products.categoryName')}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('products.selectIcon')}</label>
                  <div className="grid grid-cols-6 gap-3">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setCurrentCategory({ ...currentCategory, icon })}
                        className={`p-4 text-3xl rounded-xl border-2 transition-all ${
                          currentCategory.icon === icon 
                            ? 'border-blue-500 bg-blue-50 scale-110' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('products.selectColor')}</label>
                  <div className="grid grid-cols-8 gap-3">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setCurrentCategory({ ...currentCategory, color })}
                        className={`h-12 rounded-lg transition-all ${
                          currentCategory.color === color 
                            ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' 
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentCategory.name.trim() && step === 1) {
                      setStep(2);
                    }
                  }}
                  disabled={!currentCategory.name.trim() || step !== 1}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {t('common.next')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Subcategorías */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center mb-6">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mr-4"
                  style={{ backgroundColor: currentCategory.color + '20' }}
                >
                  {currentCategory.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentCategory.name}</h2>
                  <p className="text-gray-500">{t('products.addSubcategories')}</p>
                </div>
              </div>

              {/* Lista de subcategorías */}
              <div className="space-y-3 mb-6">
                {currentCategory.subcategories.map((sub, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{sub.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({sub.products.length} productos)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updatedSubs = currentCategory.subcategories.filter((_, i) => i !== index);
                        setCurrentCategory({ ...currentCategory, subcategories: updatedSubs });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Agregar nueva subcategoría */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={currentSubcategory.name}
                  onChange={(e) => setCurrentSubcategory({ ...currentSubcategory, name: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder={t('products.newSubcategory')}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                />
                <button
                  onClick={handleAddSubcategory}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentCategory.subcategories.length > 0 && step === 2) {
                      setStep(3);
                    }
                  }}
                  disabled={currentCategory.subcategories.length === 0 || step !== 2}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {t('common.next')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Productos */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center mb-6">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mr-4"
                  style={{ backgroundColor: currentCategory.color + '20' }}
                >
                  {currentCategory.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentCategory.name}</h2>
                  <p className="text-gray-500">{t('products.addProducts')}</p>
                </div>
              </div>

              <div className="space-y-6">
                {currentCategory.subcategories.map((sub, subIndex) => (
                  <div key={subIndex} className="border-2 border-gray-200 rounded-xl p-4">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                      <Layers className="h-5 w-5 mr-2" />
                      {sub.name}
                    </h3>

                    {/* Productos de esta subcategoría */}
                    <div className="space-y-3 mb-4">
                      {sub.products.map((product, prodIndex) => (
                        <div key={prodIndex} className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder={t('products.productName')}
                            value={product.name}
                            onChange={(e) => handleProductChange(subIndex, prodIndex, 'name', e.target.value)}
                            className="px-3 py-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            placeholder={t('products.price')}
                            value={product.price}
                            onChange={(e) => handleProductChange(subIndex, prodIndex, 'price', parseFloat(e.target.value))}
                            className="px-3 py-2 border rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder={t('products.description')}
                            value={product.description}
                            onChange={(e) => handleProductChange(subIndex, prodIndex, 'description', e.target.value)}
                            className="px-3 py-2 border rounded-lg"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddProduct(subIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
                    >
                      + {t('products.addProduct')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (step === 3) {
                      setStep(4);
                    }
                  }}
                  disabled={step !== 3}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {t('products.finalSummary')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Resumen */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">{t('products.finalSummary')}</h2>

              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl mr-4"
                    style={{ backgroundColor: currentCategory.color + '20' }}
                  >
                    {currentCategory.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{currentCategory.name}</h3>
                    <p className="text-gray-500">
                      {currentCategory.subcategories.length} subcategorías · 
                      {currentCategory.subcategories.reduce((acc, sub) => acc + sub.products.length, 0)} productos
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentCategory.subcategories.map((sub, index) => (
                    <div key={index} className="border-l-4 pl-4" style={{ borderColor: currentCategory.color }}>
                      <h4 className="font-semibold mb-2">{sub.name}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {sub.products.map((prod, pIndex) => (
                          <div key={pIndex} className="text-sm text-gray-600">
                            • {prod.name} - ${prod.price}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  {t('products.backToEdit')}
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  {t('products.saveAll')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};