from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import BulkOrder, Customer
from ..schemas import BulkOrderResponse, BulkOrderCreateRequest
from typing import List, Optional
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/bulk-orders", tags=["bulk-orders"])

@router.get("", response_model=List[BulkOrderResponse])
async def get_bulk_orders(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(BulkOrder).order_by(BulkOrder.delivery_date.desc())
    
    if status:
        stmt = stmt.where(BulkOrder.status == status)
    
    result = await db.execute(stmt)
    bulk_orders = result.scalars().all()
    
    return [
        BulkOrderResponse(
            id=str(bo.id),
            customer=bo.title,  # Using title as customer name
            eventType="Wedding" if "wedding" in bo.title.lower() else 
                     "Corporate" if "corp" in bo.title.lower() else
                     "Birthday" if "birthday" in bo.title.lower() else
                     "School" if "school" in bo.title.lower() else "Other",
            date=bo.delivery_date.strftime("%b %d, %Y"),
            items=bo.description or "Bulk order items",
            total=float(bo.quote_amount) if bo.quote_amount else 0.0,
            advance=float(bo.advance_paid) if bo.advance_paid else 0.0,
            status=bo.status
        )
        for bo in bulk_orders
    ]

@router.post("", response_model=BulkOrderResponse)
async def create_bulk_order(
    order_data: BulkOrderCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    delivery_date = datetime.fromisoformat(order_data.deliveryDate)
    
    new_bulk_order = BulkOrder(
        delivery_date=delivery_date,
        customer_id=order_data.customerId if order_data.customerId else None,
        title=order_data.customer,
        description=order_data.items,
        status="pending",
        quote_amount=order_data.total,
        advance_paid=order_data.advance
    )
    
    db.add(new_bulk_order)
    await db.commit()
    await db.refresh(new_bulk_order)
    
    return BulkOrderResponse(
        id=str(new_bulk_order.id),
        customer=new_bulk_order.title,
        eventType=order_data.eventType,
        date=new_bulk_order.delivery_date.strftime("%b %d, %Y"),
        items=new_bulk_order.description or "",
        total=float(new_bulk_order.quote_amount) if new_bulk_order.quote_amount else 0.0,
        advance=float(new_bulk_order.advance_paid) if new_bulk_order.advance_paid else 0.0,
        status=new_bulk_order.status
    )

@router.put("/{order_id}")
async def update_bulk_order(
    order_id: UUID,
    order_data: dict,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BulkOrder).where(BulkOrder.id == order_id))
    bulk_order = result.scalars().first()
    
    if not bulk_order:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    
    # Update fields from request
    if "status" in order_data:
        bulk_order.status = order_data["status"]
    if "advance" in order_data:
        bulk_order.advance_paid = order_data["advance"]
    if "total" in order_data:
        bulk_order.quote_amount = order_data["total"]
    if "items" in order_data:
        bulk_order.description = order_data["items"]
    if "deliveryDate" in order_data:
        bulk_order.delivery_date = datetime.fromisoformat(order_data["deliveryDate"])
    
    await db.commit()
    await db.refresh(bulk_order)
    
    return BulkOrderResponse(
        id=str(bulk_order.id),
        customer=bulk_order.title,
        eventType="Wedding" if "wedding" in bulk_order.title.lower() else "Other",
        date=bulk_order.delivery_date.strftime("%b %d, %Y"),
        items=bulk_order.description or "",
        total=float(bulk_order.quote_amount) if bulk_order.quote_amount else 0.0,
        advance=float(bulk_order.advance_paid) if bulk_order.advance_paid else 0.0,
        status=bulk_order.status
    )

@router.put("/{order_id}/status")
async def update_bulk_order_status(
    order_id: UUID,
    status: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BulkOrder).where(BulkOrder.id == order_id))
    bulk_order = result.scalars().first()
    
    if not bulk_order:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    
    bulk_order.status = status
    await db.commit()
    await db.refresh(bulk_order)
    
    return {"success": True, "status": bulk_order.status}

@router.delete("/{order_id}")
async def delete_bulk_order(order_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BulkOrder).where(BulkOrder.id == order_id))
    bulk_order = result.scalars().first()
    
    if not bulk_order:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    
    await db.delete(bulk_order)
    await db.commit()
    
    return {"success": True, "message": "Bulk order deleted successfully"}
