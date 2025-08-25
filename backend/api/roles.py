"""
Roles API endpoints for the Restaurant Management System
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

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

@router.get("/api/roles", response_model=List[RoleResponse])
async def get_roles():
    """Get all roles"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM roles ORDER BY id"
        cursor.execute(query)
        roles = cursor.fetchall()
        
        return roles
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int):
    """Get a specific role by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM roles WHERE id = %s"
        cursor.execute(query, (role_id,))
        role = cursor.fetchone()
        
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        return role
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/roles", response_model=RoleResponse)
async def create_role(role: RoleCreate):
    """Create a new role"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            INSERT INTO roles (name, description, permissions)
            VALUES (%s, %s, %s)
        """
        values = (role.name, role.description, role.permissions)
        
        cursor.execute(query, values)
        connection.commit()
        
        role_id = cursor.lastrowid
        
        # Get the created role
        cursor.execute("SELECT * FROM roles WHERE id = %s", (role_id,))
        created_role = cursor.fetchone()
        
        if created_role:
            columns = [desc[0] for desc in cursor.description]
            role_dict = dict(zip(columns, created_role))
            return role_dict
        
        raise HTTPException(status_code=500, detail="Failed to create role")
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Role name already exists")
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/api/roles/{role_id}", response_model=RoleResponse)
async def update_role(role_id: int, role_update: RoleUpdate):
    """Update a role"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if role exists
        cursor.execute("SELECT * FROM roles WHERE id = %s", (role_id,))
        existing_role = cursor.fetchone()
        
        if not existing_role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        if role_update.name is not None:
            update_fields.append("name = %s")
            values.append(role_update.name)
        
        if role_update.description is not None:
            update_fields.append("description = %s")
            values.append(role_update.description)
        
        if role_update.permissions is not None:
            update_fields.append("permissions = %s")
            values.append(role_update.permissions)
        
        if update_fields:
            update_fields.append("updated_at = NOW()")
            query = f"UPDATE roles SET {', '.join(update_fields)} WHERE id = %s"
            values.append(role_id)
            
            cursor.execute(query, values)
            connection.commit()
        
        # Get updated role
        cursor.execute("SELECT * FROM roles WHERE id = %s", (role_id,))
        updated_role = cursor.fetchone()
        
        return updated_role
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Role name already exists")
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/api/roles/{role_id}")
async def delete_role(role_id: int):
    """Delete a role"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if role exists
        cursor.execute("SELECT id FROM roles WHERE id = %s", (role_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Check if role is in use
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role_id = %s", (role_id,))
        count = cursor.fetchone()[0]
        if count > 0:
            raise HTTPException(status_code=400, detail=f"Cannot delete role: {count} users are using this role")
        
        # Delete role
        cursor.execute("DELETE FROM roles WHERE id = %s", (role_id,))
        connection.commit()
        
        return {"message": "Role deleted successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()