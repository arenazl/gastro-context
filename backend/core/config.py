"""
Configuration settings for the Restaurant Management System.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Restaurant Management System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database - Aiven MySQL
    DB_HOST: str = "mysql-aiven-arenazl.e.aivencloud.com"
    DB_PORT: int = 23108
    DB_USER: str = "avnadmin"
    DB_PASSWORD: str = "AVNS_Fqe0qsChCHnqSnVsvoi"
    DB_NAME: str = "gastro"
    
    # Connection pool configuration
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True
    
    # JWT Configuration
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:9002/auth/google/callback"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://172.29.228.80:5173",
        "http://10.255.255.254:5173",
        "*"  # Allow all origins in development
    ]
    
    # WebSocket
    WS_MESSAGE_QUEUE_SIZE: int = 100
    
    # Redis (optional for caching)
    REDIS_URL: Optional[str] = "redis://localhost:6379"
    
    @property
    def DATABASE_URL(self) -> str:
        """Generate MySQL connection URL"""
        return (
            f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )
    
    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Generate synchronous MySQL connection URL for Alembic"""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()