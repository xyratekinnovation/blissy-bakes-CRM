from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from ..database import get_db
from ..models import Inventory, Product
from sqlalchemy.orm import joinedload
from ..schemas import InventoryItemResponse, InventoryUpdateRequest
from typing import List, Optional
from uuid import UUID

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("", response_model=List[InventoryItemResponse])
async def get_inventory(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Inventory)
        .options(joinedload(Inventory.product))
        .join(Product, Inventory.product_id == Product.id)
        .order_by(Product.name)
    )
    
    if category and category != "All":
        stmt = stmt.where(Product.category == category)
    
    result = await db.execute(stmt)
    inventory_items = result.scalars().unique().all()
    
    return [
        InventoryItemResponse(
            id=str(inv.id),
            productId=str(inv.product_id),
            name=inv.product.name,
            category=inv.product.category,
            stock=inv.stock_quantity,
            unit="pcs",  # Default unit, can be extended
            minStock=inv.low_stock_threshold,
            lastRestock=inv.last_updated.strftime("%Y-%m-%d") if inv.last_updated else "Never"
        )
        for inv in inventory_items
    ]

@router.get("/low-stock", response_model=List[InventoryItemResponse])
async def get_low_stock_items(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Inventory)
        .options(joinedload(Inventory.product))
        .join(Product, Inventory.product_id == Product.id)
        .where(Inventory.stock_quantity <= Inventory.low_stock_threshold)
        .order_by(Inventory.stock_quantity)
    )
    
    result = await db.execute(stmt)
    inventory_items = result.scalars().unique().all()
    
    return [
        InventoryItemResponse(
            id=str(inv.id),
            productId=str(inv.product_id),
            name=inv.product.name,
            category=inv.product.category,
            stock=inv.stock_quantity,
            unit="pcs",
            minStock=inv.low_stock_threshold,
            lastRestock=inv.last_updated.strftime("%Y-%m-%d") if inv.last_updated else "Never"
        )
        for inv in inventory_items
    ]

@router.put("/{inventory_id}/restock")
async def restock_inventory(
    inventory_id: UUID,
    request: InventoryUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Inventory)
        .options(joinedload(Inventory.product))
        .where(Inventory.id == inventory_id)
    )
    inventory = result.scalars().unique().first()
    
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    inventory.stock_quantity = request.newStock
    inventory.last_updated = func.now()
    
    await db.commit()
    await db.refresh(inventory)
    
    return {
        "success": True,
        "inventory": InventoryItemResponse(
            id=str(inventory.id),
            productId=str(inventory.product_id),
            name=inventory.product.name,
            category=inventory.product.category,
            stock=inventory.stock_quantity,
            unit="pcs",
            minStock=inventory.low_stock_threshold,
            lastRestock=inventory.last_updated.strftime("%Y-%m-%d") if inventory.last_updated else "Never"
        )
    }

@router.post("")
async def create_inventory_item(
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    from uuid import UUID as UUIDType
    from ..schemas import InventoryCreateRequest
    
    product_id = UUIDType(request["productId"])
    
    # Check if inventory already exists
    existing = await db.execute(
        select(Inventory).where(Inventory.product_id == product_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Inventory already exists for this product")
    
    new_inventory = Inventory(
        product_id=product_id,
        stock_quantity=request.get("stock", 0),
        low_stock_threshold=request.get("minStock", 5)
    )
    
    db.add(new_inventory)
    await db.commit()
    await db.refresh(new_inventory)
    
    # Load product for response
    product_result = await db.execute(
        select(Product)
        .options(joinedload(Product.inventory))
        .where(Product.id == product_id)
    )
    product = product_result.scalars().first()
    
    return InventoryItemResponse(
        id=str(new_inventory.id),
        productId=str(new_inventory.product_id),
        name=product.name if product else "Unknown",
        category=product.category if product else "Unknown",
        stock=new_inventory.stock_quantity,
        unit="pcs",
        minStock=new_inventory.low_stock_threshold,
        lastRestock=new_inventory.last_updated.strftime("%Y-%m-%d") if new_inventory.last_updated else "Never"
    )

@router.delete("/{inventory_id}")
async def delete_inventory_item(
    inventory_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Inventory).where(Inventory.id == inventory_id))
    inventory = result.scalars().first()
    
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    await db.delete(inventory)
    await db.commit()
    
    return {"success": True, "message": "Inventory item deleted successfully"}

@router.get("/stats")
async def get_inventory_stats(db: AsyncSession = Depends(get_db)):
    # Total items
    total_result = await db.execute(select(func.count(Inventory.id)))
    total_items = total_result.scalar() or 0
    
    # Low stock items
    low_stock_result = await db.execute(
        select(func.count(Inventory.id)).where(
            Inventory.stock_quantity <= Inventory.low_stock_threshold
        )
    )
    low_stock_count = low_stock_result.scalar() or 0
    
    # Out of stock
    out_of_stock_result = await db.execute(
        select(func.count(Inventory.id)).where(Inventory.stock_quantity == 0)
    )
    out_of_stock_count = out_of_stock_result.scalar() or 0
    
    return {
        "totalItems": total_items,
        "lowStockCount": low_stock_count,
        "outOfStockCount": out_of_stock_count
    }
