const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function updateFontAwesomeIcons() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Actualizar íconos de categorías con Font Awesome
    console.log('Actualizando íconos de categorías a Font Awesome...');
    const categoryUpdates = [
      [1, 'utensils'], // Entradas
      [2, 'bowl-food'], // Sopas  
      [3, 'leaf'], // Ensaladas
      [4, 'drumstick-bite'], // Carnes
      [5, 'fish'], // Pescados y Mariscos
      [6, 'wheat-awn'], // Pastas
      [7, 'pizza-slice'], // Pizzas
      [8, 'drumstick-bite'], // Pollo
      [9, 'seedling'], // Vegetarianos
      [10, 'cake-candles'], // Postres
      [11, 'glass-water'], // Bebidas
      [12, 'wine-glass']  // Vinos
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

    // 2. Actualizar íconos de subcategorías con Font Awesome
    console.log('Actualizando íconos de subcategorías a Font Awesome...');
    const subcategoryUpdates = [
      // Entradas
      [1, 'snowflake'], // Frías
      [2, 'fire'], // Calientes
      [3, 'leaf'], // Vegetarianas
      
      // Sopas
      [4, 'bowl-food'], // Caldos
      [5, 'bowl-hot'], // Cremas
      [6, 'globe'], // Internacionales
      
      // Platos Principales
      [7, 'cow'], // Carnes Rojas
      [8, 'drumstick-bite'], // Aves
      [9, 'fish'], // Pescados
      [10, 'shrimp'], // Mariscos
      [11, 'leaf'], // Vegetarianos
      
      // Pastas
      [12, 'wheat-awn'], // Pasta Fresca
      [13, 'bowl-rice'], // Risottos
      [14, 'circle'], // Gnocchi
      
      // Postres
      [15, 'cake-candles'], // Clásicos
      [16, 'ice-cream'], // Helados
      [17, 'star'], // Especiales
      
      // Bebidas
      [18, 'mug-hot'], // Calientes
      [19, 'glass-water'], // Frías
      [20, 'wine-glass']  // Alcohólicas
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

    console.log('✅ Íconos Font Awesome actualizados exitosamente!');

    // Mostrar estadísticas finales
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM categories WHERE icon IS NOT NULL AND icon != '') as categories_with_icons,
        (SELECT COUNT(*) FROM subcategories WHERE icon IS NOT NULL AND icon != '') as subcategories_with_icons
    `);
    
    console.log('\n📊 Estadísticas de íconos Font Awesome:');
    console.log(`   - Categorías con íconos FA: ${stats[0].categories_with_icons}`);
    console.log(`   - Subcategorías con íconos FA: ${stats[0].subcategories_with_icons}`);

    // Mostrar algunos ejemplos
    console.log('\n🎨 Ejemplos de íconos actualizados:');
    const [categories] = await connection.execute(`
      SELECT name, icon FROM categories 
      WHERE icon IS NOT NULL 
      ORDER BY sort_order 
      LIMIT 5
    `);
    
    categories.forEach(cat => {
      console.log(`   - ${cat.name}: fa-${cat.icon}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateFontAwesomeIcons();