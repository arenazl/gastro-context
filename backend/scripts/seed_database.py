"""
Seed database with initial data for Restaurant Management System.
"""
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import engine, AsyncSessionLocal
from core.security import hash_password
from models.user import User
from models.product import Product
from models.table import Table

async def create_users(db: AsyncSession):
    """Create initial users with different roles."""
    users_data = [
        {
            "email": "admin@restaurant.com",
            "password": "admin123",
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "is_active": True
        },
        {
            "email": "manager@restaurant.com",
            "password": "manager123",
            "first_name": "Manager",
            "last_name": "User",
            "role": "manager",
            "is_active": True
        },
        {
            "email": "waiter@restaurant.com",
            "password": "waiter123",
            "first_name": "John",
            "last_name": "Waiter",
            "role": "waiter",
            "is_active": True
        },
        {
            "email": "kitchen@restaurant.com",
            "password": "kitchen123",
            "first_name": "Chef",
            "last_name": "Kitchen",
            "role": "kitchen",
            "is_active": True
        },
        {
            "email": "cashier@restaurant.com",
            "password": "cashier123",
            "first_name": "Cash",
            "last_name": "Register",
            "role": "cashier",
            "is_active": True
        }
    ]
    
    for user_data in users_data:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == user_data["email"])
        )
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            user = User(
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"],
                is_active=user_data["is_active"]
            )
            db.add(user)
            print(f"✅ Created user: {user_data['email']}")
        else:
            print(f"⏭️  User already exists: {user_data['email']}")
    
    await db.commit()

async def create_products(db: AsyncSession):
    """Create initial menu products."""
    products_data = [
        # Appetizers
        {"name": "Caesar Salad", "description": "Fresh romaine lettuce with caesar dressing", "price": 12.99, "category": "Salads", "available": True},
        {"name": "Greek Salad", "description": "Mixed greens with feta cheese and olives", "price": 10.99, "category": "Salads", "available": True},
        {"name": "French Onion Soup", "description": "Traditional soup with melted cheese", "price": 9.99, "category": "Soups", "available": True},
        {"name": "Tomato Basil Soup", "description": "Creamy tomato soup with fresh basil", "price": 8.99, "category": "Soups", "available": True},
        
        # Main Courses
        {"name": "Grilled Salmon", "description": "Atlantic salmon with lemon butter", "price": 24.99, "category": "Seafood", "available": True},
        {"name": "Fish and Chips", "description": "Beer-battered cod with fries", "price": 17.99, "category": "Seafood", "available": True},
        {"name": "Ribeye Steak", "description": "12oz premium ribeye", "price": 34.99, "category": "Steaks", "available": True},
        {"name": "Filet Mignon", "description": "8oz tender filet", "price": 39.99, "category": "Steaks", "available": True},
        {"name": "Chicken Parmesan", "description": "Breaded chicken with marinara", "price": 19.99, "category": "Chicken", "available": True},
        {"name": "Grilled Chicken", "description": "Herb-marinated chicken breast", "price": 17.99, "category": "Chicken", "available": True},
        
        # Pizza & Pasta
        {"name": "Margherita Pizza", "description": "Classic pizza with tomato and mozzarella", "price": 18.99, "category": "Pizza", "available": True},
        {"name": "Pepperoni Pizza", "description": "Traditional pepperoni pizza", "price": 20.99, "category": "Pizza", "available": True},
        {"name": "Pasta Carbonara", "description": "Creamy pasta with bacon", "price": 16.99, "category": "Pasta", "available": True},
        {"name": "Spaghetti Bolognese", "description": "Classic meat sauce pasta", "price": 15.99, "category": "Pasta", "available": True},
        
        # Burgers
        {"name": "House Burger", "description": "Angus beef with special sauce", "price": 15.99, "category": "Burgers", "available": True},
        {"name": "Bacon Cheeseburger", "description": "Burger with bacon and cheese", "price": 17.99, "category": "Burgers", "available": True},
        
        # Desserts
        {"name": "Tiramisu", "description": "Italian coffee-flavored dessert", "price": 7.99, "category": "Desserts", "available": True},
        {"name": "Chocolate Cake", "description": "Rich chocolate layer cake", "price": 6.99, "category": "Desserts", "available": True},
        {"name": "Cheesecake", "description": "New York style cheesecake", "price": 7.49, "category": "Desserts", "available": True},
        
        # Beverages
        {"name": "Coca Cola", "description": "Classic soft drink", "price": 3.99, "category": "Beverages", "available": True},
        {"name": "Fresh Orange Juice", "description": "Freshly squeezed", "price": 5.99, "category": "Beverages", "available": True},
        {"name": "Coffee", "description": "Freshly brewed", "price": 2.99, "category": "Beverages", "available": True},
        {"name": "House Wine", "description": "Red or white", "price": 8.99, "category": "Beverages", "available": True},
    ]
    
    for product_data in products_data:
        # Check if product already exists
        result = await db.execute(
            select(Product).where(Product.name == product_data["name"])
        )
        existing_product = result.scalar_one_or_none()
        
        if not existing_product:
            product = Product(**product_data)
            db.add(product)
            print(f"✅ Created product: {product_data['name']}")
        else:
            print(f"⏭️  Product already exists: {product_data['name']}")
    
    await db.commit()

async def create_tables(db: AsyncSession):
    """Create restaurant tables."""
    # Main Hall tables (1-10)
    for i in range(1, 11):
        result = await db.execute(
            select(Table).where(Table.number == i)
        )
        existing_table = result.scalar_one_or_none()
        
        if not existing_table:
            capacity = 4 if i <= 6 else 6  # Tables 1-6 have 4 seats, 7-10 have 6 seats
            table = Table(
                number=i,
                capacity=capacity,
                location="Main Hall",
                status="available"
            )
            db.add(table)
            print(f"✅ Created table: {i} (Main Hall)")
        else:
            print(f"⏭️  Table already exists: {i}")
    
    # Terrace tables (11-15)
    for i in range(11, 16):
        result = await db.execute(
            select(Table).where(Table.number == i)
        )
        existing_table = result.scalar_one_or_none()
        
        if not existing_table:
            table = Table(
                number=i,
                capacity=4,
                location="Terrace",
                status="available"
            )
            db.add(table)
            print(f"✅ Created table: {i} (Terrace)")
        else:
            print(f"⏭️  Table already exists: {i}")
    
    # VIP Room tables (16-18)
    for i in range(16, 19):
        result = await db.execute(
            select(Table).where(Table.number == i)
        )
        existing_table = result.scalar_one_or_none()
        
        if not existing_table:
            table = Table(
                number=i,
                capacity=8,
                location="VIP Room",
                status="available"
            )
            db.add(table)
            print(f"✅ Created table: {i} (VIP Room)")
        else:
            print(f"⏭️  Table already exists: {i}")
    
    await db.commit()

async def seed_database():
    """Main function to seed the database."""
    print("\n🌱 Starting database seeding...")
    print("=" * 50)
    
    async with AsyncSessionLocal() as db:
        try:
            # Create users
            print("\n👤 Creating users...")
            await create_users(db)
            
            # Create products
            print("\n🍽️  Creating products...")
            await create_products(db)
            
            # Create tables
            print("\n🪑 Creating tables...")
            await create_tables(db)
            
            print("\n" + "=" * 50)
            print("✅ Database seeding completed successfully!")
            print("=" * 50)
            
        except Exception as e:
            print(f"\n❌ Error seeding database: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(seed_database())