# FastAPI Research for Restaurant Management System

## Core Architecture Patterns

### Basic Setup and Structure
```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Lifecycle management for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_db_tables()
    yield
    # Shutdown
    await close_db_connections()

app = FastAPI(
    title="Restaurant Management API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Dependency Injection Pattern
```python
from typing import Annotated

async def get_db():
    async with async_session() as session:
        yield session

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    # Validate JWT and return user
    pass

DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
```

### Request/Response Models with Pydantic
```python
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import Optional, List

class OrderCreate(BaseModel):
    table_number: int = Field(..., gt=0, le=50)
    items: List[OrderItem] = Field(..., min_items=1)
    customer_notes: Optional[str] = Field(None, max_length=500)
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('Order must have at least one item')
        return v

class OrderResponse(BaseModel):
    id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True  # For SQLAlchemy models
```

### Error Handling Patterns
```python
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body}
    )

class BusinessLogicError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

# Usage
if not product.is_available:
    raise BusinessLogicError("Product is not available")
```

### WebSocket Implementation for Real-time Updates
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        # Group connections by role for targeted broadcasting
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "kitchen": set(),
            "waiter": set(),
            "admin": set()
        }
    
    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        self.active_connections[role].add(websocket)
    
    def disconnect(self, websocket: WebSocket, role: str):
        self.active_connections[role].discard(websocket)
    
    async def broadcast_to_role(self, message: dict, role: str):
        for connection in self.active_connections[role]:
            try:
                await connection.send_json(message)
            except:
                # Connection is broken, remove it
                self.active_connections[role].discard(connection)

manager = ConnectionManager()

@app.websocket("/ws/{role}")
async def websocket_endpoint(
    websocket: WebSocket, 
    role: str,
    token: str = Query(...)  # Auth via query param
):
    # Validate token
    user = await validate_ws_token(token)
    if not user or user.role != role:
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket, role)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Process incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, role)
```

### Background Tasks for Async Operations
```python
from fastapi import BackgroundTasks

async def notify_kitchen(order_id: int):
    """Send notification to kitchen about new order"""
    await manager.broadcast_to_role(
        {"type": "new_order", "order_id": order_id},
        "kitchen"
    )

@app.post("/orders")
async def create_order(
    order: OrderCreate,
    background_tasks: BackgroundTasks,
    db: DBSession,
    user: CurrentUser
):
    # Create order in database
    new_order = await create_order_in_db(db, order, user)
    
    # Queue background task
    background_tasks.add_task(notify_kitchen, new_order.id)
    
    return new_order
```

### API Versioning Pattern
```python
from fastapi import APIRouter

# Version 1 routes
v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(products_router, prefix="/products", tags=["products"])
v1_router.include_router(orders_router, prefix="/orders", tags=["orders"])
v1_router.include_router(tables_router, prefix="/tables", tags=["tables"])

app.include_router(v1_router)
```

### Rate Limiting Pattern
```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

# Initialize on startup
@app.on_event("startup")
async def startup():
    redis_client = redis.from_url("redis://localhost", encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_client)

# Apply to endpoints
@app.post("/orders", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def create_order():
    pass
```

### Authentication & Authorization
```python
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: CurrentUser):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Usage
@app.post("/admin/reports", dependencies=[Depends(require_role(["admin", "manager"]))])
async def generate_report():
    pass
```

### Database Transaction Pattern
```python
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

@asynccontextmanager
async def transaction(db: AsyncSession):
    """Context manager for database transactions"""
    async with db.begin():
        try:
            yield db
            await db.commit()
        except Exception:
            await db.rollback()
            raise

# Usage
async def process_payment(db: AsyncSession, order_id: int, payment_data: dict):
    async with transaction(db):
        # All operations in transaction
        order = await db.get(Order, order_id)
        payment = Payment(**payment_data)
        db.add(payment)
        order.status = "paid"
        # Auto-commit or rollback on exception
```

## Performance Optimizations

### Connection Pooling
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=3600,
    echo=False
)

async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)
```

### Response Caching
```python
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from fastapi_cache.backends.redis import RedisBackend

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@app.get("/menu")
@cache(expire=300)  # Cache for 5 minutes
async def get_menu(db: DBSession):
    return await fetch_menu_items(db)
```

## Testing Patterns

### Test Client Setup
```python
from fastapi.testclient import TestClient
import pytest
from httpx import AsyncClient

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_order(client: AsyncClient):
    response = await client.post(
        "/api/v1/orders",
        json={"table_number": 1, "items": [...]}
    )
    assert response.status_code == 201
```

## Deployment Configuration

### Production Settings
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # MySQL specific
    db_pool_size: int = 20
    db_max_overflow: int = 30
    
    # Redis for caching
    redis_url: str = "redis://localhost"
    
    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Key Takeaways for Restaurant System

1. **Use async/await throughout** for better concurrency handling during peak hours
2. **Implement WebSockets** for real-time kitchen notifications and order updates
3. **Use dependency injection** for clean, testable code
4. **Implement proper transaction handling** for payment processing
5. **Use background tasks** for non-blocking operations like sending notifications
6. **Cache menu data** to reduce database load
7. **Implement rate limiting** to prevent abuse
8. **Use connection pooling** for database efficiency
9. **Structure with routers** for modular organization
10. **Implement comprehensive error handling** for better UX