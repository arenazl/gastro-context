#!/usr/bin/env python3
"""
Servidor con conexión MySQL usando solo bibliotecas estándar
"""
import http.server
import socketserver
import json
import hashlib
import socket
import ssl
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from decimal import Decimal

PORT = 9000

# MySQL connection using raw sockets (sin librerías externas)
class SimpleMySQLConnection:
    def __init__(self):
        self.host = 'mysql-aiven-arenazl.e.aivencloud.com'
        self.port = 23108
        self.user = 'avnadmin'
        self.password = 'AVNS_Fqe0qsChCHnqSnVsvoi'
        self.database = 'gastro'
        self.connected = False
        
    def test_connection(self):
        """Test MySQL connection via socket"""
        try:
            # Create SSL context for secure connection
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            # Create socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            
            # Wrap with SSL
            ssock = context.wrap_socket(sock, server_hostname=self.host)
            
            # Try to connect
            ssock.connect((self.host, self.port))
            
            # If we get here, connection is possible
            ssock.close()
            return True
        except Exception as e:
            print(f"❌ Cannot connect to MySQL: {e}")
            return False

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class GastroAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.mysql = SimpleMySQLConnection()
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Type', 'application/json')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)
        
        if path == '/' or path == '/health':
            db_status = "connected (test)" if self.mysql.test_connection() else "disconnected"
            
            self.send_json_response({
                'name': 'Restaurant Management System',
                'version': '1.0.0',
                'status': 'operational',
                'database': db_status,
                'note': 'Using fallback data - MySQL driver not installed'
            })
            
        elif path == '/api/v1/products/categories' or path == '/api/categories':
            # Categorías reales basadas en estructura de BD pero sin conexión directa
            # Estas categorías están basadas en lo que debería estar en la BD
            categories = [
                {"id": 1, "name": "Entradas", "icon": "utensils", "color": "#FF6B6B", "display_order": 1, "is_active": True},
                {"id": 2, "name": "Platos Principales", "icon": "drumstick-bite", "color": "#4ECDC4", "display_order": 2, "is_active": True},
                {"id": 3, "name": "Bebidas", "icon": "wine-glass", "color": "#45B7D1", "display_order": 3, "is_active": True},
                {"id": 4, "name": "Postres", "icon": "ice-cream", "color": "#96CEB4", "display_order": 4, "is_active": True},
                {"id": 5, "name": "Cafetería", "icon": "coffee", "color": "#8B4513", "display_order": 5, "is_active": True},
                {"id": 6, "name": "Vinos", "icon": "wine-bottle", "color": "#722F37", "display_order": 6, "is_active": True},
                {"id": 7, "name": "Cervezas", "icon": "beer", "color": "#F28E1C", "display_order": 7, "is_active": True},
                {"id": 8, "name": "Pastas", "icon": "bowl", "color": "#FFA500", "display_order": 8, "is_active": True},
                {"id": 9, "name": "Pizzas", "icon": "pizza-slice", "color": "#FF4500", "display_order": 9, "is_active": True},
                {"id": 10, "name": "Ensaladas", "icon": "leaf", "color": "#228B22", "display_order": 10, "is_active": True},
                {"id": 11, "name": "Sopas", "icon": "spoon", "color": "#DAA520", "display_order": 11, "is_active": True},
                {"id": 12, "name": "Carnes", "icon": "meat", "color": "#8B4513", "display_order": 12, "is_active": True},
                {"id": 13, "name": "Pescados y Mariscos", "icon": "fish", "color": "#4682B4", "display_order": 13, "is_active": True},
                {"id": 14, "name": "Hamburguesas", "icon": "hamburger", "color": "#FF6347", "display_order": 14, "is_active": True},
                {"id": 15, "name": "Sándwiches", "icon": "sandwich", "color": "#F4A460", "display_order": 15, "is_active": True}
            ]
            
            self.send_json_response(categories)
            
        elif path.startswith('/api/v1/products/categories/') and '/products' in path:
            # Productos por categoría - datos realistas
            try:
                category_id = int(path.split('/')[5])
            except (IndexError, ValueError):
                self.send_error_response(400, "Invalid category ID")
                return
            
            skip = int(query.get('skip', [0])[0])
            limit = int(query.get('limit', [50])[0])
            
            # Productos realistas por categoría
            products = self.get_products_for_category(category_id, skip, limit)
            
            self.send_json_response({
                "products": products,
                "total": len(products),
                "skip": skip,
                "limit": limit,
                "has_more": False
            })
            
        elif path == '/api/v1/products/featured':
            # Productos destacados realistas
            featured = [
                {"id": 1, "name": "Pizza Margherita", "base_price": 12.99, "category_name": "Pizzas", "image_url": "/images/pizza.jpg"},
                {"id": 2, "name": "Hamburguesa Clásica", "base_price": 10.99, "category_name": "Hamburguesas", "image_url": "/images/burger.jpg"},
                {"id": 3, "name": "Ensalada César", "base_price": 8.99, "category_name": "Ensaladas", "image_url": "/images/salad.jpg"},
                {"id": 4, "name": "Salmón Grillado", "base_price": 18.99, "category_name": "Pescados y Mariscos", "image_url": "/images/salmon.jpg"},
                {"id": 5, "name": "Pasta Carbonara", "base_price": 11.99, "category_name": "Pastas", "image_url": "/images/pasta.jpg"}
            ]
            self.send_json_response(featured)
            
        elif path == '/api/v1/tables' or path == '/api/tables':
            # Mesas del restaurante
            tables = [
                {"number": 1, "capacity": 4, "location": "Salón Principal", "current_status": "available"},
                {"number": 2, "capacity": 2, "location": "Salón Principal", "current_status": "occupied"},
                {"number": 3, "capacity": 6, "location": "Terraza", "current_status": "available"},
                {"number": 4, "capacity": 4, "location": "Terraza", "current_status": "available"},
                {"number": 5, "capacity": 8, "location": "Salón VIP", "current_status": "reserved"},
                {"number": 6, "capacity": 4, "location": "Salón Principal", "current_status": "available"},
                {"number": 7, "capacity": 2, "location": "Barra", "current_status": "available"},
                {"number": 8, "capacity": 6, "location": "Terraza", "current_status": "occupied"}
            ]
            self.send_json_response(tables)
            
        elif path == '/api/v1/auth/me' or path == '/api/users/me':
            self.send_json_response({
                "id": 1,
                "email": "admin@restaurant.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin"
            })
        else:
            self.send_error(404)
    
    def get_products_for_category(self, category_id, skip, limit):
        """Get realistic products for each category"""
        products_by_category = {
            1: [  # Entradas
                {"id": 101, "name": "Bruschetta Italiana", "base_price": 6.99, "category_id": 1, "preparation_time": 10, "is_available": True},
                {"id": 102, "name": "Carpaccio de Res", "base_price": 12.99, "category_id": 1, "preparation_time": 15, "is_available": True},
                {"id": 103, "name": "Ceviche Mixto", "base_price": 14.99, "category_id": 1, "preparation_time": 20, "is_available": True},
                {"id": 104, "name": "Empanadas (3 unidades)", "base_price": 7.99, "category_id": 1, "preparation_time": 15, "is_available": True},
                {"id": 105, "name": "Tabla de Quesos y Fiambres", "base_price": 18.99, "category_id": 1, "preparation_time": 10, "is_available": True}
            ],
            2: [  # Platos Principales
                {"id": 201, "name": "Lomo de Res (300g)", "base_price": 24.99, "category_id": 2, "preparation_time": 25, "is_available": True},
                {"id": 202, "name": "Pollo a la Parrilla", "base_price": 15.99, "category_id": 2, "preparation_time": 20, "is_available": True},
                {"id": 203, "name": "Costillas BBQ", "base_price": 22.99, "category_id": 2, "preparation_time": 30, "is_available": True},
                {"id": 204, "name": "Paella Mixta", "base_price": 26.99, "category_id": 2, "preparation_time": 35, "is_available": True},
                {"id": 205, "name": "Risotto de Hongos", "base_price": 17.99, "category_id": 2, "preparation_time": 25, "is_available": True}
            ],
            3: [  # Bebidas
                {"id": 301, "name": "Coca Cola", "base_price": 2.99, "category_id": 3, "preparation_time": 1, "is_available": True},
                {"id": 302, "name": "Sprite", "base_price": 2.99, "category_id": 3, "preparation_time": 1, "is_available": True},
                {"id": 303, "name": "Jugo Natural de Naranja", "base_price": 4.99, "category_id": 3, "preparation_time": 5, "is_available": True},
                {"id": 304, "name": "Limonada", "base_price": 3.99, "category_id": 3, "preparation_time": 3, "is_available": True},
                {"id": 305, "name": "Agua Mineral", "base_price": 1.99, "category_id": 3, "preparation_time": 1, "is_available": True}
            ],
            9: [  # Pizzas
                {"id": 901, "name": "Pizza Margherita", "base_price": 12.99, "category_id": 9, "preparation_time": 20, "is_available": True},
                {"id": 902, "name": "Pizza Pepperoni", "base_price": 14.99, "category_id": 9, "preparation_time": 20, "is_available": True},
                {"id": 903, "name": "Pizza Cuatro Quesos", "base_price": 15.99, "category_id": 9, "preparation_time": 20, "is_available": True},
                {"id": 904, "name": "Pizza Hawaiana", "base_price": 13.99, "category_id": 9, "preparation_time": 20, "is_available": True},
                {"id": 905, "name": "Pizza Vegetariana", "base_price": 13.99, "category_id": 9, "preparation_time": 20, "is_available": True}
            ],
            14: [  # Hamburguesas
                {"id": 1401, "name": "Hamburguesa Clásica", "base_price": 10.99, "category_id": 14, "preparation_time": 15, "is_available": True},
                {"id": 1402, "name": "Hamburguesa con Queso", "base_price": 11.99, "category_id": 14, "preparation_time": 15, "is_available": True},
                {"id": 1403, "name": "Hamburguesa BBQ", "base_price": 13.99, "category_id": 14, "preparation_time": 15, "is_available": True},
                {"id": 1404, "name": "Hamburguesa Doble", "base_price": 15.99, "category_id": 14, "preparation_time": 18, "is_available": True},
                {"id": 1405, "name": "Hamburguesa Vegetariana", "base_price": 10.99, "category_id": 14, "preparation_time": 15, "is_available": True}
            ]
        }
        
        # Return products for the category, or empty list
        products = products_by_category.get(category_id, [])
        return products[skip:skip+limit]
    
    def do_POST(self):
        """Handle POST requests"""
        path = urlparse(self.path).path
        
        if path == '/api/v1/auth/login' or path == '/api/auth/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                email = data.get('email')
                
                # Generate fake JWT token
                token = hashlib.md5(f"{email}{datetime.now()}".encode()).hexdigest()
                
                self.send_json_response({
                    'access_token': token,
                    'token_type': 'bearer',
                    'user': {
                        'id': 1,
                        'email': email,
                        'first_name': 'Admin',
                        'last_name': 'User',
                        'role': 'admin'
                    }
                })
                
            except Exception as e:
                self.send_error_response(500, f"Login error: {str(e)}")
                
        elif path == '/api/v1/auth/logout':
            self.send_json_response({'success': True, 'message': 'Logged out successfully'})
            
        elif path == '/api/v1/orders' or path == '/api/orders':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                
                self.send_json_response({
                    'id': 1,
                    'table_number': data.get('table_number', 1),
                    'status': 'pending',
                    'total_amount': data.get('total_amount', 0),
                    'message': 'Order created successfully (simulated)'
                })
                
            except Exception as e:
                self.send_error_response(500, f"Error creating order: {str(e)}")
        else:
            self.send_error(404)
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps(data, cls=DecimalEncoder).encode())
    
    def send_error_response(self, code, message):
        """Send error response"""
        self.send_response(code)
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        if args and len(args) > 0 and isinstance(args[0], str) and '/health' not in args[0]:
            super().log_message(format, *args)

# Verificar conexión a la base de datos al iniciar
print("🔍 Checking database connection...")
mysql_test = SimpleMySQLConnection()
if mysql_test.test_connection():
    print("✅ MySQL server is reachable")
    print("⚠️  Note: Full database operations require pymysql library")
else:
    print("❌ Cannot reach MySQL server - will use simulated data")

# Start server
print(f"\n🚀 Starting Gastro API Server on port {PORT}")
print(f"📍 Server URL: http://0.0.0.0:{PORT}")
print(f"🔗 Database: Aiven MySQL (limited connection)")
print(f"⚠️  Note: This is a fallback server with simulated but realistic data")
print(f"✅ Server is ready to accept connections\n")

with socketserver.TCPServer(("0.0.0.0", PORT), GastroAPIHandler) as httpd:
    httpd.serve_forever()