"""
Product schemas for API validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex="^#[0-9A-Fa-f]{6}$")
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex="^#[0-9A-Fa-f]{6}$")
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    product_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProductVariantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    price_modifier: Decimal = Field(0, ge=-1000, le=1000)
    is_available: bool = True
    display_order: int = 0


class ProductVariantCreate(ProductVariantBase):
    product_id: int


class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: int
    base_price: Decimal = Field(..., gt=0)
    cost_price: Optional[Decimal] = Field(None, gt=0)
    preparation_time: int = Field(..., ge=0)
    is_available: bool = True
    requires_kitchen: bool = True
    image_url: Optional[str] = None
    is_featured: bool = False
    allergens: Optional[List[str]] = None
    nutritional_info: Optional[Dict[str, Any]] = None
    calories: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[int] = None
    base_price: Optional[Decimal] = Field(None, gt=0)
    cost_price: Optional[Decimal] = Field(None, gt=0)
    preparation_time: Optional[int] = Field(None, ge=0)
    is_available: Optional[bool] = None
    requires_kitchen: Optional[bool] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    allergens: Optional[List[str]] = None
    nutritional_info: Optional[Dict[str, Any]] = None
    calories: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None


class ProductResponse(ProductBase):
    id: int
    profit_margin: Optional[float] = None
    variants: Optional[List[ProductVariantResponse]] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProductWithCategory(ProductResponse):
    category: CategoryResponse
    
    model_config = ConfigDict(from_attributes=True)


class ProductSearchResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


class IngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    unit_type: str = Field(..., min_length=1, max_length=20)
    cost_per_unit: Decimal = Field(..., gt=0)
    current_stock: Decimal = Field(0, ge=0)
    min_stock_alert: Decimal = Field(0, ge=0)
    max_stock: Optional[Decimal] = Field(None, gt=0)
    supplier: Optional[str] = None
    supplier_code: Optional[str] = None


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    unit_type: Optional[str] = Field(None, min_length=1, max_length=20)
    cost_per_unit: Optional[Decimal] = Field(None, gt=0)
    current_stock: Optional[Decimal] = Field(None, ge=0)
    min_stock_alert: Optional[Decimal] = Field(None, ge=0)
    max_stock: Optional[Decimal] = Field(None, gt=0)
    supplier: Optional[str] = None
    supplier_code: Optional[str] = None


class IngredientResponse(IngredientBase):
    id: int
    stock_status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProductIngredientBase(BaseModel):
    product_id: int
    ingredient_id: int
    quantity_needed: Decimal = Field(..., gt=0)
    is_optional: bool = False


class ProductIngredientCreate(ProductIngredientBase):
    pass


class ProductIngredientResponse(ProductIngredientBase):
    id: int
    ingredient: Optional[IngredientResponse] = None
    product: Optional[ProductResponse] = None
    
    model_config = ConfigDict(from_attributes=True)