"""
Areas API endpoints for the Restaurant Management System
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import mysql.connector

router = APIRouter()

def get_db_connection():
    """Get database connection from pool"""
    from complete_server import pool
    return pool.get_connection()

class AreaBase(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int = 0
    outdoor: bool = False
    smoking_allowed: bool = False
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "square"

class AreaCreate(AreaBase):
    company_id: int

class AreaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    outdoor: Optional[bool] = None
    smoking_allowed: Optional[bool] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class AreaResponse(AreaBase):
    id: int
    company_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

@router.get("/api/areas", response_model=List[AreaResponse])
async def get_areas(company_id: Optional[int] = None):
    """Get all areas"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if company_id:
            query = "SELECT * FROM areas WHERE company_id = %s AND is_active = 1 ORDER BY name"
            cursor.execute(query, (company_id,))
        else:
            query = "SELECT * FROM areas WHERE is_active = 1 ORDER BY name"
            cursor.execute(query)
        
        areas = cursor.fetchall()
        return areas
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/areas/{area_id}", response_model=AreaResponse)
async def get_area(area_id: int):
    """Get a specific area by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM areas WHERE id = %s"
        cursor.execute(query, (area_id,))
        area = cursor.fetchone()
        
        if not area:
            raise HTTPException(status_code=404, detail="Area not found")
        
        return area
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/areas", response_model=AreaResponse)
async def create_area(area: AreaCreate):
    """Create a new area"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            INSERT INTO areas (company_id, name, description, capacity, outdoor, 
                             smoking_allowed, color, icon, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, NOW())
        """
        values = (
            area.company_id, area.name, area.description, area.capacity,
            area.outdoor, area.smoking_allowed, area.color, area.icon
        )
        
        cursor.execute(query, values)
        connection.commit()
        
        area_id = cursor.lastrowid
        
        # Get the created area
        cursor.execute("SELECT * FROM areas WHERE id = %s", (area_id,))
        created_area = cursor.fetchone()
        
        if created_area:
            columns = [desc[0] for desc in cursor.description]
            area_dict = dict(zip(columns, created_area))
            return area_dict
        
        raise HTTPException(status_code=500, detail="Failed to create area")
        
    except mysql.connector.IntegrityError as e:
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/api/areas/{area_id}", response_model=AreaResponse)
async def update_area(area_id: int, area_update: AreaUpdate):
    """Update an area"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if area exists
        cursor.execute("SELECT * FROM areas WHERE id = %s", (area_id,))
        existing_area = cursor.fetchone()
        
        if not existing_area:
            raise HTTPException(status_code=404, detail="Area not found")
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        if area_update.name is not None:
            update_fields.append("name = %s")
            values.append(area_update.name)
        
        if area_update.description is not None:
            update_fields.append("description = %s")
            values.append(area_update.description)
        
        if area_update.capacity is not None:
            update_fields.append("capacity = %s")
            values.append(area_update.capacity)
        
        if area_update.outdoor is not None:
            update_fields.append("outdoor = %s")
            values.append(area_update.outdoor)
        
        if area_update.smoking_allowed is not None:
            update_fields.append("smoking_allowed = %s")
            values.append(area_update.smoking_allowed)
        
        if area_update.color is not None:
            update_fields.append("color = %s")
            values.append(area_update.color)
        
        if area_update.icon is not None:
            update_fields.append("icon = %s")
            values.append(area_update.icon)
        
        if update_fields:
            update_fields.append("updated_at = NOW()")
            query = f"UPDATE areas SET {', '.join(update_fields)} WHERE id = %s"
            values.append(area_id)
            
            cursor.execute(query, values)
            connection.commit()
        
        # Get updated area
        cursor.execute("SELECT * FROM areas WHERE id = %s", (area_id,))
        updated_area = cursor.fetchone()
        
        return updated_area
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/api/areas/{area_id}")
async def delete_area(area_id: int):
    """Delete an area (soft delete)"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if area exists
        cursor.execute("SELECT id FROM areas WHERE id = %s", (area_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Area not found")
        
        # Check if area has tables
        cursor.execute("SELECT COUNT(*) as count FROM tables WHERE area_id = %s", (area_id,))
        count = cursor.fetchone()[0]
        if count > 0:
            raise HTTPException(status_code=400, detail=f"Cannot delete area: {count} tables are assigned to this area")
        
        # Soft delete area
        cursor.execute("UPDATE areas SET is_active = 0, updated_at = NOW() WHERE id = %s", (area_id,))
        connection.commit()
        
        return {"message": "Area deleted successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()