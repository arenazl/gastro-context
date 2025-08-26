#!/usr/bin/env node
/**
 * Crear categorías y subcategorías paso a paso
 */

const mysql = require('mysql2/promise');

async function createCategories() {
  try {
    const connection = await mysql.createConnection({
      host: 'mysql-aiven-arenazl.e.aivencloud.com',
      port: 23108,
      user: 'avnadmin', 
      password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
      database: 'gastro'
    });
    
    console.log('🔗 Conectado a MySQL');
    
    // 1. Crear tabla de categorías
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_active (is_active),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla categories creada');
    
    // 2. Crear tabla de subcategorías  
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        INDEX idx_category_id (category_id),
        INDEX idx_name (name),
        INDEX idx_active (is_active),
        INDEX idx_sort (sort_order),
        UNIQUE KEY unique_category_subcategory (category_id, name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla subcategories creada');
    
    // 3. Actualizar tabla products
    try {
      await connection.execute('ALTER TABLE products ADD COLUMN category_id INT');
      await connection.execute('ALTER TABLE products ADD COLUMN subcategory_id INT');
      await connection.execute('ALTER TABLE products ADD COLUMN image_filename VARCHAR(255)');
      await connection.execute('ALTER TABLE products ADD COLUMN image_alt_text VARCHAR(255)');
      console.log('✅ Columnas agregadas a products');
    } catch (error) {
      console.log('⚠️ Columnas ya existen en products');
    }
    
    // 4. Insertar categorías principales
    const categories = [
      ['Entradas', 'Aperitivos y platos de entrada', 'appetizer', '#10B981', 1],
      ['Sopas', 'Sopas calientes y frías', 'soup', '#F59E0B', 2], 
      ['Ensaladas', 'Ensaladas frescas y saludables', 'salad', '#22C55E', 3],
      ['Carnes', 'Platos principales de carne', 'meat', '#DC2626', 4],
      ['Pescados y Mariscos', 'Pescados frescos y mariscos', 'fish', '#0EA5E9', 5],
      ['Pastas', 'Pastas italianas y salsas', 'pasta', '#F97316', 6],
      ['Pizzas', 'Pizzas artesanales', 'pizza', '#EF4444', 7],
      ['Pollo', 'Platos de pollo preparados', 'chicken', '#FBBF24', 8],
      ['Vegetarianos', 'Opciones vegetarianas', 'vegetarian', '#22C55E', 9],
      ['Postres', 'Dulces y postres caseros', 'dessert', '#EC4899', 10],
      ['Bebidas', 'Bebidas frías y calientes', 'drink', '#3B82F6', 11],
      ['Vinos', 'Carta de vinos', 'wine', '#7C3AED', 12]
    ];
    
    for (const [name, description, icon, color, sort_order] of categories) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO categories (name, description, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)',
          [name, description, icon, color, sort_order]
        );
      } catch (error) {
        console.log(`⚠️ Categoría ${name} ya existe`);
      }
    }
    console.log('✅ Categorías insertadas');
    
    // 5. Verificar resultados
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [subcategoryCount] = await connection.execute('SELECT COUNT(*) as count FROM subcategories');
    
    console.log(`\n📊 Resultados:`);
    console.log(`   - ${categoryCount[0].count} categorías creadas`);
    console.log(`   - ${subcategoryCount[0].count} subcategorías creadas`);
    
    // Mostrar categorías
    const [categoriesList] = await connection.execute('SELECT name, color, icon FROM categories ORDER BY sort_order');
    console.log(`\n🏷️ Categorías disponibles:`);
    categoriesList.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.icon}) ${cat.color}`);
    });
    
    await connection.end();
    console.log('\n✨ Setup de categorías completado!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCategories();