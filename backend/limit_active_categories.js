const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function limitActiveCategories() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Primero, desactivar todas las categorías
    console.log('Desactivando todas las categorías...');
    await connection.execute('UPDATE categories SET is_active = FALSE');
    
    // 2. Activar solo las primeras 6 categorías más importantes
    console.log('Activando solo 6 categorías principales...');
    const activeCategories = [1, 2, 3, 4, 5, 10]; // Entradas, Sopas, Ensaladas, Carnes, Pescados, Postres
    
    for (const categoryId of activeCategories) {
      await connection.execute(
        'UPDATE categories SET is_active = TRUE WHERE id = ?',
        [categoryId]
      );
      const [category] = await connection.execute(
        'SELECT name FROM categories WHERE id = ?',
        [categoryId]
      );
      console.log(`✅ Categoría activada: ${category[0].name}`);
    }
    
    // 3. Desactivar todas las subcategorías
    console.log('\nDesactivando todas las subcategorías...');
    await connection.execute('UPDATE subcategories SET is_active = FALSE');
    
    // 4. Activar solo 4 subcategorías por cada categoría activa
    console.log('Activando 4 subcategorías por categoría...');
    
    const subcategoriesConfig = {
      1: [1, 2, 3], // Entradas: Frías, Calientes, Vegetarianas (solo 3 disponibles)
      2: [4, 5, 6], // Sopas: Caldos, Cremas, Internacionales (solo 3 disponibles)
      3: [], // Ensaladas: no tiene subcategorías en el sistema actual
      4: [], // Carnes: no tiene subcategorías directas (están en id 3 - Platos principales)
      5: [], // Pescados: no tiene subcategorías directas
      10: [15, 16, 17] // Postres: Clásicos, Helados, Especiales (solo 3 disponibles)
    };
    
    // Para categorías sin subcategorías directas, vamos a usar las de Platos Principales
    // Activar subcategorías de Platos Principales para Carnes y Pescados
    const platosSubcategories = {
      3: [7, 8], // Para Carnes: Carnes Rojas, Aves
      5: [9, 10] // Para Pescados: Pescados, Mariscos
    };
    
    for (const [categoryId, subcategoryIds] of Object.entries(subcategoriesConfig)) {
      if (subcategoryIds.length > 0) {
        for (const subcatId of subcategoryIds) {
          await connection.execute(
            'UPDATE subcategories SET is_active = TRUE WHERE id = ?',
            [subcatId]
          );
          const [subcat] = await connection.execute(
            'SELECT name, category_id FROM subcategories WHERE id = ?',
            [subcatId]
          );
          if (subcat.length > 0) {
            console.log(`  ✅ Subcategoría activada: ${subcat[0].name} (Cat ID: ${subcat[0].category_id})`);
          }
        }
      }
    }
    
    // Activar las subcategorías de Platos Principales que corresponden a Carnes y Pescados
    for (const [categoryId, subcategoryIds] of Object.entries(platosSubcategories)) {
      for (const subcatId of subcategoryIds) {
        await connection.execute(
          'UPDATE subcategories SET is_active = TRUE WHERE id = ?',
          [subcatId]
        );
        const [subcat] = await connection.execute(
          'SELECT name FROM subcategories WHERE id = ?',
          [subcatId]
        );
        if (subcat.length > 0) {
          console.log(`  ✅ Subcategoría activada: ${subcat[0].name}`);
        }
      }
    }
    
    // 5. Verificar el estado final
    console.log('\n📊 Estado final del sistema:');
    
    const [categoriesStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active
      FROM categories
    `);
    console.log(`Categorías: ${categoriesStats[0].active} activas de ${categoriesStats[0].total} totales`);
    
    const [subcategoriesStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active
      FROM subcategories
    `);
    console.log(`Subcategorías: ${subcategoriesStats[0].active} activas de ${subcategoriesStats[0].total} totales`);
    
    // 6. Mostrar las categorías activas con sus subcategorías
    console.log('\n🎯 Categorías activas con subcategorías:');
    const [activeCategs] = await connection.execute(`
      SELECT c.id, c.name, c.icon,
        (SELECT COUNT(*) FROM subcategories s 
         WHERE s.category_id = c.id AND s.is_active = TRUE) as active_subcategories
      FROM categories c
      WHERE c.is_active = TRUE
      ORDER BY c.sort_order
    `);
    
    for (const cat of activeCategs) {
      console.log(`\n${cat.icon} ${cat.name}:`);
      
      const [subcats] = await connection.execute(`
        SELECT name, icon 
        FROM subcategories 
        WHERE category_id = ? AND is_active = TRUE
        ORDER BY sort_order
        LIMIT 4
      `, [cat.id]);
      
      if (subcats.length > 0) {
        subcats.forEach(subcat => {
          console.log(`  - ${subcat.icon} ${subcat.name}`);
        });
      } else {
        // Buscar subcategorías relacionadas (caso de Carnes y Pescados)
        if (cat.id === 4) { // Carnes
          const [relatedSubcats] = await connection.execute(`
            SELECT name, icon FROM subcategories 
            WHERE id IN (7, 8) AND is_active = TRUE
          `);
          relatedSubcats.forEach(subcat => {
            console.log(`  - ${subcat.icon} ${subcat.name}`);
          });
        } else if (cat.id === 5) { // Pescados
          const [relatedSubcats] = await connection.execute(`
            SELECT name, icon FROM subcategories 
            WHERE id IN (9, 10) AND is_active = TRUE
          `);
          relatedSubcats.forEach(subcat => {
            console.log(`  - ${subcat.icon} ${subcat.name}`);
          });
        } else {
          console.log('  (Sin subcategorías)');
        }
      }
    }
    
    console.log('\n✅ Configuración completada exitosamente!');
    console.log('📌 Solo 6 categorías activas y máximo 4 subcategorías por categoría');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

limitActiveCategories();