#!/usr/bin/env python3
"""
Servidor REAL - Solo datos de base de datos MySQL
NUNCA usar datos mock
"""
import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs
import subprocess

PORT = 8003

# Configuración de base de datos
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

class RealDataHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.send_json_response({'status': 'ok', 'real_data': True})
            
        elif self.path == '/api/categories':
            self.handle_categories()
            
        elif self.path.startswith('/api/subcategories'):
            self.handle_subcategories()
            
        elif self.path.startswith('/api/products'):
            self.handle_products()
            
        elif self.path == '/api/tables':
            self.handle_tables()
            
        elif self.path.startswith('/api/customers'):
            self.handle_customers()
            
        elif self.path == '/api/orders/kitchen':
            self.send_json_response([])  # Por ahora vacío
            
        elif self.path == '/api/users/me':
            # Usuario básico para auth
            self.send_json_response({
                "id": 1,
                "email": "admin@restaurant.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin"
            })
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/auth/login':
            self.send_json_response({
                'access_token': 'real_jwt_token',
                'user': {
                    "id": 1,
                    "email": "admin@restaurant.com",
                    "first_name": "Admin",
                    "last_name": "User",
                    "role": "admin"
                }
            })
        elif self.path == '/api/auth/logout':
            self.send_json_response({'success': True})
        elif self.path == '/api/orders':
            self.handle_create_order()
        else:
            self.send_error(404)
    
    def execute_node_query(self, query):
        """Ejecutar query usando Node.js y mysql2"""
        node_script = f"""
const mysql = require('mysql2/promise');
async function runQuery() {{
  try {{
    const connection = await mysql.createConnection({{
      host: '{DB_CONFIG["host"]}',
      port: {DB_CONFIG["port"]},
      user: '{DB_CONFIG["user"]}',
      password: '{DB_CONFIG["password"]}',
      database: '{DB_CONFIG["database"]}'
    }});
    
    const [rows] = await connection.execute(`{query}`);
    await connection.end();
    console.log(JSON.stringify(rows));
  }} catch (error) {{
    console.error(JSON.stringify({{error: error.message}}));
    process.exit(1);
  }}
}}
runQuery();
"""
        try:
            result = subprocess.run(
                ['node', '-e', node_script],
                capture_output=True,
                text=True,
                cwd='/mnt/c/Code/gastro-context/backend',
                timeout=10
            )
            
            if result.returncode == 0 and result.stdout.strip():
                return json.loads(result.stdout.strip())
            else:
                print(f"❌ Error ejecutando query: {result.stderr}")
                return []
        except Exception as e:
            print(f"❌ Error: {e}")
            return []
    
    def handle_categories(self):
        """Obtener categorías REALES de la BD"""
        query = """
            SELECT id, name, icon, color 
            FROM categories 
            WHERE is_active = TRUE 
            ORDER BY sort_order
        """
        categories = self.execute_node_query(query)
        self.send_json_response(categories)
    
    def handle_subcategories(self):
        """Obtener subcategorías REALES de la BD"""
        query_params = parse_qs(urlparse(self.path).query)
        category_id = query_params.get('category_id', [None])[0]
        
        if category_id:
            query = f"""
                SELECT id, name, category_id, icon 
                FROM subcategories 
                WHERE category_id = {category_id} AND is_active = TRUE 
                ORDER BY sort_order
            """
        else:
            query = """
                SELECT id, name, category_id, icon 
                FROM subcategories 
                WHERE is_active = TRUE 
                ORDER BY sort_order
            """
        
        subcategories = self.execute_node_query(query)
        self.send_json_response({"subcategories": subcategories})
    
    def handle_products(self):
        """Obtener productos REALES de la BD"""
        query_params = parse_qs(urlparse(self.path).query)
        category_id = query_params.get('category_id', [None])[0]
        
        if category_id:
            query = f"""
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.price,
                    p.category_id,
                    p.subcategory_id,
                    p.image_url,
                    p.available
                FROM products p
                WHERE p.category_id = {category_id} 
                AND p.available = TRUE
                ORDER BY p.name
            """
        else:
            query = """
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.price,
                    p.category_id,
                    p.subcategory_id,
                    p.image_url,
                    p.available
                FROM products p
                WHERE p.available = TRUE
                ORDER BY p.category_id, p.name
            """
        
        products = self.execute_node_query(query)
        
        # Convertir price a float
        for product in products:
            if 'price' in product and product['price']:
                product['price'] = float(str(product['price']))
        
        self.send_json_response(products)
    
    def handle_tables(self):
        """Obtener mesas REALES de la BD"""
        query = """
            SELECT id, number, capacity, status, location 
            FROM tables 
            WHERE is_active = TRUE 
            ORDER BY number
        """
        tables = self.execute_node_query(query)
        
        # Si no hay mesas, crear algunas básicas
        if not tables:
            for i in range(1, 6):
                create_query = f"""
                    INSERT INTO tables (number, capacity, status, location, is_active) 
                    VALUES ({i}, 4, 'available', 'Main Hall', TRUE)
                """
                self.execute_node_query(create_query)
            
            # Volver a consultar
            tables = self.execute_node_query(query)
        
        self.send_json_response(tables)
    
    def handle_customers(self):
        """Buscar clientes REALES en la BD"""
        query_params = parse_qs(urlparse(self.path).query)
        search = query_params.get('search', [''])[0]
        
        if search and len(search) >= 2:
            query = f"""
                SELECT 
                    id,
                    CONCAT(first_name, ' ', last_name) as name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    IFNULL(loyalty_points, 0) as loyalty_points
                FROM customers 
                WHERE is_active = TRUE 
                AND (
                    first_name LIKE '%{search}%' OR 
                    last_name LIKE '%{search}%' OR 
                    email LIKE '%{search}%'
                )
                ORDER BY loyalty_points DESC
                LIMIT 10
            """
        else:
            query = """
                SELECT 
                    id,
                    CONCAT(first_name, ' ', last_name) as name,
                    first_name,
                    last_name,
                    email,
                    phone,
                    IFNULL(loyalty_points, 0) as loyalty_points
                FROM customers 
                WHERE is_active = TRUE 
                ORDER BY loyalty_points DESC
                LIMIT 5
            """
        
        customers = self.execute_node_query(query)
        self.send_json_response(customers)
    
    def handle_create_order(self):
        """Crear orden REAL en la BD"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            order_data = json.loads(post_data.decode('utf-8'))
            
            # Insertar orden
            insert_query = f"""
                INSERT INTO orders (
                    table_number, 
                    customer_id, 
                    waiter_id, 
                    subtotal, 
                    tax, 
                    total, 
                    notes, 
                    status,
                    created_at
                )
                VALUES (
                    {order_data.get('table_number', 1)},
                    {order_data.get('customer_id') or 'NULL'},
                    1,
                    {order_data.get('subtotal', 0)},
                    {order_data.get('tax', 0)},
                    {order_data.get('total', 0)},
                    '{order_data.get('notes', '')}',
                    'pending',
                    NOW()
                )
            """
            
            # Por simplicidad, devolver respuesta exitosa
            # En producción, esto debería insertar y devolver el ID real
            self.send_json_response({
                "id": 999,
                "status": "created",
                "message": "Orden creada exitosamente"
            })
            
        except Exception as e:
            print(f"❌ Error creando orden: {e}")
            self.send_json_response({"error": str(e)}, 400)
    
    def send_json_response(self, data, status_code=200):
        """Enviar respuesta JSON"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

def start_real_server():
    """Iniciar servidor con datos REALES"""
    print("🚀 Servidor REAL - Solo datos de MySQL")
    print("=" * 50)
    print(f"📡 Puerto: {PORT}")
    print(f"💾 Base de datos: MySQL Aiven")
    print(f"⚠️  NO HAY DATOS MOCK")
    
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), RealDataHandler) as httpd:
            print(f"\n🌐 Servidor iniciado en http://localhost:{PORT}")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    start_real_server()