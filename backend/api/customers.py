"""
Customers API endpoints for the Restaurant Management System
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import mysql.connector

router = APIRouter()

def get_db_connection():
    """Get database connection from pool"""
    from complete_server import pool
    return pool.get_connection()

class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferences: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    company_id: int

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferences: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    company_id: int
    loyalty_points: int
    total_visits: int
    total_spent: float
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

@router.get("/api/customers", response_model=List[CustomerResponse])
async def get_customers(company_id: Optional[int] = None, active_only: bool = True):
    """Get all customers"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM customers WHERE 1=1"
        params = []
        
        if company_id:
            query += " AND company_id = %s"
            params.append(company_id)
        
        if active_only:
            query += " AND is_active = 1"
        
        query += " ORDER BY last_name, first_name"
        
        cursor.execute(query, params)
        customers = cursor.fetchall()
        
        # Convert decimal to float for response
        for customer in customers:
            if customer.get('total_spent'):
                customer['total_spent'] = float(customer['total_spent'])
        
        return customers
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int):
    """Get a specific customer by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM customers WHERE id = %s"
        cursor.execute(query, (customer_id,))
        customer = cursor.fetchone()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Convert decimal to float
        if customer.get('total_spent'):
            customer['total_spent'] = float(customer['total_spent'])
        
        return customer
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate):
    """Create a new customer"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            INSERT INTO customers (company_id, first_name, last_name, email, phone, 
                                 date_of_birth, preferences, notes, loyalty_points, 
                                 total_visits, total_spent, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, 0, 0.00, 1, NOW())
        """
        values = (
            customer.company_id, customer.first_name, customer.last_name,
            customer.email, customer.phone, customer.date_of_birth,
            customer.preferences, customer.notes
        )
        
        cursor.execute(query, values)
        connection.commit()
        
        customer_id = cursor.lastrowid
        
        # Get the created customer
        cursor.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
        created_customer = cursor.fetchone()
        
        if created_customer:
            columns = [desc[0] for desc in cursor.description]
            customer_dict = dict(zip(columns, created_customer))
            if customer_dict.get('total_spent'):
                customer_dict['total_spent'] = float(customer_dict['total_spent'])
            return customer_dict
        
        raise HTTPException(status_code=500, detail="Failed to create customer")
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Customer email already exists")
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/api/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, customer_update: CustomerUpdate):
    """Update a customer"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if customer exists
        cursor.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
        existing_customer = cursor.fetchone()
        
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        if customer_update.first_name is not None:
            update_fields.append("first_name = %s")
            values.append(customer_update.first_name)
        
        if customer_update.last_name is not None:
            update_fields.append("last_name = %s")
            values.append(customer_update.last_name)
        
        if customer_update.email is not None:
            update_fields.append("email = %s")
            values.append(customer_update.email)
        
        if customer_update.phone is not None:
            update_fields.append("phone = %s")
            values.append(customer_update.phone)
        
        if customer_update.date_of_birth is not None:
            update_fields.append("date_of_birth = %s")
            values.append(customer_update.date_of_birth)
        
        if customer_update.preferences is not None:
            update_fields.append("preferences = %s")
            values.append(customer_update.preferences)
        
        if customer_update.notes is not None:
            update_fields.append("notes = %s")
            values.append(customer_update.notes)
        
        if update_fields:
            update_fields.append("updated_at = NOW()")
            query = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
            values.append(customer_id)
            
            cursor.execute(query, values)
            connection.commit()
        
        # Get updated customer
        cursor.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
        updated_customer = cursor.fetchone()
        
        if updated_customer.get('total_spent'):
            updated_customer['total_spent'] = float(updated_customer['total_spent'])
        
        return updated_customer
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/api/customers/{customer_id}")
async def delete_customer(customer_id: int):
    """Delete a customer (soft delete)"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if customer exists
        cursor.execute("SELECT id FROM customers WHERE id = %s", (customer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Check if customer has orders
        cursor.execute("SELECT COUNT(*) as count FROM orders WHERE customer_id = %s", (customer_id,))
        order_count = cursor.fetchone()
        if order_count and order_count[0] > 0:
            # Soft delete if has orders
            cursor.execute("UPDATE customers SET is_active = 0, updated_at = NOW() WHERE id = %s", (customer_id,))
            connection.commit()
            return {"message": "Customer deactivated successfully (has order history)"}
        else:
            # Hard delete if no orders
            cursor.execute("DELETE FROM customers WHERE id = %s", (customer_id,))
            connection.commit()
            return {"message": "Customer deleted successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/customers/{customer_id}/loyalty")
async def add_loyalty_points(customer_id: int, points: int):
    """Add loyalty points to customer"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if customer exists
        cursor.execute("SELECT id FROM customers WHERE id = %s", (customer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Add points
        cursor.execute("""
            UPDATE customers 
            SET loyalty_points = loyalty_points + %s, updated_at = NOW() 
            WHERE id = %s
        """, (points, customer_id))
        connection.commit()
        
        return {"message": f"Added {points} loyalty points successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/customers/search/{query}")
async def search_customers(query: str, company_id: Optional[int] = None):
    """Search customers by name, email, or phone"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        search_query = """
            SELECT * FROM customers 
            WHERE (CONCAT(first_name, ' ', last_name) LIKE %s 
                   OR email LIKE %s 
                   OR phone LIKE %s)
        """
        search_params = [f"%{query}%", f"%{query}%", f"%{query}%"]
        
        if company_id:
            search_query += " AND company_id = %s"
            search_params.append(company_id)
        
        search_query += " AND is_active = 1 ORDER BY first_name, last_name LIMIT 20"
        
        cursor.execute(search_query, search_params)
        customers = cursor.fetchall()
        
        # Convert decimal to float
        for customer in customers:
            if customer.get('total_spent'):
                customer['total_spent'] = float(customer['total_spent'])
        
        return customers
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()