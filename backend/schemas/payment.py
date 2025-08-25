"""
Payment schemas for API validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class PaymentMethodEnum(str, Enum):
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    DIGITAL_WALLET = "digital_wallet"


class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentBase(BaseModel):
    amount: Decimal = Field(..., description="Payment amount", ge=0)
    method: PaymentMethodEnum
    tip_amount: Optional[Decimal] = Field(0, ge=0)
    reference_number: Optional[str] = None


class PaymentCreate(PaymentBase):
    order_id: int


class StripePaymentIntent(BaseModel):
    order_id: int
    amount: Decimal
    tip_amount: Optional[Decimal] = 0
    currency: str = "USD"


class StripePaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str


class ProcessPayment(BaseModel):
    order_id: int
    payment_method_id: Optional[str] = None
    tip_amount: Optional[Decimal] = 0


class RefundRequest(BaseModel):
    payment_id: int
    reason: Optional[str] = None
    amount: Optional[Decimal] = None


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: Decimal
    method: PaymentMethodEnum
    status: PaymentStatusEnum
    tip_amount: Decimal
    paid_at: Optional[datetime]
    refunded_at: Optional[datetime]
    stripe_payment_intent_id: Optional[str]
    invoice_number: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PaymentSummary(BaseModel):
    total_amount: Decimal
    subtotal: Decimal
    tax_amount: Decimal
    tip_amount: Decimal
    discount_amount: Decimal
    payment_method: PaymentMethodEnum
    status: PaymentStatusEnum


class DailySalesReport(BaseModel):
    date: datetime
    total_sales: Decimal
    total_orders: int
    total_tips: Decimal
    payment_methods: Dict[str, Decimal]
    average_order_value: Decimal


class CashRegisterSession(BaseModel):
    opening_amount: Decimal
    closing_amount: Optional[Decimal] = None
    expected_cash: Optional[Decimal] = None
    actual_cash: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    cashier_id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None