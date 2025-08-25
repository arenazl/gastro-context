const http = require('http');
const mysql = require('mysql2/promise');
const url = require('url');

const PORT = 8004;

// Pool de conexiones para máximo rendimiento
let pool;

async function createPool() {
  pool = mysql.createPool({
    host: 'mysql-aiven-arenazl.e.aivencloud.com',
    port: 23108,
    user: 'avnadmin',
    password: 'AVNS_Fqe0qsChCHnqSnVsvoi',
    database: 'gastro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('✅ Pool de conexiones MySQL creado');
}

// Crear servidor HTTP
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  try {
    // Categorías
    if (pathname === '/api/categories') {
      const [rows] = await pool.execute(
        'SELECT id, name, icon, color FROM categories WHERE is_active = TRUE ORDER BY sort_order'
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    }
    // Subcategorías
    else if (pathname === '/api/subcategories') {
      let sql = 'SELECT id, name, category_id, icon FROM subcategories WHERE is_active = TRUE ORDER BY sort_order';
      let params = [];
      
      if (query.category_id) {
        sql = 'SELECT id, name, category_id, icon FROM subcategories WHERE category_id = ? AND is_active = TRUE ORDER BY sort_order';
        params = [query.category_id];
      }
      
      const [rows] = await pool.execute(sql, params);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ subcategories: rows }));
    }
    // Productos
    else if (pathname === '/api/products') {
      let sql = `
        SELECT 
          id, name, description, 
          CAST(price AS DECIMAL(10,2)) as price,
          category_id, subcategory_id, image_url, available
        FROM products 
        WHERE available = TRUE 
        ORDER BY category_id, name
      `;
      let params = [];
      
      if (query.category_id) {
        sql = `
          SELECT 
            id, name, description,
            CAST(price AS DECIMAL(10,2)) as price,
            category_id, subcategory_id, image_url, available
          FROM products 
          WHERE category_id = ? AND available = TRUE 
          ORDER BY name
        `;
        params = [query.category_id];
      }
      
      const [rows] = await pool.execute(sql, params);
      
      // Convertir price a número
      const products = rows.map(row => ({
        ...row,
        price: parseFloat(row.price)
      }));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(products));
    }
    // Mesas
    else if (pathname === '/api/tables') {
      const [rows] = await pool.execute(
        'SELECT id, number, capacity, status, location FROM tables WHERE is_active = TRUE ORDER BY number'
      );
      
      // Si no hay mesas, crear algunas
      if (rows.length === 0) {
        const tables = [];
        for (let i = 1; i <= 10; i++) {
          await pool.execute(
            'INSERT INTO tables (number, capacity, status, location, is_active) VALUES (?, ?, ?, ?, ?)',
            [i, 4, 'available', 'Main Hall', true]
          );
          tables.push({
            id: i,
            number: i,
            capacity: 4,
            status: 'available',
            location: 'Main Hall'
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tables));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows));
      }
    }
    // Clientes
    else if (pathname === '/api/customers') {
      const search = query.search || '';
      let sql = `
        SELECT 
          id,
          CONCAT(first_name, ' ', last_name) as name,
          first_name, last_name, email, phone,
          IFNULL(loyalty_points, 0) as loyalty_points
        FROM customers 
        WHERE is_active = TRUE
      `;
      let params = [];
      
      if (search && search.length >= 2) {
        sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
      }
      
      sql += ' ORDER BY loyalty_points DESC LIMIT 10';
      
      const [rows] = await pool.execute(sql, params);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
    }
    // Kitchen orders
    else if (pathname === '/api/orders/kitchen') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
    }
    // User info
    else if (pathname === '/api/users/me') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 1,
        email: 'admin@restaurant.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      }));
    }
    // Login
    else if (pathname === '/api/auth/login' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        access_token: 'fast_jwt_token',
        user: {
          id: 1,
          email: 'admin@restaurant.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        }
      }));
    }
    // Logout
    else if (pathname === '/api/auth/logout' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    }
    // Create order
    else if (pathname === '/api/orders' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        const orderData = JSON.parse(body);
        
        // Insertar orden
        const [result] = await pool.execute(
          `INSERT INTO orders (
            table_number, customer_id, waiter_id, 
            subtotal, tax, total, notes, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderData.table_number || 1,
            orderData.customer_id || null,
            1,
            orderData.subtotal || 0,
            orderData.tax || 0,
            orderData.total || 0,
            orderData.notes || '',
            'pending'
          ]
        );
        
        const orderId = result.insertId;
        
        // Insertar items
        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            await pool.execute(
              'INSERT INTO order_items (order_id, product_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)',
              [orderId, item.product_id, item.quantity, item.price, item.notes || '']
            );
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: orderId,
          status: 'created',
          message: 'Orden creada exitosamente'
        }));
      });
    }
    // Health check
    else if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', fast: true }));
    }
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Iniciar servidor
async function start() {
  console.log('⚡ Servidor MySQL ULTRARRÁPIDO');
  console.log('=' .repeat(50));
  
  await createPool();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('💾 Conexión MySQL con pool (súper rápido)');
    console.log('⚡ Respuestas en milisegundos');
  });
}

start().catch(console.error);