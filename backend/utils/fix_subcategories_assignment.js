const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function fixSubcategoriesAssignment() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Primero, desactivar todas las subcategorías
    console.log('Desactivando todas las subcategorías...');
    await connection.execute('UPDATE subcategories SET is_active = FALSE');
    
    // Corregir las asignaciones de category_id
    console.log('Corrigiendo asignaciones de subcategorías...');
    
    // Las subcategorías 7-11 son de "Platos Principales" (category_id = 3 en subcategories original)
    // pero necesitamos redistribuirlas para nuestras categorías activas
    
    const corrections = [
      // Entradas (ID 1) - Ya correctas
      [1, 1, 'Frías'],
      [2, 1, 'Calientes'],
      [3, 1, 'Vegetarianas'],
      
      // Sopas (ID 2) - Ya correctas
      [4, 2, 'Caldos'],
      [5, 2, 'Cremas'],
      [6, 2, 'Internacionales'],
      
      // Para Ensaladas (ID 3) - Crear nuevas subcategorías apropiadas
      // Usaremos algunas de las subcategorías existentes pero las reasignaremos
      
      // Para Carnes (ID 4) - Usar las subcategorías 7 y 8
      [7, 4, 'Carnes Rojas'],
      [8, 4, 'Aves'],
      
      // Para Pescados y Mariscos (ID 5) - Usar las subcategorías 9 y 10
      [9, 5, 'Pescados'],
      [10, 5, 'Mariscos'],
      
      // Para Postres (ID 10) - Usar las subcategorías 15, 16, 17
      [15, 10, 'Clásicos'],
      [16, 10, 'Helados'],
      [17, 10, 'Especiales']
    ];
    
    for (const [subId, newCategoryId, name] of corrections) {
      try {
        await connection.execute(
          'UPDATE subcategories SET category_id = ?, is_active = TRUE WHERE id = ?',
          [newCategoryId, subId]
        );
        console.log(`✅ Subcategoría "${name}" (ID ${subId}) asignada a category_id ${newCategoryId}`);
      } catch (error) {
        console.log(`⚠️ Error actualizando subcategoría ${subId}: ${error.message}`);
      }
    }
    
    // Para Ensaladas, vamos a crear subcategorías nuevas si no existen
    console.log('\nCreando subcategorías para Ensaladas...');
    const ensaladasSubcategories = [
      ['Verdes', 'Ensaladas de hojas verdes', 'leaf'],
      ['Mixtas', 'Ensaladas con variedad de ingredientes', 'bowl-food'],
      ['Gourmet', 'Ensaladas especiales', 'star']
    ];
    
    for (const [name, description, icon] of ensaladasSubcategories) {
      try {
        // Verificar si ya existe
        const [existing] = await connection.execute(
          'SELECT id FROM subcategories WHERE name = ? AND category_id = 3',
          [name]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO subcategories (name, description, category_id, icon, is_active) VALUES (?, ?, ?, ?, TRUE)',
            [name, description, 3, icon]
          );
          console.log(`✅ Creada subcategoría "${name}" para Ensaladas`);
        } else {
          await connection.execute(
            'UPDATE subcategories SET is_active = TRUE WHERE id = ?',
            [existing[0].id]
          );
          console.log(`✅ Activada subcategoría existente "${name}" para Ensaladas`);
        }
      } catch (error) {
        console.log(`⚠️ Error con subcategoría ${name}: ${error.message}`);
      }
    }
    
    // Verificar el resultado final
    console.log('\n📊 Verificando resultado final:');
    
    const [finalResult] = await connection.execute(`
      SELECT 
        c.name as category_name,
        COUNT(s.id) as subcategory_count,
        GROUP_CONCAT(s.name ORDER BY s.sort_order SEPARATOR ', ') as subcategories
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id AND s.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.id, c.name
      ORDER BY c.sort_order
    `);
    
    console.log('\n✅ Subcategorías por categoría activa:');
    finalResult.forEach(row => {
      console.log(`\n${row.category_name}: (${row.subcategory_count} subcategorías)`);
      if (row.subcategories) {
        console.log(`  ${row.subcategories}`);
      } else {
        console.log('  (Sin subcategorías)');
      }
    });
    
    console.log('\n✅ Asignaciones corregidas exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixSubcategoriesAssignment();