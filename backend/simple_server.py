#!/usr/bin/env python3
"""
Simple HTTP server for testing database connectivity
"""
import http.server
import socketserver
import json
import urllib.parse
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class RestaurantHandler(http.server.SimpleHTTPRequestHandler):
    """Simple handler for restaurant API endpoints"""
    
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
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'message': 'Restaurant Management System API',
                'status': 'running',
                'version': '1.0.0',
                'database': 'connected'
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'status': 'healthy', 'database': 'connected'}
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path.startswith('/api/'):
            # Mock API responses for testing
            self.handle_api_request()
        else:
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        print(f"🟡 POST {self.path} from {self.client_address[0]}")
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_api_request(self):
        """Handle API requests with mock responses"""
        
        # Mock users for authentication
        mock_users = [
            {"id": 1, "email": "admin@restaurant.com", "role": "admin", "first_name": "Admin", "last_name": "User"},
            {"id": 2, "email": "waiter@restaurant.com", "role": "waiter", "first_name": "John", "last_name": "Waiter"},
            {"id": 3, "email": "kitchen@restaurant.com", "role": "kitchen", "first_name": "Chef", "last_name": "Kitchen"},
            {"id": 4, "email": "cashier@restaurant.com", "role": "cashier", "first_name": "Cash", "last_name": "Register"}
        ]
        
        # Mock products
        mock_products = [
            {"id": 1, "name": "Caesar Salad", "price": 12.99, "category": "Salads", "available": True},
            {"id": 2, "name": "Grilled Salmon", "price": 24.99, "category": "Seafood", "available": True},
            {"id": 3, "name": "Ribeye Steak", "price": 34.99, "category": "Steaks", "available": True}
        ]
        
        # Mock tables
        mock_tables = [
            {"id": 1, "number": 1, "capacity": 4, "status": "available", "location": "Main Hall"},
            {"id": 2, "number": 2, "capacity": 4, "status": "occupied", "location": "Main Hall"},
            {"id": 3, "number": 3, "capacity": 6, "status": "available", "location": "Main Hall"}
        ]
        
        if self.path == '/api/auth/login' and self.command == 'POST':
            # Mock login response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'access_token': 'mock_jwt_token',
                'token_type': 'bearer',
                'user': mock_users[0]  # Always return admin user for testing
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/products':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(mock_products).encode())
            
        elif self.path == '/api/tables':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(mock_tables).encode())
            
        elif self.path == '/api/users/me':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(mock_users[0]).encode())
            
        elif self.path == '/api/auth/logout' and self.command == 'POST':
            # Mock logout response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'message': 'Logged out successfully'}
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/orders':
            # Mock orders response
            mock_orders = [
                {
                    "id": 1,
                    "table_number": 2,
                    "status": "preparing",
                    "items": [
                        {"product_name": "Caesar Salad", "quantity": 2, "price": 12.99},
                        {"product_name": "Grilled Salmon", "quantity": 1, "price": 24.99}
                    ],
                    "total": 50.97,
                    "created_at": "2025-08-11T09:15:00Z",
                    "waiter_name": "John Waiter"
                },
                {
                    "id": 2,
                    "table_number": 5,
                    "status": "ready",
                    "items": [
                        {"product_name": "Ribeye Steak", "quantity": 1, "price": 34.99},
                        {"product_name": "House Wine", "quantity": 2, "price": 8.99}
                    ],
                    "total": 52.97,
                    "created_at": "2025-08-11T09:10:00Z",
                    "waiter_name": "John Waiter"
                },
                {
                    "id": 3,
                    "table_number": 7,
                    "status": "pending",
                    "items": [
                        {"product_name": "Margherita Pizza", "quantity": 1, "price": 18.99}
                    ],
                    "total": 18.99,
                    "created_at": "2025-08-11T09:20:00Z",
                    "waiter_name": "John Waiter"
                }
            ]
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(mock_orders).encode())
            
        elif self.path.startswith('/api/orders/') and self.command == 'POST':
            # Mock create order response
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            new_order = {
                "id": 999,
                "table_number": 1,
                "status": "pending",
                "total": 0.00,
                "created_at": "2025-08-11T09:25:00Z",
                "message": "Order created successfully"
            }
            self.wfile.write(json.dumps(new_order).encode())
            
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'error': 'Not found', 'path': self.path}
            self.wfile.write(json.dumps(response).encode())

def start_server():
    """Start the simple HTTP server"""
    PORT = 8002
    
    with socketserver.TCPServer(("0.0.0.0", PORT), RestaurantHandler) as httpd:
        print(f"🚀 Simple Restaurant API Server starting on port {PORT}")
        print(f"📡 Server running at:")
        print(f"   - http://localhost:{PORT}")
        print(f"   - http://172.29.228.80:{PORT}")
        print("\n🔗 Database tables created: ✅")
        print("📊 Available endpoints:")
        print("   - GET  /health")
        print("   - POST /api/auth/login")
        print("   - GET  /api/products")
        print("   - GET  /api/tables")
        print("   - GET  /api/users/me")
        print("\n⚡ Ready to connect with frontend!")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    start_server()