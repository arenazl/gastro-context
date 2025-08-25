#!/usr/bin/env python3
"""
Servidor FastAPI simplificado que funciona sin instalación de dependencias
"""
import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs
import hashlib

PORT = 9000

class GastroAPIHandler(http.server.SimpleHTTPRequestHandler):
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
            self.send_json_response({
                'name': 'Restaurant Management System',
                'version': '1.0.0',
                'status': 'operational'
            })
            
        elif path == '/api/v1/products/categories' or path == '/api/categories':
            # Categorías optimizadas
            self.send_json_response([
                {"id": 1, "name": "Entradas", "icon": "utensils", "color": "#FF6B6B", "display_order": 1},
                {"id": 2, "name": "Platos Principales", "icon": "drumstick-bite", "color": "#4ECDC4", "display_order": 2},
                {"id": 3, "name": "Bebidas", "icon": "wine-glass", "color": "#45B7D1", "display_order": 3},
                {"id": 4, "name": "Postres", "icon": "ice-cream", "color": "#96CEB4", "display_order": 4},
                {"id": 5, "name": "Cafetería", "icon": "coffee", "color": "#8B4513", "display_order": 5}
            ])
            
        elif path.startswith('/api/v1/products/categories/') and '/products' in path:
            # Productos por categoría (lazy loading)
            category_id = path.split('/')[5]
            skip = int(query.get('skip', [0])[0])
            limit = int(query.get('limit', [50])[0])
            
            # Simular productos por categoría
            products = self.get_products_by_category(int(category_id), skip, limit)
            self.send_json_response({
                "products": products,
                "total": len(products),
                "skip": skip,
                "limit": limit,
                "has_more": False
            })
            
        elif path == '/api/v1/products/featured':
            # Productos destacados
            self.send_json_response([
                {"id": 1, "name": "Pizza Margherita", "base_price": 12.99, "category_name": "Platos Principales", "image_url": "/images/pizza.jpg"},
                {"id": 2, "name": "Hamburguesa Clásica", "base_price": 10.99, "category_name": "Platos Principales", "image_url": "/images/burger.jpg"},
                {"id": 3, "name": "Ensalada César", "base_price": 8.99, "category_name": "Entradas", "image_url": "/images/salad.jpg"}
            ])
            
        elif path == '/api/v1/tables' or path == '/api/tables':
            # Mesas del restaurante
            self.send_json_response([
                {"number": 1, "capacity": 4, "location": "Salón Principal", "current_status": "available"},
                {"number": 2, "capacity": 2, "location": "Salón Principal", "current_status": "occupied"},
                {"number": 3, "capacity": 6, "location": "Terraza", "current_status": "available"},
                {"number": 4, "capacity": 4, "location": "Terraza", "current_status": "available"},
                {"number": 5, "capacity": 8, "location": "Salón VIP", "current_status": "reserved"}
            ])
            
        elif path == '/api/v1/orders/kitchen':
            # Pedidos en cocina
            self.send_json_response([
                {
                    "id": 1,
                    "table_number": 2,
                    "status": "preparing",
                    "ordered_at": "2024-01-11T12:30:00",
                    "items": [
                        {"product_name": "Pizza Margherita", "quantity": 2, "status": "preparing"},
                        {"product_name": "Coca Cola", "quantity": 2, "status": "ready"}
                    ]
                }
            ])
            
        elif path == '/api/subcategories':
            # Subcategorías por categoría
            category_id = query.get('category_id', [None])[0]
            
            if category_id:
                subcategories = self.get_subcategories(int(category_id))
                self.send_json_response(subcategories)
            else:
                # Si no se especifica categoría, devolver todas las subcategorías
                self.send_json_response([])
                
        elif path == '/api/v1/auth/me' or path == '/api/users/me':
            # Usuario actual
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
        path = urlparse(self.path).path
        
        if path == '/api/v1/auth/login' or path == '/api/auth/login':
            # Login simulation
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Generate fake JWT token
            token = hashlib.md5(b"fake_jwt_token").hexdigest()
            
            self.send_json_response({
                'access_token': token,
                'token_type': 'bearer',
                'user': {
                    "id": 1,
                    "email": "admin@restaurant.com",
                    "first_name": "Admin",
                    "last_name": "User",
                    "role": "admin"
                }
            })
            
        elif path == '/api/v1/auth/logout':
            self.send_json_response({'success': True, 'message': 'Logged out successfully'})
            
        elif path == '/api/v1/orders' or path == '/api/orders':
            # Create order
            self.send_json_response({
                'id': 1,
                'table_number': 1,
                'status': 'pending',
                'total_amount': 45.99,
                'message': 'Order created successfully'
            })
        else:
            self.send_error(404)
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def get_products_by_category(self, category_id, skip, limit):
        """Generate products based on category"""
        products_db = {
            1: [  # Entradas
                {"id": 101, "name": "Bruschetta", "base_price": 6.99, "category_id": 1, "preparation_time": 10},
                {"id": 102, "name": "Carpaccio", "base_price": 12.99, "category_id": 1, "preparation_time": 15},
                {"id": 103, "name": "Ensalada César", "base_price": 8.99, "category_id": 1, "preparation_time": 10},
                {"id": 104, "name": "Sopa del Día", "base_price": 5.99, "category_id": 1, "preparation_time": 5},
                {"id": 105, "name": "Tabla de Quesos", "base_price": 14.99, "category_id": 1, "preparation_time": 10}
            ],
            2: [  # Platos Principales
                {"id": 201, "name": "Pizza Margherita", "base_price": 12.99, "category_id": 2, "preparation_time": 20},
                {"id": 202, "name": "Pizza Pepperoni", "base_price": 14.99, "category_id": 2, "preparation_time": 20},
                {"id": 203, "name": "Hamburguesa Clásica", "base_price": 10.99, "category_id": 2, "preparation_time": 15},
                {"id": 204, "name": "Pasta Carbonara", "base_price": 11.99, "category_id": 2, "preparation_time": 18},
                {"id": 205, "name": "Salmón Grillado", "base_price": 18.99, "category_id": 2, "preparation_time": 25},
                {"id": 206, "name": "Pollo al Curry", "base_price": 13.99, "category_id": 2, "preparation_time": 22},
                {"id": 207, "name": "Risotto de Hongos", "base_price": 15.99, "category_id": 2, "preparation_time": 25}
            ],
            3: [  # Bebidas
                {"id": 301, "name": "Coca Cola", "base_price": 2.99, "category_id": 3, "preparation_time": 1},
                {"id": 302, "name": "Jugo Natural", "base_price": 4.99, "category_id": 3, "preparation_time": 5},
                {"id": 303, "name": "Cerveza Artesanal", "base_price": 5.99, "category_id": 3, "preparation_time": 1},
                {"id": 304, "name": "Vino Tinto Copa", "base_price": 7.99, "category_id": 3, "preparation_time": 1},
                {"id": 305, "name": "Agua Mineral", "base_price": 1.99, "category_id": 3, "preparation_time": 1}
            ],
            4: [  # Postres
                {"id": 401, "name": "Tiramisú", "base_price": 6.99, "category_id": 4, "preparation_time": 5},
                {"id": 402, "name": "Cheesecake", "base_price": 5.99, "category_id": 4, "preparation_time": 5},
                {"id": 403, "name": "Helado Artesanal", "base_price": 4.99, "category_id": 4, "preparation_time": 2},
                {"id": 404, "name": "Brownie con Helado", "base_price": 7.99, "category_id": 4, "preparation_time": 8}
            ],
            5: [  # Cafetería
                {"id": 501, "name": "Espresso", "base_price": 2.50, "category_id": 5, "preparation_time": 3},
                {"id": 502, "name": "Cappuccino", "base_price": 3.50, "category_id": 5, "preparation_time": 4},
                {"id": 503, "name": "Latte", "base_price": 3.99, "category_id": 5, "preparation_time": 4},
                {"id": 504, "name": "Té Selection", "base_price": 2.99, "category_id": 5, "preparation_time": 3}
            ]
        }
        
        products = products_db.get(category_id, [])
        # Apply pagination
        return products[skip:skip+limit]
    
    def get_subcategories(self, category_id):
        """Get subcategories for a given category"""
        subcategories_db = {
            1: [  # Entradas
                {"id": 101, "name": "Entradas Frías", "category_id": 1, "display_order": 1},
                {"id": 102, "name": "Entradas Calientes", "category_id": 1, "display_order": 2},
                {"id": 103, "name": "Ensaladas", "category_id": 1, "display_order": 3},
                {"id": 104, "name": "Sopas", "category_id": 1, "display_order": 4}
            ],
            2: [  # Platos Principales
                {"id": 201, "name": "Carnes", "category_id": 2, "display_order": 1},
                {"id": 202, "name": "Pescados", "category_id": 2, "display_order": 2},
                {"id": 203, "name": "Pastas", "category_id": 2, "display_order": 3},
                {"id": 204, "name": "Arroces", "category_id": 2, "display_order": 4},
                {"id": 205, "name": "Vegetarianos", "category_id": 2, "display_order": 5}
            ],
            3: [  # Bebidas
                {"id": 301, "name": "Gaseosas", "category_id": 3, "display_order": 1},
                {"id": 302, "name": "Jugos Naturales", "category_id": 3, "display_order": 2},
                {"id": 303, "name": "Cervezas", "category_id": 3, "display_order": 3},
                {"id": 304, "name": "Vinos", "category_id": 3, "display_order": 4},
                {"id": 305, "name": "Cócteles", "category_id": 3, "display_order": 5},
                {"id": 306, "name": "Aguas", "category_id": 3, "display_order": 6}
            ],
            4: [  # Postres
                {"id": 401, "name": "Tortas", "category_id": 4, "display_order": 1},
                {"id": 402, "name": "Helados", "category_id": 4, "display_order": 2},
                {"id": 403, "name": "Postres Fríos", "category_id": 4, "display_order": 3},
                {"id": 404, "name": "Postres Calientes", "category_id": 4, "display_order": 4}
            ],
            5: [  # Cafetería
                {"id": 501, "name": "Cafés", "category_id": 5, "display_order": 1},
                {"id": 502, "name": "Tés", "category_id": 5, "display_order": 2},
                {"id": 503, "name": "Infusiones", "category_id": 5, "display_order": 3},
                {"id": 504, "name": "Chocolates", "category_id": 5, "display_order": 4}
            ]
        }
        
        return subcategories_db.get(category_id, [])
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        if args and len(args) > 0 and isinstance(args[0], str) and '/health' not in args[0]:
            super().log_message(format, *args)

# Start server
print(f"🚀 Starting Gastro API Server on port {PORT}")
print(f"📍 Server URL: http://localhost:{PORT}")
print(f"📚 API Docs: http://localhost:{PORT}/api/docs")
print(f"✅ Server is ready to accept connections")

with socketserver.TCPServer(("0.0.0.0", PORT), GastroAPIHandler) as httpd:
    httpd.serve_forever()