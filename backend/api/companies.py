"""
Companies API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import mysql.connector
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/companies", tags=["companies"])

class CompanyBase(BaseModel):
    name: str
    tax_id: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "Argentina"
    postal_code: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    currency: Optional[str] = "ARS"
    timezone: Optional[str] = "America/Argentina/Buenos_Aires"
    subscription_type: Optional[str] = "basic"
    max_users: Optional[int] = 5
    max_branches: Optional[int] = 1

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

def get_db_connection():
    """Get database connection from pool"""
    from complete_server import pool
    return pool.get_connection()

@router.get("/", response_model=List[Company])
async def get_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get all companies with optional filtering"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM companies WHERE 1=1"
        params = []
        
        if search:
            query += " AND (name LIKE %s OR email LIKE %s OR tax_id LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        if is_active is not None:
            query += " AND is_active = %s"
            params.append(is_active)
        
        query += " ORDER BY name ASC LIMIT %s OFFSET %s"
        params.extend([limit, skip])
        
        cursor.execute(query, params)
        companies = cursor.fetchall()
        
        return companies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/{company_id}", response_model=Company)
async def get_company(company_id: int):
    """Get a specific company by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
        company = cursor.fetchone()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return company
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/", response_model=Company)
async def create_company(company: CompanyCreate):
    """Create a new company"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if tax_id already exists
        if company.tax_id:
            cursor.execute("SELECT id FROM companies WHERE tax_id = %s", (company.tax_id,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Tax ID already exists")
        
        # Insert new company
        columns = []
        values = []
        placeholders = []
        
        for field, value in company.dict(exclude_unset=True).items():
            if value is not None:
                columns.append(field)
                values.append(value)
                placeholders.append("%s")
        
        query = f"INSERT INTO companies ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        cursor.execute(query, values)
        connection.commit()
        
        # Get the created company
        company_id = cursor.lastrowid
        cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
        new_company = cursor.fetchone()
        
        return new_company
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/{company_id}", response_model=Company)
async def update_company(company_id: int, company: CompanyUpdate):
    """Update a company"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if company exists
        cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
        existing_company = cursor.fetchone()
        if not existing_company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Build update query
        updates = []
        values = []
        for field, value in company.dict(exclude_unset=True).items():
            if value is not None:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            return existing_company
        
        values.append(company_id)
        query = f"UPDATE companies SET {', '.join(updates)} WHERE id = %s"
        
        cursor.execute(query, values)
        connection.commit()
        
        # Get updated company
        cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
        updated_company = cursor.fetchone()
        
        return updated_company
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/{company_id}")
async def delete_company(company_id: int):
    """Delete a company (soft delete by setting is_active = false)"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Soft delete
        cursor.execute(
            "UPDATE companies SET is_active = FALSE WHERE id = %s",
            (company_id,)
        )
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Company not found")
        
        connection.commit()
        
        return {"message": "Company deactivated successfully"}
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()