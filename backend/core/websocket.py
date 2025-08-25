"""
WebSocket manager for real-time communication.
"""
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import structlog
from datetime import datetime

logger = structlog.get_logger()

class ConnectionManager:
    """
    Manages WebSocket connections for different roles.
    """
    
    def __init__(self):
        # Store active connections by role
        self.active_connections: Dict[str, List[WebSocket]] = {
            "kitchen": [],
            "waiter": [],
            "cashier": [],
            "admin": [],
            "manager": []
        }
        
        # Store connection metadata
        self.connection_info: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, role: str, user_id: int, username: str):
        """
        Accept a new WebSocket connection.
        """
        await websocket.accept()
        
        # Add to appropriate role list
        if role in self.active_connections:
            self.active_connections[role].append(websocket)
        else:
            self.active_connections[role] = [websocket]
        
        # Store connection metadata
        self.connection_info[websocket] = {
            "role": role,
            "user_id": user_id,
            "username": username,
            "connected_at": datetime.utcnow().isoformat()
        }
        
        logger.info(
            "WebSocket connected",
            role=role,
            user_id=user_id,
            username=username
        )
        
        # Notify others about new connection
        await self.broadcast_to_role(
            role="admin",
            message={
                "type": "user_connected",
                "role": role,
                "username": username,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection.
        """
        # Get connection info before removing
        info = self.connection_info.get(websocket, {})
        role = info.get("role", "unknown")
        username = info.get("username", "unknown")
        
        # Remove from role list
        if role in self.active_connections:
            if websocket in self.active_connections[role]:
                self.active_connections[role].remove(websocket)
        
        # Remove connection info
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        
        logger.info(
            "WebSocket disconnected",
            role=role,
            username=username
        )
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.
        """
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error("Failed to send personal message", error=str(e))
            self.disconnect(websocket)
    
    async def send_json_to_socket(self, data: dict, websocket: WebSocket):
        """
        Send JSON data to a specific WebSocket.
        """
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.error("Failed to send JSON", error=str(e))
            self.disconnect(websocket)
    
    async def broadcast_to_role(self, role: str, message: dict):
        """
        Broadcast a message to all connections with a specific role.
        """
        if role not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[role]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(
                    "Failed to broadcast to connection",
                    role=role,
                    error=str(e)
                )
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_to_all(self, message: dict):
        """
        Broadcast a message to all connected clients.
        """
        for role in self.active_connections:
            await self.broadcast_to_role(role, message)
    
    async def notify_kitchen_new_order(self, order_data: dict):
        """
        Notify kitchen about a new order.
        """
        message = {
            "type": "new_order",
            "order": order_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_role("kitchen", message)
        await self.broadcast_to_role("admin", message)
        
        logger.info(
            "Kitchen notified of new order",
            order_id=order_data.get("id"),
            table_number=order_data.get("table_number")
        )
    
    async def notify_order_status_update(self, order_id: int, table_number: int, 
                                        status: str, waiter_id: int = None):
        """
        Notify relevant parties about order status update.
        """
        message = {
            "type": "order_status_update",
            "order_id": order_id,
            "table_number": table_number,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Notify kitchen
        await self.broadcast_to_role("kitchen", message)
        
        # Notify waiters
        await self.broadcast_to_role("waiter", message)
        
        # Notify admin
        await self.broadcast_to_role("admin", message)
        
        # If order is ready, send special notification to waiters
        if status == "ready":
            ready_message = {
                "type": "order_ready",
                "order_id": order_id,
                "table_number": table_number,
                "timestamp": datetime.utcnow().isoformat(),
                "alert": True
            }
            await self.broadcast_to_role("waiter", ready_message)
        
        logger.info(
            "Order status update broadcasted",
            order_id=order_id,
            table_number=table_number,
            status=status
        )
    
    async def notify_table_status_update(self, table_number: int, status: str):
        """
        Notify about table status update.
        """
        message = {
            "type": "table_status_update",
            "table_number": table_number,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Notify waiters and hosts
        await self.broadcast_to_role("waiter", message)
        await self.broadcast_to_role("admin", message)
        await self.broadcast_to_role("manager", message)
        
        logger.info(
            "Table status update broadcasted",
            table_number=table_number,
            status=status
        )
    
    async def notify_payment_processed(self, order_id: int, table_number: int, 
                                      amount: float, payment_method: str):
        """
        Notify about payment processing.
        """
        message = {
            "type": "payment_processed",
            "order_id": order_id,
            "table_number": table_number,
            "amount": amount,
            "payment_method": payment_method,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Notify cashier and admin
        await self.broadcast_to_role("cashier", message)
        await self.broadcast_to_role("admin", message)
        
        # Also notify waiters so they know the table is about to be freed
        await self.broadcast_to_role("waiter", message)
        
        logger.info(
            "Payment notification sent",
            order_id=order_id,
            table_number=table_number,
            amount=amount
        )
    
    def get_connection_count(self) -> Dict[str, int]:
        """
        Get count of active connections by role.
        """
        return {
            role: len(connections) 
            for role, connections in self.active_connections.items()
        }
    
    def get_all_connections_info(self) -> List[Dict]:
        """
        Get information about all active connections.
        """
        return [
            {
                **info,
                "role": info.get("role", "unknown"),
                "user_id": info.get("user_id", 0),
                "username": info.get("username", "unknown")
            }
            for info in self.connection_info.values()
        ]


# Create a global instance
manager = ConnectionManager()