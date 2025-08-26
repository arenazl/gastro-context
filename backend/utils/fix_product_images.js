const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

// URLs de imágenes reales de Unsplash para cada tipo de producto
const productImages = {
  // Entradas
  'Bruschetta Clásica': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=400&fit=crop',
  'Carpaccio de Res': 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop',
  'Ceviche Peruano': 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400&h=400&fit=crop',
  'Tabla de Quesos': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=400&fit=crop',
  'Empanadas Argentinas': 'https://images.unsplash.com/photo-1601924381523-019bbb3e3460?w=400&h=400&fit=crop',
  'Spring Rolls': 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&h=400&fit=crop',
  'Nachos con Queso': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&h=400&fit=crop',
  'Tartar de Salmón': 'https://images.unsplash.com/photo-1625944525333-8a32a4f5c8e5?w=400&h=400&fit=crop',
  'Hummus con Verduras': 'https://images.unsplash.com/photo-1547586650-8f60d8e4b6d2?w=400&h=400&fit=crop',
  'Calamares Fritos': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
  
  // Sopas
  'Sopa de Cebolla': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop',
  'Minestrone': 'https://images.unsplash.com/photo-1613844237701-8f3664fc2eff?w=400&h=400&fit=crop',
  'Sopa de Tomate': 'https://images.unsplash.com/photo-1629978445078-2cb10ba6e0c3?w=400&h=400&fit=crop',
  'Crema de Champiñones': 'https://images.unsplash.com/photo-1569058242252-623df46b5025?w=400&h=400&fit=crop',
  'Crema de Espárragos': 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=400&h=400&fit=crop',
  'Crema de Mariscos': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=400&fit=crop',
  'Sopa Tom Yum': 'https://images.unsplash.com/photo-1631992991577-13527e079df3?w=400&h=400&fit=crop',
  'Ramen Japonés': 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=400&fit=crop',
  'Pho Vietnamita': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=400&fit=crop',
  
  // Ensaladas
  'Caesar Salad': 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=400&fit=crop',
  'Greek Salad': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
  'Ensalada Caprese': 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=400&fit=crop',
  'Ensalada de Quinoa': 'https://images.unsplash.com/photo-1505576633757-0ac1084af824?w=400&h=400&fit=crop',
  'Ensalada Waldorf': 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&h=400&fit=crop',
  'Ensalada de Aguacate': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
  'Ensalada Niçoise': 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=400&h=400&fit=crop',
  'Ensalada de Salmón': 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400&h=400&fit=crop',
  'Ensalada Thai': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=400&fit=crop',
  
  // Carnes
  'Ribeye Steak': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
  'Filet Mignon': 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop',
  'Asado de Tira': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
  'Lomo Saltado': 'https://images.unsplash.com/photo-1625944525533-473f1a3c54e7?w=400&h=400&fit=crop',
  'Costillas BBQ': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop',
  'Chicken Parmesan': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=400&fit=crop',
  'Grilled Chicken': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=400&fit=crop',
  'Pollo a la Brasa': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=400&fit=crop',
  'Pato Confitado': 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=400&h=400&fit=crop',
  'Coq au Vin': 'https://images.unsplash.com/photo-1612871689142-6bacd6e5a20f?w=400&h=400&fit=crop',
  
  // Pescados y Mariscos
  'Grilled Salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
  'Fish and Chips': 'https://images.unsplash.com/photo-1580217593608-61931cefc821?w=400&h=400&fit=crop',
  'Paella de Mariscos': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=400&fit=crop',
  'Lubina a la Sal': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop',
  'Trucha al Limón': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=400&fit=crop',
  'Langostinos al Ajillo': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=400&fit=crop',
  'Pulpo a la Gallega': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=400&fit=crop',
  'Almejas Marineras': 'https://images.unsplash.com/photo-1612831197310-ff5cf7a211b6?w=400&h=400&fit=crop',
  'Zarzuela de Mariscos': 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=400&h=400&fit=crop',
  'Crab Cakes': 'https://images.unsplash.com/photo-1606525380527-fc7b7285ab77?w=400&h=400&fit=crop',
  
  // Postres
  'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
  'Cheesecake': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=400&fit=crop',
  'Crème Brûlée': 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=400&fit=crop',
  'Flan Casero': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=400&fit=crop',
  'Tarta de Chocolate': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
  'Helado Artesanal': 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400&h=400&fit=crop',
  'Sundae de Fresa': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
  'Banana Split': 'https://images.unsplash.com/photo-1514849302-984523450cf4?w=400&h=400&fit=crop',
  'Profiteroles': 'https://images.unsplash.com/photo-1595272838369-0d00a7bbbd8f?w=400&h=400&fit=crop',
  'Tarta de Limón': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
  'Brownie con Helado': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop',
  'Panna Cotta': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop'
};

// Imágenes genéricas por categoría para productos que no están en la lista
const categoryImages = {
  1: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&h=400&fit=crop', // Entradas
  2: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop', // Sopas
  3: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop', // Ensaladas
  4: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop', // Carnes
  5: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=400&fit=crop', // Pescados
  10: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop' // Postres
};

async function fixProductImages() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener todos los productos
    const [products] = await connection.execute('SELECT id, name, category_id FROM products');
    console.log(`Total de productos a actualizar: ${products.length}`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      // Buscar imagen específica para el producto
      let imageUrl = productImages[product.name];
      
      // Si no hay imagen específica, usar imagen de categoría
      if (!imageUrl) {
        imageUrl = categoryImages[product.category_id] || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=400&h=400&fit=crop';
      }
      
      // Actualizar la imagen en la base de datos
      await connection.execute(
        'UPDATE products SET image_url = ? WHERE id = ?',
        [imageUrl, product.id]
      );
      
      updatedCount++;
      console.log(`✅ ${updatedCount}/${products.length} - ${product.name}: ${imageUrl.substring(0, 50)}...`);
    }
    
    console.log(`\n✅ Se actualizaron ${updatedCount} productos con imágenes reales!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixProductImages();