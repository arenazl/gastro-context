from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

from ..core.database import get_db
from ..core.security import get_current_user
from ..core.websocket import manager
from ..models.order import Order, OrderItem
from ..models.table import Table
from ..models.product import Product
from ..models.user import User
from ..schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    OrderItemCreate,
    OrderItemResponse
)

router = APIRouter()

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    table_number: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders with optional filters"""
    query = select(Order)
    
    if status:
        query = query.where(Order.status == status)
    if table_number:
        query = query.where(Order.table_number == table_number)
    
    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific order by ID"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new order"""
    # Check if table exists and is available
    result = await db.execute(
        select(Table).where(Table.number == order_data.table_number)
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table {order_data.table_number} not found"
        )
    
    if table.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Table {order_data.table_number} is not available"
        )
    
    # Create order
    order = Order(
        table_number=order_data.table_number,
        waiter_id=current_user.id,
        status="pending",
        notes=order_data.notes
    )
    
    # Calculate totals
    subtotal = 0
    
    # Add order items
    for item_data in order_data.items:
        # Get product to verify it exists and get current price
        result = await db.execute(
            select(Product).where(Product.id == item_data.product_id)
        )
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found"
            )
        
        if not product.available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product.name} is not available"
            )
        
        # Create order item
        order_item = OrderItem(
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            price=product.price,  # Use current product price
            notes=item_data.notes
        )
        
        order.items.append(order_item)
        subtotal += product.price * item_data.quantity
    
    # Calculate tax and total
    order.subtotal = subtotal
    order.tax = subtotal * 0.10  # 10% tax
    order.total = order.subtotal + order.tax
    
    # Update table status
    table.status = "occupied"
    
    # Save to database
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # Send WebSocket notification to kitchen
    await manager.notify_kitchen_new_order({
        "id": order.id,
        "table_number": order.table_number,
        "items": [
            {
                "product_name": item.product.name if hasattr(item, 'product') else f"Product {item.product_id}",
                "quantity": item.quantity,
                "notes": item.notes
            }
            for item in order.items
        ],
        "status": order.status,
        "waiter": current_user.first_name
    })
    
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order status"""
    valid_statuses = ["pending", "preparing", "ready", "delivered", "cancelled"]
    
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update order status
    order.status = status
    order.updated_at = datetime.utcnow()
    
    # If order is delivered or cancelled, free up the table
    if status in ["delivered", "cancelled"]:
        result = await db.execute(
            select(Table).where(Table.number == order.table_number)
        )
        table = result.scalar_one_or_none()
        if table:
            table.status = "available"
    
    await db.commit()
    await db.refresh(order)
    
    return order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an order (add/remove items)"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status in ["delivered", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify delivered or cancelled orders"
        )
    
    # Update notes if provided
    if order_update.notes is not None:
        order.notes = order_update.notes
    
    # Add new items if provided
    if order_update.add_items:
        subtotal = order.subtotal
        
        for item_data in order_update.add_items:
            # Get product
            result = await db.execute(
                select(Product).where(Product.id == item_data.product_id)
            )
            product = result.scalar_one_or_none()
            
            if not product or not product.available:
                continue
            
            # Check if item already exists in order
            existing_item = None
            for item in order.items:
                if item.product_id == item_data.product_id:
                    existing_item = item
                    break
            
            if existing_item:
                # Update quantity
                existing_item.quantity += item_data.quantity
            else:
                # Add new item
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item_data.product_id,
                    quantity=item_data.quantity,
                    price=product.price,
                    notes=item_data.notes
                )
                order.items.append(order_item)
            
            subtotal += product.price * item_data.quantity
        
        # Recalculate totals
        order.subtotal = subtotal
        order.tax = subtotal * 0.10
        order.total = order.subtotal + order.tax
    
    order.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(order)
    
    return order

@router.delete("/{order_id}")
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an order"""
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status in ["delivered", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already completed or cancelled"
        )
    
    # Update order status
    order.status = "cancelled"
    order.updated_at = datetime.utcnow()
    
    # Free up the table
    result = await db.execute(
        select(Table).where(Table.number == order.table_number)
    )
    table = result.scalar_one_or_none()
    if table:
        table.status = "available"
    
    await db.commit()
    
    return {"message": "Order cancelled successfully"}

@router.get("/table/{table_number}/active", response_model=Optional[OrderResponse])
async def get_active_order_for_table(
    table_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get active order for a specific table"""
    result = await db.execute(
        select(Order).where(
            and_(
                Order.table_number == table_number,
                Order.status.notin_(["delivered", "cancelled"])
            )
        ).order_by(Order.created_at.desc())
    )
    order = result.scalar_one_or_none()
    
    return order