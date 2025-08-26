const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function checkSubcategories() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar todas las subcategorías activas
    const [activeSubcategories] = await connection.execute(`
      SELECT 
        s.id,
        s.name,
        s.category_id,
        c.name as category_name,
        s.is_active,
        s.icon
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = TRUE
      ORDER BY s.category_id, s.sort_order
    `);
    
    console.log('\n📊 Subcategorías activas:');
    console.log('Total:', activeSubcategories.length);
    
    // Agrupar por categoría
    const byCategory = {};
    activeSubcategories.forEach(sub => {
      const catName = sub.category_name || `Category ${sub.category_id}`;
      if (!byCategory[catName]) {
        byCategory[catName] = [];
      }
      byCategory[catName].push(sub);
    });
    
    console.log('\n📋 Por categoría:');
    Object.entries(byCategory).forEach(([catName, subs]) => {
      console.log(`\n${catName}:`);
      subs.forEach(sub => {
        console.log(`  - ID ${sub.id}: ${sub.name} (category_id: ${sub.category_id})`);
      });
    });
    
    // Verificar categorías activas
    const [activeCategories] = await connection.execute(`
      SELECT id, name, is_active
      FROM categories
      WHERE is_active = TRUE
      ORDER BY sort_order
    `);
    
    console.log('\n📂 Categorías activas:');
    activeCategories.forEach(cat => {
      console.log(`  - ID ${cat.id}: ${cat.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSubcategories();