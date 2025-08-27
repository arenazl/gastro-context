import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Wand2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

interface Ingredient {
  id: number;
  name: string;
  category_name: string;
  category_color: string;
  unit_abbr: string;
  cost_per_unit: number;
  current_stock: number;
  stock_status: 'good' | 'warning' | 'low';
}

interface IngredientCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface AISuggestion {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  optional: boolean;
  reason: string;
}

interface ProductIngredient {
  id?: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit_name: string;
  preparation_notes?: string;
  cost_contribution?: number;
  is_optional: boolean;
  category_name?: string;
  category_color?: string;
}

interface IngredientsExpanderProps {
  productId: number;
  productName: string;
  productCategory?: string;
  isOpen: boolean;
  onToggle: () => void;
  onIngredientsUpdate?: (ingredients: ProductIngredient[]) => void;
  hideHeader?: boolean; // Nueva prop para ocultar el header
}

export const IngredientsExpander: React.FC<IngredientsExpanderProps> = ({
  productId,
  productName,
  productCategory,
  isOpen,
  onToggle,
  onIngredientsUpdate,
  hideHeader = false
}) => {
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Cargar ingredientes del producto
  useEffect(() => {
    if (isOpen && productId) {
      //loadProductIngredients();
      //loadAvailableIngredients();
      //loadCategories();
    }
  }, [isOpen, productId]);

  const loadProductIngredients = async () => {
    setIsLoadingIngredients(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/ingredients`);
      if (response.ok) {
        const data = await response.json();
        setIngredients(data || []);
        if (onIngredientsUpdate) {
          onIngredientsUpdate(data || []);
        }
      }
    } catch (error) {
      console.error('Error cargando ingredientes del producto:', error);
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  const loadAvailableIngredients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ingredients`);
      if (response.ok) {
        const data = await response.json();
        setAvailableIngredients(data || []);
      }
    } catch (error) {
      console.error('Error cargando ingredientes disponibles:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ingredients/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const getAISuggestions = async () => {
    if (!productName) return;

    setIsLoadingAI(true);
    try {
      const params = new URLSearchParams({
        product_name: productName
      });
      if (productCategory) {
        params.append('category', productCategory);
      }

      const response = await fetch(`${API_BASE_URL}/api/ingredients/ai-suggestions?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiSuggestions(data.suggestions || []);
        }
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias de IA:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const addIngredientToProduct = async (ingredientId: number, quantity: number, unit: string, isOptional: boolean, notes?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredient_id: ingredientId,
          quantity: quantity,
          unit_name: unit,
          preparation_notes: notes || '',
          is_optional: isOptional
        })
      });

      if (response.ok) {
        //loadProductIngredients();
        setShowAddForm(false);
        return true;
      } else if (response.status === 409) {
        alert('Este ingrediente ya está asignado al producto');
      }
    } catch (error) {
      console.error('Error agregando ingrediente:', error);
    }
    return false;
  };

  const acceptAISuggestion = async (suggestion: AISuggestion) => {
    // Buscar el ingrediente en la lista disponible
    const ingredient = availableIngredients.find(ing =>
      ing.name.toLowerCase().includes(suggestion.name.toLowerCase()) ||
      suggestion.name.toLowerCase().includes(ing.name.toLowerCase())
    );

    if (ingredient) {
      const success = await addIngredientToProduct(
        ingredient.id,
        parseFloat(suggestion.quantity),
        suggestion.unit,
        suggestion.optional,
        suggestion.reason
      );
      if (success) {
        setAiSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
      }
    } else {
      alert('Ingrediente no encontrado en el inventario. Puede agregarlo manualmente.');
    }
  };

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={hideHeader ? "space-y-4" : "border border-gray-200 rounded-lg mt-4"}>
      {/* Header expandible - solo si no está oculto */}
      {!hideHeader && (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">Gestión de Ingredientes</span>
            </div>
            {ingredients.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {ingredients.length} ingredientes
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      )}

      {/* Contenido expandible */}
      {(isOpen || hideHeader) && (
        <div className={hideHeader ? "space-y-4" : "p-4 space-y-4"}>
          {/* Acciones principales */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={getAISuggestions}
              disabled={isLoadingAI}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all font-medium"
            >
              <Wand2 className="h-4 w-4" />
              <span className="text-sm">{isLoadingAI ? 'Generando...' : 'Sugerir con IA'}</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-sm">Agregar Manual</span>
            </button>
          </div>

          {/* Sugerencias de IA */}
          {aiSuggestions.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3">
                🤖 Sugerencias de IA para "{productName}"
              </h4>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{suggestion.name}</span>
                          <span className="text-sm px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {suggestion.category}
                          </span>
                          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-600 rounded">
                            {suggestion.quantity} {suggestion.unit}
                          </span>
                          {suggestion.optional && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded">
                              Opcional
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.reason}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => acceptAISuggestion(suggestion)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => setAiSuggestions(prev => prev.filter(s => s.name !== suggestion.name))}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario para agregar ingredientes */}
          {showAddForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Agregar Ingrediente Manualmente</h4>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Buscador de ingredientes */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar ingredientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Lista de ingredientes disponibles */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{ingredient.name}</span>
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: ingredient.category_color + '20', color: ingredient.category_color }}
                        >
                          {ingredient.category_name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStockStatusColor(ingredient.stock_status)}`}>
                          Stock: {ingredient.current_stock} {ingredient.unit_abbr}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ${ingredient.cost_per_unit} por {ingredient.unit_abbr}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addIngredientToProduct(ingredient.id, 1, ingredient.unit_abbr, false);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de ingredientes del producto */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Ingredientes del Producto ({ingredients.length})
            </h4>
            {isLoadingIngredients ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando ingredientes...</span>
              </div>
            ) : ingredients.length > 0 ? (
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id || ingredient.ingredient_id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{ingredient.ingredient_name}</span>
                        {ingredient.category_color && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: ingredient.category_color + '20', color: ingredient.category_color }}
                          >
                            {ingredient.category_name}
                          </span>
                        )}
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-600 rounded">
                          {ingredient.quantity} {ingredient.unit_name}
                        </span>
                        {ingredient.is_optional && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded">
                            Opcional
                          </span>
                        )}
                      </div>
                      {ingredient.preparation_notes && (
                        <p className="text-sm text-gray-600">{ingredient.preparation_notes}</p>
                      )}
                      {ingredient.cost_contribution && (
                        <div className="text-sm text-green-600 font-medium">
                          Costo: ${ingredient.cost_contribution}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SparklesIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay ingredientes asignados</p>
                <p className="text-sm">Usa la IA para obtener sugerencias o agrega ingredientes manualmente</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};