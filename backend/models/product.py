"""
Product and category models for the restaurant menu.
"""
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, ForeignKey, JSON, Index, func, DateTime
from sqlalchemy.orm import relationship, validates
from decimal import Decimal
from typing import Optional

from core.database import Base
from .base import TimestampMixin, mysql_table_args


class Category(Base, TimestampMixin):
    """Product categories (Appetizers, Main Courses, Desserts, Beverages, etc.)"""
    __tablename__ = "categories"
    __table_args__ = (
        Index('idx_categories_display_order', 'display_order'),
        Index('idx_categories_active', 'is_active'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)  # Hex color
    
    # Relationships
    products = relationship("Product", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"


class Product(Base, TimestampMixin):
    """
    Products in the menu with complete business information.
    Includes costs, preparation times, and availability.
    """
    __tablename__ = "products"
    __table_args__ = (
        Index('idx_products_name', 'name'),
        Index('idx_products_category_available', 'category_id', 'is_available'),
        Index('idx_products_featured', 'is_featured'),
        Index('idx_products_price_range', 'base_price'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Pricing - DECIMAL for precision
    base_price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2), nullable=True)
    
    # Operational information
    preparation_time = Column(Integer, nullable=False)  # Minutes
    is_available = Column(Boolean, default=True, nullable=False)
    requires_kitchen = Column(Boolean, default=True)  # False for simple beverages
    
    # Media and presentation
    image_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    
    # Nutritional/allergen information - JSON in MySQL
    allergens = Column(JSON, nullable=True)  # ["gluten", "lactose", "nuts"]
    nutritional_info = Column(JSON, nullable=True)  # {"calories": 850, "protein": 25}
    calories = Column(Integer, nullable=True)
    
    # SEO and metadata
    slug = Column(String(250), unique=True, nullable=True)
    tags = Column(JSON, nullable=True)  # ["vegetarian", "gluten-free", "spicy"]
    
    # Relationships
    category = relationship("Category", back_populates="products")
    ingredients = relationship("ProductIngredient", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    variants = relationship("ProductVariant", back_populates="product")
    
    @validates('base_price')
    def validate_price(self, key, price):
        """Validate price is positive"""
        if price <= 0:
            raise ValueError("Price must be greater than 0")
        return price
    
    @validates('preparation_time')
    def validate_prep_time(self, key, time):
        """Validate preparation time"""
        if time < 0:
            raise ValueError("Preparation time cannot be negative")
        return time
    
    @property
    def profit_margin(self) -> Optional[Decimal]:
        """Calculate profit margin percentage"""
        if self.cost_price and self.base_price:
            return ((self.base_price - self.cost_price) / self.base_price) * 100
        return None
    
    def __repr__(self):
        return f"<Product {self.name} - ${self.base_price}>"


class ProductVariant(Base, TimestampMixin):
    """
    Product variants (sizes, temperatures, styles).
    Example: Large Pizza, Iced Coffee, etc.
    """
    __tablename__ = "product_variants"
    __table_args__ = (
        Index('idx_variants_product_type', 'product_id', 'type'),
        Index('idx_variants_available', 'is_available'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Large", "Medium", "Iced", "Hot"
    type = Column(String(50), nullable=False)   # "size", "temperature", "style"
    price_modifier = Column(DECIMAL(10, 2), default=0)  # +/- to base price
    is_available = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    # Relationships
    product = relationship("Product", back_populates="variants")
    
    def __repr__(self):
        return f"<ProductVariant {self.name} ({self.type})>"


class Ingredient(Base, TimestampMixin):
    """
    Ingredients for inventory control and cost management.
    """
    __tablename__ = "ingredients"
    __table_args__ = (
        Index('idx_ingredients_name', 'name'),
        Index('idx_ingredients_stock_alert', 'current_stock', 'min_stock_alert'),
        Index('idx_ingredients_supplier', 'supplier'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    unit_type = Column(String(20), nullable=False)  # kg, liters, units
    cost_per_unit = Column(DECIMAL(10, 4), nullable=False)
    current_stock = Column(DECIMAL(10, 2), default=0)
    min_stock_alert = Column(DECIMAL(10, 2), default=0)
    max_stock = Column(DECIMAL(10, 2), nullable=True)
    supplier = Column(String(200), nullable=True)
    supplier_code = Column(String(100), nullable=True)
    
    # Expiry tracking for perishables
    expiry_date = Column(DateTime, nullable=True)
    days_until_expiry_alert = Column(Integer, default=7)
    
    # Relationships
    products = relationship("ProductIngredient", back_populates="ingredient")
    
    @property
    def stock_status(self) -> str:
        """Get stock status: ok, low, critical, out"""
        if self.current_stock <= 0:
            return "out"
        elif self.current_stock <= self.min_stock_alert * 0.5:
            return "critical"
        elif self.current_stock <= self.min_stock_alert:
            return "low"
        else:
            return "ok"
    
    def __repr__(self):
        return f"<Ingredient {self.name} ({self.current_stock} {self.unit_type})>"


class ProductIngredient(Base):
    """
    Many-to-many relationship between products and ingredients.
    Defines what ingredients each product uses and in what quantity.
    """
    __tablename__ = "product_ingredients"
    __table_args__ = (
        Index('idx_product_ingredients_product', 'product_id'),
        Index('idx_product_ingredients_ingredient', 'ingredient_id'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity_needed = Column(DECIMAL(10, 4), nullable=False)  # Amount per serving
    is_optional = Column(Boolean, default=False)
    
    # Relationships
    product = relationship("Product", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="products")
    
    def __repr__(self):
        return f"<ProductIngredient {self.product_id}:{self.ingredient_id}>"