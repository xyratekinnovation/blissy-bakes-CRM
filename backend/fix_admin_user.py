import asyncio
from app.database import AsyncSessionLocal
from app.models import AppUser
from sqlalchemy import select, update
import sys

async def fix_admin():
    async with AsyncSessionLocal() as db:
        # Find the admin user
        result = await db.execute(select(AppUser).where(AppUser.phone_number == '9999999999'))
        user = result.scalars().first()
        
        if not user:
            print("❌ Admin user not found. Did you run the SQL seed?")
            # Create if missing
            user = AppUser(
                full_name='Admin Owner',
                phone_number='9999999999',
                pin_hash='1234', # Plain text for testing (auth.py handles this fallback)
                role='owner'
            )
            db.add(user)
            print("✅ Created Admin User.")
        else:
            print(f"found user: {user.full_name}")
            user.pin_hash = '1234' # Set to plain text 1234
            db.add(user)
            print("✅ Updated Admin PIN to '1234'")
            
        await db.commit()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_admin())
