"""
Modelos de base de datos MySQL para el sistema gastronómico.
SIEMPRE usar esta estructura y patrones para todos los modelos.

Configuración específica para MySQL:
- Engine: InnoDB para transacciones ACID
- Charset: utf8mb4 para emojis y caracteres especiales
- Collation: utf8mb4_unicode_ci para ordenamiento correcto
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import LONGTEXT, MEDIUMTEXT

Base = declarative_base()

# Configuración MySQL específica
mysql_table_args = {
    'mysql_engine': 'InnoDB',
    'mysql_charset': 'utf8mb4',
    'mysql_collate': 'utf8mb4_unicode_ci'
}

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
    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_role_active', 'role', 'is_active'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # admin, manager, waiter, kitchen, cashier
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hire_date = Column(DateTime, default=func.now())
    
    # Configuración adicional para MySQL
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
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
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

class Category(Base, TimestampMixin):
    """Categorías de productos (Entrantes, Principales, Postres, Bebidas, etc.)"""
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
    icon = Column(String(50), nullable=True)  # Para iconos en la UI
    color = Column(String(7), nullable=True)  # Color hex para categoría
    
    # Relaciones
    products = relationship("Product", back_populates="category")
    
    def __repr__(self):
        return f"<Category {self.name}>"

class Product(Base, TimestampMixin):
    """
    Productos del menú con información completa para el negocio.
    Incluye costos, tiempos de preparación y disponibilidad.
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
    
    # Precios y costos - DECIMAL para precisión en MySQL
    base_price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2), nullable=True)  # Para calcular margen
    
    # Información operativa
    preparation_time = Column(Integer, nullable=False)  # Minutos
    is_available = Column(Boolean, default=True, nullable=False)
    requires_kitchen = Column(Boolean, default=True)  # False para bebidas simples
    
    # Media y presentación
    image_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)  # Para destacados
    
    # Información nutricional/alérgenos - JSON en MySQL
    allergens = Column(JSON, nullable=True)  # ["gluten", "lactosa", "nueces"]
    nutritional_info = Column(JSON, nullable=True)  # {"calories": 850, "protein": 25}
    calories = Column(Integer, nullable=True)
    
    # SEO y metadata
    slug = Column(String(250), unique=True, nullable=True)  # Para URLs amigables
    tags = Column(JSON, nullable=True)  # ["vegetariano", "sin_gluten", "picante"]
    
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
    
    @property
    def profit_margin(self) -> Optional[Decimal]:
        """Calcular margen de ganancia"""
        if self.cost_price and self.base_price:
            return ((self.base_price - self.cost_price) / self.base_price) * 100
        return None
    
    def __repr__(self):
        return f"<Product {self.name} - ${self.base_price}>"

class ProductVariant(Base, TimestampMixin):
    """
    Variantes de productos (tamaños, temperaturas, etc.)
    Ejemplo: Pizza Grande, Café Frío, etc.
    """
    __tablename__ = "product_variants"
    __table_args__ = (
        Index('idx_variants_product_type', 'product_id', 'type'),
        Index('idx_variants_available', 'is_available'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)  # "Grande", "Mediano", "Frío", "Caliente"
    type = Column(String(50), nullable=False)   # "size", "temperature", "style"
    price_modifier = Column(DECIMAL(10, 2), default=0)  # +/- al precio base
    is_available = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    # Relaciones
    product = relationship("Product", back_populates="variants")
    
    def __repr__(self):
        return f"<ProductVariant {self.name} ({self.type})>"

class Ingredient(Base, TimestampMixin):
    """
    Ingredientes para control de inventario y costos.
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
    unit_type = Column(String(20), nullable=False)  # kg, litros, unidades
    cost_per_unit = Column(DECIMAL(10, 4), nullable=False)
    current_stock = Column(DECIMAL(10, 2), default=0)
    min_stock_alert = Column(DECIMAL(10, 2), default=0)  # Para alertas automáticas
    max_stock = Column(DECIMAL(10, 2), nullable=True)  # Stock máximo
    supplier = Column(String(200), nullable=True)
    supplier_code = Column(String(100), nullable=True)  # Código del proveedor
    
    # Fechas de vencimiento para productos perecederos
    expiry_date = Column(DateTime, nullable=True)
    days_until_expiry_alert = Column(Integer, default=7)
    
    # Relaciones
    products = relationship("ProductIngredient", back_populates="ingredient")
    
    @property
    def stock_status(self) -> str:
        """Estado del stock: ok, low, critical, out"""
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
    Relación many-to-many entre productos e ingredientes.
    Define qué ingredientes usa cada producto y en qué cantidad.
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
    quantity_needed = Column(DECIMAL(10, 4), nullable=False)  # Cantidad por porción
    is_optional = Column(Boolean, default=False)  # Para ingredientes opcionales
    
    # Relaciones
    product = relationship("Product", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="products")
    
    def __repr__(self):
        return f"<ProductIngredient {self.product_id}:{self.ingredient_id}>"

class Table(Base, TimestampMixin):
    """
    Mesas del restaurante con información de ubicación y capacidad.
    """
    __tablename__ = "tables"
    __table_args__ = (
        Index('idx_tables_number', 'number'),
        Index('idx_tables_location_active', 'location', 'is_active'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    number = Column(Integer, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    location = Column(String(100), nullable=True)  # "Terraza", "Salón principal", etc.
    is_active = Column(Boolean, default=True)
    
    # Coordenadas para layout visual (opcional)
    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Estado actual de la mesa
    current_status = Column(String(50), default="available")  # available, occupied, reserved, cleaning
    current_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    # Relaciones
    orders = relationship("Order", back_populates="table", foreign_keys="Order.table_number")
    current_order = relationship("Order", foreign_keys=[current_order_id])
    
    def __repr__(self):
        return f"<Table {self.number} ({self.capacity} persons)>"

class Order(Base, TimestampMixin):
    """
    Pedidos del restaurante. Modelo crítico del negocio.
    Incluye toda la información necesaria para el flujo operativo.
    """
    __tablename__ = "orders"
    __table_args__ = (
        Index('idx_orders_table_status', 'table_number', 'status'),
        Index('idx_orders_status_created', 'status', 'created_at'),
        Index('idx_orders_waiter_date', 'waiter_id', 'created_at'),
        Index('idx_orders_daily_reports', 'ordered_at'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Información básica
    table_number = Column(Integer, ForeignKey("tables.number"), nullable=False)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Estados del pedido
    status = Column(String(50), default="pending", nullable=False)
    # pending -> preparing -> ready -> delivered -> paid
    
    # Información financiera - DECIMAL para precisión en MySQL
    subtotal = Column(DECIMAL(10, 2), nullable=False, default=0)
    tax_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    discount_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    tip_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    
    # Tiempos críticos para el negocio
    ordered_at = Column(DateTime, default=func.now(), nullable=False)
    kitchen_notified_at = Column(DateTime, nullable=True)
    preparation_started_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Información del cliente (opcional)
    customer_name = Column(String(200), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    # Notas y observaciones
    customer_notes = Column(MEDIUMTEXT, nullable=True)
    kitchen_notes = Column(MEDIUMTEXT, nullable=True)
    internal_notes = Column(MEDIUMTEXT, nullable=True)
    
    # Metadata del pedido
    order_type = Column(String(50), default="dine_in")  # dine_in, takeout, delivery
    priority_level = Column(Integer, default=0)  # 0=normal, 1=high, 2=urgent
    estimated_ready_time = Column(DateTime, nullable=True)
    
    # Relaciones
    table = relationship("Table", back_populates="orders", foreign_keys=[table_number])
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
    
    @property
    def total_time_minutes(self) -> Optional[int]:
        """Tiempo total desde orden hasta entrega"""
        if self.ordered_at and self.delivered_at:
            delta = self.delivered_at - self.ordered_at
            return int(delta.total_seconds() / 60)
        return None
    
    def __repr__(self):
        return f"<Order {self.id} - Mesa {self.table_number} ({self.status})>"

class OrderItem(Base, TimestampMixin):
    """
    Items individuales de cada pedido.
    """
    __tablename__ = "order_items"
    __table_args__ = (
        Index('idx_order_items_order_status', 'order_id', 'status'),
        Index('idx_order_items_product', 'product_id'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Información del pedido
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)  # Precio al momento del pedido
    
    # Customizaciones - JSON para MySQL
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    modifications = Column(JSON, nullable=True)  # {"sin_cebolla": true, "extra_queso": true}
    special_notes = Column(Text, nullable=True)
    
    # Estado individual del item
    status = Column(String(50), default="pending", nullable=False)
    kitchen_notes = Column(Text, nullable=True)
    
    # Tiempos específicos del item
    started_preparing_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    
    # Relaciones
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    variant = relationship("ProductVariant")
    
    @property
    def total_price(self) -> Decimal:
        """Precio total del item (precio unitario × cantidad)"""
        return self.unit_price * self.quantity
    
    def __repr__(self):
        return f"<OrderItem {self.product_id} x{self.quantity}>"

class Payment(Base, TimestampMixin):
    """
    Pagos procesados para cada pedido.
    Integración con Stripe y métodos locales.
    """
    __tablename__ = "payments"
    __table_args__ = (
        Index('idx_payments_order', 'order_id'),
        Index('idx_payments_status_method', 'status', 'method'),
        Index('idx_payments_date_reports', 'paid_at'),
        Index('idx_payments_stripe_intent', 'stripe_payment_intent_id'),
        mysql_table_args
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    
    # Información del pago
    amount = Column(DECIMAL(10, 2), nullable=False)
    method = Column(String(50), nullable=False)  # cash, card, transfer, digital_wallet
    status = Column(String(50), default="pending", nullable=False)  # pending, completed, failed, refunded
    
    # Integración con Stripe
    stripe_payment_intent_id = Column(String(200), nullable=True)
    stripe_charge_id = Column(String(200), nullable=True)
    stripe_customer_id = Column(String(200), nullable=True)
    
    # Información adicional
    tip_amount = Column(DECIMAL(10, 2), default=0)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reference_number = Column(String(100), nullable=True)  # Para transferencias
    
    # Tiempos
    paid_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Facturación
    invoice_number = Column(String(100), nullable=True)
    tax_info = Column(JSON, nullable=True)  # Información fiscal
    
    # Relaciones
    order = relationship("Order", back_populates="payment")
    cashier = relationship("User")
    
    @validates('method')
    def validate_payment_method(self, key, method):
        valid_methods = ['cash', 'card', 'transfer', 'digital_wallet']
        if method not in valid_methods:
            raise ValueError(f"Método debe ser uno de: {', '.join(valid_methods)}")
        return method
    
    def __repr__(self):
        return f"<Payment {self.id} - ${self.amount} ({self.method})>"

# Configuración específica para MySQL
"""
-- Crear base de datos con configuración correcta
CREATE DATABASE gastronomy_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Configuración de MySQL optimizada para restaurantes
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Índices adicionales para performance crítica
CREATE INDEX idx_orders_kitchen_workflow ON orders(status, ordered_at, table_number);
CREATE INDEX idx_order_items_kitchen_prep ON order_items(status, created_at);
CREATE INDEX idx_payments_daily_sales ON payments(paid_at, method, status);
CREATE INDEX idx_products_menu_display ON products(category_id, is_available, display_order);

-- Triggers para automatización (opcional)
DELIMITER $$
CREATE TRIGGER update_order_total 
AFTER INSERT ON order_items 
FOR EACH ROW 
BEGIN
    UPDATE orders 
    SET subtotal = (
        SELECT SUM(unit_price * quantity) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
END$$
DELIMITER ;
"""