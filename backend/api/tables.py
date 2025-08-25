from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.table import Table
from ..models.user import User
from ..schemas.table import (
    TableCreate,
    TableResponse,
    TableUpdate,
    TableStatusUpdate
)

router = APIRouter()

@router.get("/", response_model=List[TableResponse])
async def get_tables(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    location: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tables with optional filters"""
    query = select(Table)
    
    if status:
        query = query.where(Table.status == status)
    if location:
        query = query.where(Table.location == location)
    
    query = query.offset(skip).limit(limit).order_by(Table.number)
    
    result = await db.execute(query)
    tables = result.scalars().all()
    
    return tables

@router.get("/{table_id}", response_model=TableResponse)
async def get_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific table by ID"""
    result = await db.execute(
        select(Table).where(Table.id == table_id)
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    return table

@router.get("/number/{table_number}", response_model=TableResponse)
async def get_table_by_number(
    table_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific table by table number"""
    result = await db.execute(
        select(Table).where(Table.number == table_number)
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table {table_number} not found"
        )
    
    return table

@router.post("/", response_model=TableResponse)
async def create_table(
    table_data: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new table (admin/manager only)"""
    # Check if user is admin or manager
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can create tables"
        )
    
    # Check if table number already exists
    result = await db.execute(
        select(Table).where(Table.number == table_data.number)
    )
    existing_table = result.scalar_one_or_none()
    
    if existing_table:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Table {table_data.number} already exists"
        )
    
    # Create table
    table = Table(
        number=table_data.number,
        capacity=table_data.capacity,
        location=table_data.location,
        status="available"
    )
    
    db.add(table)
    await db.commit()
    await db.refresh(table)
    
    return table

@router.put("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: int,
    table_update: TableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update table details (admin/manager only)"""
    # Check if user is admin or manager
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or manager can update tables"
        )
    
    result = await db.execute(
        select(Table).where(Table.id == table_id)
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Update fields if provided
    if table_update.capacity is not None:
        table.capacity = table_update.capacity
    if table_update.location is not None:
        table.location = table_update.location
    if table_update.status is not None:
        table.status = table_update.status
    
    table.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(table)
    
    return table

@router.patch("/{table_id}/status", response_model=TableResponse)
async def update_table_status(
    table_id: int,
    status_update: TableStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update table status"""
    valid_statuses = ["available", "occupied", "reserved", "cleaning"]
    
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    result = await db.execute(
        select(Table).where(Table.id == table_id)
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    table.status = status_update.status
    table.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(table)
    
    return table

@router.delete("/{table_id}")
async def delete_table(
    table_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a table (admin only)"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete tables"
        )
    
    result = await db.execute(
        select(Table).where(Table.id == table_id)
    )
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    
    # Check if table has active orders
    if table.status == "occupied":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete occupied table. Clear orders first."
        )
    
    await db.delete(table)
    await db.commit()
    
    return {"message": f"Table {table.number} deleted successfully"}

@router.post("/bulk-create", response_model=List[TableResponse])
async def bulk_create_tables(
    start_number: int,
    end_number: int,
    capacity: int,
    location: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk create tables (admin only)"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can bulk create tables"
        )
    
    if start_number >= end_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start number must be less than end number"
        )
    
    if end_number - start_number > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create more than 50 tables at once"
        )
    
    tables = []
    for number in range(start_number, end_number + 1):
        # Check if table number already exists
        result = await db.execute(
            select(Table).where(Table.number == number)
        )
        existing_table = result.scalar_one_or_none()
        
        if not existing_table:
            table = Table(
                number=number,
                capacity=capacity,
                location=location,
                status="available"
            )
            db.add(table)
            tables.append(table)
    
    if tables:
        await db.commit()
        for table in tables:
            await db.refresh(table)
    
    return tables