# Blissy Bakes - Setup & Testing Guide

## ✅ What Has Been Completed

### Backend Implementation
- ✅ **Inventory Router** (`backend/app/routers/inventory.py`)
  - GET `/inventory` - Get all inventory items
  - GET `/inventory/low-stock` - Get low stock items
  - PUT `/inventory/{id}/restock` - Restock inventory
  - GET `/inventory/stats` - Get inventory statistics

- ✅ **Products Router** (`backend/app/routers/products.py`)
  - GET `/products` - Get all products (with stock info)
  - GET `/products/{id}` - Get single product

- ✅ **Enhanced Analytics Router**
  - GET `/analytics/dashboard-stats?period=today|week|month` - Get dashboard stats with period support

### Frontend Implementation
- ✅ **Inventory Page** - Connected to real API, removed mock data
- ✅ **Dashboard Page** - Connected to real API, removed mock data
- ✅ **New Order Page** - Connected to real products API, removed mock data
- ✅ **API Clients** - Created `products.ts` and `inventory.ts` API clients
- ✅ **Login Error Handling** - Improved error messages for connection issues

### Code Cleanup
- ✅ Fixed all "Edge Function" comments to "Python backend"
- ✅ Updated backend README to reflect Python FastAPI architecture

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
SECRET_KEY=your-secret-key-change-in-production
EOF

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Database Setup

**Option A: Using Local Supabase**
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Start Supabase locally
cd backend
supabase start

# Apply migrations
supabase db reset
```

**Option B: Using Remote PostgreSQL**
- Update `DATABASE_URL` in `.env` to point to your database
- Run migrations manually or let the app create tables on startup

### 3. Frontend Setup

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## 🧪 Testing the Complete Flow

### 1. Test Login
1. Open `http://localhost:5173`
2. Select "Staff PIN" tab
3. Enter phone number: `9999999999` (or create a user first)
4. Enter PIN: `1234` (or the PIN you set)
5. Should navigate to `/home` on success

**If login fails:**
- Check backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify database connection in backend logs

### 2. Create a Test User (if needed)

You can create a user via Python:
```python
import bcrypt
from backend.app.database import AsyncSessionLocal
from backend.app.models import AppUser

async def create_user():
    async with AsyncSessionLocal() as db:
        pin = "1234"
        pin_hash = bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()
        
        user = AppUser(
            full_name="Test User",
            phone_number="9999999999",
            pin_hash=pin_hash,
            role="owner"
        )
        db.add(user)
        await db.commit()
        print("User created!")
```

### 3. Test Products & Inventory
1. Navigate to "New Order" page
2. Should see products loaded from database
3. Navigate to "Inventory" page
4. Should see inventory items from database
5. Try restocking an item

### 4. Test Order Creation
1. Go to "New Order"
2. Add items to cart
3. Click "Checkout"
4. Fill customer info
5. Complete order
6. Verify:
   - Order created in database
   - Inventory deducted
   - Customer created/updated

### 5. Test Dashboard
1. Navigate to "Dashboard"
2. Should see real statistics:
   - Total sales
   - Order count
   - Average order value
   - Low stock items
3. Try switching between Today/Week/Month periods

## 🔍 Troubleshooting

### Login Error: "Connection error!"
- **Solution**: Make sure backend is running on port 8000
- Check: `http://localhost:8000/docs` should show Swagger UI

### Database Connection Error
- **Solution**: Verify `DATABASE_URL` in `.env` is correct
- For local Supabase: Default is `postgresql+asyncpg://postgres:postgres@localhost:54322/postgres`
- Check Supabase is running: `supabase status`

### CORS Errors
- **Solution**: Backend CORS is configured for `localhost:5173` and `localhost:3000`
- If using different port, update `backend/app/main.py` CORS origins

### No Products/Inventory Showing
- **Solution**: Seed the database with sample data
- Run: `supabase db reset` (applies seed.sql)
- Or manually insert products via SQL or API

## 📝 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Staff login with phone + PIN |
| `/orders` | GET | Get all orders |
| `/orders/create` | POST | Create new order |
| `/customers` | GET | Get/search customers |
| `/products` | GET | Get products (with stock) |
| `/inventory` | GET | Get inventory items |
| `/inventory/low-stock` | GET | Get low stock items |
| `/inventory/{id}/restock` | PUT | Restock item |
| `/analytics/dashboard-stats` | GET | Get dashboard stats |

## 🎯 Next Steps

1. **Seed Database**: Add sample products and inventory
2. **Test End-to-End**: Complete full order flow
3. **Add More Features**: 
   - Product creation UI
   - Inventory management UI
   - Customer management enhancements
   - Reports export functionality

## 📚 Documentation

- Backend API Docs: `http://localhost:8000/docs` (Swagger UI)
- Backend README: `backend/README.md`
