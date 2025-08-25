"""
Modelos de base de datos para el sistema gastronómico.
SIEMPRE usar esta estructura y patrones para todos los modelos.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

Base = declarative_base()

class TimestampMixin:
    """Mixin para campos de timestamp en todos los modelos"""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

class User(Base, TimestampMixin):
    """
    Modelo de usuarios del sistema (empleados del restaurante).
    Incluye roles específicos del negocio gastronómico.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # admin, manager, waiter, kitchen, cashier
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hire_date = Column(DateTime, default=func.now())
    
    # Relaciones
    orders_as_waiter = relationship("Order", back_populates="waiter")
    
    @validates('role')
    def validate_role(self, key, role):
        valid_roles = ['admin', 'manager', 'waiter', 'kitchen', 'cashier']
        if role not in valid_roles:
            raise ValueError(f"Rol debe ser uno de: {', '.join(valid_roles)}")
        return role
    
    @validates('email')
    def validate_email(self, key, email):
        if '@' not in email:
            raise ValueError("Email inválido")
        return email.lower()

class Category(Base, TimestampMixin):
    """Categorías de productos (Entrantes, Principales, Postres, Bebidas, etc.)"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    icon = Column(String(50), nullable=True)  # Para iconos en la UI
    
    # Relaciones
    products = relationship("Product", back_populates="category")

class Product(Base, TimestampMixin):
    """
    Productos del menú con información completa para el negocio.
    Incluye costos, tiempos de preparación y disponibilidad.
    """
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Precios y costos
    base_price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2), nullable=True)  # Para calcular margen
    
    # Información operativa
    preparation_time = Column(Integer, nullable=False)  # Minutos
    is_available = Column(Boolean, default=True, nullable=False)
    requires_kitchen = Column(Boolean, default=True)  # False para bebidas simples
    
    # Media y presentación
    image_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)  # Para destacados
    
    # Información nutricional/alérgenos
    allergens = Column(JSON, nullable=True)  # ["gluten", "lactosa", "nueces"]
    calories = Column(Integer, nullable=True)
    
    # Relaciones
    category = relationship("Category", back_populates="products")
    ingredients = relationship("ProductIngredient", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    variants = relationship("ProductVariant", back_populates="product")
    
    @validates('base_price')
    def validate_price(self, key, price):
        if price <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return price
    
    @validates('preparation_time')
    def validate_prep_time(self, key, time):
        if time < 0:
            raise ValueError("Tiempo de preparación no puede ser negativo")
        return time

class ProductVariant(Base, TimestampMixin):
    """
    Variantes de productos (tamaños, temperaturas, etc.)
    Ejemplo: Pizza Grande, Café Frío, etc.
    """
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Grande", "Mediano", "Frío", "Caliente"
    type = Column(String(50), nullable=False)   # "size", "temperature", "style"
    price_modifier = Column(DECIMAL(10, 2), default=0)  # +/- al precio base
    is_available = Column(Boolean, default=True)
    
    # Relaciones
    product = relationship("Product", back_populates="variants")

class Ingredient(Base, TimestampMixin):
    """
    Ingredientes para control de inventario y costos.
    """
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    unit_type = Column(String(20), nullable=False)  # kg, litros, unidades
    cost_per_unit = Column(DECIMAL(10, 4), nullable=False)
    current_stock = Column(DECIMAL(10, 2), default=0)
    min_stock_alert = Column(DECIMAL(10, 2), default=0)  # Para alertas automáticas
    supplier = Column(String(200), nullable=True)
    
    # Relaciones
    products = relationship("ProductIngredient", back_populates="ingredient")

class ProductIngredient(Base):
    """
    Relación many-to-many entre productos e ingredientes.
    Define qué ingredientes usa cada producto y en qué cantidad.
    """
    __tablename__ = "product_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity_needed = Column(DECIMAL(10, 4), nullable=False)  # Cantidad por porción
    is_optional = Column(Boolean, default=False)  # Para ingredientes opcionales
    
    # Relaciones
    product = relationship("Product", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="products")

class Table(Base, TimestampMixin):
    """
    Mesas del restaurante con información de ubicación y capacidad.
    """
    __tablename__ = "tables"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False, index=True)
    capacity = Column(Integer, nullable=False)
    location = Column(String(100), nullable=True)  # "Terraza", "Salón principal", etc.
    is_active = Column(Boolean, default=True)
    
    # Coordenadas para layout visual (opcional)
    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    
    # Relaciones
    orders = relationship("Order", back_populates="table")

class Order(Base, TimestampMixin):
    """
    Pedidos del restaurante. Modelo crítico del negocio.
    Incluye toda la información necesaria para el flujo operativo.
    """
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información básica
    table_number = Column(Integer, ForeignKey("tables.number"), nullable=False, index=True)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Estados del pedido
    status = Column(String(50), default="pending", nullable=False, index=True)
    # pending -> preparing -> ready -> delivered -> paid
    
    # Información financiera
    subtotal = Column(DECIMAL(10, 2), nullable=False, default=0)
    tax_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    
    # Tiempos críticos para el negocio
    ordered_at = Column(DateTime, default=func.now(), nullable=False)
    kitchen_notified_at = Column(DateTime, nullable=True)
    preparation_started_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Notas y observaciones
    customer_notes = Column(Text, nullable=True)
    kitchen_notes = Column(Text, nullable=True)
    
    # Relaciones
    table = relationship("Table", back_populates="orders")
    waiter = relationship("User", back_populates="orders_as_waiter")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    
    @validates('status')
    def validate_status(self, key, status):
        valid_statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'paid']
        if status not in valid_statuses:
            raise ValueError(f"Estado debe ser uno de: {', '.join(valid_statuses)}")
        return status
    
    @property
    def preparation_time_minutes(self) -> Optional[int]:
        """Calcular tiempo de preparación en minutos"""
        if self.preparation_started_at and self.ready_at:
            delta = self.ready_at - self.preparation_started_at
            return int(delta.total_seconds() / 60)
        return None

class OrderItem(Base, TimestampMixin):
    """
    Items individuales de cada pedido.
    """
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Información del pedido
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)  # Precio al momento del pedido
    
    # Customizaciones
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    modifications = Column(JSON, nullable=True)  # {"sin_cebolla": true, "extra_queso": true}
    special_notes = Column(Text, nullable=True)
    
    # Estado individual del item
    status = Column(String(50), default="pending", nullable=False)
    
    # Relaciones
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    variant = relationship("ProductVariant")

class Payment(Base, TimestampMixin):
    """
    Pagos procesados para cada pedido.
    Integración con Stripe y métodos locales.
    """
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    
    # Información del pago
    amount = Column(DECIMAL(10, 2), nullable=False)
    method = Column(String(50), nullable=False)  # cash, card, transfer
    status = Column(String(50), default="pending", nullable=False)  # pending, completed, failed
    
    # Integración con Stripe
    stripe_payment_intent_id = Column(String(200), nullable=True)
    stripe_charge_id = Column(String(200), nullable=True)
    
    # Información adicional
    tip_amount = Column(DECIMAL(10, 2), default=0)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Tiempos
    paid_at = Column(DateTime, nullable=True)
    
    # Relaciones
    order = relationship("Order", back_populates="payment")
    cashier = relationship("User")
    
    @validates('method')
    def validate_payment_method(self, key, method):
        valid_methods = ['cash', 'card', 'transfer', 'digital_wallet']
        if method not in valid_methods:
            raise ValueError(f"Método debe ser uno de: {', '.join(valid_methods)}")
        return method

# Índices para optimización de consultas críticas
"""
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_orders_table_status ON orders(table_number, status);
CREATE INDEX idx_order_items_order_status ON order_items(order_id, status);
CREATE INDEX idx_products_category_available ON products(category_id, is_available);
CREATE INDEX idx_ingredients_stock_alert ON ingredients(current_stock, min_stock_alert);
"""