#!/usr/bin/env python3
import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import os
from datetime import datetime

PORT = 8003

# Datos en memoria (MUCHO MÁS RÁPIDO)
CATEGORIES = [
    {"id": 1, "name": "Appetizers", "icon": "utensils", "color": "#FF6B6B"},
    {"id": 2, "name": "Salads", "icon": "leaf", "color": "#51CF66"},
    {"id": 3, "name": "Main Courses", "icon": "hamburger", "color": "#FF8C42"},
    {"id": 4, "name": "Desserts", "icon": "ice-cream", "color": "#FF6B9D"},
    {"id": 5, "name": "Beverages", "icon": "wine-glass", "color": "#4ECDC4"},
    {"id": 6, "name": "Specials", "icon": "star", "color": "#FFD93D"}
]

SUBCATEGORIES = [
    {"id": 1, "name": "Hot Starters", "category_id": 1, "icon": "fire"},
    {"id": 2, "name": "Cold Starters", "category_id": 1, "icon": "snowflake"},
    {"id": 3, "name": "Green Salads", "category_id": 2, "icon": "leaf"},
    {"id": 4, "name": "Meat", "category_id": 3, "icon": "drumstick-bite"},
    {"id": 5, "name": "Fish", "category_id": 3, "icon": "fish"},
    {"id": 6, "name": "Pasta", "category_id": 3, "icon": "bacon"},
]

# Productos optimizados (menos productos por categoría para carga más rápida)
def generate_products():
    products = []
    product_id = 1
    
    product_templates = {
        1: [  # Appetizers
            ("Bruschetta", "Toasted bread with tomatoes and basil", 8.99),
            ("Calamari Fritti", "Crispy fried squid rings", 12.99),
            ("Caprese Skewers", "Mozzarella, tomato, and basil", 9.99),
            ("Garlic Bread", "Homemade with fresh garlic", 6.99),
            ("Spring Rolls", "Vegetable spring rolls", 7.99),
        ],
        2: [  # Salads
            ("Caesar Salad", "Classic caesar with parmesan", 10.99),
            ("Greek Salad", "Feta, olives, and vegetables", 11.99),
            ("Garden Salad", "Fresh mixed greens", 8.99),
            ("Quinoa Bowl", "Healthy quinoa mix", 12.99),
        ],
        3: [  # Main Courses
            ("Grilled Salmon", "Atlantic salmon with herbs", 24.99),
            ("Ribeye Steak", "Premium cut beef", 32.99),
            ("Chicken Parmesan", "Breaded chicken with cheese", 18.99),
            ("Pasta Carbonara", "Classic Italian pasta", 16.99),
            ("Veggie Burger", "Plant-based patty", 14.99),
        ],
        4: [  # Desserts
            ("Tiramisu", "Classic Italian dessert", 7.99),
            ("Chocolate Cake", "Rich dark chocolate", 8.99),
            ("Panna Cotta", "Vanilla cream dessert", 6.99),
            ("Ice Cream", "Three scoops", 5.99),
        ],
        5: [  # Beverages
            ("Coca Cola", "Classic soft drink", 3.99),
            ("Fresh Juice", "Orange or apple", 5.99),
            ("Coffee", "Espresso based", 4.99),
            ("Wine", "House red or white", 8.99),
        ],
        6: [  # Specials
            ("Chef's Special", "Daily special dish", 28.99),
            ("Tasting Menu", "5 course experience", 59.99),
        ]
    }
    
    for cat_id, items in product_templates.items():
        for name, desc, price in items:
            products.append({
                "id": product_id,
                "name": name,
                "description": desc,
                "price": price,
                "category_id": cat_id,
                "subcategory_id": 1 if cat_id <= 3 else None,
                "image_url": f"https://images.pexels.com/photos/{1000000 + product_id}/pexels-photo.jpeg?w=400",
                "available": True
            })
            product_id += 1
    
    return products

PRODUCTS = generate_products()

TABLES = [
    {"id": 1, "number": 1, "capacity": 4, "status": "available", "location": "Main Hall"},
    {"id": 2, "number": 2, "capacity": 4, "status": "available", "location": "Main Hall"},
    {"id": 3, "number": 3, "capacity": 6, "status": "available", "location": "Terrace"},
    {"id": 4, "number": 4, "capacity": 2, "status": "available", "location": "Bar"},
    {"id": 5, "number": 5, "capacity": 8, "status": "available", "location": "Private"},
]

CUSTOMERS = [
    {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "555-0001", "address": "123 Main St"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "phone": "555-0002", "address": "456 Oak Ave"},
    {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "phone": "555-0003", "address": "789 Pine Rd"},
]

class FastRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # CORS headers
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        # Route handling (datos en memoria = respuesta instantánea)
        if parsed_path.path == '/api/categories':
            self.wfile.write(json.dumps(CATEGORIES).encode())
            
        elif parsed_path.path == '/api/subcategories':
            query_params = parse_qs(parsed_path.query)
            if 'category_id' in query_params:
                cat_id = int(query_params['category_id'][0])
                filtered = [s for s in SUBCATEGORIES if s['category_id'] == cat_id]
                self.wfile.write(json.dumps({"subcategories": filtered}).encode())
            else:
                self.wfile.write(json.dumps({"subcategories": SUBCATEGORIES}).encode())
                
        elif parsed_path.path == '/api/products':
            query_params = parse_qs(parsed_path.query)
            if 'category_id' in query_params:
                cat_id = int(query_params['category_id'][0])
                filtered = [p for p in PRODUCTS if p['category_id'] == cat_id]
                self.wfile.write(json.dumps(filtered).encode())
            else:
                self.wfile.write(json.dumps(PRODUCTS).encode())
                
        elif parsed_path.path == '/api/tables':
            self.wfile.write(json.dumps(TABLES).encode())
            
        elif parsed_path.path == '/api/customers':
            query_params = parse_qs(parsed_path.query)
            if 'search' in query_params:
                search = query_params['search'][0].lower()
                filtered = [c for c in CUSTOMERS if search in c['name'].lower()]
                self.wfile.write(json.dumps(filtered).encode())
            else:
                self.wfile.write(json.dumps(CUSTOMERS).encode())
                
        elif parsed_path.path == '/api/orders/kitchen':
            self.wfile.write(json.dumps([]).encode())
            
        elif parsed_path.path == '/api/users/me':
            user = {
                "id": 1,
                "email": "admin@restaurant.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin"
            }
            self.wfile.write(json.dumps(user).encode())
            
        elif parsed_path.path == '/health':
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            
        else:
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_POST(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        if self.path == '/api/auth/login':
            self.wfile.write(json.dumps({
                "access_token": "fake-jwt-token",
                "user": {
                    "id": 1,
                    "email": "admin@restaurant.com",
                    "first_name": "Admin",
                    "last_name": "User",
                    "role": "admin"
                }
            }).encode())
        elif self.path == '/api/auth/logout':
            self.wfile.write(json.dumps({"success": True}).encode())
        elif self.path == '/api/orders':
            self.wfile.write(json.dumps({"id": 1, "status": "created"}).encode())
        else:
            self.wfile.write(json.dumps({"success": True}).encode())
    
    def do_PUT(self):
        self.do_POST()
    
    def do_DELETE(self):
        self.do_POST()
    
    def log_message(self, format, *args):
        # Reducir logs para mejor rendimiento
        pass

if __name__ == "__main__":
    print(f"""
╔══════════════════════════════════════════╗
║      🚀 FAST RESTAURANT SERVER 🚀        ║
╠══════════════════════════════════════════╣
║  ⚡ Optimizado para velocidad             ║
║  📍 Puerto: {PORT}                        ║
║  💾 Datos: En memoria (súper rápido)     ║
║  🌐 URL: http://localhost:{PORT}          ║
╚══════════════════════════════════════════╝
    """)
    
    with socketserver.TCPServer(("", PORT), FastRequestHandler) as httpd:
        httpd.serve_forever()