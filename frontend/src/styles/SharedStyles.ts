// Estilos compartidos para toda la aplicación
// Mantiene consistencia visual en todos los componentes

export const styles = {
  // Contenedores principales
  page: {
    container: "h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden",
    content: "flex-1 overflow-hidden"
  },

  // Headers y búsqueda
  header: {
    searchContainer: "bg-white shadow-sm border-b",
    searchWrapper: "px-6 py-4",
    searchInner: "max-w-4xl mx-auto",
    searchTitle: "text-lg font-semibold text-gray-700",
    searchInput: "w-full pl-11 pr-11 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
    searchIcon: "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
  },

  // Cards y contenedores
  card: {
    base: "bg-white rounded-xl shadow-lg border border-gray-100",
    hover: "hover:shadow-xl transition-all",
    selected: "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg",
    unselected: "bg-gray-50 hover:bg-gray-100"
  },

  // Items de lista (categorías, subcategorías, productos)
  listItem: {
    container: "p-2.5 rounded-xl cursor-pointer transition-all",
    categorySelected: "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg",
    categoryUnselected: "bg-gray-50 hover:bg-gray-100",
    subcategorySelected: "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg",
    subcategoryUnselected: "bg-white hover:bg-gray-50 border border-gray-100",
    allProductsSelected: "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg",
    allProductsUnselected: "bg-blue-50 hover:bg-blue-100 border border-blue-200"
  },

  // Iconos
  icon: {
    containerLarge: "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
    containerMedium: "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
    containerSmall: "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
    sizeLarge: "h-7 w-7",
    sizeMedium: "h-6 w-6",
    sizeSmall: "h-4 w-4"
  },

  // Textos
  text: {
    title: "font-semibold text-sm",
    titleSelected: "text-white",
    titleUnselected: "text-gray-800",
    subtitle: "text-xs",
    subtitleSelected: "text-white/80",
    subtitleUnselected: "text-gray-500"
  },

  // Botones
  button: {
    primary: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
    secondary: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
    danger: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors",
    success: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",
    icon: "p-1.5 hover:bg-gray-100 rounded transition-colors",
    iconSelected: "p-1 bg-white/20 rounded hover:bg-white/30 transition-colors",
    // Botones de agregar para las columnas (diferentes colores)
    addNewCategory: "p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center",
    addNewSubcategory: "p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center",
    addNewProduct: "p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-sm flex items-center justify-center",
    // Botones de acción sobre items seleccionados (hover)
    actionEdit: "p-2 border border-white text-white rounded-lg transition-all flex items-center justify-center",
    actionDelete: "p-2 border border-white text-white rounded-lg transition-all flex items-center justify-center"
  },

  // Formularios
  form: {
    input: "w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    label: "block text-sm font-medium text-gray-700 mb-1",
    textarea: "w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  },

  // Modales
  modal: {
    overlay: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
    container: "bg-white rounded-2xl p-6 w-96 max-w-full mx-4",
    title: "text-xl font-bold mb-4 text-gray-800"
  },

  // Columnas y layout
  layout: {
    threeColumns: "flex-1 flex overflow-hidden",
    columnLeft: "w-1/4 border-r border-gray-200 bg-white",
    columnCenter: "w-1/4 border-r border-gray-200 bg-gray-50",
    columnRight: "flex-1 bg-white",
    columnHeader: "p-4 border-b border-gray-200",
    columnContent: "overflow-y-auto h-full scrollbar-hide"
  },

  // Productos con imagen
  product: {
    container: "relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100",
    image: "h-40 bg-gradient-to-br from-blue-400 to-purple-500 relative",
    imageOverlay: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
    content: "p-4",
    title: "font-bold text-white text-lg drop-shadow-lg",
    price: "text-2xl font-bold text-green-600 mt-1",
    badge: {
      available: "text-xs px-3 py-1.5 rounded-full font-medium bg-green-100 text-green-700",
      unavailable: "text-xs px-3 py-1.5 rounded-full font-medium bg-red-100 text-red-700"
    }
  },

  // Estados y alertas
  states: {
    loading: "flex items-center justify-center h-full",
    spinner: "animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full",
    empty: "flex items-center justify-center h-full text-gray-400"
  }
};

// Funciones helper para combinar clases
export const combineClasses = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Función para obtener clases de item según tipo y estado
export const getListItemClasses = (type: 'category' | 'subcategory' | 'allProducts', isSelected: boolean): string => {
  const base = styles.listItem.container;
  
  if (type === 'category') {
    return combineClasses(base, isSelected ? styles.listItem.categorySelected : styles.listItem.categoryUnselected);
  }
  
  if (type === 'subcategory') {
    return combineClasses(base, isSelected ? styles.listItem.subcategorySelected : styles.listItem.subcategoryUnselected);
  }
  
  if (type === 'allProducts') {
    return combineClasses(base, isSelected ? styles.listItem.allProductsSelected : styles.listItem.allProductsUnselected);
  }
  
  return base;
};