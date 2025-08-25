"""
Payment model for transaction processing.
"""
from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, JSON, Index, DateTime, Enum
from sqlalchemy.orm import relationship, validates
import enum

from core.database import Base
from .base import TimestampMixin, mysql_table_args


class PaymentMethod(str, enum.Enum):
    """Available payment methods"""
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    DIGITAL_WALLET = "digital_wallet"


class PaymentStatus(str, enum.Enum):
    """Payment processing statuses"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base, TimestampMixin):
    """
    Payments for orders.
    Integrates with Stripe and handles local payment methods.
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
    
    # Payment information
    amount = Column(DECIMAL(10, 2), nullable=False)
    method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Stripe integration fields
    stripe_payment_intent_id = Column(String(200), nullable=True)
    stripe_charge_id = Column(String(200), nullable=True)
    stripe_customer_id = Column(String(200), nullable=True)
    stripe_payment_method_id = Column(String(200), nullable=True)
    
    # Additional payment details
    tip_amount = Column(DECIMAL(10, 2), default=0)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reference_number = Column(String(100), nullable=True)  # For transfers
    
    # Timestamps
    paid_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Invoicing
    invoice_number = Column(String(100), nullable=True)
    tax_info = Column(JSON, nullable=True)  # Tax breakdown details
    
    # Relationships
    order = relationship("Order", back_populates="payment")
    cashier = relationship("User", back_populates="payments_as_cashier")
    
    @validates('method')
    def validate_payment_method(self, key, method):
        """Validate payment method requirements"""
        # Card payments require Stripe integration
        if method == PaymentMethod.CARD and not self.stripe_payment_intent_id:
            # This will be set later in the payment process
            pass
        return method
    
    @property
    def is_successful(self) -> bool:
        """Check if payment was successful"""
        return self.status == PaymentStatus.COMPLETED
    
    @property
    def can_refund(self) -> bool:
        """Check if payment can be refunded"""
        return (
            self.status == PaymentStatus.COMPLETED and
            self.refunded_at is None and
            self.method in [PaymentMethod.CARD, PaymentMethod.DIGITAL_WALLET]
        )
    
    def __repr__(self):
        return f"<Payment {self.id} - ${self.amount} ({self.method.value}) - {self.status.value}>"