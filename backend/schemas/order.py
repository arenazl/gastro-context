from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    notes: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    price: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    table_number: int
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    notes: Optional[str] = None
    add_items: Optional[List[OrderItemCreate]] = None

class OrderResponse(OrderBase):
    id: int
    waiter_id: int
    status: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True