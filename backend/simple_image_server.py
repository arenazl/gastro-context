#!/usr/bin/env python3
"""
Servidor simple solo para servir imágenes estáticas
"""
import http.server
import socketserver
import os

PORT = 9003
DIRECTORY = "/mnt/c/Code/gastro-context/backend/static/products"

class ImageHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Agregar CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()

print(f"🖼️  Servidor de imágenes en puerto {PORT}")
print(f"📁 Sirviendo desde: {DIRECTORY}")
print(f"🔗 URL base: http://172.29.228.80:{PORT}/")

with socketserver.TCPServer(("0.0.0.0", PORT), ImageHandler) as httpd:
    httpd.serve_forever()