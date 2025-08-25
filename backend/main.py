"""
Main FastAPI application for Restaurant Management System.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from core.config import settings
from core.database import init_db
from core.websocket import manager
from core.security import decode_token
from core.cache import init_redis

# Import routers
from api.auth import router as auth_router
from api.products import router as products_router
from api.products_optimized import router as products_optimized_router
from api.orders import router as orders_router
from api.tables import router as tables_router
from api.payments import router as payments_router
from api.companies import router as companies_router
from api.tables_enhanced import router as tables_enhanced_router
from api.users import router as users_router
from api.roles import router as roles_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle.
    """
    # Startup
    logger.info("Starting Restaurant Management System", version=settings.VERSION)
    
    # Initialize Redis cache
    try:
        await init_redis()
        logger.info("Redis cache initialized")
    except Exception as e:
        logger.warning("Redis cache not available", error=str(e))
    
    # Initialize database tables (only in development)
    if settings.DEBUG:
        try:
            await init_db()
            logger.info("Database tables initialized")
        except Exception as e:
            logger.error("Failed to initialize database", error=str(e))
    
    yield
    
    # Shutdown
    logger.info("Shutting down Restaurant Management System")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
# Use optimized products router with lazy loading and caching
app.include_router(products_optimized_router, prefix="/api/v1/products", tags=["products"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(tables_router, prefix="/api/v1/tables", tags=["tables"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(companies_router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(tables_enhanced_router, prefix="/api/v1/tables-enhanced", tags=["tables-enhanced"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(roles_router, prefix="/api/v1", tags=["roles"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "operational"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    # TODO: Add database connection check
    # TODO: Add WebSocket status check
    
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected",  # TODO: Implement actual check
        "websocket": "operational"  # TODO: Implement actual check
    }


# WebSocket endpoint for real-time updates
@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str, token: str):
    """
    WebSocket endpoint for real-time communication.
    Roles: kitchen, waiter, cashier, admin, manager
    """
    # Validate token
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        username = payload.get("username", "Unknown")
    except Exception as e:
        logger.error("WebSocket authentication failed", error=str(e))
        await websocket.close(code=1008, reason="Authentication failed")
        return
    
    # Connect to manager
    await manager.connect(websocket, role, user_id, username)
    
    try:
        while True:
            # Receive and process messages
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif data.get("type") == "get_status":
                connections = manager.get_connection_count()
                await websocket.send_json({
                    "type": "status",
                    "connections": connections
                })
            
            # Add more message handlers as needed
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        manager.disconnect(websocket)


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    logger.error("Internal server error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9000,
        reload=settings.DEBUG,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )