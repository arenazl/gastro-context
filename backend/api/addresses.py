"""
Addresses API endpoints for the Restaurant Management System
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
import mysql.connector

router = APIRouter()

def get_db_connection():
    """Get database connection from pool"""
    from complete_server import pool
    return pool.get_connection()

class AddressBase(BaseModel):
    address_type: str = "home"  # home, work, other
    street_address: str
    city: str
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Argentina"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False
    delivery_instructions: Optional[str] = None

class AddressCreate(AddressBase):
    customer_id: int
    company_id: int

class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: Optional[bool] = None
    delivery_instructions: Optional[str] = None

class AddressResponse(AddressBase):
    id: int
    customer_id: int
    company_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

@router.get("/api/addresses", response_model=List[AddressResponse])
async def get_addresses(customer_id: Optional[int] = None, company_id: Optional[int] = None):
    """Get all addresses"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM addresses WHERE is_active = 1"
        params = []
        
        if customer_id:
            query += " AND customer_id = %s"
            params.append(customer_id)
        
        if company_id:
            query += " AND company_id = %s"
            params.append(company_id)
        
        query += " ORDER BY is_default DESC, created_at DESC"
        
        cursor.execute(query, params)
        addresses = cursor.fetchall()
        
        # Convert decimal to float for response
        for address in addresses:
            if address.get('latitude') and isinstance(address['latitude'], Decimal):
                address['latitude'] = float(address['latitude'])
            if address.get('longitude') and isinstance(address['longitude'], Decimal):
                address['longitude'] = float(address['longitude'])
        
        return addresses
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/addresses/{address_id}", response_model=AddressResponse)
async def get_address(address_id: int):
    """Get a specific address by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM addresses WHERE id = %s"
        cursor.execute(query, (address_id,))
        address = cursor.fetchone()
        
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # Convert decimal to float
        if address.get('latitude') and isinstance(address['latitude'], Decimal):
            address['latitude'] = float(address['latitude'])
        if address.get('longitude') and isinstance(address['longitude'], Decimal):
            address['longitude'] = float(address['longitude'])
        
        return address
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/addresses", response_model=AddressResponse)
async def create_address(address: AddressCreate):
    """Create a new address"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # If this is set as default, unset other defaults for this customer
        if address.is_default:
            cursor.execute("""
                UPDATE addresses 
                SET is_default = FALSE 
                WHERE customer_id = %s AND company_id = %s
            """, (address.customer_id, address.company_id))
        
        query = """
            INSERT INTO addresses (customer_id, company_id, address_type, street_address, 
                                 city, state_province, postal_code, country, latitude, 
                                 longitude, is_default, delivery_instructions, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, NOW())
        """
        values = (
            address.customer_id, address.company_id, address.address_type,
            address.street_address, address.city, address.state_province,
            address.postal_code, address.country, address.latitude,
            address.longitude, address.is_default, address.delivery_instructions
        )
        
        cursor.execute(query, values)
        connection.commit()
        
        address_id = cursor.lastrowid
        
        # Get the created address
        cursor.execute("SELECT * FROM addresses WHERE id = %s", (address_id,))
        created_address = cursor.fetchone()
        
        if created_address:
            columns = [desc[0] for desc in cursor.description]
            address_dict = dict(zip(columns, created_address))
            
            # Convert decimal to float
            if address_dict.get('latitude') and isinstance(address_dict['latitude'], Decimal):
                address_dict['latitude'] = float(address_dict['latitude'])
            if address_dict.get('longitude') and isinstance(address_dict['longitude'], Decimal):
                address_dict['longitude'] = float(address_dict['longitude'])
            
            return address_dict
        
        raise HTTPException(status_code=500, detail="Failed to create address")
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/api/addresses/{address_id}", response_model=AddressResponse)
async def update_address(address_id: int, address_update: AddressUpdate):
    """Update an address"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if address exists
        cursor.execute("SELECT * FROM addresses WHERE id = %s", (address_id,))
        existing_address = cursor.fetchone()
        
        if not existing_address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # If setting as default, unset other defaults for this customer
        if address_update.is_default:
            cursor.execute("""
                UPDATE addresses 
                SET is_default = FALSE 
                WHERE customer_id = %s AND company_id = %s AND id != %s
            """, (existing_address['customer_id'], existing_address['company_id'], address_id))
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        if address_update.address_type is not None:
            update_fields.append("address_type = %s")
            values.append(address_update.address_type)
        
        if address_update.street_address is not None:
            update_fields.append("street_address = %s")
            values.append(address_update.street_address)
        
        if address_update.city is not None:
            update_fields.append("city = %s")
            values.append(address_update.city)
        
        if address_update.state_province is not None:
            update_fields.append("state_province = %s")
            values.append(address_update.state_province)
        
        if address_update.postal_code is not None:
            update_fields.append("postal_code = %s")
            values.append(address_update.postal_code)
        
        if address_update.country is not None:
            update_fields.append("country = %s")
            values.append(address_update.country)
        
        if address_update.latitude is not None:
            update_fields.append("latitude = %s")
            values.append(address_update.latitude)
        
        if address_update.longitude is not None:
            update_fields.append("longitude = %s")
            values.append(address_update.longitude)
        
        if address_update.is_default is not None:
            update_fields.append("is_default = %s")
            values.append(address_update.is_default)
        
        if address_update.delivery_instructions is not None:
            update_fields.append("delivery_instructions = %s")
            values.append(address_update.delivery_instructions)
        
        if update_fields:
            update_fields.append("updated_at = NOW()")
            query = f"UPDATE addresses SET {', '.join(update_fields)} WHERE id = %s"
            values.append(address_id)
            
            cursor.execute(query, values)
            connection.commit()
        
        # Get updated address
        cursor.execute("SELECT * FROM addresses WHERE id = %s", (address_id,))
        updated_address = cursor.fetchone()
        
        # Convert decimal to float
        if updated_address.get('latitude') and isinstance(updated_address['latitude'], Decimal):
            updated_address['latitude'] = float(updated_address['latitude'])
        if updated_address.get('longitude') and isinstance(updated_address['longitude'], Decimal):
            updated_address['longitude'] = float(updated_address['longitude'])
        
        return updated_address
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/api/addresses/{address_id}")
async def delete_address(address_id: int):
    """Delete an address (soft delete)"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if address exists
        cursor.execute("SELECT id FROM addresses WHERE id = %s", (address_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Address not found")
        
        # Soft delete address
        cursor.execute("UPDATE addresses SET is_active = 0, updated_at = NOW() WHERE id = %s", (address_id,))
        connection.commit()
        
        return {"message": "Address deleted successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/addresses/{address_id}/set-default")
async def set_default_address(address_id: int):
    """Set an address as the default for the customer"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get the address to find customer_id and company_id
        cursor.execute("SELECT customer_id, company_id FROM addresses WHERE id = %s", (address_id,))
        address_info = cursor.fetchone()
        
        if not address_info:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # Unset all defaults for this customer
        cursor.execute("""
            UPDATE addresses 
            SET is_default = FALSE 
            WHERE customer_id = %s AND company_id = %s
        """, (address_info['customer_id'], address_info['company_id']))
        
        # Set this address as default
        cursor.execute("""
            UPDATE addresses 
            SET is_default = TRUE, updated_at = NOW() 
            WHERE id = %s
        """, (address_id,))
        
        connection.commit()
        
        return {"message": "Address set as default successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/addresses/nearby")
async def get_nearby_addresses(latitude: float, longitude: float, radius_km: float = 10.0, company_id: Optional[int] = None):
    """Get addresses near a specific location using Haversine formula"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Haversine formula to calculate distance
        query = """
            SELECT *, 
                   (6371 * acos(cos(radians(%s)) 
                   * cos(radians(latitude)) 
                   * cos(radians(longitude) - radians(%s)) 
                   + sin(radians(%s)) 
                   * sin(radians(latitude)))) AS distance_km
            FROM addresses 
            WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL 
            AND is_active = 1
        """
        params = [latitude, longitude, latitude]
        
        if company_id:
            query += " AND company_id = %s"
            params.append(company_id)
        
        query += """
            HAVING distance_km <= %s
            ORDER BY distance_km
            LIMIT 50
        """
        params.append(radius_km)
        
        cursor.execute(query, params)
        addresses = cursor.fetchall()
        
        # Convert decimal to float
        for address in addresses:
            if address.get('latitude') and isinstance(address['latitude'], Decimal):
                address['latitude'] = float(address['latitude'])
            if address.get('longitude') and isinstance(address['longitude'], Decimal):
                address['longitude'] = float(address['longitude'])
            if address.get('distance_km') and isinstance(address['distance_km'], Decimal):
                address['distance_km'] = float(address['distance_km'])
        
        return addresses
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()