#!/usr/bin/env python3
"""
Servidor mejorado con manejo de imágenes y categorías
"""
import http.server
import socketserver
import json
import urllib.parse
import os
import sys
import uuid
import time
import mimetypes
from urllib.parse import urlparse, parse_qs
import shutil

# Database connection for real data
try:
    import mysql.connector
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️ mysql.connector no disponible, usando datos mock")

# Configuración de base de datos
DB_CONFIG = {
    'host': 'mysql-aiven-arenazl.e.aivencloud.com',
    'port': 23108,
    'user': 'avnadmin',
    'password': 'AVNS_Fqe0qsChCHnqSnVsvoi',
    'database': 'gastro'
}

class EnhancedRestaurantHandler(http.server.SimpleHTTPRequestHandler):
    """Handler mejorado con soporte para imágenes y categorías"""
    
    def __init__(self, *args, **kwargs):
        # Configurar directorio base para archivos estáticos
        self.uploads_dir = "/mnt/c/Code/gastro-context/uploads"
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        print(f"🔵 OPTIONS {self.path} from {self.client_address[0]}")
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        print(f"🔵 GET {self.path} from {self.client_address[0]}")
        
        if self.path == '/':
            self.send_json_response({'message': 'Enhanced Restaurant API', 'version': '2.0.0'})
            
        elif self.path == '/health':
            self.send_json_response({'status': 'healthy', 'features': ['images', 'categories']})
            
        elif self.path.startswith('/uploads/'):
            # Servir archivos de imágenes
            self.serve_upload_file()
            
        elif self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        print(f"🟡 POST {self.path} from {self.client_address[0]}")
        
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)
    
    def serve_upload_file(self):
        """Servir archivos subidos"""
        try:
            # Remover /uploads/ del path
            file_path = self.path[9:]  # Remove '/uploads/'
            full_path = os.path.join(self.uploads_dir, file_path)
            
            if os.path.exists(full_path) and os.path.isfile(full_path):
                # Determinar tipo MIME
                mime_type, _ = mimetypes.guess_type(full_path)
                if mime_type is None:
                    mime_type = 'application/octet-stream'
                
                self.send_response(200)
                self.send_header('Content-type', mime_type)
                self.send_header('Cache-Control', 'public, max-age=31536000')  # 1 año de cache
                self.end_headers()
                
                with open(full_path, 'rb') as f:
                    shutil.copyfileobj(f, self.wfile)
            else:
                self.send_error(404, "Archivo no encontrado")
                
        except Exception as e:
            print(f"❌ Error sirviendo archivo: {e}")
            self.send_error(500, "Error interno del servidor")
    
    def handle_file_upload(self):
        """Manejar subida de archivos"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                return self.send_json_response({'error': 'No file data'}, 400)
            
            # Leer datos del archivo
            post_data = self.rfile.read(content_length)
            
            # Generar nombre único para el archivo
            file_id = str(uuid.uuid4())
            timestamp = int(time.time())
            filename = f"product_{timestamp}_{file_id}.jpg"
            
            # Crear directorio si no existe
            os.makedirs(f"{self.uploads_dir}/products", exist_ok=True)
            
            # Guardar archivo
            file_path = f"{self.uploads_dir}/products/{filename}"
            with open(file_path, 'wb') as f:
                f.write(post_data)
            
            # Generar URL pública
            file_url = f"/uploads/products/{filename}"
            
            return self.send_json_response({
                'success': True,
                'filename': filename,
                'url': file_url,
                'size': len(post_data)
            })
            
        except Exception as e:
            print(f"❌ Error en subida de archivo: {e}")
            return self.send_json_response({'error': 'Upload failed'}, 500)
    
    def get_categories(self):
        """Obtener categorías desde la base de datos"""
        # Usar datos reales de la base de datos vía Node.js
        import subprocess
        import json
        
        try:
            # Ejecutar consulta usando Node.js
            result = subprocess.run([
                'node', '-e', f'''
const mysql = require('mysql2/promise');
const dbConfig = {{
  host: '{DB_CONFIG["host"]}',
  port: {DB_CONFIG["port"]},
  user: '{DB_CONFIG["user"]}',
  password: '{DB_CONFIG["password"]}',
  database: '{DB_CONFIG["database"]}'
}};

async function getCategories() {{
  try {{
    const connection = await mysql.createConnection(dbConfig);
    const [categories] = await connection.execute(`
      SELECT * FROM categories 
      WHERE is_active = TRUE 
      ORDER BY sort_order
    `);
    await connection.end();
    console.log(JSON.stringify(categories));
  }} catch (error) {{
    console.log(JSON.stringify([]));
  }}
}}
getCategories();
                '''
            ], capture_output=True, text=True, cwd='/mnt/c/Code/gastro-context/backend')
            
            if result.returncode == 0 and result.stdout.strip():
                categories = json.loads(result.stdout.strip())
                print(f"✅ Categorías obtenidas desde BD: {len(categories)}")
                return categories
            else:
                print(f"❌ Error ejecutando consulta: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error obteniendo categorías reales: {e}")
        
        # Reintentar conexión a base de datos - NUNCA mock data
        print("🔄 Reintentando conexión a base de datos...")
        import time
        time.sleep(1)
        return self.get_categories()

    def get_subcategories(self, category_id=None):
        """Obtener subcategorías desde la base de datos"""
        # Usar datos reales de la base de datos vía Node.js
        import subprocess
        import json
        
        try:
            # Construir query según el filtro
            if category_id:
                query = f"""
                    SELECT s.*, c.name as category_name 
                    FROM subcategories s
                    JOIN categories c ON s.category_id = c.id
                    WHERE s.category_id = {category_id} AND s.is_active = TRUE
                    ORDER BY s.sort_order, s.name
                """
            else:
                query = """
                    SELECT s.*, c.name as category_name 
                    FROM subcategories s
                    JOIN categories c ON s.category_id = c.id
                    WHERE s.is_active = TRUE
                    ORDER BY c.sort_order, s.sort_order, s.name
                """
            
            # Ejecutar consulta usando Node.js
            result = subprocess.run([
                'node', '-e', f'''
const mysql = require('mysql2/promise');
const dbConfig = {{
  host: '{DB_CONFIG["host"]}',
  port: {DB_CONFIG["port"]},
  user: '{DB_CONFIG["user"]}',
  password: '{DB_CONFIG["password"]}',
  database: '{DB_CONFIG["database"]}'
}};

async function getSubcategories() {{
  try {{
    const connection = await mysql.createConnection(dbConfig);
    const [subcategories] = await connection.execute(`{query}`);
    await connection.end();
    console.log(JSON.stringify(subcategories));
  }} catch (error) {{
    console.log(JSON.stringify([]));
  }}
}}
getSubcategories();
                '''
            ], capture_output=True, text=True, cwd='/mnt/c/Code/gastro-context/backend')
            
            if result.returncode == 0 and result.stdout.strip():
                subcategories = json.loads(result.stdout.strip())
                print(f"✅ Subcategorías obtenidas desde BD: {len(subcategories)}")
                return subcategories
            else:
                print(f"❌ Error ejecutando consulta: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error obteniendo subcategorías reales: {e}")
        
        # NUNCA usar mock data
        print("🔄 Reintentando conexión a base de datos para subcategorías...")
        import time
        time.sleep(1)
        return self.get_subcategories(category_id)
    
    def get_customers(self, search_query=None):
        """Obtener clientes con búsqueda autocompletado"""
        if not DB_AVAILABLE:
            # Datos mock de clientes
            mock_customers = [
                {"id": 1, "first_name": "Juan", "last_name": "Pérez", "email": "juan.perez@email.com", "phone": "+54 11 1234-5678", "loyalty_points": 150},
                {"id": 2, "first_name": "María", "last_name": "González", "email": "maria.gonzalez@email.com", "phone": "+54 11 2345-6789", "loyalty_points": 89},
                {"id": 3, "first_name": "Carlos", "last_name": "Rodríguez", "email": "carlos.rodriguez@email.com", "phone": "+54 11 3456-7890", "loyalty_points": 245}
            ]
            
            if search_query:
                search_lower = search_query.lower()
                mock_customers = [c for c in mock_customers if 
                                search_lower in c['first_name'].lower() or 
                                search_lower in c['last_name'].lower() or 
                                search_lower in c['email'].lower()]
            
            return mock_customers
        
        try:
            connection = mysql.connector.connect(**DB_CONFIG)
            cursor = connection.cursor(dictionary=True)
            
            if search_query:
                query = """
                    SELECT id, first_name, last_name, email, phone, loyalty_points, total_visits
                    FROM customers 
                    WHERE is_active = TRUE AND (
                        first_name LIKE %s OR 
                        last_name LIKE %s OR 
                        email LIKE %s OR 
                        phone LIKE %s
                    )
                    ORDER BY loyalty_points DESC, first_name
                    LIMIT 20
                """
                search_param = f"%{search_query}%"
                cursor.execute(query, (search_param, search_param, search_param, search_param))
            else:
                cursor.execute("""
                    SELECT id, first_name, last_name, email, phone, loyalty_points, total_visits
                    FROM customers 
                    WHERE is_active = TRUE 
                    ORDER BY loyalty_points DESC, first_name
                    LIMIT 50
                """)
            
            customers = cursor.fetchall()
            cursor.close()
            connection.close()
            return customers
        except Exception as e:
            print(f"❌ Error obteniendo clientes: {e}")
            return []

    def create_order(self, order_data):
        """Crear nueva orden"""
        if not DB_AVAILABLE:
            # Mock response para testing
            return {
                "id": 999,
                "table_number": order_data.get('table_number'),
                "customer_id": order_data.get('customer_id'),
                "status": "pending",
                "subtotal": order_data.get('subtotal', 0),
                "tax": order_data.get('tax', 0),
                "total": order_data.get('total', 0),
                "items": order_data.get('items', []),
                "created_at": "2025-08-11T10:00:00Z",
                "message": "Orden creada exitosamente"
            }
        
        try:
            connection = mysql.connector.connect(**DB_CONFIG)
            cursor = connection.cursor(dictionary=True)
            
            # Insertar orden principal
            insert_order_query = """
                INSERT INTO orders (table_number, customer_id, waiter_id, subtotal, tax, total, notes, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(insert_order_query, (
                order_data['table_number'],
                order_data.get('customer_id'),
                order_data.get('waiter_id', 1),  # Default waiter
                order_data['subtotal'],
                order_data['tax'],
                order_data['total'],
                order_data.get('notes', ''),
                'pending'
            ))
            
            order_id = cursor.lastrowid
            
            # Insertar items de la orden
            for item in order_data['items']:
                insert_item_query = """
                    INSERT INTO order_items (order_id, product_id, quantity, price, notes)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(insert_item_query, (
                    order_id,
                    item['product_id'],
                    item['quantity'],
                    item['price'],
                    item.get('notes', '')
                ))
            
            connection.commit()
            cursor.close()
            connection.close()
            
            return {
                "id": order_id,
                "table_number": order_data['table_number'],
                "customer_id": order_data.get('customer_id'),
                "status": "pending",
                "subtotal": order_data['subtotal'],
                "tax": order_data['tax'],
                "total": order_data['total'],
                "items": order_data['items'],
                "created_at": "2025-08-11T10:00:00Z",
                "message": "Orden creada exitosamente"
            }
            
        except Exception as e:
            print(f"❌ Error creando orden: {e}")
            return {"error": "Error creating order", "details": str(e)}

    def get_products_enhanced(self):
        """Obtener productos con categorías"""
        # Usar datos reales de la base de datos vía Node.js
        import subprocess
        import json
        
        try:
            # Ejecutar consulta usando Node.js
            result = subprocess.run([
                'node', '-e', f'''
const mysql = require('mysql2/promise');
const dbConfig = {{
  host: '{DB_CONFIG["host"]}',
  port: {DB_CONFIG["port"]},
  user: '{DB_CONFIG["user"]}',
  password: '{DB_CONFIG["password"]}',
  database: '{DB_CONFIG["database"]}'
}};

async function getProducts() {{
  try {{
    const connection = await mysql.createConnection(dbConfig);
    const [products] = await connection.execute(`
      SELECT 
        p.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        s.name as subcategory_name,
        s.icon as subcategory_icon
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.available = TRUE
      ORDER BY c.sort_order, s.sort_order, p.name
    `);
    await connection.end();
    console.log(JSON.stringify(products));
  }} catch (error) {{
    console.log(JSON.stringify([]));
  }}
}}
getProducts();
                '''
            ], capture_output=True, text=True, cwd='/mnt/c/Code/gastro-context/backend')
            
            if result.returncode == 0 and result.stdout.strip():
                products = json.loads(result.stdout.strip())
                print(f"✅ Productos obtenidos desde BD: {len(products)}")
                return products
            else:
                print(f"❌ Error ejecutando consulta: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error obteniendo productos reales: {e}")
        
        # Reintentar conexión a base de datos - NUNCA mock data
        print("🔄 Reintentando conexión a base de datos para productos...")
        import time
        time.sleep(1)
        return self.get_products_enhanced()
    
    def handle_api_request(self):
        """Manejar requests de API"""
        
        # Mock users
        mock_users = [
            {"id": 1, "email": "admin@restaurant.com", "role": "admin", "first_name": "Admin", "last_name": "User"}
        ]
        
        if self.path == '/api/auth/login' and self.command == 'POST':
            self.send_json_response({
                'access_token': 'mock_jwt_token',
                'token_type': 'bearer',
                'user': mock_users[0]
            })
            
        elif self.path == '/api/auth/logout' and self.command == 'POST':
            self.send_json_response({'message': 'Logged out successfully'})
            
        elif self.path == '/api/users/me':
            self.send_json_response(mock_users[0])
            
        elif self.path == '/api/categories':
            categories = self.get_categories()
            self.send_json_response(categories)
            
        elif self.path == '/api/subcategories' or self.path.startswith('/api/subcategories'):
            # Manejo de subcategorías con filtro por categoría
            category_id = None
            if '?' in self.path:
                query_string = self.path.split('?')[1]
                params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
                category_id = params.get('category_id')
            
            subcategories = self.get_subcategories(category_id)
            self.send_json_response({'subcategories': subcategories})
            
        elif self.path == '/api/products':
            products = self.get_products_enhanced()
            self.send_json_response(products)
            
        elif self.path == '/api/products/upload' and self.command == 'POST':
            self.handle_file_upload()
            
        elif self.path.startswith('/api/customers'):
            # Manejo de clientes con búsqueda
            if '?' in self.path:
                # Extraer query parameters
                query_string = self.path.split('?')[1]
                params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
                search_query = params.get('search', '').replace('%20', ' ')
            else:
                search_query = None
                
            customers = self.get_customers(search_query)
            self.send_json_response(customers)
            
        elif self.path == '/api/orders' and self.command == 'POST':
            # Crear nueva orden
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    order_data = json.loads(post_data.decode('utf-8'))
                    
                    result = self.create_order(order_data)
                    
                    if 'error' in result:
                        self.send_json_response(result, 400)
                    else:
                        self.send_json_response(result, 201)
                else:
                    self.send_json_response({'error': 'No order data provided'}, 400)
            except Exception as e:
                print(f"❌ Error procesando orden: {e}")
                self.send_json_response({'error': 'Invalid order data'}, 400)
            
        elif self.path == '/api/orders/kitchen':
            # Endpoint para órdenes de cocina
            mock_orders = []
            self.send_json_response(mock_orders)
            
        elif self.path == '/api/tables':
            mock_tables = [
                {"id": 1, "number": 1, "capacity": 4, "status": "available", "location": "Main Hall"},
                {"id": 2, "number": 2, "capacity": 4, "status": "occupied", "location": "Main Hall"}
            ]
            self.send_json_response(mock_tables)
            
        elif self.path == '/api/orders':
            mock_orders = [
                {
                    "id": 1, "table_number": 2, "status": "preparing",
                    "items": [{"product_name": "Caesar Salad", "quantity": 2, "price": 12.99}],
                    "total": 25.98, "created_at": "2025-08-11T09:15:00Z"
                }
            ]
            self.send_json_response(mock_orders)
            
        else:
            self.send_json_response({'error': 'Not found', 'path': self.path}, 404)
    
    def send_json_response(self, data, status_code=200):
        """Enviar respuesta JSON"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

def start_enhanced_server():
    """Iniciar servidor mejorado"""
    PORT = 8003
    
    print("🚀 Enhanced Restaurant API Server")
    print("=" * 50)
    print(f"📡 Puerto: {PORT}")
    print(f"🖼️ Imágenes: /uploads/products/")
    print(f"🏷️ Categorías: Habilitadas")
    print(f"💾 Base de datos: {'✅ Conectada' if DB_AVAILABLE else '❌ Mock'}")
    
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), EnhancedRestaurantHandler) as httpd:
            print(f"\n🌐 Servidor iniciado:")
            print(f"   - http://localhost:{PORT}")
            print(f"   - http://172.29.228.80:{PORT}")
            print(f"\n📋 Endpoints disponibles:")
            print(f"   - GET  /api/categories")
            print(f"   - GET  /api/products (con categorías)")
            print(f"   - POST /api/products/upload")
            print(f"   - GET  /uploads/products/imagen.jpg")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    start_enhanced_server()