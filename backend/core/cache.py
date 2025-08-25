"""
Redis cache configuration and utilities.
"""
import redis.asyncio as redis
from typing import Optional, Any
import json
import structlog
from functools import wraps
import hashlib

from .config import settings

logger = structlog.get_logger()

# Global Redis client
redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    
    if not settings.REDIS_URL:
        logger.warning("Redis URL not configured, caching disabled")
        return None
    
    try:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50
        )
        
        # Test connection
        await redis_client.ping()
        logger.info("Redis connection established")
        return redis_client
    except Exception as e:
        logger.error("Failed to connect to Redis", error=str(e))
        return None


async def get_redis() -> Optional[redis.Redis]:
    """Get Redis client instance"""
    if not redis_client:
        await init_redis()
    return redis_client


def make_cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    key_str = ":".join(key_parts)
    
    # Hash if too long
    if len(key_str) > 200:
        key_str = hashlib.md5(key_str.encode()).hexdigest()
    
    return key_str


def cache_result(prefix: str, ttl: int = 60):
    """
    Decorator to cache async function results.
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Skip caching if Redis not available
            cache = await get_redis()
            if not cache:
                return await func(*args, **kwargs)
            
            # Generate cache key
            cache_key = f"{prefix}:{make_cache_key(*args, **kwargs)}"
            
            try:
                # Try to get from cache
                cached = await cache.get(cache_key)
                if cached:
                    logger.debug("Cache hit", key=cache_key)
                    return json.loads(cached)
            except Exception as e:
                logger.warning("Cache get error", error=str(e))
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                await cache.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                logger.debug("Cache set", key=cache_key, ttl=ttl)
            except Exception as e:
                logger.warning("Cache set error", error=str(e))
            
            return result
        
        return wrapper
    return decorator


async def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "products:*")
    """
    cache = await get_redis()
    if not cache:
        return 0
    
    try:
        keys = await cache.keys(pattern)
        if keys:
            deleted = await cache.delete(*keys)
            logger.info("Cache invalidated", pattern=pattern, count=deleted)
            return deleted
        return 0
    except Exception as e:
        logger.error("Cache invalidation error", error=str(e))
        return 0


class CacheManager:
    """
    Cache manager for different data types.
    """
    
    @staticmethod
    async def get_categories(include_counts: bool = False) -> Optional[Any]:
        """Get cached categories"""
        cache = await get_redis()
        if not cache:
            return None
        
        key = f"categories:counts:{include_counts}"
        try:
            cached = await cache.get(key)
            return json.loads(cached) if cached else None
        except Exception:
            return None
    
    @staticmethod
    async def set_categories(data: Any, include_counts: bool = False, ttl: int = 300):
        """Cache categories"""
        cache = await get_redis()
        if not cache:
            return
        
        key = f"categories:counts:{include_counts}"
        try:
            await cache.setex(key, ttl, json.dumps(data, default=str))
        except Exception as e:
            logger.warning("Failed to cache categories", error=str(e))
    
    @staticmethod
    async def get_products(category_id: int, skip: int = 0, limit: int = 50) -> Optional[Any]:
        """Get cached products for category"""
        cache = await get_redis()
        if not cache:
            return None
        
        key = f"products:cat:{category_id}:skip:{skip}:limit:{limit}"
        try:
            cached = await cache.get(key)
            return json.loads(cached) if cached else None
        except Exception:
            return None
    
    @staticmethod
    async def set_products(data: Any, category_id: int, skip: int = 0, limit: int = 50, ttl: int = 60):
        """Cache products for category"""
        cache = await get_redis()
        if not cache:
            return
        
        key = f"products:cat:{category_id}:skip:{skip}:limit:{limit}"
        try:
            await cache.setex(key, ttl, json.dumps(data, default=str))
        except Exception as e:
            logger.warning("Failed to cache products", error=str(e))
    
    @staticmethod
    async def invalidate_products(category_id: Optional[int] = None):
        """Invalidate product cache"""
        if category_id:
            pattern = f"products:cat:{category_id}:*"
        else:
            pattern = "products:*"
        
        await invalidate_cache(pattern)
    
    @staticmethod
    async def invalidate_categories():
        """Invalidate category cache"""
        await invalidate_cache("categories:*")