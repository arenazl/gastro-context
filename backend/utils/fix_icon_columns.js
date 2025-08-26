const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function fixIconColumns() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Expandir columna icon en categorías
    console.log('Expandiendo columna icon en categories...');
    try {
      await connection.execute(`
        ALTER TABLE categories 
        MODIFY COLUMN icon VARCHAR(50) DEFAULT NULL
      `);
      console.log('✅ Columna icon expandida en categories');
    } catch (error) {
      console.log(`⚠️ Error expandiendo columna: ${error.message}`);
    }

    // 2. Expandir columna icon en subcategorías
    console.log('Expandiendo columna icon en subcategories...');
    try {
      await connection.execute(`
        ALTER TABLE subcategories 
        MODIFY COLUMN icon VARCHAR(50) DEFAULT NULL
      `);
      console.log('✅ Columna icon expandida en subcategories');
    } catch (error) {
      console.log(`⚠️ Error expandiendo columna: ${error.message}`);
    }

    // 3. Actualizar los íconos que fallaron con nombres más cortos
    console.log('Actualizando íconos con nombres más cortos...');
    const fixUpdates = [
      // Subcategorías que fallaron
      [8, 'chicken'], // Aves (más corto que drumstick-bite)
      [15, 'cookie'], // Postres clásicos (más corto que cake-candles)
      [19, 'glass'] // Bebidas frías (más corto que glass-water)
    ];

    for (const [id, icon] of fixUpdates) {
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

    console.log('✅ Columnas de íconos corregidas exitosamente!');

    // Verificar que todos tengan íconos
    const [results] = await connection.execute(`
      SELECT 
        'categories' as table_name,
        COUNT(*) as total,
        COUNT(CASE WHEN icon IS NOT NULL AND icon != '' THEN 1 END) as with_icons
      FROM categories
      UNION ALL
      SELECT 
        'subcategories' as table_name,
        COUNT(*) as total,
        COUNT(CASE WHEN icon IS NOT NULL AND icon != '' THEN 1 END) as with_icons
      FROM subcategories
    `);

    console.log('\n📊 Verificación final:');
    results.forEach(result => {
      console.log(`   - ${result.table_name}: ${result.with_icons}/${result.total} con íconos`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixIconColumns();