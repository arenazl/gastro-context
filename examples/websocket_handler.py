"""
Manejo de WebSockets para comunicación en tiempo real en el sistema gastronómico.
SIEMPRE usar esta estructura para WebSocket endpoints y manejo de conexiones.

Casos críticos:
- Notificaciones instantáneas a cocina cuando llega un pedido
- Actualizaciones de estado de pedidos en tiempo real
- Alertas de stock bajo a administradores
- Sincronización de disponibilidad de productos
"""

from datetime import datetime
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect, Depends
from fastapi.routing import APIRouter
from sqlalchemy.orm import Session
import json
import asyncio
import logging

from .database import get_db
from .models import User, Order, Product
from .auth import get_current_user_websocket

# Router para WebSocket endpoints
ws_router = APIRouter()

# Logging para debugging
logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    Gestor centralizado de conexiones WebSocket para el sistema gastronómico.
    Maneja conexiones por roles y tipos de dispositivos.
    """
    
    def __init__(self):
        # Conexiones activas organizadas por rol y usuario
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "kitchen": set(),
            "waiters": set(), 
            "managers": set(),
            "cashiers": set(),
            "all": set()
        }
        
        # Mapeo de websocket a información del usuario
        self.connection_info: Dict[WebSocket, Dict] = {}
        
        # Conexiones por mesa (para notificaciones específicas)
        self.table_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user: User, table_number: int = None):
        """Conectar un nuevo WebSocket con información del usuario"""
        await websocket.accept()
        
        # Agregar a conexiones generales
        self.active_connections["all"].add(websocket)
        
        # Agregar según rol del usuario
        role = user.role
        if role == "kitchen":
            self.active_connections["kitchen"].add(websocket)
        elif role == "waiter":
            self.active_connections["waiters"].add(websocket)
        elif role in ["admin", "manager"]:
            self.active_connections["managers"].add(websocket)
        elif role == "cashier":
            self.active_connections["cashiers"].add(websocket)
        
        # Guardar información del usuario y mesa
        self.connection_info[websocket] = {
            "user_id": user.id,
            "user_role": role,
            "user_name": f"{user.first_name} {user.last_name}",
            "table_number": table_number,
            "connected_at": datetime.utcnow()
        }
        
        # Conectar a mesa específica si es mesero
        if table_number and role == "waiter":
            if table_number not in self.table_connections:
                self.table_connections[table_number] = set()
            self.table_connections[table_number].add(websocket)
        
        logger.info(f"Usuario {user.email} ({role}) conectado via WebSocket")
        
        # Enviar mensaje de bienvenida con estado inicial
        await self.send_personal_message({
            "type": "connection_success",
            "message": f"Conectado como {role}",
            "user_info": {
                "name": f"{user.first_name} {user.last_name}",
                "role": role,
                "table_number": table_number
            },
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Desconectar un WebSocket y limpiar referencias"""
        # Remover de todas las listas
        for role_connections in self.active_connections.values():
            role_connections.discard(websocket)
        
        # Remover de conexiones de mesa
        for table_connections in self.table_connections.values():
            table_connections.discard(websocket)
        
        # Limpiar información del usuario
        user_info = self.connection_info.pop(websocket, {})
        
        logger.info(f"Usuario {user_info.get('user_name', 'Desconocido')} desconectado")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Enviar mensaje a una conexión específica"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error enviando mensaje personal: {e}")
            self.disconnect(websocket)
    
    async def broadcast_to_role(self, role: str, message: dict):
        """Enviar mensaje a todos los usuarios de un rol específico"""
        if role not in self.active_connections:
            logger.warning(f"Rol {role} no existe en conexiones")
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        message_text = json.dumps(message)
        
        # Lista de conexiones a remover (si fallan)
        failed_connections = []
        
        for websocket in self.active_connections[role].copy():
            try:
                await websocket.send_text(message_text)
            except Exception as e:
                logger.error(f"Error enviando a {role}: {e}")
                failed_connections.append(websocket)
        
        # Limpiar conexiones fallidas
        for websocket in failed_connections:
            self.disconnect(websocket)
    
    async def broadcast_to_table(self, table_number: int, message: dict):
        """Enviar mensaje a todos los dispositivos de una mesa específica"""
        if table_number not in self.table_connections:
            return
        
        message["timestamp"] = datetime.utcnow().isoformat()
        message_text = json.dumps(message)
        
        failed_connections = []
        
        for websocket in self.table_connections[table_number].copy():
            try:
                await websocket.send_text(message_text)
            except Exception as e:
                logger.error(f"Error enviando a mesa {table_number}: {e}")
                failed_connections.append(websocket)
        
        # Limpiar conexiones fallidas
        for websocket in failed_connections:
            self.disconnect(websocket)
    
    async def broadcast_to_all(self, message: dict):
        """Enviar mensaje a todas las conexiones activas"""
        await self.broadcast_to_role("all", message)
    
    def get_active_users_by_role(self, role: str) -> List[dict]:
        """Obtener lista de usuarios activos por rol"""
        users = []
        for websocket in self.active_connections.get(role, set()):
            if websocket in self.connection_info:
                users.append(self.connection_info[websocket])
        return users

# Instancia global del manager
websocket_manager = WebSocketManager()

@ws_router.websocket("/ws/kitchen")
async def kitchen_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint específico para cocina"""
    try:
        # Autenticar usuario (en producción usar token)
        # Por simplicidad, aquí asumimos autenticación previa
        user = await get_current_user_websocket(websocket, db)
        
        if user.role != "kitchen":
            await websocket.close(code=1008, reason="Acceso denegado: no es personal de cocina")
            return
        
        await websocket_manager.connect(websocket, user)
        
        # Enviar pedidos pendientes al conectarse
        pending_orders = db.query(Order).filter(
            Order.status.in_(["pending", "preparing"])
        ).order_by(Order.created_at).all()
        
        await websocket_manager.send_personal_message({
            "type": "pending_orders",
            "orders": [format_order_for_kitchen(order) for order in pending_orders]
        }, websocket)
        
        # Escuchar mensajes del cliente
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Manejar diferentes tipos de mensajes de cocina
            if message["type"] == "update_order_status":
                await handle_kitchen_status_update(message, user, db)
            elif message["type"] == "request_order_details":
                await handle_order_details_request(message, websocket, db)
            elif message["type"] == "mark_ingredient_unavailable":
                await handle_ingredient_unavailable(message, db)
    
    except WebSocketDisconnect:
        logger.info("Cocina desconectada")
    except Exception as e:
        logger.error(f"Error en WebSocket de cocina: {e}")
    finally:
        websocket_manager.disconnect(websocket)

@ws_router.websocket("/ws/waiter/{table_number}")
async def waiter_endpoint(
    websocket: WebSocket,
    table_number: int,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint para meseros con mesa específica"""
    try:
        user = await get_current_user_websocket(websocket, db)
        
        if user.role != "waiter":
            await websocket.close(code=1008, reason="Acceso denegado: no es mesero")
            return
        
        await websocket_manager.connect(websocket, user, table_number)
        
        # Enviar estado actual de la mesa
        table_orders = db.query(Order).filter(
            Order.table_number == table_number,
            Order.status != "paid"
        ).all()
        
        await websocket_manager.send_personal_message({
            "type": "table_status",
            "table_number": table_number,
            "active_orders": [format_order_for_waiter(order) for order in table_orders]
        }, websocket)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "create_order":
                await handle_new_order(message, user, table_number, db)
            elif message["type"] == "request_check":
                await handle_check_request(message, table_number, db)
            elif message["type"] == "mark_delivered":
                await handle_mark_delivered(message, user, db)
    
    except WebSocketDisconnect:
        logger.info(f"Mesero de mesa {table_number} desconectado")
    except Exception as e:
        logger.error(f"Error en WebSocket de mesero: {e}")
    finally:
        websocket_manager.disconnect(websocket)

@ws_router.websocket("/ws/admin")
async def admin_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint para administradores y managers"""
    try:
        user = await get_current_user_websocket(websocket, db)
        
        if user.role not in ["admin", "manager"]:
            await websocket.close(code=1008, reason="Acceso denegado: permisos insuficientes")
            return
        
        await websocket_manager.connect(websocket, user)
        
        # Enviar resumen del estado actual
        await send_admin_dashboard_update(websocket, db)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "get_real_time_stats":
                await send_admin_dashboard_update(websocket, db)
            elif message["type"] == "broadcast_announcement":
                await handle_admin_announcement(message, user)
            elif message["type"] == "update_product_availability":
                await handle_product_availability_update(message, db)
    
    except WebSocketDisconnect:
        logger.info("Admin desconectado")
    except Exception as e:
        logger.error(f"Error en WebSocket de admin: {e}")
    finally:
        websocket_manager.disconnect(websocket)

# Funciones auxiliares para manejar eventos específicos

async def handle_new_order(message: dict, user: User, table_number: int, db: Session):
    """Manejar creación de nuevo pedido desde mesero"""
    try:
        # Procesar el pedido (lógica de negocio)
        order_data = message["order_data"]
        
        # Crear orden en base de datos
        # (aquí iría la lógica de creación que ya tienes en el endpoint REST)
        
        # Notificar inmediatamente a cocina
        await websocket_manager.broadcast_to_role("kitchen", {
            "type": "new_order",
            "order_id": order_data["id"],
            "table_number": table_number,
            "waiter_name": f"{user.first_name} {user.last_name}",
            "items": order_data["items"],
            "priority": "normal",  # o calcular según tiempo de espera
            "estimated_time": calculate_estimated_preparation_time(order_data["items"])
        })
        
        # Notificar a managers para seguimiento
        await websocket_manager.broadcast_to_role("managers", {
            "type": "order_created",
            "order_id": order_data["id"],
            "table_number": table_number,
            "total_amount": order_data["total_amount"],
            "items_count": len(order_data["items"])
        })
        
        logger.info(f"Nuevo pedido {order_data['id']} notificado a cocina")
        
    except Exception as e:
        logger.error(f"Error procesando nuevo pedido: {e}")

async def handle_kitchen_status_update(message: dict, user: User, db: Session):
    """Manejar actualización de estado desde cocina"""
    try:
        order_id = message["order_id"]
        new_status = message["status"]
        
        # Actualizar en base de datos
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.status = new_status
            if new_status == "ready":
                order.ready_at = datetime.utcnow()
            db.commit()
            
            # Notificar al mesero de la mesa
            await websocket_manager.broadcast_to_table(order.table_number, {
                "type": "order_status_update",
                "order_id": order_id,
                "status": new_status,
                "message": get_status_message(new_status),
                "updated_by": "kitchen"
            })
            
            # Notificar a managers
            await websocket_manager.broadcast_to_role("managers", {
                "type": "order_status_update",
                "order_id": order_id,
                "table_number": order.table_number,
                "status": new_status,
                "preparation_time": order.preparation_time_minutes
            })
            
            logger.info(f"Pedido {order_id} actualizado a {new_status}")
        
    except Exception as e:
        logger.error(f"Error actualizando estado de pedido: {e}")

async def notify_low_stock_alert(ingredient_name: str, current_stock: float, min_stock: float):
    """Notificar alerta de stock bajo a administradores"""
    await websocket_manager.broadcast_to_role("managers", {
        "type": "low_stock_alert",
        "ingredient": ingredient_name,
        "current_stock": current_stock,
        "minimum_stock": min_stock,
        "urgency": "high" if current_stock < min_stock * 0.5 else "medium",
        "suggested_action": f"Reponer {ingredient_name} urgentemente"
    })

# Funciones utilitarias

def format_order_for_kitchen(order: Order) -> dict:
    """Formatear pedido para vista de cocina"""
    return {
        "id": order.id,
        "table_number": order.table_number,
        "status": order.status,
        "items": [
            {
                "product_name": item.product.name,
                "quantity": item.quantity,
                "modifications": item.modifications,
                "special_notes": item.special_notes,
                "preparation_time": item.product.preparation_time
            }
            for item in order.items
        ],
        "ordered_at": order.ordered_at.isoformat(),
        "customer_notes": order.customer_notes,
        "estimated_ready_time": calculate_estimated_ready_time(order)
    }

def format_order_for_waiter(order: Order) -> dict:
    """Formatear pedido para vista de mesero"""
    return {
        "id": order.id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "items_count": len(order.items),
        "ordered_at": order.ordered_at.isoformat(),
        "estimated_ready_time": calculate_estimated_ready_time(order)
    }

def calculate_estimated_preparation_time(items: List[dict]) -> int:
    """Calcular tiempo estimado de preparación en minutos"""
    # Lógica para calcular tiempo basado en productos y cantidad
    # En implementación real, considerar tiempos paralelos vs secuenciales
    return max([item.get("preparation_time", 15) for item in items])

def calculate_estimated_ready_time(order: Order) -> str:
    """Calcular hora estimada de finalización"""
    if order.preparation_started_at:
        # Si ya empezó, calcular basado en tiempo transcurrido
        estimated_total = calculate_estimated_preparation_time([])
        # Lógica más compleja aquí
        pass
    
    return (order.ordered_at + timedelta(minutes=30)).isoformat()

def get_status_message(status: str) -> str:
    """Obtener mensaje amigable para estado"""
    status_messages = {
        "pending": "Pedido recibido, esperando cocina",
        "preparing": "En preparación",
        "ready": "¡Listo para servir!",
        "delivered": "Entregado al cliente",
        "cancelled": "Pedido cancelado"
    }
    return status_messages.get(status, f"Estado: {status}")