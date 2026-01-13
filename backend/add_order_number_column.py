"""
Script to add the order_number column to the existing orders table.
This migration adds the column that was added to the model.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine
from sqlalchemy import text

async def add_order_number_column():
    """Add order_number column to orders table"""
    async with engine.begin() as conn:
        try:
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='orders' AND column_name='order_number'
            """)
            result = await conn.execute(check_query)
            exists = result.first()
            
            if exists:
                print("Column 'order_number' already exists. Skipping migration.")
                return
            
            # Add the column
            print("Adding order_number column to orders table...")
            alter_query = text("""
                ALTER TABLE orders 
                ADD COLUMN order_number VARCHAR(20) UNIQUE
            """)
            await conn.execute(alter_query)
            print("✓ Successfully added order_number column")
            
            # Create index for better performance
            try:
                index_query = text("""
                    CREATE INDEX IF NOT EXISTS idx_orders_order_number 
                    ON orders(order_number)
                """)
                await conn.execute(index_query)
                print("✓ Created index on order_number")
            except Exception as e:
                print(f"Note: Index creation skipped (may already exist): {e}")
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    print("Running database migration: Adding order_number column...")
    asyncio.run(add_order_number_column())
    print("\nMigration complete! You can now create orders with sequential IDs.")
