const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function updateCategoriesAndSubcategoriesIcons() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Actualizar íconos de categorías
    console.log('Actualizando íconos de categorías...');
    const categoryUpdates = [
      [1, '🥗'], // Entradas
      [2, '🍲'], // Sopas  
      [3, '🥙'], // Ensaladas
      [4, '🥩'], // Carnes
      [5, '🐟'], // Pescados y Mariscos
      [6, '🍝'], // Pastas
      [7, '🍕'], // Pizzas
      [8, '🍗'], // Pollo
      [9, '🥬'], // Vegetarianos
      [10, '🍰'], // Postres
      [11, '🥤'], // Bebidas
      [12, '🍷']  // Vinos
    ];

    for (const [id, icon] of categoryUpdates) {
      try {
        await connection.execute(
          'UPDATE categories SET icon = ? WHERE id = ?',
          [icon, id]
        );
        console.log(`✅ Categoría ${id} actualizada con ícono ${icon}`);
      } catch (error) {
        console.log(`⚠️ Error actualizando categoría ${id}: ${error.message}`);
      }
    }

    // 2. Actualizar íconos de subcategorías
    console.log('Actualizando íconos de subcategorías...');
    const subcategoryUpdates = [
      // Entradas
      [1, '❄️'], // Frías
      [2, '🔥'], // Calientes
      [3, '🌱'], // Vegetarianas
      
      // Sopas
      [4, '🍜'], // Caldos
      [5, '🥛'], // Cremas
      [6, '🌍'], // Internacionales
      
      // Platos Principales
      [7, '🥩'], // Carnes Rojas
      [8, '🍗'], // Aves
      [9, '🐟'], // Pescados
      [10, '🦐'], // Mariscos
      [11, '🥗'], // Vegetarianos
      
      // Pastas
      [12, '🍝'], // Pasta Fresca
      [13, '🍚'], // Risottos
      [14, '🥟'], // Gnocchi
      
      // Postres
      [15, '🍰'], // Clásicos
      [16, '🍨'], // Helados
      [17, '✨'], // Especiales
      
      // Bebidas
      [18, '☕'], // Calientes
      [19, '🧊'], // Frías
      [20, '🍷']  // Alcohólicas
    ];

    for (const [id, icon] of subcategoryUpdates) {
      try {
        await connection.execute(
          'UPDATE subcategories SET icon = ? WHERE id = ?',
          [icon, id]
        );
        console.log(`✅ Subcategoría ${id} actualizada con ícono ${icon}`);
      } catch (error) {
        console.log(`⚠️ Error actualizando subcategoría ${id}: ${error.message}`);
      }
    }

    // 3. Agregar imágenes a productos existentes
    console.log('Actualizando imágenes de productos...');
    
    // Obtener todos los productos sin imagen
    const [products] = await connection.execute(`
      SELECT id, name, category_id, subcategory_id 
      FROM products 
      WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '/images/%'
    `);

    console.log(`Encontrados ${products.length} productos para actualizar imágenes`);

    // Generar URLs de imágenes basadas en el nombre del producto
    const imageMap = {
      'Carpaccio de Res': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      'Tabla de Quesos': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400',
      'Salmón Marinado': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
      'Vitello Tonnato': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
      'Ensalada Caprese': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400',
      'Empanadas Criollas': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
      'Provoleta a la Parrilla': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
      'Hongos Rellenos': 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400',
      'Calamares Fritos': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
      'Croquetas de Jamón': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
      'Hummus con Pita': 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400',
      'Bruschetta Mixta': 'https://images.unsplash.com/photo-1572441713132-51f7ec01803c?w=400',
      'Baba Ganoush': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
      'Antipasto Veggie': 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
      'Tarta de Verduras': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      'Consomé de Pollo': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
      'Caldo de Pescado': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
      'Sopa Miso': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      'Caldo Verde': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
      'Sopa de Cebolla': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
      'Crema de Calabaza': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400',
      'Crema de Espárragos': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
      'Crema de Champiñones': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
      'Crema de Tomate': 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400',
      'Crema de Brócoli': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400',
      'Bife de Chorizo': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      'Entraña Grillada': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      'Cordero Patagónico': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
      'Lomo Wellington': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
      'Osso Buco': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      'Pollo al Limón': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400',
      'Pato Confitado': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400',
      'Pollo Tikka Masala': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      'Suprema Maryland': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400',
      'Pollo Thai': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      'Tiramisú': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
      'Flan Casero': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
      'Cheesecake': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
      'Brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
      'Panacotta': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'
    };

    // Imágenes genéricas por categoría para productos sin imagen específica
    const defaultImages = {
      1: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400', // Entradas
      2: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400', // Sopas
      3: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', // Platos principales
      4: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400', // Pastas
      5: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', // Postres
      6: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'  // Bebidas
    };

    for (const product of products) {
      let imageUrl = imageMap[product.name] || defaultImages[product.category_id] || 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400';
      
      try {
        await connection.execute(
          'UPDATE products SET image_url = ? WHERE id = ?',
          [imageUrl, product.id]
        );
        console.log(`✅ Producto "${product.name}" actualizado con imagen`);
      } catch (error) {
        console.log(`⚠️ Error actualizando producto ${product.id}: ${error.message}`);
      }
    }

    console.log('✅ Actualización completada exitosamente!');
    
    // Mostrar estadísticas finales
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as products_with_images,
        (SELECT COUNT(*) FROM categories WHERE icon IS NOT NULL) as categories_with_icons,
        (SELECT COUNT(*) FROM subcategories WHERE icon IS NOT NULL) as subcategories_with_icons
      FROM products
    `);
    
    console.log('\n📊 Estadísticas actualizadas:');
    console.log(`   - Productos totales: ${stats[0].total_products}`);
    console.log(`   - Productos con imágenes: ${stats[0].products_with_images}`);
    console.log(`   - Categorías con íconos: ${stats[0].categories_with_icons}`);
    console.log(`   - Subcategorías con íconos: ${stats[0].subcategories_with_icons}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateCategoriesAndSubcategoriesIcons();