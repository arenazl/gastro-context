const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

// URLs estáticas de imágenes de comida desde Pexels (CDN confiable)
const productImages = {
  // Entradas
  'Bruschetta Clásica': 'https://images.pexels.com/photos/1893557/pexels-photo-1893557.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Carpaccio de Res': 'https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ceviche Peruano': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Tabla de Quesos': 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Empanadas Argentinas': 'https://images.pexels.com/photos/5602503/pexels-photo-5602503.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Spring Rolls': 'https://images.pexels.com/photos/3622476/pexels-photo-3622476.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Nachos con Queso': 'https://images.pexels.com/photos/5695882/pexels-photo-5695882.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Tartar de Salmón': 'https://images.pexels.com/photos/3763816/pexels-photo-3763816.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Hummus con Verduras': 'https://images.pexels.com/photos/6275169/pexels-photo-6275169.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Calamares Fritos': 'https://images.pexels.com/photos/7613568/pexels-photo-7613568.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  
  // Sopas
  'Sopa de Cebolla': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Minestrone': 'https://images.pexels.com/photos/1707270/pexels-photo-1707270.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Sopa de Tomate': 'https://images.pexels.com/photos/2403391/pexels-photo-2403391.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Crema de Champiñones': 'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Crema de Espárragos': 'https://images.pexels.com/photos/6294361/pexels-photo-6294361.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Crema de Mariscos': 'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Sopa Tom Yum': 'https://images.pexels.com/photos/3662136/pexels-photo-3662136.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ramen Japonés': 'https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Pho Vietnamita': 'https://images.pexels.com/photos/2703468/pexels-photo-2703468.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  
  // Ensaladas
  'Caesar Salad': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Greek Salad': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada Caprese': 'https://images.pexels.com/photos/3850838/pexels-photo-3850838.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada de Quinoa': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada Waldorf': 'https://images.pexels.com/photos/2862154/pexels-photo-2862154.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada de Aguacate': 'https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada Niçoise': 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada de Salmón': 'https://images.pexels.com/photos/3763847/pexels-photo-3763847.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Ensalada Thai': 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  
  // Carnes
  'Ribeye Steak': 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Filet Mignon': 'https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Asado de Tira': 'https://images.pexels.com/photos/4253302/pexels-photo-4253302.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Lomo Saltado': 'https://images.pexels.com/photos/7474268/pexels-photo-7474268.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Costillas BBQ': 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Chicken Parmesan': 'https://images.pexels.com/photos/5639968/pexels-photo-5639968.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Grilled Chicken': 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Pollo a la Brasa': 'https://images.pexels.com/photos/6210747/pexels-photo-6210747.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Pato Confitado': 'https://images.pexels.com/photos/6544376/pexels-photo-6544376.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Coq au Vin': 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  
  // Pescados y Mariscos
  'Grilled Salmon': 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Fish and Chips': 'https://images.pexels.com/photos/3843224/pexels-photo-3843224.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Paella de Mariscos': 'https://images.pexels.com/photos/16041207/pexels-photo-16041207.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Lubina a la Sal': 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Trucha al Limón': 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Langostinos al Ajillo': 'https://images.pexels.com/photos/3640451/pexels-photo-3640451.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Pulpo a la Gallega': 'https://images.pexels.com/photos/6270541/pexels-photo-6270541.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Almejas Marineras': 'https://images.pexels.com/photos/6316552/pexels-photo-6316552.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Zarzuela de Mariscos': 'https://images.pexels.com/photos/14758870/pexels-photo-14758870.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Crab Cakes': 'https://images.pexels.com/photos/5409020/pexels-photo-5409020.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  
  // Postres
  'Tiramisu': 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Cheesecake': 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Crème Brûlée': 'https://images.pexels.com/photos/4686956/pexels-photo-4686956.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Flan Casero': 'https://images.pexels.com/photos/5623183/pexels-photo-5623183.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Tarta de Chocolate': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Helado Artesanal': 'https://images.pexels.com/photos/1352296/pexels-photo-1352296.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Sundae de Fresa': 'https://images.pexels.com/photos/1332267/pexels-photo-1332267.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Banana Split': 'https://images.pexels.com/photos/5061193/pexels-photo-5061193.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Profiteroles': 'https://images.pexels.com/photos/6479548/pexels-photo-6479548.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Tarta de Limón': 'https://images.pexels.com/photos/1343504/pexels-photo-1343504.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Brownie con Helado': 'https://images.pexels.com/photos/887853/pexels-photo-887853.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  'Panna Cotta': 'https://images.pexels.com/photos/3026810/pexels-photo-3026810.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
};

// Imágenes genéricas por categoría para productos que no están en la lista
const categoryImages = {
  1: 'https://images.pexels.com/photos/604969/pexels-photo-604969.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', // Entradas
  2: 'https://images.pexels.com/photos/1707270/pexels-photo-1707270.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', // Sopas
  3: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', // Ensaladas
  4: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', // Carnes
  5: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', // Pescados
  10: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1' // Postres
};

async function useStaticImages() {
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
        imageUrl = categoryImages[product.category_id] || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1';
      }
      
      // Actualizar la imagen en la base de datos
      await connection.execute(
        'UPDATE products SET image_url = ? WHERE id = ?',
        [imageUrl, product.id]
      );
      
      updatedCount++;
      console.log(`✅ ${updatedCount}/${products.length} - ${product.name}`);
    }
    
    console.log(`\n✅ Se actualizaron ${updatedCount} productos con imágenes de Pexels!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

useStaticImages();