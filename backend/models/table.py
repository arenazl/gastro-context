"""
Table model for restaurant seating management.
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
import enum

from core.database import Base
from .base import TimestampMixin, mysql_table_args


class TableStatus(str, enum.Enum):
    """Table status options"""
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CLEANING = "cleaning"


class Table(Base, TimestampMixin):
    """
    Restaurant tables with location and capacity information.
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
    location = Column(String(100), nullable=True)  # "Terrace", "Main Hall", etc.
    is_active = Column(Boolean, default=True)
    
    # Layout positioning for visual display (optional)
    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Current state
    current_status = Column(Enum(TableStatus), default=TableStatus.AVAILABLE)
    current_order_id = Column(Integer, ForeignKey("orders.id", use_alter=True), nullable=True)
    
    # Relationships
    orders = relationship("Order", back_populates="table", foreign_keys="Order.table_number", primaryjoin="Table.number==Order.table_number")
    
    @property
    def is_available_for_seating(self) -> bool:
        """Check if table can accept new customers"""
        return self.current_status == TableStatus.AVAILABLE and self.is_active
    
    def __repr__(self):
        return f"<Table {self.number} ({self.capacity} seats) - {self.current_status.value}>"