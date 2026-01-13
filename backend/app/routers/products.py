from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from ..database import get_db
from ..models import Product, Inventory
from ..schemas import ProductResponse, ProductCreateRequest, ProductUpdateRequest
from typing import List, Optional
from uuid import UUID
import base64

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # Use joinedload to fetch inventory in a single query (avoid N+1)
    stmt = select(Product).options(joinedload(Product.inventory)).where(Product.is_available == True)
    
    if category and category != "All":
        stmt = stmt.where(Product.category == category)
    
    stmt = stmt.order_by(Product.name)
    
    result = await db.execute(stmt)
    products = result.unique().scalars().all()
    
    # Build response list (inventory is already loaded)
    product_list = []
    for product in products:
        inventory = product.inventory
        
        product_list.append(ProductResponse(
            id=str(product.id),
            name=product.name,
            price=float(product.price),
            category=product.category,
            image=product.image_url or "🎂",
            stock=inventory.stock_quantity if inventory else 0,
            isAvailable=product.is_available and (inventory is None or inventory.stock_quantity > 0)
        ))
    
    return product_list

@router.get("/{product_id}")
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    inv_result = await db.execute(
        select(Inventory).where(Inventory.product_id == product.id)
    )
    inventory = inv_result.scalars().first()
    
    return ProductResponse(
        id=str(product.id),
        name=product.name,
        price=float(product.price),
        category=product.category,
        image=product.image_url or "🎂",
        stock=inventory.stock_quantity if inventory else 0,
        isAvailable=product.is_available and (inventory is None or inventory.stock_quantity > 0)
    )

@router.post("", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    stock: int = Form(0),
    minStock: int = Form(5),
    isAvailable: str = Form("true"),
    image: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    from decimal import Decimal
    
    # Convert boolean string to boolean
    is_available_bool = isAvailable.lower() == "true" if isinstance(isAvailable, str) else bool(isAvailable)
    
    # Handle image upload
    image_data = None
    if image and image.filename:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")
        
        # Read and convert to base64
        contents = await image.read()
        if len(contents) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 5MB")
        
        # Determine MIME type
        mime_type = image.content_type
        if mime_type not in ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']:
            raise HTTPException(status_code=400, detail="Unsupported image format. Use JPEG, PNG, GIF, or WebP")
        
        # Convert to base64 data URI
        base64_data = base64.b64encode(contents).decode('utf-8')
        image_data = f"data:{mime_type};base64,{base64_data}"
    elif imageUrl:
        # Use provided URL
        image_data = imageUrl
    
    # Generate SKU
    count_result = await db.execute(select(func.count(Product.id)))
    count = count_result.scalar() or 0
    sku = f"PROD-{name[:3].upper()}-{count + 1}"
    
    new_product = Product(
        name=name,
        sku=sku,
        price=Decimal(str(price)),
        category=category,
        image_url=image_data,
        is_available=is_available_bool
    )
    
    db.add(new_product)
    await db.flush()
    
    # Create inventory entry if stock provided
    if stock > 0:
        new_inventory = Inventory(
            product_id=new_product.id,
            stock_quantity=stock,
            low_stock_threshold=minStock
        )
        db.add(new_inventory)
    
    await db.commit()
    await db.refresh(new_product)
    
    inv_result = await db.execute(
        select(Inventory).where(Inventory.product_id == new_product.id)
    )
    inventory = inv_result.scalars().first()
    
    return ProductResponse(
        id=str(new_product.id),
        name=new_product.name,
        price=float(new_product.price),
        category=new_product.category,
        image=new_product.image_url or "🎂",
        stock=inventory.stock_quantity if inventory else 0,
        isAvailable=new_product.is_available
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    name: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    isAvailable: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    imageUrl: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    from decimal import Decimal
    
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product fields
    if name is not None:
        product.name = name
    if price is not None:
        product.price = Decimal(str(price))
    if category is not None:
        product.category = category
    if isAvailable is not None:
        # Convert boolean string to boolean
        product.is_available = isAvailable.lower() == "true" if isinstance(isAvailable, str) else bool(isAvailable)
    
    # Handle image upload
    if image and image.filename:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")
        
        # Read and convert to base64
        contents = await image.read()
        if len(contents) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 5MB")
        
        # Determine MIME type
        mime_type = image.content_type
        if mime_type not in ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']:
            raise HTTPException(status_code=400, detail="Unsupported image format. Use JPEG, PNG, GIF, or WebP")
        
        # Convert to base64 data URI
        base64_data = base64.b64encode(contents).decode('utf-8')
        product.image_url = f"data:{mime_type};base64,{base64_data}"
    elif imageUrl is not None:
        # Use provided URL or clear image
        product.image_url = imageUrl if imageUrl else None
    
    await db.commit()
    await db.refresh(product)
    
    inv_result = await db.execute(
        select(Inventory).where(Inventory.product_id == product.id)
    )
    inventory = inv_result.scalars().first()
    
    return ProductResponse(
        id=str(product.id),
        name=product.name,
        price=float(product.price),
        category=product.category,
        image=product.image_url or "🎂",
        stock=inventory.stock_quantity if inventory else 0,
        isAvailable=product.is_available
    )

@router.delete("/{product_id}")
async def delete_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(product)
    await db.commit()
    
    return {"success": True, "message": "Product deleted successfully"}
