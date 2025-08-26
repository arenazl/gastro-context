const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function fixFontAwesomeIcons() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Actualizar íconos que no existen en Font Awesome Free
    console.log('Actualizando íconos a versiones compatibles con Font Awesome Free...');
    
    const iconFixes = [
      // Subcategorías
      ['subcategories', 5, 'mug-hot'], // Cremas - cambiar de bowl-hot a mug-hot
      ['subcategories', 8, 'egg'], // Aves - cambiar de chicken a egg
      ['subcategories', 19, 'glasses'], // Bebidas frías - cambiar de glass a glasses
      ['subcategories', 15, 'cookie'] // Postres clásicos - mantener cookie
    ];

    for (const [table, id, newIcon] of iconFixes) {
      try {
        await connection.execute(
          `UPDATE ${table} SET icon = ? WHERE id = ?`,
          [newIcon, id]
        );
        console.log(`✅ ${table} ID ${id} actualizada con ícono: ${newIcon}`);
      } catch (error) {
        console.log(`⚠️ Error actualizando ${table} ${id}: ${error.message}`);
      }
    }

    // Verificar todos los íconos actuales
    console.log('\n📊 Verificando íconos actuales:');
    
    const [categories] = await connection.execute(`
      SELECT id, name, icon 
      FROM categories 
      WHERE is_active = TRUE 
      ORDER BY sort_order
    `);
    
    console.log('\n✅ Categorías activas:');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name}: fa-${cat.icon}`);
    });

    const [subcategories] = await connection.execute(`
      SELECT id, name, icon 
      FROM subcategories 
      WHERE is_active = TRUE 
      ORDER BY id
    `);
    
    console.log('\n✅ Subcategorías activas:');
    subcategories.forEach(subcat => {
      console.log(`  ${subcat.id}. ${subcat.name}: fa-${subcat.icon}`);
    });

    console.log('\n✅ Íconos corregidos para compatibilidad con Font Awesome Free!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixFontAwesomeIcons();