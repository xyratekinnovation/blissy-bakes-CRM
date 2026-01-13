from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, orders, analytics, customers, products, inventory, expenses, offers, bulk_orders, staff
from .database import engine, Base
import asyncio

app = FastAPI(title="Blissy Bakes API", version="1.0.0")

# CORS Setup
# Get allowed origins from environment variable or use defaults
import os
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
    "http://localhost:8080", # Vite dev server
    "http://localhost:8081", # Alternative frontend port
    *allowed_origins, # Add production origins from environment
    "*" # For development (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
