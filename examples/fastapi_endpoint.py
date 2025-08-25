"""
Patrón estándar para endpoints de FastAPI con MySQL.
SIEMPRE usar esta estructura para APIs del sistema gastronómico.

Incluye:
- FastAPI con type hints completos
- MySQL con SQLAlchemy 2.0
- Validación con Pydantic
- Manejo de errores robusto
- Autenticación JWT
- Documentación automática
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field, validator
import stripe

# Importaciones del proyecto (ajustar según estructura)
from database import get_db_session
from models import Product, Category, Order, OrderItem, User, Table, Payment
from auth import verify_jwt_token, require_role, get_current_user
from services.stripe_service import StripeService
from services.websocket_service import WebSocketManager

# Router con prefijo para productos
router = APIRouter(prefix="/api/v1/products", tags=["products"])
security = HTTPBearer()

# ================================================================
# SCHEMAS DE VALIDACIÓN (Pydantic)
# ================================================================

class ProductBase(BaseModel):
    """Schema base para productos"""
    name: str = Field(..., min_length=1, max_length=200, description="Nombre del producto")
    description: Optional[str] = Field(None, max_length=1000, description="Descripción del producto")
    category_id: int = Field(..., gt=0, description="ID de la categoría")
    base_price: Decimal = Field(..., gt=0, description="Precio base del producto")
    preparation_time: int = Field(..., ge=0, le=180, description="Tiempo de preparación en minutos")
    is_available: bool = Field(True, description="Disponibilidad del producto")
    allergens: Optional[List[str]] = Field(None, description="Lista de alérgenos")
    tags: Optional[List[str]] = Field(None, description="Tags para filtrado")
    
    @validator('base_price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('El precio debe ser mayor a 0')
        if v > 999999.99:
            raise ValueError('El precio es demasiado alto')
        return round(v, 2)
    
    @validator('allergens')
    def validate_allergens(cls, v):
        if v:
            valid_allergens = ['gluten', 'lactosa', 'nueces', 'mariscos', 'huevos', 'soja', 'pescado']
            for allergen in v:
                if allergen.lower() not in valid_allergens:
                    raise ValueError(f'Alérgeno inválido: {allergen}')
        return v

class ProductCreate(ProductBase):
    """Schema para crear productos"""
    cost_price: Optional[Decimal] = Field(None, gt=0, description="Precio de costo (opcional)")
    image_url: Optional[str] = Field(None, max_length=500, description="URL de la imagen")

class ProductUpdate(BaseModel):
    """Schema para actualizar productos - todos los campos opcionales"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category_id: Optional[int] = Field(None, gt=0)
    base_price: Optional[Decimal] = Field(None, gt=0)
    preparation_time: Optional[int] = Field(None, ge=0, le=180)
    is_available: Optional[bool] = None
    allergens: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    cost_price: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=500)

class ProductResponse(ProductBase):
    """Schema de respuesta para productos"""
    id: int
    cost_price: Optional[Decimal]
    image_url: Optional[str]
    slug: Optional[str]
    calories: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    # Campos calculados
    profit_margin: Optional[Decimal]
    
    # Relaciones
    category: Dict[str, Any]
    variants: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    """Schema para crear pedidos"""
    table_number: int = Field(..., gt=0, description="Número de mesa")
    customer_name: Optional[str] = Field(None, max_length=200)
    customer_notes: Optional[str] = Field(None, max_length=1000)
    order_type: str = Field("dine_in", description="Tipo de pedido")
    items: List[Dict[str, Any]] = Field(..., min_items=1, description="Items del pedido")
    
    @validator('order_type')
    def validate_order_type(cls, v):
        valid_types = ['dine_in', 'takeout', 'delivery']
        if v not in valid_types:
            raise ValueError(f'Tipo de pedido debe ser uno de: {valid_types}')
        return v

class OrderResponse(BaseModel):
    """Schema de respuesta para pedidos"""
    id: int
    table_number: int
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    ordered_at: datetime
    estimated_ready_time: Optional[datetime]
    customer_name: Optional[str]
    order_type: str
    items: List[Dict[str, Any]]
    waiter: Dict[str, str]
    
    class Config:
        from_attributes = True

# ================================================================
# ENDPOINTS DE PRODUCTOS
# ================================================================

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db_session),
    category_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    is_available: Optional[bool] = Query(None, description="Filtrar por disponibilidad"),
    search: Optional[str] = Query(None, description="Buscar en nombre o descripción"),
    tags: Optional[str] = Query(None, description="Filtrar por tags (separados por coma)"),
    limit: int = Query(50, le=100, description="Límite de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginación")
):
    """
    Obtener lista de productos con filtros opcionales.
    Optimizado para menú del restaurante.
    """
    # Construir query con joins optimizados para MySQL
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.variants)
    )
    
    # Aplicar filtros
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    if is_available is not None:
        query = query.where(Product.is_available == is_available)
    
    if search:
        # Búsqueda en MySQL con LIKE optimizado
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.like(search_term),
                Product.description.like(search_term)
            )
        )
    
    if tags:
        # Filtro por tags usando JSON_CONTAINS en MySQL
        tag_list = [tag.strip() for tag in tags.split(",")]
        for tag in tag_list:
            query = query.where(func.json_contains(Product.tags, f'"{tag}"'))
    
    # Ordenar por categoría y disponibilidad
    query = query.order_by(Product.category_id, desc(Product.is_available), Product.name)
    
    # Aplicar paginación
    query = query.offset(offset).limit(limit)
    
    # Ejecutar query
    result = await db.execute(query)
    products = result.scalars().all()
    
    return products

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Crear nuevo producto. Solo admins y managers.
    Incluye notificación en tiempo real a interfaces conectadas.
    """
    try:
        # Verificar que la categoría existe
        category = await db.get(Category, product_data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría no encontrada"
            )
        
        # Crear el producto
        new_product = Product(**product_data.dict())
        
        # Generar slug automático
        slug_base = product_data.name.lower().replace(" ", "-")
        new_product.slug = slug_base
        
        db.add(new_product)
        
        # Commit con manejo de errores MySQL
        try:
            await db.commit()
            await db.refresh(new_product)
        except IntegrityError as e:
            await db.rollback()
            if "slug" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto con ese nombre"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al crear producto: datos duplicados"
            )
        
        # Notificar en tiempo real a interfaces conectadas
        background_tasks.add_task(
            notify_product_update,
            "product_created",
            new_product.id,
            current_user.id
        )
        
        # Cargar relaciones para respuesta
        await db.refresh(new_product, ["category", "variants"])
        
        return new_product
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db_session)
):
    """
    Obtener producto específico por ID con todas sus relaciones.
    """
    # Query optimizado con carga de relaciones
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.ingredients)
    ).where(Product.id == product_id)
    
    result = await db.execute(query)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Actualizar producto existente.
    Notifica cambios en tiempo real.
    """
    # Obtener producto existente
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Actualizar solo campos proporcionados
    update_data = product_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    try:
        await db.commit()
        await db.refresh(product, ["category", "variants"])
        
        # Notificar actualización en tiempo real
        background_tasks.add_task(
            notify_product_update,
            "product_updated",
            product.id,
            current_user.id
        )
        
        return product
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar: datos duplicados"
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Eliminar producto. Solo admins.
    Verifica que no tenga pedidos activos.
    """
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Verificar que no hay pedidos activos con este producto
    active_orders_query = select(func.count(OrderItem.id)).where(
        and_(
            OrderItem.product_id == product_id,
            OrderItem.status.in_(["pending", "preparing"])
        )
    )
    
    result = await db.execute(active_orders_query)
    active_count = result.scalar()
    
    if active_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar: producto tiene pedidos activos"
        )
    
    try:
        await db.delete(product)
        await db.commit()
        
        # Notificar eliminación
        background_tasks.add_task(
            notify_product_update,
            "product_deleted",
            product_id,
            current_user.id
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar producto: {str(e)}"
        )

# ================================================================
# ENDPOINTS DE PEDIDOS
# ================================================================

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(["waiter", "admin", "manager"]))
):
    """
    Crear nuevo pedido.
    Incluye validación de stock y notificación a cocina.
    """
    try:
        # Verificar que la mesa existe y está disponible
        table = await db.get(Table, order_data.table_number)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mesa no encontrada"
            )
        
        if table.current_status not in ["available", "occupied"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mesa no disponible para nuevos pedidos"
            )
        
        # Crear el pedido principal
        new_order = Order(
            table_number=order_data.table_number,
            waiter_id=current_user.id,
            customer_name=order_data.customer_name,
            customer_notes=order_data.customer_notes,
            order_type=order_data.order_type,
            status="pending"
        )
        
        db.add(new_order)
        await db.flush()  # Para obtener el ID del pedido
        
        # Procesar items del pedido
        total_amount = Decimal(0)
        estimated_prep_time = 0
        
        for item_data in order_data.items:
            # Validar producto
            product = await db.get(Product, item_data["product_id"])
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto {item_data['product_id']} no encontrado"
                )
            
            if not product.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Producto '{product.name}' no disponible"
                )
            
            # Crear item del pedido
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item_data["quantity"],
                unit_price=product.base_price,
                modifications=item_data.get("modifications"),
                special_notes=item_data.get("special_notes"),
                status="pending"
            )
            
            db.add(order_item)
            
            # Calcular totales
            item_total = product.base_price * item_data["quantity"]
            total_amount += item_total
            
            # Calcular tiempo estimado (el mayor tiempo de preparación)
            estimated_prep_time = max(estimated_prep_time, product.preparation_time)
        
        # Actualizar totales del pedido
        tax_rate = Decimal("0.21")  # 21% IVA Argentina
        new_order.subtotal = total_amount
        new_order.tax_amount = total_amount * tax_rate
        new_order.total_amount = total_amount + new_order.tax_amount
        
        # Calcular tiempo estimado
        new_order.estimated_ready_time = datetime.now() + timedelta(minutes=estimated_prep_time)
        
        # Actualizar estado de la mesa
        table.current_status = "occupied"
        table.current_order_id = new_order.id
        
        await db.commit()
        
        # Cargar relaciones para respuesta
        await db.refresh(new_order, ["items", "waiter", "table"])
        
        # Notificar a cocina en tiempo real
        background_tasks.add_task(
            notify_kitchen_new_order,
            new_order.id,
            current_user.id
        )
        
        return new_order
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear pedido: {str(e)}"
        )

# ================================================================
# FUNCIONES DE UTILIDAD Y BACKGROUND TASKS
# ================================================================

async def notify_product_update(event_type: str, product_id: int, user_id: int):
    """
    Notificar actualización de producto via WebSocket.
    """
    try:
        ws_manager = WebSocketManager()
        await ws_manager.broadcast_to_role(
            message={
                "type": event_type,
                "product_id": product_id,
                "updated_by": user_id,
                "timestamp": datetime.now().isoformat()
            },
            roles=["admin", "manager", "waiter"]
        )
    except Exception as e:
        # Log error pero no fallar la request principal
        print(f"Error notificando actualización de producto: {e}")

async def notify_kitchen_new_order(order_id: int, waiter_id: int):
    """
    Notificar nuevo pedido a la cocina.
    """
    try:
        ws_manager = WebSocketManager()
        await ws_manager.broadcast_to_role(
            message={
                "type": "new_order",
                "order_id": order_id,
                "waiter_id": waiter_id,
                "timestamp": datetime.now().isoformat(),
                "sound_alert": True  # Para reproducir sonido en cocina
            },
            roles=["kitchen", "admin", "manager"]
        )
    except Exception as e:
        print(f"Error notificando pedido a cocina: {e}")

# ================================================================
# ENDPOINTS DE ANALYTICS Y REPORTES
# ================================================================

@router.get("/analytics/popular", response_model=List[Dict[str, Any]])
async def get_popular_products(
    db: Session = Depends(get_db_session),
    days: int = Query(30, le=365, description="Días a analizar"),
    limit: int = Query(10, le=50, description="Límite de resultados"),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """
    Obtener productos más vendidos en período especificado.
    """
    start_date = datetime.now() - timedelta(days=days)
    
    # Query optimizado para MySQL con agregaciones
    query = select(
        Product.id,
        Product.name,
        Product.base_price,
        func.count(OrderItem.id).label("times_ordered"),
        func.sum(OrderItem.quantity).label("total_quantity"),
        func.sum(OrderItem.unit_price * OrderItem.quantity).label("total_revenue")
    ).select_from(
        Product.__table__.join(OrderItem.__table__)
        .join(Order.__table__)
    ).where(
        and_(
            Order.ordered_at >= start_date,
            Order.status.in_(["delivered", "paid"])
        )
    ).group_by(
        Product.id, Product.name, Product.base_price
    ).order_by(
        desc("total_quantity")
    ).limit(limit)
    
    result = await db.execute(query)
    return [dict(row) for row in result.fetchall()]

# ================================================================
# CONFIGURACIÓN DE STRIPE PARA PAGOS
# ================================================================

@router.post("/orders/{order_id}/payment/intent")
async def create_payment_intent(
    order_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(["waiter", "cashier", "admin"]))
):
    """
    Crear PaymentIntent de Stripe para procesar pago.
    """
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado"
        )
    
    if order.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pedido no está listo para pago"
        )
    
    try:
        stripe_service = StripeService()
        
        # Crear PaymentIntent en Stripe
        payment_intent = await stripe_service.create_payment_intent(
            amount=int(order.total_amount * 100),  # Stripe usa centavos
            currency="ars",
            metadata={
                "order_id": order.id,
                "table_number": order.table_number,
                "restaurant_id": "gastronomy_system"
            }
        )
        
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
            "amount": order.total_amount
        }
        
    except stripe.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de Stripe: {str(e)}"
        )

# ================================================================
# MIDDLEWARE DE MANEJO DE ERRORES MYSQL
# ================================================================

def handle_mysql_errors(func):
    """
    Decorator para manejar errores comunes de MySQL.
    """
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except IntegrityError as e:
            error_msg = str(e.orig)
            if "Duplicate entry" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Datos duplicados: registro ya existe"
                )
            elif "foreign key constraint" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error de referencia: registro relacionado no existe"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error de integridad de datos"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno: {str(e)}"
            )
    return wrapper

"""
CONFIGURACIÓN MYSQL ESPECÍFICA:

1. Variables de entorno necesarias:
   DATABASE_URL="mysql+pymysql://user:pass@host:3306/db?charset=utf8mb4"
   
2. Índices optimizados para performance:
   CREATE INDEX idx_products_category_available ON products(category_id, is_available);
   CREATE INDEX idx_orders_status_date ON orders(status, ordered_at);
   CREATE INDEX idx_order_items_order_status ON order_items(order_id, status);

3. Configuración de SQLAlchemy para MySQL:
   engine = create_async_engine(
       DATABASE_URL,
       pool_size=20,
       max_overflow=30,
       pool_timeout=30,
       pool_recycle=3600,
       echo=False
   )

4. Transacciones ACID para operaciones críticas:
   - Creación de pedidos con múltiples items
   - Procesamiento de pagos
   - Actualizaciones de inventario

5. Optimizaciones específicas para restaurantes:
   - Queries con LIMIT para menús grandes
   - Filtros por disponibilidad optimizados
   - Agregaciones para analytics en tiempo real
   - JSON columns para datos flexibles (tags, modificaciones)
"""