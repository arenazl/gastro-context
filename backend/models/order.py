"""
Order and order item models - core business entities.
"""
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, ForeignKey, JSON, Index, DateTime, Enum, func
from sqlalchemy.orm import relationship, validates
from decimal import Decimal
from typing import Optional
import enum

from core.database import Base
from .base import TimestampMixin, mysql_table_args


class OrderStatus(str, enum.Enum):
    """Order lifecycle statuses"""
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    PAID = "paid"


class OrderType(str, enum.Enum):
    """Types of orders"""
    DINE_IN = "dine_in"
    TAKEOUT = "takeout"
    DELIVERY = "delivery"


class Order(Base, TimestampMixin):
    """
    Orders - the critical business entity.
    Tracks complete order lifecycle from placement to payment.
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
    
    # Basic information
    table_number = Column(Integer, ForeignKey("tables.number"), nullable=False)
    waiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status tracking
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Financial information - DECIMAL for precision
    subtotal = Column(DECIMAL(10, 2), nullable=False, default=0)
    tax_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    discount_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    tip_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    
    # Critical timestamps for business operations
    ordered_at = Column(DateTime, server_default=func.now(), nullable=False)
    kitchen_notified_at = Column(DateTime, nullable=True)
    preparation_started_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Customer information (optional)
    customer_name = Column(String(200), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    # Notes and special instructions
    customer_notes = Column(Text, nullable=True)
    kitchen_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Order metadata
    order_type = Column(Enum(OrderType), default=OrderType.DINE_IN)
    priority_level = Column(Integer, default=0)  # 0=normal, 1=high, 2=urgent
    estimated_ready_time = Column(DateTime, nullable=True)
    
    # Relationships
    table = relationship("Table", back_populates="orders", foreign_keys=[table_number], primaryjoin="Table.number==Order.table_number")
    waiter = relationship("User", back_populates="orders_as_waiter")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    
    @validates('status')
    def validate_status(self, key, status):
        """Validate status transitions"""
        # TODO: Add state machine validation for status transitions
        return status
    
    @property
    def preparation_time_minutes(self) -> Optional[int]:
        """Calculate preparation time in minutes"""
        if self.preparation_started_at and self.ready_at:
            delta = self.ready_at - self.preparation_started_at
            return int(delta.total_seconds() / 60)
        return None
    
    @property
    def total_time_minutes(self) -> Optional[int]:
        """Total time from order to delivery"""
        if self.ordered_at and self.delivered_at:
            delta = self.delivered_at - self.ordered_at
            return int(delta.total_seconds() / 60)
        return None
    
    @property
    def is_active(self) -> bool:
        """Check if order is still active"""
        return self.status not in [OrderStatus.PAID, OrderStatus.CANCELLED]
    
    def calculate_totals(self):
        """Recalculate order totals based on items"""
        if self.items:
            self.subtotal = sum(item.total_price for item in self.items)
            self.tax_amount = self.subtotal * Decimal('0.21')  # 21% VAT
            self.total_amount = self.subtotal + self.tax_amount + self.tip_amount - self.discount_amount
    
    def __repr__(self):
        return f"<Order {self.id} - Table {self.table_number} ({self.status.value})>"


class OrderItemStatus(str, enum.Enum):
    """Individual item statuses"""
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItem(Base, TimestampMixin):
    """
    Individual items within an order.
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
    
    # Order details
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)  # Price at time of order
    
    # Customizations
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    modifications = Column(JSON, nullable=True)  # {"no_onion": true, "extra_cheese": true}
    special_notes = Column(Text, nullable=True)
    
    # Item status tracking
    status = Column(Enum(OrderItemStatus), default=OrderItemStatus.PENDING, nullable=False)
    kitchen_notes = Column(Text, nullable=True)
    
    # Timing for individual items
    started_preparing_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    variant = relationship("ProductVariant")
    
    @property
    def total_price(self) -> Decimal:
        """Calculate total price for this item"""
        base_total = self.unit_price * self.quantity
        if self.variant and self.variant.price_modifier:
            base_total += self.variant.price_modifier * self.quantity
        return base_total
    
    @property
    def preparation_time(self) -> Optional[int]:
        """Get preparation time in minutes"""
        if self.started_preparing_at and self.ready_at:
            delta = self.ready_at - self.started_preparing_at
            return int(delta.total_seconds() / 60)
        return None
    
    def __repr__(self):
        return f"<OrderItem {self.product_id} x{self.quantity} - Order {self.order_id}>"