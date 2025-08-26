const mysql = require('mysql2/promise');

// Configuración de conexión a la base de datos Aiven
const dbConfig = {
  host: 'mysql-aiven-arenazl.e.aivencloud.com',
  port: 23108,
  user: 'avnadmin',
  password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
  database: 'gastro'
};

async function fixImageFormat() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener todas las URLs de imágenes actuales
    const [products] = await connection.execute('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL');
    console.log(`Total de productos con imágenes: ${products.length}`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      let newUrl = product.image_url;
      
      // Si la URL es de Unsplash, asegurarse de que use el formato correcto
      if (newUrl && newUrl.includes('unsplash.com')) {
        // Extraer el ID de la foto si está en el formato antiguo
        const match = newUrl.match(/photo-([a-zA-Z0-9_-]+)/);
        if (match) {
          const photoId = match[1];
          // Usar el formato de API directo de Unsplash que no requiere autenticación
          newUrl = `https://source.unsplash.com/${photoId}/400x400`;
        }
      }
      
      // Actualizar solo si la URL cambió
      if (newUrl !== product.image_url) {
        await connection.execute(
          'UPDATE products SET image_url = ? WHERE id = ?',
          [newUrl, product.id]
        );
        updatedCount++;
        console.log(`✅ ${product.name}: ${newUrl}`);
      }
    }
    
    console.log(`\n✅ Se actualizaron ${updatedCount} URLs de imágenes!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixImageFormat();