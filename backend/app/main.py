from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, orders, analytics, customers, products, inventory, expenses, offers, bulk_orders, staff
from .database import engine, Base
import asyncio

app = FastAPI(title="Blissy Bakes API", version="1.0.0")

# CORS Setup
# With allow_credentials=True, browser requires explicit origins (no "*")
import os
allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "https://blissy-bakes-crm.vercel.app",  # Production frontend
    "https://blissy-bakes-crm.vercel.app/",
    *allowed_origins,
]
# Fallback: if no origins (e.g. dev), allow localhost only is already in list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(analytics.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(expenses.router)
app.include_router(offers.router)
app.include_router(bulk_orders.router)
app.include_router(staff.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Blissy Bakes Python API"}

# Startup Event (Optional: create tables if not exist)
@app.on_event("startup")
async def startup():
    # In production, use Alembic for migrations.
    # Here we can create tables for dev convenience if they don't exist.
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # DATA LOSS WARNING
        await conn.run_sync(Base.metadata.create_all)
