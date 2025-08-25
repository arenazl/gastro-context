"""
User model for restaurant staff.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index, Enum, func
from sqlalchemy.orm import relationship, validates
import enum

from core.database import Base
from .base import TimestampMixin, mysql_table_args


class UserRole(str, enum.Enum):
    """User roles in the restaurant system"""
    ADMIN = "admin"
    MANAGER = "manager"
    WAITER = "waiter"
    KITCHEN = "kitchen"
    CASHIER = "cashier"


class User(Base, TimestampMixin):
    """
    User model for restaurant employees.
    Includes role-based access control.
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
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hire_date = Column(DateTime, server_default=func.now())
    
    # Security fields
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # Relationships
    orders_as_waiter = relationship("Order", back_populates="waiter", foreign_keys="Order.waiter_id")
    payments_as_cashier = relationship("Payment", back_populates="cashier")
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate and normalize email"""
        if '@' not in email:
            raise ValueError("Invalid email address")
        return email.lower()
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_locked(self) -> bool:
        """Check if account is locked"""
        if self.locked_until:
            from datetime import datetime
            return datetime.utcnow() < self.locked_until
        return False
    
    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"