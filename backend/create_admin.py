"""
Script to create or update the admin user with phone 7397334933 and PIN 2003
"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.models import AppUser
from sqlalchemy import select
import bcrypt

ADMIN_PHONE = "7397334933"
ADMIN_PIN = "2003"
ADMIN_NAME = "Admin"

def hash_pin(pin: str) -> str:
    """Hash a PIN using bcrypt"""
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

async def create_or_update_admin():
    """Create or update the admin user"""
    async with AsyncSessionLocal() as db:
        try:
            # Check if admin exists
            result = await db.execute(
                select(AppUser).where(AppUser.phone_number == ADMIN_PHONE)
            )
            admin = result.scalars().first()
            
            if admin:
                # Update existing admin
                print(f"Updating existing admin user: {admin.full_name}")
                admin.full_name = ADMIN_NAME
                admin.pin_hash = hash_pin(ADMIN_PIN)
                admin.role = "admin"
                admin.is_active = True
                print(f"✓ Admin updated successfully")
            else:
                # Create new admin
                print(f"Creating new admin user...")
                admin = AppUser(
                    full_name=ADMIN_NAME,
                    phone_number=ADMIN_PHONE,
                    pin_hash=hash_pin(ADMIN_PIN),
                    role="admin",
                    is_active=True
                )
                db.add(admin)
                print(f"✓ Admin created successfully")
            
            await db.commit()
            print(f"\n=== ADMIN CREDENTIALS ===")
            print(f"Phone Number: {ADMIN_PHONE}")
            print(f"PIN: {ADMIN_PIN}")
            print(f"Role: admin")
            print(f"========================\n")
            
        except Exception as e:
            await db.rollback()
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    print("Creating/Updating admin user...")
    asyncio.run(create_or_update_admin())
