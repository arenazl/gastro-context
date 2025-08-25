#!/usr/bin/env python3
"""
WebSocket server for real-time kitchen updates
Works without external dependencies using built-in libraries
"""
import asyncio
import json
import hashlib
import base64
import struct
import socket
import threading
from datetime import datetime

class WebSocketServer:
    def __init__(self, host='0.0.0.0', port=9001):
        self.host = host
        self.port = port
        self.clients = set()
        self.orders = {}
        self.order_counter = 1
        
    def start(self):
        """Start the WebSocket server"""
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((self.host, self.port))
        server_socket.listen(5)
        
        print(f"🔌 WebSocket Server listening on ws://{self.host}:{self.port}")
        
        while True:
            client_socket, address = server_socket.accept()
            client_thread = threading.Thread(target=self.handle_client, args=(client_socket,))
            client_thread.start()
    
    def handle_client(self, client_socket):
        """Handle individual WebSocket client connection"""
        # Perform WebSocket handshake
        request = client_socket.recv(1024).decode('utf-8')
        
        # Extract WebSocket key from headers
        key = None
        for line in request.split('\n'):
            if 'Sec-WebSocket-Key:' in line:
                key = line.split(': ')[1].strip()
                break
        
        if not key:
            client_socket.close()
            return
        
        # Generate accept key
        accept_key = base64.b64encode(
            hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()
        ).decode('utf-8')
        
        # Send handshake response
        response = (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept_key}\r\n"
            "\r\n"
        )
        client_socket.send(response.encode())
        
        # Add client to connected clients
        self.clients.add(client_socket)
        
        # Send initial connection message
        self.send_message(client_socket, json.dumps({
            "type": "connection",
            "status": "connected",
            "message": "Connected to kitchen updates"
        }))
        
        try:
            while True:
                # Receive WebSocket frame
                data = self.receive_frame(client_socket)
                if not data:
                    break
                
                # Parse message
                try:
                    message = json.loads(data)
                    self.handle_message(client_socket, message)
                except json.JSONDecodeError:
                    pass
                    
        except Exception as e:
            print(f"Client disconnected: {e}")
        finally:
            self.clients.discard(client_socket)
            client_socket.close()
    
    def receive_frame(self, client_socket):
        """Receive and decode WebSocket frame"""
        try:
            # Read frame header
            header = client_socket.recv(2)
            if len(header) < 2:
                return None
            
            # Parse header
            fin = (header[0] & 0x80) != 0
            opcode = header[0] & 0x0F
            masked = (header[1] & 0x80) != 0
            payload_length = header[1] & 0x7F
            
            # Handle different payload lengths
            if payload_length == 126:
                extended = client_socket.recv(2)
                payload_length = struct.unpack('>H', extended)[0]
            elif payload_length == 127:
                extended = client_socket.recv(8)
                payload_length = struct.unpack('>Q', extended)[0]
            
            # Read mask if present
            if masked:
                mask = client_socket.recv(4)
            
            # Read payload
            payload = client_socket.recv(payload_length)
            
            # Unmask payload if needed
            if masked:
                payload = bytes([payload[i] ^ mask[i % 4] for i in range(len(payload))])
            
            # Handle different opcodes
            if opcode == 0x8:  # Close frame
                return None
            elif opcode == 0x9:  # Ping frame
                self.send_pong(client_socket, payload)
                return self.receive_frame(client_socket)
            elif opcode == 0x1:  # Text frame
                return payload.decode('utf-8')
            
            return None
            
        except Exception:
            return None
    
    def send_message(self, client_socket, message):
        """Send message to client"""
        try:
            payload = message.encode('utf-8')
            frame = bytearray()
            
            # FIN = 1, opcode = 1 (text)
            frame.append(0x81)
            
            # Add payload length
            length = len(payload)
            if length < 126:
                frame.append(length)
            elif length < 65536:
                frame.append(126)
                frame.extend(struct.pack('>H', length))
            else:
                frame.append(127)
                frame.extend(struct.pack('>Q', length))
            
            # Add payload
            frame.extend(payload)
            
            client_socket.send(bytes(frame))
            return True
        except:
            return False
    
    def send_pong(self, client_socket, payload):
        """Send pong frame"""
        frame = bytearray()
        frame.append(0x8A)  # FIN = 1, opcode = 10 (pong)
        frame.append(len(payload))
        frame.extend(payload)
        client_socket.send(bytes(frame))
    
    def broadcast(self, message):
        """Broadcast message to all connected clients"""
        disconnected = set()
        for client in self.clients:
            if not self.send_message(client, message):
                disconnected.add(client)
        
        # Remove disconnected clients
        self.clients -= disconnected
    
    def handle_message(self, client_socket, message):
        """Handle incoming WebSocket messages"""
        msg_type = message.get('type')
        
        if msg_type == 'new_order':
            # New order from POS
            order = {
                'id': self.order_counter,
                'table_number': message.get('table_number'),
                'items': message.get('items', []),
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'waiter': message.get('waiter', 'Unknown')
            }
            self.orders[self.order_counter] = order
            self.order_counter += 1
            
            # Broadcast to all kitchen displays
            self.broadcast(json.dumps({
                'type': 'order_received',
                'order': order
            }))
            
        elif msg_type == 'update_order_status':
            # Kitchen updating order status
            order_id = message.get('order_id')
            new_status = message.get('status')
            
            if order_id in self.orders:
                self.orders[order_id]['status'] = new_status
                self.orders[order_id]['updated_at'] = datetime.now().isoformat()
                
                # Broadcast status update
                self.broadcast(json.dumps({
                    'type': 'order_status_changed',
                    'order_id': order_id,
                    'status': new_status,
                    'updated_at': self.orders[order_id]['updated_at']
                }))
                
        elif msg_type == 'update_item_status':
            # Update individual item status
            order_id = message.get('order_id')
            item_index = message.get('item_index')
            new_status = message.get('status')
            
            if order_id in self.orders and item_index < len(self.orders[order_id]['items']):
                self.orders[order_id]['items'][item_index]['status'] = new_status
                
                # Check if all items are ready
                all_ready = all(item.get('status') == 'ready' for item in self.orders[order_id]['items'])
                if all_ready:
                    self.orders[order_id]['status'] = 'ready'
                
                # Broadcast item update
                self.broadcast(json.dumps({
                    'type': 'item_status_changed',
                    'order_id': order_id,
                    'item_index': item_index,
                    'status': new_status,
                    'order_ready': all_ready
                }))
        
        elif msg_type == 'get_active_orders':
            # Send all active orders to new kitchen display
            active_orders = [order for order in self.orders.values() 
                           if order['status'] not in ['delivered', 'cancelled']]
            
            self.send_message(client_socket, json.dumps({
                'type': 'active_orders',
                'orders': active_orders
            }))
        
        elif msg_type == 'ping':
            # Respond to ping
            self.send_message(client_socket, json.dumps({
                'type': 'pong',
                'timestamp': datetime.now().isoformat()
            }))

if __name__ == "__main__":
    server = WebSocketServer()
    server.start()