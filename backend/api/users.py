"""
Users API endpoints for the Restaurant Management System
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import bcrypt
import mysql.connector

router = APIRouter()

def get_db_connection():
    """Get database connection from pool"""
    from complete_server import pool
    return pool.get_connection()

class UserBase(BaseModel):
    company_id: int
    role_id: Optional[int] = None
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None  # For convenience
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = "es"
    theme: Optional[str] = "light"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    role_id: Optional[int] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.get("/api/users", response_model=List[UserResponse])
async def get_users(company_id: Optional[int] = None):
    """Get all users, optionally filtered by company"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        if company_id:
            query = """
                SELECT u.*, r.name as role_name, r.description as role_description
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.company_id = %s
                ORDER BY u.created_at DESC
            """
            cursor.execute(query, (company_id,))
        else:
            query = """
                SELECT u.*, r.name as role_name, r.description as role_description
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                ORDER BY u.created_at DESC
            """
            cursor.execute(query)
        
        users = cursor.fetchall()
        
        # Process users to combine first_name and last_name into full_name
        for user in users:
            if user['first_name'] and user['last_name']:
                user['full_name'] = f"{user['first_name']} {user['last_name']}"
            elif user['first_name']:
                user['full_name'] = user['first_name']
            elif user['last_name']:
                user['full_name'] = user['last_name']
            else:
                user['full_name'] = user['username']
        
        return users
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Get a specific user by ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT u.*, r.name as role_name, r.description as role_description
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = %s
        """
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Process full_name
        if user['first_name'] and user['last_name']:
            user['full_name'] = f"{user['first_name']} {user['last_name']}"
        elif user['first_name']:
            user['full_name'] = user['first_name']
        elif user['last_name']:
            user['full_name'] = user['last_name']
        else:
            user['full_name'] = user['username']
        
        return user
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Hash the password
        password_hash = hash_password(user.password)
        
        # Parse full_name if provided
        first_name = user.first_name
        last_name = user.last_name
        if user.full_name and not (first_name and last_name):
            parts = user.full_name.split(' ', 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''
        
        # Insert user
        query = """
            INSERT INTO users (
                company_id, role_id, username, email, password_hash,
                first_name, last_name, phone, avatar_url,
                language, theme, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            user.company_id, user.role_id, user.username, user.email, password_hash,
            first_name, last_name, user.phone, user.avatar_url,
            user.language, user.theme, user.is_active
        )
        
        cursor.execute(query, values)
        connection.commit()
        
        user_id = cursor.lastrowid
        
        # Get the created user
        cursor.execute(
            "SELECT * FROM users WHERE id = %s",
            (user_id,)
        )
        created_user = cursor.fetchone()
        
        if created_user:
            # Convert tuple to dict
            columns = [desc[0] for desc in cursor.description]
            user_dict = dict(zip(columns, created_user))
            
            # Add full_name
            if user_dict['first_name'] and user_dict['last_name']:
                user_dict['full_name'] = f"{user_dict['first_name']} {user_dict['last_name']}"
            elif user_dict['first_name']:
                user_dict['full_name'] = user_dict['first_name']
            elif user_dict['last_name']:
                user_dict['full_name'] = user_dict['last_name']
            else:
                user_dict['full_name'] = user_dict['username']
            
            return user_dict
        
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            if "username" in str(e):
                raise HTTPException(status_code=400, detail="Username already exists")
            elif "email" in str(e):
                raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    """Update a user"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        existing_user = cursor.fetchone()
        
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update query dynamically
        update_fields = []
        values = []
        
        if user_update.role_id is not None:
            update_fields.append("role_id = %s")
            values.append(user_update.role_id)
        
        if user_update.email is not None:
            update_fields.append("email = %s")
            values.append(user_update.email)
        
        # Handle full_name
        if user_update.full_name is not None:
            parts = user_update.full_name.split(' ', 1)
            update_fields.append("first_name = %s")
            values.append(parts[0])
            update_fields.append("last_name = %s")
            values.append(parts[1] if len(parts) > 1 else '')
        else:
            if user_update.first_name is not None:
                update_fields.append("first_name = %s")
                values.append(user_update.first_name)
            
            if user_update.last_name is not None:
                update_fields.append("last_name = %s")
                values.append(user_update.last_name)
        
        if user_update.phone is not None:
            update_fields.append("phone = %s")
            values.append(user_update.phone)
        
        if user_update.avatar_url is not None:
            update_fields.append("avatar_url = %s")
            values.append(user_update.avatar_url)
        
        if user_update.language is not None:
            update_fields.append("language = %s")
            values.append(user_update.language)
        
        if user_update.theme is not None:
            update_fields.append("theme = %s")
            values.append(user_update.theme)
        
        if user_update.is_active is not None:
            update_fields.append("is_active = %s")
            values.append(user_update.is_active)
        
        if user_update.password is not None:
            update_fields.append("password_hash = %s")
            values.append(hash_password(user_update.password))
        
        if update_fields:
            update_fields.append("updated_at = NOW()")
            query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
            values.append(user_id)
            
            cursor.execute(query, values)
            connection.commit()
        
        # Get updated user
        cursor.execute(
            """
            SELECT u.*, r.name as role_name, r.description as role_description
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = %s
            """,
            (user_id,)
        )
        updated_user = cursor.fetchone()
        
        # Add full_name
        if updated_user['first_name'] and updated_user['last_name']:
            updated_user['full_name'] = f"{updated_user['first_name']} {updated_user['last_name']}"
        elif updated_user['first_name']:
            updated_user['full_name'] = updated_user['first_name']
        elif updated_user['last_name']:
            updated_user['full_name'] = updated_user['last_name']
        else:
            updated_user['full_name'] = updated_user['username']
        
        return updated_user
        
    except mysql.connector.IntegrityError as e:
        if "Duplicate entry" in str(e):
            if "username" in str(e):
                raise HTTPException(status_code=400, detail="Username already exists")
            elif "email" in str(e):
                raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=400, detail=f"Integrity error: {str(e)}")
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.delete("/api/users/{user_id}")
async def delete_user(user_id: int):
    """Delete a user"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        connection.commit()
        
        return {"message": "User deleted successfully"}
        
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@router.get("/api/companies/{company_id}/users", response_model=List[UserResponse])
async def get_company_users(company_id: int):
    """Get all users for a specific company"""
    return await get_users(company_id=company_id)