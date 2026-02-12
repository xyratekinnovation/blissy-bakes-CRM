from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import joinedload, selectinload
from ..database import get_db
from ..models import Order, OrderItem, Customer, Product, Inventory, AppUser
from ..schemas import CreateOrderRequest, OrderResponse, OrderView, UpdateOrderRequest
from decimal import Decimal
import uuid
from typing import List

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_to_view(o: Order) -> "OrderView":
    from ..schemas import OrderItemView
    items_list = [
        OrderItemView(
            id=str(i.id),
            productId=str(i.product_id) if i.product_id else "",
            name=i.product.name if i.product else "Unknown",
            quantity=i.quantity,
            price=float(i.unit_price),
            image=i.product.image_url if i.product and i.product.image_url else "🎂"
        )
        for i in o.items
    ]
    return OrderView(
        id=o.id,
        order_number=o.order_number or f"#{str(o.id)[:8].upper()}",
        created_at=o.created_at,
        total_amount=o.total_amount,
        payment_method=o.payment_method,
        status=o.status,
        customer_name=o.customer.full_name if o.customer else "Unknown",
        customer_phone=o.customer.phone_number if o.customer else "",
        staff_name=o.staff.full_name if o.staff else "System",
        items_summary=", ".join([f"{i.quantity}x {i.product.name if i.product else 'Unknown'}" for i in o.items]),
        items=items_list
    )


@router.get("", response_model=List[OrderView])
async def get_orders(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(
            joinedload(Order.customer), 
            joinedload(Order.staff),
            selectinload(Order.items).joinedload(OrderItem.product)
        )
        .order_by(Order.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return [_order_to_view(o) for o in orders]

@router.post("/create", response_model=OrderResponse)
async def create_order(order_data: CreateOrderRequest, db: AsyncSession = Depends(get_db)):
    try:
        # ALL database operations in a single transaction
        # 1. Handle Customer
        customer_id = None
        existing_customer = None
        new_customer = None
        
        # Check if customer exists by phone
        result = await db.execute(select(Customer).where(Customer.phone_number == order_data.customer.phoneNumber))
        existing_customer = result.scalars().first()
        
        if existing_customer:
            customer_id = existing_customer.id
            # Update customer name if provided (in case it changed)
            if order_data.customer.fullName and order_data.customer.fullName != existing_customer.full_name:
                existing_customer.full_name = order_data.customer.fullName
        else:
            new_customer = Customer(
                full_name=order_data.customer.fullName,
                phone_number=order_data.customer.phoneNumber,
                notes=order_data.customer.notes
            )
            db.add(new_customer)
            await db.flush() # get ID
            customer_id = new_customer.id

        # 2. Generate sequential order number
        # Find all existing order numbers and get the highest
        all_orders_result = await db.execute(
            select(Order.order_number)
            .where(Order.order_number.isnot(None))
        )
        all_order_numbers = [row[0] for row in all_orders_result.all() if row[0]]
        
        # Extract numbers and find the maximum
        max_number = 0
        for order_num in all_order_numbers:
            # Extract number from format like "BB001" or "#BB001"
            number_str = str(order_num).replace("#", "").replace("BB", "").strip()
            try:
                num = int(number_str)
                if num > max_number:
                    max_number = num
            except ValueError:
                continue
        
        # Generate next order number
        next_number = max_number + 1
        order_number = f"BB{str(next_number).zfill(3)}"
        
        # 3. Create Order
        new_order = Order(
            order_number=order_number,
            customer_id=customer_id,
            staff_id=order_data.staffId,
            total_amount=Decimal(str(order_data.totalAmount)),
            payment_method=order_data.paymentMethod,
            status="completed",
            notes=order_data.notes
        )
        db.add(new_order)
        await db.flush() # get ID

        # Update Customer Stats
        if existing_customer:
             # existing_customer is already attached to the session
             existing_customer.total_orders += 1
             existing_customer.total_spent = existing_customer.total_spent + Decimal(str(order_data.totalAmount))
             # updated_at will be automatically updated by SQLAlchemy due to onupdate=func.now()
             # No need to manually set it
        else:
             # new_customer was just added
             new_customer.total_orders = 1
             new_customer.total_spent = Decimal(str(order_data.totalAmount))

        # 3. Create Items and Update Inventory
        for item in order_data.items:
            # Add Order Item
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.id,
                quantity=item.quantity,
                unit_price=Decimal(str(item.price)), # Should ideally verify against DB price
                total_price=Decimal(str(item.price * item.quantity))
            )
            db.add(order_item)

            # Update Inventory
            # Fetch current stock to ensure valid
            inv_result = await db.execute(select(Inventory).where(Inventory.product_id == item.id).with_for_update())
            inventory = inv_result.scalars().first()
            
            if inventory:
                if inventory.stock_quantity < item.quantity:
                     await db.rollback()
                     raise HTTPException(status_code=400, detail=f"Insufficient stock for product id {item.id}")
                
                inventory.stock_quantity -= item.quantity
                db.add(inventory) # Mark for update
            else:
                 await db.rollback()
                 raise HTTPException(status_code=400, detail=f"Inventory record not found for product id {item.id}")
        
        # Commit all changes
        await db.commit()
        
        # Return success with order ID and order number
        return {"success": True, "orderId": new_order.id, "orderNumber": new_order.order_number}
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error and return a user-friendly message
        import traceback
        print(f"Error creating order: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.get("/{order_id}", response_model=OrderView)
async def get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.staff),
            selectinload(Order.items).joinedload(OrderItem.product)
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_view(order)


@router.delete("/{order_id}")
async def delete_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(selectinload(Order.items).joinedload(OrderItem.product))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = None
    if order.customer_id:
        cust_result = await db.execute(select(Customer).where(Customer.id == order.customer_id))
        customer = cust_result.scalars().first()

    # Restore inventory for each item
    for item in order.items:
        if item.product_id:
            inv_result = await db.execute(select(Inventory).where(Inventory.product_id == item.product_id).with_for_update())
            inv = inv_result.scalars().first()
            if inv:
                inv.stock_quantity += item.quantity

    # Revert customer stats
    if customer:
        customer.total_orders = max(0, customer.total_orders - 1)
        customer.total_spent = max(Decimal("0"), (customer.total_spent or Decimal("0")) - (order.total_amount or Decimal("0")))

    # Delete order items then order (cascade may handle items)
    for item in order.items:
        await db.delete(item)
    await db.delete(order)
    await db.commit()
    return {"success": True, "message": "Order deleted"}


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: uuid.UUID, order_data: UpdateOrderRequest, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(
            joinedload(Order.customer),
            selectinload(Order.items).joinedload(OrderItem.product)
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_customer_id = order.customer_id
    old_total = order.total_amount or Decimal("0")
    old_items = list(order.items)

    # 1. Restore inventory for old items
    for item in old_items:
        if item.product_id:
            inv_result = await db.execute(select(Inventory).where(Inventory.product_id == item.product_id).with_for_update())
            inv = inv_result.scalars().first()
            if inv:
                inv.stock_quantity += item.quantity

    # 2. Revert old customer stats
    if order.customer_id:
        cust_result = await db.execute(select(Customer).where(Customer.id == order.customer_id))
        old_customer = cust_result.scalars().first()
        if old_customer:
            old_customer.total_orders = max(0, old_customer.total_orders - 1)
            old_customer.total_spent = max(Decimal("0"), (old_customer.total_spent or Decimal("0")) - old_total)

    # 3. Handle customer (same as create)
    customer_id = None
    existing_customer = None
    new_customer = None
    result = await db.execute(select(Customer).where(Customer.phone_number == order_data.customer.phoneNumber))
    existing_customer = result.scalars().first()
    if existing_customer:
        customer_id = existing_customer.id
        if order_data.customer.fullName and order_data.customer.fullName != existing_customer.full_name:
            existing_customer.full_name = order_data.customer.fullName
    else:
        new_customer = Customer(
            full_name=order_data.customer.fullName,
            phone_number=order_data.customer.phoneNumber,
            notes=order_data.customer.notes
        )
        db.add(new_customer)
        await db.flush()
        customer_id = new_customer.id

    # 4. Update order header
    order.customer_id = customer_id
    order.total_amount = Decimal(str(order_data.totalAmount))
    order.payment_method = order_data.paymentMethod
    order.notes = order_data.notes

    # 5. Remove old order items
    for item in old_items:
        await db.delete(item)
    await db.flush()

    # 6. Add new items and deduct inventory (same as create)
    for item in order_data.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.id,
            quantity=item.quantity,
            unit_price=Decimal(str(item.price)),
            total_price=Decimal(str(item.price * item.quantity))
        )
        db.add(order_item)
        inv_result = await db.execute(select(Inventory).where(Inventory.product_id == item.id).with_for_update())
        inventory = inv_result.scalars().first()
        if inventory:
            if inventory.stock_quantity < item.quantity:
                await db.rollback()
                raise HTTPException(status_code=400, detail=f"Insufficient stock for product id {item.id}")
            inventory.stock_quantity -= item.quantity
        else:
            await db.rollback()
            raise HTTPException(status_code=400, detail=f"Inventory record not found for product id {item.id}")

    # 7. Update customer stats for new total
    if existing_customer:
        existing_customer.total_orders += 1
        existing_customer.total_spent = (existing_customer.total_spent or Decimal("0")) + Decimal(str(order_data.totalAmount))
    else:
        new_customer.total_orders = 1
        new_customer.total_spent = Decimal(str(order_data.totalAmount))

    await db.commit()
    return {"success": True, "orderId": order.id, "orderNumber": order.order_number}
