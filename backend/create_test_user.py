"""
Script to create a test user for local development.
Run this after setting up the database.
"""
import asyncio
import sys
import bcrypt
from app.database import AsyncSessionLocal
from app.models import AppUser
from sqlalchemy import select

async def create_test_user():
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(select(AppUser).where(AppUser.phone_number == '9999999999'))
        user = result.scalars().first()
        
        # Hash the PIN using bcrypt
        pin = "1234"
        pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        if user:
            # Update existing user
            user.pin_hash = pin_hash
            user.full_name = "Admin Owner"
            user.role = "owner"
            user.is_active = True
            print(f"✅ Updated existing user: {user.full_name}")
            print(f"   Phone: {user.phone_number}")
            print(f"   PIN: {pin}")
        else:
            # Create new user
            user = AppUser(
                full_name='Admin Owner',
                phone_number='9999999999',
                pin_hash=pin_hash,
                role='owner',
                is_active=True
            )
            db.add(user)
            print(f"✅ Created new user: {user.full_name}")
            print(f"   Phone: {user.phone_number}")
            print(f"   PIN: {pin}")
        
        await db.commit()
        print("\n📝 Login Credentials:")
        print("   Phone Number: 9999999999")
        print("   PIN: 1234")
        print("\n✅ Test user ready!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(create_test_user())
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure:")
        print("1. Database is running and accessible")
        print("2. DATABASE_URL is set correctly in .env file")
        print("3. You've run database migrations")
        sys.exit(1)
