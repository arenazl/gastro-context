const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function addIconColumns() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Agregar columna icon a subcategories
    console.log('Agregando columna icon a subcategories...');
    try {
      await connection.execute(`
        ALTER TABLE subcategories 
        ADD COLUMN icon VARCHAR(10) DEFAULT NULL
      `);
      console.log('✅ Columna icon agregada a subcategories');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ La columna icon ya existe en subcategories');
      } else {
        throw error;
      }
    }

    // 2. Agregar columna icon a categories si no existe
    console.log('Verificando columna icon en categories...');
    try {
      await connection.execute(`
        ALTER TABLE categories 
        ADD COLUMN icon VARCHAR(10) DEFAULT NULL
      `);
      console.log('✅ Columna icon agregada a categories');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ La columna icon ya existe en categories');
      } else {
        throw error;
      }
    }

    // 3. Actualizar íconos de subcategorías
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

    console.log('✅ Columnas de íconos actualizadas exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addIconColumns();