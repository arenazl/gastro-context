"""
Patrón de testing para sistema gastronómico con MySQL.
SIEMPRE usar esta estructura para tests unitarios e integración.

Incluye:
- Pytest con fixtures específicas para restaurantes
- Base de datos MySQL de testing
- Factories para crear datos de prueba
- Tests de APIs críticas del negocio
- Tests de WebSockets en tiempo real
- Mocking de Stripe para pagos
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from typing import AsyncGenerator, Dict, Any

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Importaciones del proyecto
from main import app
from database import get_db_session, Base
from models import User, Product, Category, Order, Table, OrderItem
from auth import create_access_token
from services.stripe_service import StripeService

# ================================================================
# CONFIGURACIÓN DE BASE DE DATOS DE TESTING
# ================================================================

# MySQL Test Database URL
TEST_DATABASE_URL = "mysql+aiomysql://test_user:test_password@localhost:3306/gastronomy_test?charset=utf8mb4"

# Engine para testing con pool configurado para MySQL
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    pool_size=1,
    max_overflow=0,
    pool_pre_ping=True,
    echo=False  # Cambiar a True para debug SQL
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# ================================================================
# FIXTURES BÁSICAS
# ================================================================

@pytest_asyncio.fixture(scope="session")
async def setup_test_db():
    """
    Configurar base de datos de testing.
    Crear todas las tablas al inicio de la sesión.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Cleanup después de todos los tests
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session(setup_test_db) -> AsyncGenerator[AsyncSession, None]:
    """
    Crear sesión de base de datos para cada test.
    Rollback automático después de cada test.
    """
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Cliente HTTP asíncrono para testing de APIs.
    """
    # Override dependency de base de datos
    app.dependency_overrides[get_db_session] = lambda: db_session
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Cleanup
    app.dependency_overrides.clear()

# ================================================================
# FIXTURES DE DATOS DE TESTING (FACTORIES)
# ================================================================

@pytest_asyncio.fixture
async def test_category(db_session: AsyncSession) -> Category:
    """Crear categoría de prueba"""
    category = Category(
        name="Principales",
        description="Platos principales del restaurante",
        display_order=1,
        is_active=True,
        icon="🍽️",
        color="#FF6B35"
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category

@pytest_asyncio.fixture
async def test_product(db_session: AsyncSession, test_category: Category) -> Product:
    """Crear producto de prueba"""
    product = Product(
        name="Milanesa con Papas",
        description="Milanesa de ternera con guarnición de papas fritas",
        category_id=test_category.id,
        base_price=Decimal("2500.00"),
        cost_price=Decimal("1200.00"),
        preparation_time=25,
        is_available=True,
        allergens=["gluten"],
        tags=["popular", "tradicional"],
        calories=850
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product

@pytest_asyncio.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Crear usuario administrador para testing"""
    from auth import hash_password
    
    admin = User(
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        first_name="Admin",
        last_name="Test",
        role="admin",
        is_active=True,
        phone="+5491123456789"
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin

@pytest_asyncio.fixture
async def test_waiter_user(db_session: AsyncSession) -> User:
    """Crear usuario mesero para testing"""
    from auth import hash_password
    
    waiter = User(
        email="mesero@test.com",
        hashed_password=hash_password("mesero123"),
        first_name="Carlos",
        last_name="Mesero",
        role="waiter",
        is_active=True,
        phone="+5491234567890"
    )
    db_session.add(waiter)
    await db_session.commit()
    await db_session.refresh(waiter)
    return waiter

@pytest_asyncio.fixture
async def test_table(db_session: AsyncSession) -> Table:
    """Crear mesa de prueba"""
    table = Table(
        number=1,
        capacity=4,
        location="Salón principal",
        is_active=True,
        current_status="available",
        position_x=100,
        position_y=200,
        width=80,
        height=80
    )
    db_session.add(table)
    await db_session.commit()
    await db_session.refresh(table)
    return table

@pytest_asyncio.fixture
async def test_order(
    db_session: AsyncSession, 
    test_table: Table, 
    test_waiter_user: User,
    test_product: Product
) -> Order:
    """Crear pedido de prueba con items"""
    order = Order(
        table_number=test_table.number,
        waiter_id=test_waiter_user.id,
        status="pending",
        subtotal=Decimal("2500.00"),
        tax_amount=Decimal("525.00"),
        total_amount=Decimal("3025.00"),
        customer_name="Juan Pérez",
        order_type="dine_in",
        ordered_at=datetime.now()
    )
    db_session.add(order)
    await db_session.flush()
    
    # Agregar item al pedido
    order_item = OrderItem(
        order_id=order.id,
        product_id=test_product.id,
        quantity=1,
        unit_price=test_product.base_price,
        modifications={"sin_cebolla": True},
        special_notes="Punto medio",
        status="pending"
    )
    db_session.add(order_item)
    
    await db_session.commit()
    await db_session.refresh(order)
    return order

# ================================================================
# FIXTURES DE AUTENTICACIÓN
# ================================================================

@pytest_asyncio.fixture
async def admin_headers(test_admin_user: User) -> Dict[str, str]:
    """Headers de autenticación para admin"""
    token = create_access_token({"sub": str(test_admin_user.id), "role": test_admin_user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture
async def waiter_headers(test_waiter_user: User) -> Dict[str, str]:
    """Headers de autenticación para mesero"""
    token = create_access_token({"sub": str(test_waiter_user.id), "role": test_waiter_user.role})
    return {"Authorization": f"Bearer {token}"}

# ================================================================
# TESTS DE PRODUCTOS
# ================================================================

class TestProducts:
    """Suite de tests para productos"""
    
    async def test_get_products_success(
        self, 
        async_client: AsyncClient, 
        test_product: Product
    ):
        """Test obtener lista de productos"""
        response = await async_client.get("/api/v1/products/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Milanesa con Papas"
        assert data[0]["base_price"] == "2500.00"
        assert data[0]["is_available"] is True
    
    async def test_get_products_filtered_by_category(
        self, 
        async_client: AsyncClient, 
        test_product: Product,
        test_category: Category
    ):
        """Test filtrar productos por categoría"""
        response = await async_client.get(f"/api/v1/products/?category_id={test_category.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"]["id"] == test_category.id
    
    async def test_get_products_search(
        self, 
        async_client: AsyncClient, 
        test_product: Product
    ):
        """Test búsqueda de productos por nombre"""
        response = await async_client.get("/api/v1/products/?search=milanesa")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "milanesa" in data[0]["name"].lower()
    
    async def test_create_product_success(
        self, 
        async_client: AsyncClient, 
        admin_headers: Dict[str, str],
        test_category: Category
    ):
        """Test crear producto exitosamente"""
        product_data = {
            "name": "Empanadas de Carne",
            "description": "Empanadas caseras con carne cortada a cuchillo",
            "category_id": test_category.id,
            "base_price": "150.00",
            "cost_price": "80.00",
            "preparation_time": 15,
            "is_available": True,
            "allergens": ["gluten"],
            "tags": ["entrada", "tradicional"]
        }
        
        response = await async_client.post(
            "/api/v1/products/",
            json=product_data,
            headers=admin_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Empanadas de Carne"
        assert data["base_price"] == "150.00"
        assert data["profit_margin"] is not None
    
    async def test_create_product_unauthorized(
        self, 
        async_client: AsyncClient,
        test_category: Category
    ):
        """Test crear producto sin autenticación"""
        product_data = {
            "name": "Test Product",
            "category_id": test_category.id,
            "base_price": "100.00",
            "preparation_time": 10
        }
        
        response = await async_client.post("/api/v1/products/", json=product_data)
        assert response.status_code == 401
    
    async def test_create_product_invalid_category(
        self, 
        async_client: AsyncClient, 
        admin_headers: Dict[str, str]
    ):
        """Test crear producto con categoría inexistente"""
        product_data = {
            "name": "Test Product",
            "category_id": 999,
            "base_price": "100.00",
            "preparation_time": 10
        }
        
        response = await async_client.post(
            "/api/v1/products/",
            json=product_data,
            headers=admin_headers
        )
        
        assert response.status_code == 404
        assert "Categoría no encontrada" in response.json()["detail"]
    
    async def test_update_product_success(
        self, 
        async_client: AsyncClient, 
        admin_headers: Dict[str, str],
        test_product: Product
    ):
        """Test actualizar producto exitosamente"""
        update_data = {
            "name": "Milanesa Napolitana",
            "base_price": "2800.00",
            "preparation_time": 30
        }
        
        response = await async_client.put(
            f"/api/v1/products/{test_product.id}",
            json=update_data,
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Milanesa Napolitana"
        assert data["base_price"] == "2800.00"
        assert data["preparation_time"] == 30

# ================================================================
# TESTS DE PEDIDOS
# ================================================================

class TestOrders:
    """Suite de tests para pedidos"""
    
    async def test_create_order_success(
        self, 
        async_client: AsyncClient, 
        waiter_headers: Dict[str, str],
        test_table: Table,
        test_product: Product
    ):
        """Test crear pedido exitosamente"""
        order_data = {
            "table_number": test_table.number,
            "customer_name": "María García",
            "customer_notes": "Sin sal en las papas",
            "order_type": "dine_in",
            "items": [
                {
                    "product_id": test_product.id,
                    "quantity": 2,
                    "modifications": {"sin_cebolla": True},
                    "special_notes": "Bien cocido"
                }
            ]
        }
        
        response = await async_client.post(
            "/api/v1/products/orders",
            json=order_data,
            headers=waiter_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["table_number"] == test_table.number
        assert data["customer_name"] == "María García"
        assert data["status"] == "pending"
        assert len(data["items"]) == 1
        assert data["total_amount"] == "6050.00"  # 2500 * 2 + 21% IVA
    
    async def test_create_order_invalid_table(
        self, 
        async_client: AsyncClient, 
        waiter_headers: Dict[str, str],
        test_product: Product
    ):
        """Test crear pedido con mesa inexistente"""
        order_data = {
            "table_number": 999,
            "order_type": "dine_in",
            "items": [
                {
                    "product_id": test_product.id,
                    "quantity": 1
                }
            ]
        }
        
        response = await async_client.post(
            "/api/v1/products/orders",
            json=order_data,
            headers=waiter_headers
        )
        
        assert response.status_code == 404
        assert "Mesa no encontrada" in response.json()["detail"]
    
    async def test_create_order_unavailable_product(
        self, 
        async_client: AsyncClient, 
        waiter_headers: Dict[str, str],
        test_table: Table,
        test_product: Product,
        db_session: AsyncSession
    ):
        """Test crear pedido con producto no disponible"""
        # Marcar producto como no disponible
        test_product.is_available = False
        await db_session.commit()
        
        order_data = {
            "table_number": test_table.number,
            "order_type": "dine_in",
            "items": [
                {
                    "product_id": test_product.id,
                    "quantity": 1
                }
            ]
        }
        
        response = await async_client.post(
            "/api/v1/products/orders",
            json=order_data,
            headers=waiter_headers
        )
        
        assert response.status_code == 400
        assert "no disponible" in response.json()["detail"]

# ================================================================
# TESTS DE PAGOS (MOCKING STRIPE)
# ================================================================

class TestPayments:
    """Suite de tests para procesamiento de pagos"""
    
    @pytest.fixture
    def mock_stripe_service(self, monkeypatch):
        """Mock del servicio de Stripe"""
        class MockStripeService:
            async def create_payment_intent(self, amount, currency, metadata=None):
                return type('PaymentIntent', (), {
                    'id': 'pi_test_123456789',
                    'client_secret': 'pi_test_123456789_secret_test',
                    'amount': amount,
                    'currency': currency,
                    'status': 'requires_payment_method'
                })()
        
        monkeypatch.setattr('services.stripe_service.StripeService', MockStripeService)
        return MockStripeService()
    
    async def test_create_payment_intent_success(
        self, 
        async_client: AsyncClient, 
        waiter_headers: Dict[str, str],
        test_order: Order,
        mock_stripe_service,
        db_session: AsyncSession
    ):
        """Test crear PaymentIntent exitosamente"""
        # Marcar pedido como listo para pago
        test_order.status = "ready"
        await db_session.commit()
        
        response = await async_client.post(
            f"/api/v1/products/orders/{test_order.id}/payment/intent",
            headers=waiter_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "client_secret" in data
        assert "payment_intent_id" in data
        assert data["amount"] == "3025.00"
    
    async def test_create_payment_intent_order_not_ready(
        self, 
        async_client: AsyncClient, 
        waiter_headers: Dict[str, str],
        test_order: Order,
        mock_stripe_service
    ):
        """Test crear PaymentIntent con pedido no listo"""
        response = await async_client.post(
            f"/api/v1/products/orders/{test_order.id}/payment/intent",
            headers=waiter_headers
        )
        
        assert response.status_code == 400
        assert "no está listo para pago" in response.json()["detail"]

# ================================================================
# TESTS DE PERFORMANCE
# ================================================================

class TestPerformance:
    """Suite de tests de performance para el sistema gastronómico"""
    
    async def test_menu_loading_performance(
        self, 
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_category: Category
    ):
        """Test performance de carga de menú con muchos productos"""
        # Crear 100 productos para test de performance
        products = []
        for i in range(100):
            product = Product(
                name=f"Producto {i}",
                description=f"Descripción del producto {i}",
                category_id=test_category.id,
                base_price=Decimal(f"{100 + i}.00"),
                preparation_time=10 + (i % 30),
                is_available=True
            )
            products.append(product)
        
        db_session.add_all(products)
        await db_session.commit()
        
        # Medir tiempo de respuesta
        import time
        start_time = time.time()
        
        response = await async_client.get("/api/v1/products/")
        
        end_time = time.time()
        response_time = end_time - start_time
        
        # Validar respuesta y performance
        assert response.status_code == 200
        assert len(response.json()) == 50  # Límite por defecto
        assert response_time < 1.0  # Menos de 1 segundo
    
    @pytest.mark.asyncio
    async def test_concurrent_orders(
        self, 
        async_client: AsyncClient,
        waiter_headers: Dict[str, str],
        test_table: Table,
        test_product: Product
    ):
        """Test manejo de pedidos concurrentes"""
        
        async def create_order():
            order_data = {
                "table_number": test_table.number,
                "order_type": "dine_in",
                "items": [
                    {
                        "product_id": test_product.id,
                        "quantity": 1
                    }
                ]
            }
            return await async_client.post(
                "/api/v1/products/orders",
                json=order_data,
                headers=waiter_headers
            )
        
        # Crear 10 pedidos concurrentes
        tasks = [create_order() for _ in range(10)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Validar que al menos uno fue exitoso
        successful_responses = [r for r in responses if not isinstance(r, Exception) and r.status_code == 201]
        assert len(successful_responses) >= 1

# ================================================================
# TESTS DE WEBSOCKETS
# ================================================================

class TestWebSockets:
    """Suite de tests para WebSockets en tiempo real"""
    
    @pytest.mark.asyncio
    async def test_kitchen_notification_on_new_order(
        self, 
        async_client: AsyncClient,
        waiter_headers: Dict[str, str],
        test_table: Table,
        test_product: Product
    ):
        """Test notificación a cocina cuando se crea pedido"""
        # Mock del WebSocket manager
        notifications_sent = []
        
        async def mock_broadcast(message, roles):
            notifications_sent.append({"message": message, "roles": roles})
        
        # Monkey patch del WebSocket manager
        import unittest.mock
        with unittest.mock.patch('services.websocket_service.WebSocketManager.broadcast_to_role', side_effect=mock_broadcast):
            
            order_data = {
                "table_number": test_table.number,
                "order_type": "dine_in",
                "items": [
                    {
                        "product_id": test_product.id,
                        "quantity": 1
                    }
                ]
            }
            
            response = await async_client.post(
                "/api/v1/products/orders",
                json=order_data,
                headers=waiter_headers
            )
            
            assert response.status_code == 201
            
            # Validar que se envió notificación a cocina
            assert len(notifications_sent) == 1
            notification = notifications_sent[0]
            assert "kitchen" in notification["roles"]
            assert notification["message"]["type"] == "new_order"

# ================================================================
# CONFIGURACIÓN DE TESTING
# ================================================================

# Configuración específica para MySQL testing
@pytest.fixture(scope="session")
def event_loop():
    """
    Configurar event loop para toda la sesión de testing.
    Necesario para tests async con MySQL.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Marcadores pytest personalizados
pytestmark = [
    pytest.mark.asyncio,
    pytest.mark.mysql  # Para identificar tests que usan MySQL
]

"""
COMANDOS PARA EJECUTAR TESTS:

1. Tests unitarios:
   pytest tests/test_products.py -v

2. Tests de integración:
   pytest tests/test_integration.py -v

3. Tests de performance:
   pytest tests/test_performance.py -v -s

4. Todos los tests con coverage:
   pytest --cov=app --cov-report=html -v

5. Solo tests de MySQL:
   pytest -m mysql -v

6. Tests en paralelo:
   pytest -n auto tests/

CONFIGURACIÓN MYSQL PARA TESTING:

1. Crear base de datos de testing:
   CREATE DATABASE gastronomy_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'test_user'@'localhost' IDENTIFIED BY 'test_password';
   GRANT ALL PRIVILEGES ON gastronomy_test.* TO 'test_user'@'localhost';

2. Variables de entorno para testing:
   export TEST_DATABASE_URL="mysql+aiomysql://test_user:test_password@localhost:3306/gastronomy_test?charset=utf8mb4"
   export STRIPE_SECRET_KEY="sk_test_..."  # Test keys de Stripe

3. Performance testing con MySQL:
   - Tests de carga con 100+ productos
   - Tests de concurrencia con múltiples pedidos
   - Tests de queries optimizados con índices

4. Cleanup automático:
   - Rollback después de cada test
   - Recrear schema para cada sesión
   - Limpiar datos de testing automáticamente
"""