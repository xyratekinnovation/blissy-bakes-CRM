from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import AppUser
from ..schemas import LoginRequest, LoginResponse
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find user by phone
    result = await db.execute(select(AppUser).where(AppUser.phone_number == login_data.phoneNumber))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid phone number or PIN")

    # Verify PIN
    # Note: In production you should verify the hash.
    # For now assuming strict comparison if not hash, or bcrypt if hash
    valid = False
    try:
        if user.pin_hash.startswith('$2a$') or user.pin_hash.startswith('$2b$'):
             valid = bcrypt.checkpw(login_data.pin.encode(), user.pin_hash.encode())
        else:
             # Fallback for plain text during migration/testing (NOT SECURE)
             valid = user.pin_hash == login_data.pin
    except Exception as e:
        print(f"Auth error: {e}")
        valid = False

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid phone number or PIN")

    # Generate JWT
    access_token_expires = timedelta(minutes=60 * 24) # 1 day
    expire = datetime.utcnow() + access_token_expires
    to_encode = {"sub": str(user.id), "role": user.role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "token": encoded_jwt,
        "user": {
            "id": str(user.id),
            "fullName": user.full_name,
            "phoneNumber": user.phone_number,
            "role": user.role
        }
    }
