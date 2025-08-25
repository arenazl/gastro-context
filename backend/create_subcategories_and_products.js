const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function createSubcategoriesAndProducts() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Crear tabla subcategories si no existe
    console.log('Creando tabla subcategories...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category_id INT NOT NULL,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        INDEX idx_category_id (category_id),
        INDEX idx_active_sort (is_active, sort_order)
      )
    `);

    // 2. Verificar subcategorías existentes
    console.log('Verificando subcategorías existentes...');
    const [existingSubcats] = await connection.execute('SELECT COUNT(*) as count FROM subcategories');
    console.log(`Subcategorías existentes: ${existingSubcats[0].count}`);

    // 3. Verificar si la columna subcategory_id existe, si no, agregarla
    console.log('Verificando tabla products...');
    try {
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN subcategory_id INT DEFAULT NULL,
        ADD FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
        ADD INDEX idx_subcategory_id (subcategory_id)
      `);
      console.log('Columna subcategory_id agregada exitosamente');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna subcategory_id ya existe');
      } else {
        throw error;
      }
    }

    // 4. Insertar muchos más productos con subcategorías
    console.log('Insertando productos con subcategorías...');
    const products = [
      // Entradas Frías (subcategory_id = 1)
      ['Carpaccio de Res', 'Láminas finas de res con rúcula y parmesano', 18.50, 1, 1, true, '/images/carpaccio.jpg'],
      ['Tabla de Quesos', 'Selección de quesos artesanales con nueces', 22.00, 1, 1, true, '/images/cheese-board.jpg'],
      ['Salmón Marinado', 'Salmón curado con eneldo y mostaza', 16.00, 1, 1, true, '/images/salmon.jpg'],
      ['Vitello Tonnato', 'Ternera con salsa de atún y alcaparras', 19.50, 1, 1, true, '/images/vitello.jpg'],
      ['Ensalada Caprese', 'Mozzarella, tomate y albahaca fresca', 14.00, 1, 1, true, '/images/caprese.jpg'],

      // Entradas Calientes (subcategory_id = 2)
      ['Empanadas Criollas', 'Empanadas de carne, pollo y verdura', 12.00, 1, 2, true, '/images/empanadas.jpg'],
      ['Provoleta a la Parrilla', 'Queso provolone grillado con oregano', 13.50, 1, 2, true, '/images/provoleta.jpg'],
      ['Hongos Rellenos', 'Portobello rellenos con espinaca y queso', 15.00, 1, 2, true, '/images/mushrooms.jpg'],
      ['Calamares Fritos', 'Aros de calamar con salsa tártara', 16.50, 1, 2, true, '/images/calamari.jpg'],
      ['Croquetas de Jamón', 'Croquetas caseras con jamón ibérico', 14.50, 1, 2, true, '/images/croquetas.jpg'],

      // Entradas Vegetarianas (subcategory_id = 3)
      ['Hummus con Pita', 'Hummus casero con pan pita tostado', 11.00, 1, 3, true, '/images/hummus.jpg'],
      ['Bruschetta Mixta', 'Tostadas con tomate, pesto y ricotta', 12.50, 1, 3, true, '/images/bruschetta.jpg'],
      ['Baba Ganoush', 'Crema de berenjena con tahini', 10.50, 1, 3, true, '/images/baba.jpg'],
      ['Antipasto Veggie', 'Verduras marinadas y queso de cabra', 15.50, 1, 3, true, '/images/antipasto.jpg'],
      ['Tarta de Verduras', 'Tarta de calabacín y pimientos', 13.00, 1, 3, true, '/images/veggie-tart.jpg'],

      // Caldos (subcategory_id = 4)
      ['Consomé de Pollo', 'Caldo claro con fideos y verduras', 8.50, 2, 4, true, '/images/consomme.jpg'],
      ['Caldo de Pescado', 'Caldo aromático con mariscos', 12.00, 2, 4, true, '/images/fish-broth.jpg'],
      ['Sopa Miso', 'Caldo japonés con tofu y algas', 9.50, 2, 4, true, '/images/miso.jpg'],
      ['Caldo Verde', 'Sopa portuguesa con chorizo', 11.00, 2, 4, true, '/images/caldo-verde.jpg'],
      ['Sopa de Cebolla', 'Caldo de cebolla con queso gratinado', 10.50, 2, 4, true, '/images/onion-soup.jpg'],

      // Cremas (subcategory_id = 5)
      ['Crema de Calabaza', 'Crema suave con semillas tostadas', 9.50, 2, 5, true, '/images/pumpkin-cream.jpg'],
      ['Crema de Espárragos', 'Crema verde con crema agria', 11.50, 2, 5, true, '/images/asparagus-cream.jpg'],
      ['Crema de Champiñones', 'Crema de hongos silvestres', 10.50, 2, 5, true, '/images/mushroom-cream.jpg'],
      ['Crema de Tomate', 'Crema clásica con albahaca fresca', 8.50, 2, 5, true, '/images/tomato-cream.jpg'],
      ['Crema de Brócoli', 'Crema nutritiva con queso azul', 10.00, 2, 5, true, '/images/broccoli-cream.jpg'],

      // Carnes Rojas (subcategory_id = 7)
      ['Bife de Chorizo', 'Corte premium a la parrilla', 28.00, 3, 7, true, '/images/ribeye.jpg'],
      ['Entraña Grillada', 'Entraña tierna con chimichurri', 24.00, 3, 7, true, '/images/skirt-steak.jpg'],
      ['Cordero Patagónico', 'Rack de cordero con hierbas', 32.00, 3, 7, true, '/images/lamb.jpg'],
      ['Lomo Wellington', 'Lomo en hojaldre con paté', 35.00, 3, 7, true, '/images/wellington.jpg'],
      ['Osso Buco', 'Osobuco braseado con risotto', 26.50, 3, 7, true, '/images/osso-buco.jpg'],

      // Aves (subcategory_id = 8)
      ['Pollo al Limón', 'Pechuga con salsa de limón y tomillo', 19.50, 3, 8, true, '/images/lemon-chicken.jpg'],
      ['Pato Confitado', 'Pato con salsa de naranja', 28.00, 3, 8, true, '/images/duck.jpg'],
      ['Pollo Tikka Masala', 'Pollo en salsa especiada', 21.00, 3, 8, true, '/images/tikka.jpg'],
      ['Suprema Maryland', 'Pechuga empanizada con jamón', 22.50, 3, 8, true, '/images/maryland.jpg'],
      ['Pollo Thai', 'Pollo al curry con leche de coco', 20.00, 3, 8, true, '/images/thai-chicken.jpg'],

      // Postres Clásicos (subcategory_id = 14)
      ['Tiramisú', 'Postre italiano con café y mascarpone', 12.00, 5, 14, true, '/images/tiramisu.jpg'],
      ['Flan Casero', 'Flan de vainilla con dulce de leche', 8.50, 5, 14, true, '/images/flan.jpg'],
      ['Cheesecake', 'Tarta de queso con frutos rojos', 11.50, 5, 14, true, '/images/cheesecake.jpg'],
      ['Brownie', 'Brownie de chocolate con helado', 10.00, 5, 14, true, '/images/brownie.jpg'],
      ['Panacotta', 'Panacotta de vainilla con coulis', 9.50, 5, 14, true, '/images/panacotta.jpg']
    ];

    for (const [name, description, price, category_id, subcategory_id, available, image_url] of products) {
      await connection.execute(
        'INSERT INTO products (name, description, price, category_id, subcategory_id, available, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, category_id, subcategory_id, available, image_url]
      );
    }

    console.log('✅ Subcategorías y productos creados exitosamente!');
    console.log(`📊 Total productos nuevos: ${products.length}`);

    // Mostrar resumen por categoría
    const [categoryStats] = await connection.execute(`
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT s.id) as subcategories_count,
        COUNT(p.id) as products_count
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      LEFT JOIN products p ON s.id = p.subcategory_id
      GROUP BY c.id, c.name
      ORDER BY c.sort_order
    `);
    
    console.log('\n📈 Resumen por categoría:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category_name}: ${stat.subcategories_count} subcategorías, ${stat.products_count} productos`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ La columna subcategory_id ya existe en la tabla products');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSubcategoriesAndProducts();