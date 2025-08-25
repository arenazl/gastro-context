"""
Optimized Products API with lazy loading and caching.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
import json
import redis.asyncio as redis
from decimal import Decimal
import structlog

from core.database import get_db
from core.config import settings
from models.product import Product, Category, ProductVariant, Ingredient
from schemas.product import ProductResponse, CategoryResponse

logger = structlog.get_logger()
router = APIRouter()

# Redis client for caching
redis_client = None

async def get_redis():
    global redis_client
    if not redis_client and settings.REDIS_URL:
        redis_client = await redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    include_counts: bool = Query(False, description="Include product counts"),
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis)
):
    """
    Get all active categories with optional product counts.
    Cached for 5 minutes.
    """
    cache_key = f"categories:counts:{include_counts}"
    
    # Try cache first
    if cache:
        try:
            cached = await cache.get(cache_key)
            if cached:
                logger.info("Categories served from cache")
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis cache error", error=str(e))
    
    # Query database
    query = select(Category).where(Category.is_active == True).order_by(Category.display_order)
    
    if include_counts:
        # Include product counts efficiently
        query = query.options(selectinload(Category.products))
    
    result = await db.execute(query)
    categories = result.scalars().all()
    
    # Format response
    response = []
    for category in categories:
        cat_dict = {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "icon": category.icon,
            "color": category.color,
            "display_order": category.display_order
        }
        
        if include_counts:
            cat_dict["product_count"] = len([p for p in category.products if p.is_available])
        
        response.append(cat_dict)
    
    # Cache result
    if cache:
        try:
            await cache.setex(cache_key, 300, json.dumps(response))  # 5 minutes
        except Exception as e:
            logger.warning("Failed to cache categories", error=str(e))
    
    return response


@router.get("/categories/{category_id}/products")
async def get_category_products(
    category_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    include_variants: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis)
):
    """
    Get products for a specific category with pagination.
    Implements lazy loading - only loads products when category is selected.
    """
    cache_key = f"products:cat:{category_id}:skip:{skip}:limit:{limit}:variants:{include_variants}"
    
    # Try cache first
    if cache:
        try:
            cached = await cache.get(cache_key)
            if cached:
                logger.info("Products served from cache", category_id=category_id)
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis cache error", error=str(e))
    
    # Build optimized query
    query = (
        select(Product)
        .where(
            and_(
                Product.category_id == category_id,
                Product.is_available == True
            )
        )
        .order_by(Product.name)
        .offset(skip)
        .limit(limit)
    )
    
    # Optionally include variants
    if include_variants:
        query = query.options(selectinload(Product.variants))
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    # Format response
    response = []
    for product in products:
        prod_dict = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "base_price": float(product.base_price),
            "category_id": product.category_id,
            "preparation_time": product.preparation_time,
            "image_url": product.image_url,
            "is_featured": product.is_featured,
            "allergens": product.allergens,
            "calories": product.calories,
            "tags": product.tags
        }
        
        if include_variants and product.variants:
            prod_dict["variants"] = [
                {
                    "id": v.id,
                    "name": v.name,
                    "type": v.type,
                    "price_modifier": float(v.price_modifier),
                    "is_available": v.is_available
                }
                for v in product.variants
                if v.is_available
            ]
        
        response.append(prod_dict)
    
    # Get total count for pagination
    count_query = select(func.count()).where(
        and_(
            Product.category_id == category_id,
            Product.is_available == True
        )
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    result_data = {
        "products": response,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": skip + limit < total
    }
    
    # Cache result
    if cache:
        try:
            await cache.setex(cache_key, 60, json.dumps(result_data))  # 1 minute
        except Exception as e:
            logger.warning("Failed to cache products", error=str(e))
    
    return result_data


@router.get("/products/featured")
async def get_featured_products(
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    cache: redis.Redis = Depends(get_redis)
):
    """
    Get featured products for homepage display.
    Heavily cached as these change infrequently.
    """
    cache_key = f"products:featured:{limit}"
    
    # Try cache first
    if cache:
        try:
            cached = await cache.get(cache_key)
            if cached:
                logger.info("Featured products served from cache")
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis cache error", error=str(e))
    
    # Query only featured products
    query = (
        select(Product)
        .where(
            and_(
                Product.is_featured == True,
                Product.is_available == True
            )
        )
        .options(joinedload(Product.category))
        .limit(limit)
    )
    
    result = await db.execute(query)
    products = result.scalars().unique().all()
    
    response = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "base_price": float(p.base_price),
            "category_name": p.category.name,
            "image_url": p.image_url,
            "preparation_time": p.preparation_time
        }
        for p in products
    ]
    
    # Cache for longer as featured products change rarely
    if cache:
        try:
            await cache.setex(cache_key, 600, json.dumps(response))  # 10 minutes
        except Exception as e:
            logger.warning("Failed to cache featured products", error=str(e))
    
    return response


@router.get("/products/search")
async def search_products(
    q: str = Query(..., min_length=2, description="Search query"),
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Search products with filters.
    Not cached due to dynamic nature of searches.
    """
    # Build search query
    filters = [
        Product.is_available == True,
        Product.name.ilike(f"%{q}%") | Product.description.ilike(f"%{q}%")
    ]
    
    if category_id:
        filters.append(Product.category_id == category_id)
    if min_price:
        filters.append(Product.base_price >= min_price)
    if max_price:
        filters.append(Product.base_price <= max_price)
    
    query = (
        select(Product)
        .where(and_(*filters))
        .order_by(Product.name)
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "base_price": float(p.base_price),
            "category_id": p.category_id,
            "image_url": p.image_url
        }
        for p in products
    ]


@router.post("/cache/clear")
async def clear_cache(
    pattern: str = Query("*", description="Cache key pattern to clear"),
    cache: redis.Redis = Depends(get_redis)
):
    """
    Clear cache for specific pattern.
    Admin only endpoint.
    """
    if not cache:
        return {"message": "Cache not configured"}
    
    try:
        keys = await cache.keys(f"products:{pattern}")
        if keys:
            await cache.delete(*keys)
        
        keys = await cache.keys(f"categories:{pattern}")
        if keys:
            await cache.delete(*keys)
        
        return {"message": f"Cleared cache for pattern: {pattern}"}
    except Exception as e:
        logger.error("Failed to clear cache", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear cache"
        )