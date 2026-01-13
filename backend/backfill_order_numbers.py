"""
Script to backfill order numbers for existing orders that don't have them.
This will assign sequential order numbers (BB001, BB002, etc.) to all existing orders.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.models import Order
from sqlalchemy import select, func
from sqlalchemy import update

async def backfill_order_numbers():
    """Assign sequential order numbers to all orders that don't have them"""
    async with AsyncSessionLocal() as db:
        try:
            # Get all orders without order numbers, ordered by creation date
            result = await db.execute(
                select(Order)
                .where(Order.order_number.is_(None))
                .order_by(Order.created_at.asc())
            )
            orders_without_numbers = result.scalars().all()
            
            if not orders_without_numbers:
                print("No orders need order numbers assigned.")
                return
            
            # Find the highest existing order number
            max_result = await db.execute(
                select(func.max(Order.order_number))
                .where(Order.order_number.isnot(None))
            )
            max_order_number = max_result.scalar()
            
            # Extract the highest number
            start_number = 1
            if max_order_number:
                number_str = str(max_order_number).replace("#", "").replace("BB", "").strip()
                try:
                    start_number = int(number_str) + 1
                except ValueError:
                    start_number = 1
            
            # Assign order numbers sequentially
            print(f"Assigning order numbers starting from BB{str(start_number).zfill(3)}...")
            
            for idx, order in enumerate(orders_without_numbers):
                order_number = f"BB{str(start_number + idx).zfill(3)}"
                order.order_number = order_number
                print(f"  - Order {order.id} → #{order_number}")
            
            await db.commit()
            print(f"\n✓ Successfully assigned order numbers to {len(orders_without_numbers)} orders")
            
        except Exception as e:
            await db.rollback()
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    print("Backfilling order numbers for existing orders...")
    asyncio.run(backfill_order_numbers())
