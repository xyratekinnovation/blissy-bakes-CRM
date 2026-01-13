from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Offer
from ..schemas import OfferResponse, OfferCreateRequest
from typing import List, Optional
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/offers", tags=["offers"])

@router.get("", response_model=List[OfferResponse])
async def get_offers(
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Offer).order_by(Offer.created_at.desc())
    
    if is_active is not None:
        stmt = stmt.where(Offer.is_active == is_active)
    
    result = await db.execute(stmt)
    offers = result.scalars().all()
    
    return [
        OfferResponse(
            id=str(offer.id),
            title=offer.name,
            description=offer.name,  # Use name as description if needed
            type="percent" if offer.discount_type == "percentage" else "fixed",
            value=f"{offer.discount_value}{'%' if offer.discount_type == 'percentage' else ''}",
            validUntil=offer.end_date.strftime("%Y-%m-%d") if offer.end_date else "Ongoing",
            isActive=offer.is_active,
            code=offer.code
        )
        for offer in offers
    ]

@router.post("", response_model=OfferResponse)
async def create_offer(
    offer_data: OfferCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    start_date = datetime.fromisoformat(offer_data.startDate) if offer_data.startDate else None
    end_date = datetime.fromisoformat(offer_data.endDate) if offer_data.endDate else None
    
    new_offer = Offer(
        name=offer_data.title,
        code=offer_data.code,
        discount_type="percentage" if offer_data.type == "percent" else "fixed",
        discount_value=offer_data.discountValue,
        start_date=start_date,
        end_date=end_date,
        is_active=offer_data.isActive
    )
    
    db.add(new_offer)
    await db.commit()
    await db.refresh(new_offer)
    
    return OfferResponse(
        id=str(new_offer.id),
        title=new_offer.name,
        description=new_offer.name,
        type="percent" if new_offer.discount_type == "percentage" else "fixed",
        value=f"{new_offer.discount_value}{'%' if new_offer.discount_type == 'percentage' else ''}",
        validUntil=new_offer.end_date.strftime("%Y-%m-%d") if new_offer.end_date else "Ongoing",
        isActive=new_offer.is_active,
        code=new_offer.code
    )

@router.get("/stats")
async def get_offer_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    
    total = await db.execute(select(func.count(Offer.id)))
    active = await db.execute(select(func.count(Offer.id)).where(Offer.is_active == True))
    
    return {
        "total": total.scalar() or 0,
        "active": active.scalar() or 0,
        "redeemed": 0  # Placeholder - would need order tracking
    }
