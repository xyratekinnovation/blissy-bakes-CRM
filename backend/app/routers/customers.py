from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from ..database import get_db
from ..models import Customer
from ..schemas import CustomerView
from typing import List, Optional

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("", response_model=List[CustomerView])
async def get_customers(q: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    # Fetch customers
    stmt = select(Customer).order_by(Customer.updated_at.desc())
    
    if q:
        stmt = stmt.where(
            or_(Customer.full_name.ilike(f"%{q}%"), Customer.phone_number.ilike(f"%{q}%"))
        )

    result = await db.execute(stmt)
    customers = result.scalars().all()
    
    return [
        CustomerView(
            id=c.id,
            name=c.full_name,
            phone=c.phone_number,
            totalSpent=c.total_spent,
            visits=c.total_orders,
            lastVisit=c.updated_at.strftime("%Y-%m-%d") if c.updated_at else "Never",
            favoriteItems=[], # Placeholder, logic to be added if needed
            loyaltyPoints=int(c.total_spent / 100) # Simple loyalty logic
        ) for c in customers
    ]
