"""
Product management API endpoints.
"""
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field, validator

from core.database import get_db
from core.auth import get_current_user, require_role
from models import Product, Category, ProductVariant, User

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


# Pydantic schemas
class CategoryBase(BaseModel):
    """Base schema for categories"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    display_order: int = Field(0, ge=0)
    is_active: bool = True
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)


class CategoryCreate(CategoryBase):
    """Schema for creating categories"""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating categories"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Base schema for products"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category_id: int = Field(..., gt=0)
    base_price: Decimal = Field(..., gt=0, decimal_places=2)
    preparation_time: int = Field(..., ge=0, le=180)
    is_available: bool = True
    allergens: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    
    @validator('base_price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        if v > 999999.99:
            raise ValueError('Price is too high')
        return round(v, 2)


class ProductCreate(ProductBase):
    """Schema for creating products"""
    cost_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    image_url: Optional[str] = Field(None, max_length=500)
    calories: Optional[int] = Field(None, ge=0)
    requires_kitchen: bool = True
    is_featured: bool = False


class ProductUpdate(BaseModel):
    """Schema for updating products"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[int] = Field(None, gt=0)
    base_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    cost_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    preparation_time: Optional[int] = Field(None, ge=0, le=180)
    is_available: Optional[bool] = None
    allergens: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    calories: Optional[int] = None
    requires_kitchen: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int
    cost_price: Optional[Decimal]
    image_url: Optional[str]
    slug: Optional[str]
    calories: Optional[int]
    requires_kitchen: bool
    is_featured: bool
    created_at: str
    updated_at: str
    profit_margin: Optional[float]
    category: CategoryResponse
    
    class Config:
        from_attributes = True


class ProductVariantBase(BaseModel):
    """Base schema for product variants"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    price_modifier: Decimal = Field(0, decimal_places=2)
    is_available: bool = True
    display_order: int = 0


class ProductVariantCreate(ProductVariantBase):
    """Schema for creating product variants"""
    pass


class ProductVariantResponse(ProductVariantBase):
    """Schema for product variant response"""
    id: int
    product_id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


# Category endpoints
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all categories, optionally filtered by active status"""
    query = select(Category)
    
    if is_active is not None:
        query = query.where(Category.is_active == is_active)
    
    query = query.order_by(Category.display_order, Category.name)
    
    result = await db.execute(query)
    categories = result.scalars().all()
    
    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Create a new category. Requires admin or manager role."""
    # Check if category name already exists
    result = await db.execute(
        select(Category).where(Category.name == category_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    new_category = Category(**category_data.dict())
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    return new_category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Update a category. Requires admin or manager role."""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    update_data = category_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    
    return category


# Product endpoints
@router.get("/", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[int] = Query(None),
    is_available: Optional[bool] = Query(None),
    is_featured: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get products with optional filters.
    Optimized for menu display.
    """
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.variants)
    )
    
    # Apply filters
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    if is_available is not None:
        query = query.where(Product.is_available == is_available)
    
    if is_featured is not None:
        query = query.where(Product.is_featured == is_featured)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.like(search_term),
                Product.description.like(search_term)
            )
        )
    
    if tags:
        # Filter by tags (simplified for now)
        tag_list = [tag.strip() for tag in tags.split(",")]
        # This would need proper JSON querying in production
        pass
    
    # Order and paginate
    query = query.order_by(Product.category_id, Product.name)
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return products


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Create a new product. Requires admin or manager role."""
    # Verify category exists
    result = await db.execute(
        select(Category).where(Category.id == product_data.category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Create product
    new_product = Product(**product_data.dict())
    
    # Generate slug
    slug_base = product_data.name.lower().replace(" ", "-")
    new_product.slug = slug_base
    
    db.add(new_product)
    
    try:
        await db.commit()
        await db.refresh(new_product, ["category", "variants"])
    except Exception as e:
        await db.rollback()
        if "slug" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with similar name already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating product"
        )
    
    return new_product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific product by ID"""
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
            detail="Product not found"
        )
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Update a product. Requires admin or manager role."""
    result = await db.execute(
        select(Product).options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = product_data.dict(exclude_unset=True)
    
    # If updating category, verify it exists
    if "category_id" in update_data:
        result = await db.execute(
            select(Category).where(Category.id == update_data["category_id"])
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    await db.commit()
    await db.refresh(product)
    
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a product. Requires admin role."""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if product has active orders
    # TODO: Implement check for active orders
    
    await db.delete(product)
    await db.commit()


# Product variant endpoints
@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
async def create_product_variant(
    product_id: int,
    variant_data: ProductVariantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"]))
):
    """Create a variant for a product. Requires admin or manager role."""
    # Verify product exists
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    new_variant = ProductVariant(
        product_id=product_id,
        **variant_data.dict()
    )
    
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    
    return new_variant


@router.get("/{product_id}/variants", response_model=List[ProductVariantResponse])
async def get_product_variants(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all variants for a product"""
    query = select(ProductVariant).where(
        ProductVariant.product_id == product_id
    ).order_by(ProductVariant.display_order, ProductVariant.name)
    
    result = await db.execute(query)
    variants = result.scalars().all()
    
    return variants