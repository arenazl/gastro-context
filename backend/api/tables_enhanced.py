"""
Enhanced Tables API endpoints with shape, capacity and features
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import mysql.connector
from pydantic import BaseModel
from enum import Enum

router = APIRouter(prefix="/api/tables-enhanced", tags=["tables-enhanced"])

class TableShape(str, Enum):
    square = "square"
    rectangle = "rectangle"
    round = "round"
    oval = "oval"
    l_shaped = "l-shaped"
    u_shaped = "u-shaped"
    custom = "custom"

class TableStatus(str, Enum):
    available = "available"
    occupied = "occupied"
    reserved = "reserved"
    cleaning = "cleaning"
    maintenance = "maintenance"
    blocked = "blocked"

class TableBase(BaseModel):
    company_id: int
    area_id: Optional[int] = None
    table_number: str
    capacity: int
    min_capacity: Optional[int] = 1
    max_capacity: Optional[int] = None
    shape: Optional[TableShape] = TableShape.square
    width: Optional[float] = None
    length: Optional[float] = None
    height: Optional[float] = 0.75
    position_x: Optional[int] = 0
    position_y: Optional[int] = 0
    rotation: Optional[int] = 0
    has_power_outlet: Optional[bool] = False
    has_usb_charging: Optional[bool] = False
    wheelchair_accessible: Optional[bool] = True
    high_chair_compatible: Optional[bool] = True
    booth_seating: Optional[bool] = False
    window_view: Optional[bool] = False
    preferred_for: Optional[str] = None
    qr_code: Optional[str] = None
    notes: Optional[str] = None
    is_joinable: Optional[bool] = True
    join_group: Optional[str] = None

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    area_id: Optional[int] = None
    capacity: Optional[int] = None
    min_capacity: Optional[int] = None
    max_capacity: Optional[int] = None
    shape: Optional[TableShape] = None
    width: Optional[float] = None
    length: Optional[float] = None
    height: Optional[float] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    rotation: Optional[int] = None
    has_power_outlet: Optional[bool] = None
    has_usb_charging: Optional[bool] = None
    wheelchair_accessible: Optional[bool] = None
    high_chair_compatible: Optional[bool] = None
    booth_seating: Optional[bool] = None
    window_view: Optional[bool] = None
    preferred_for: Optional[str] = None
    notes: Optional[str] = None
    is_joinable: Optional[bool] = None
    join_group: Optional[str] = None
    is_active: Optional[bool] = None

class TableStatusUpdate(BaseModel):
    status: TableStatus
    current_customer_id: Optional[int] = None
    expected_available_at: Optional[datetime] = None

class Table(TableBase):
    id: int
    status: TableStatus
    current_order_id: Optional[int] = None
    current_customer_id: Optional[int] = None
    occupied_since: Optional[datetime] = None
    expected_available_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    area_name: Optional[str] = None

    class Config:
        from_attributes = True

def get_db_connection():
    """Get database connection from pool"""
    from complete_server import pool
    return pool.get_connection()

@router.get("/", response_model=List[Table])
async def get_tables(
    company_id: int = Query(..., description="Company ID"),
    area_id: Optional[int] = None,
    status: Optional[TableStatus] = None,
    min_capacity: Optional[int] = None,
    shape: Optional[TableShape] = None,
    window_view: Optional[bool] = None,
    wheelchair_accessible: Optional[bool] = None,
    is_active: Optional[bool] = True
):
    """Get all tables with optional filtering"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT t.*, a.name as area_name 
            FROM tables_enhanced t
            LEFT JOIN areas a ON t.area_id = a.id
            WHERE t.company_id = %s
        """
        params = [company_id]
        
        if area_id is not None:
            query += " AND t.area_id = %s"
            params.append(area_id)
        
        if status:
            query += " AND t.status = %s"
            params.append(status.value)
        
        if min_capacity is not None:
            query += " AND t.capacity >= %s"
            params.append(min_capacity)
        
        if shape:
            query += " AND t.shape = %s"
            params.append(shape.value)
        
        if window_view is not None:
            query += " AND t.window_view = %s"
            params.append(window_view)
        
        if wheelchair_accessible is not None:
            query += " AND t.wheelchair_accessible = %s"
            params.append(wheelchair_accessible)
        
        if is_active is not None:
            query += " AND t.is_active = %s"
            params.append(is_active)
        
        query += " ORDER BY t.area_id, t.table_number"
        
        cursor.execute(query, params)
        tables = cursor.fetchall()
        
        return tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/{table_id}", response_model=Table)
async def get_table(table_id: int):
    """Get a specific table by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT t.*, a.name as area_name 
            FROM tables_enhanced t
            LEFT JOIN areas a ON t.area_id = a.id
            WHERE t.id = %s
        """
        cursor.execute(query, (table_id,))
        table = cursor.fetchone()
        
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        return table
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/", response_model=Table)
async def create_table(table: TableCreate):
    """Create a new table"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if table number already exists for this company
        cursor.execute(
            "SELECT id FROM tables_enhanced WHERE company_id = %s AND table_number = %s",
            (table.company_id, table.table_number)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Table number already exists for this company")
        
        # Set max_capacity if not provided
        if table.max_capacity is None:
            table.max_capacity = table.capacity * 2  # Default to double the normal capacity
        
        # Insert new table
        columns = []
        values = []
        placeholders = []
        
        for field, value in table.dict(exclude_unset=True).items():
            if value is not None:
                columns.append(field)
                values.append(value)
                placeholders.append("%s")
        
        query = f"INSERT INTO tables_enhanced ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        cursor.execute(query, values)
        connection.commit()
        
        # Get the created table with area name
        table_id = cursor.lastrowid
        query = """
            SELECT t.*, a.name as area_name 
            FROM tables_enhanced t
            LEFT JOIN areas a ON t.area_id = a.id
            WHERE t.id = %s
        """
        cursor.execute(query, (table_id,))
        new_table = cursor.fetchone()
        
        return new_table
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/{table_id}", response_model=Table)
async def update_table(table_id: int, table: TableUpdate):
    """Update a table"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if table exists
        cursor.execute("SELECT * FROM tables_enhanced WHERE id = %s", (table_id,))
        existing_table = cursor.fetchone()
        if not existing_table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        # Build update query
        updates = []
        values = []
        for field, value in table.dict(exclude_unset=True).items():
            if value is not None:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            return existing_table
        
        values.append(table_id)
        query = f"UPDATE tables_enhanced SET {', '.join(updates)} WHERE id = %s"
        
        cursor.execute(query, values)
        connection.commit()
        
        # Get updated table with area name
        query = """
            SELECT t.*, a.name as area_name 
            FROM tables_enhanced t
            LEFT JOIN areas a ON t.area_id = a.id
            WHERE t.id = %s
        """
        cursor.execute(query, (table_id,))
        updated_table = cursor.fetchone()
        
        return updated_table
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/{table_id}/status", response_model=Table)
async def update_table_status(table_id: int, status_update: TableStatusUpdate):
    """Update table status (available, occupied, reserved, etc.)"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Build update query
        updates = ["status = %s"]
        values = [status_update.status.value]
        
        if status_update.status == TableStatus.occupied:
            updates.append("occupied_since = NOW()")
            if status_update.current_customer_id:
                updates.append("current_customer_id = %s")
                values.append(status_update.current_customer_id)
        elif status_update.status == TableStatus.available:
            updates.extend([
                "occupied_since = NULL",
                "current_customer_id = NULL",
                "current_order_id = NULL",
                "expected_available_at = NULL"
            ])
        
        if status_update.expected_available_at:
            updates.append("expected_available_at = %s")
            values.append(status_update.expected_available_at)
        
        values.append(table_id)
        query = f"UPDATE tables_enhanced SET {', '.join(updates)} WHERE id = %s"
        
        cursor.execute(query, values)
        connection.commit()
        
        # Get updated table
        query = """
            SELECT t.*, a.name as area_name 
            FROM tables_enhanced t
            LEFT JOIN areas a ON t.area_id = a.id
            WHERE t.id = %s
        """
        cursor.execute(query, (table_id,))
        updated_table = cursor.fetchone()
        
        return updated_table
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/{table_id}")
async def delete_table(table_id: int):
    """Delete a table (soft delete by setting is_active = false)"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Soft delete
        cursor.execute(
            "UPDATE tables_enhanced SET is_active = FALSE WHERE id = %s",
            (table_id,)
        )
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Table not found")
        
        connection.commit()
        
        return {"message": "Table deactivated successfully"}
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/join-tables")
async def join_tables(table_ids: List[int], join_group: str):
    """Join multiple tables together"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Update all tables with the same join_group
        placeholders = ','.join(['%s'] * len(table_ids))
        query = f"""
            UPDATE tables_enhanced 
            SET join_group = %s 
            WHERE id IN ({placeholders}) AND is_joinable = TRUE
        """
        
        cursor.execute(query, [join_group] + table_ids)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="No joinable tables found")
        
        connection.commit()
        
        return {"message": f"Tables joined successfully with group: {join_group}"}
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()