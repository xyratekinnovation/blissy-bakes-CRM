from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import AppUser
from ..schemas import StaffResponse, StaffCreateRequest, StaffUpdateRequest
import bcrypt
from typing import List
from uuid import UUID

router = APIRouter(prefix="/staff", tags=["staff"])

def hash_pin(pin: str) -> str:
    """Hash a PIN using bcrypt"""
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

@router.get("", response_model=List[StaffResponse])
async def get_staff(db: AsyncSession = Depends(get_db)):
    """Get all staff members"""
    result = await db.execute(select(AppUser).order_by(AppUser.created_at.desc()))
    staff = result.scalars().all()
    
    return [
        StaffResponse(
            id=str(s.id),
            fullName=s.full_name,
            phoneNumber=s.phone_number,
            role=s.role,
            isActive=s.is_active,
            createdAt=s.created_at.isoformat() if s.created_at else None
        )
        for s in staff
    ]

@router.post("", response_model=StaffResponse)
async def create_staff(staff_data: StaffCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new staff member"""
    # Check if phone number already exists
    result = await db.execute(select(AppUser).where(AppUser.phone_number == staff_data.phoneNumber))
    existing = result.scalars().first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already exists")
    
    # Hash the PIN (default is 1234 if not provided)
    pin = staff_data.pin or "1234"
    pin_hash = hash_pin(pin)
    
    new_staff = AppUser(
        full_name=staff_data.fullName,
        phone_number=staff_data.phoneNumber,
        pin_hash=pin_hash,
        role=staff_data.role or "employee",
        is_active=True
    )
    
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    
    return StaffResponse(
        id=str(new_staff.id),
        fullName=new_staff.full_name,
        phoneNumber=new_staff.phone_number,
        role=new_staff.role,
        isActive=new_staff.is_active,
        createdAt=new_staff.created_at.isoformat() if new_staff.created_at else None
    )

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(staff_id: str, staff_data: StaffUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update a staff member"""
    
    result = await db.execute(select(AppUser).where(AppUser.id == UUID(staff_id)))
    staff = result.scalars().first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Update fields
    if staff_data.fullName is not None:
        staff.full_name = staff_data.fullName
    if staff_data.phoneNumber is not None:
        # Check if new phone number is already taken by another user
        check_result = await db.execute(
            select(AppUser).where(
                AppUser.phone_number == staff_data.phoneNumber,
                AppUser.id != UUID(staff_id)
            )
        )
        if check_result.scalars().first():
            raise HTTPException(status_code=400, detail="Phone number already exists")
        staff.phone_number = staff_data.phoneNumber
    if staff_data.role is not None:
        staff.role = staff_data.role
    if staff_data.isActive is not None:
        staff.is_active = staff_data.isActive
    if staff_data.pin is not None:
        staff.pin_hash = hash_pin(staff_data.pin)
    
    await db.commit()
    await db.refresh(staff)
    
    return StaffResponse(
        id=str(staff.id),
        fullName=staff.full_name,
        phoneNumber=staff.phone_number,
        role=staff.role,
        isActive=staff.is_active,
        createdAt=staff.created_at.isoformat() if staff.created_at else None
    )

@router.delete("/{staff_id}")
async def delete_staff(staff_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a staff member"""
    
    result = await db.execute(select(AppUser).where(AppUser.id == UUID(staff_id)))
    staff = result.scalars().first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    await db.delete(staff)
    await db.commit()
    
    return {"success": True, "message": "Staff member deleted successfully"}
