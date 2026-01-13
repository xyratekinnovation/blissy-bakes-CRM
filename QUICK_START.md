# 🚀 Quick Start Guide - Fix Login Error

## The Problem
The backend server is not running, which is why you're getting the connection error.

## ✅ Solution - 3 Simple Steps

### Step 1: Start the Backend Server

**On Windows:**
```bash
cd backend
start_backend.bat
```

**On Mac/Linux:**
```bash
cd backend
chmod +x start_backend.sh
./start_backend.sh
```

**Or manually:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 2: Create Test User

**Open a NEW terminal window** (keep backend running) and run:

```bash
cd backend
python create_test_user.py
```

You should see:
```
✅ Created new user: Admin Owner
   Phone: 9999999999
   PIN: 1234

📝 Login Credentials:
   Phone Number: 9999999999
   PIN: 1234
```

### Step 3: Login

1. Make sure frontend is running (usually `npm run dev` in the root folder)
2. Go to `http://localhost:5173` (or your frontend URL)
3. Select **"Staff PIN"** tab
4. Enter:
   - **Phone Number:** `9999999999`
   - **PIN:** `1234`
5. Click "Login with PIN"

## 🔍 Verify Backend is Running

Open your browser and go to:
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/

If you see the Swagger UI or a JSON response, the backend is running correctly!

## ❌ Still Having Issues?

### Issue: "DATABASE_URL not found"
**Solution:** Create a `.env` file in the `backend` folder:
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
SECRET_KEY=your-secret-key-here
```

### Issue: "Connection refused" or "Cannot connect to database"
**Solution:** 
1. Make sure PostgreSQL/Supabase is running
2. For local Supabase: Run `supabase start` in the backend folder
3. Check the DATABASE_URL matches your database connection

### Issue: "Module not found" errors
**Solution:** 
```bash
cd backend
pip install -r requirements.txt
```

### Issue: Port 8000 already in use
**Solution:** 
- Change port in `start_backend.bat` or `start_backend.sh` to `--port 8001`
- Update frontend API calls to use port 8001

## 📝 Default Login Credentials

- **Phone Number:** `9999999999`
- **PIN:** `1234`

**⚠️ Important:** These are for local development only. Change them in production!

## 🎯 Next Steps After Login

Once logged in, you can:
1. View Dashboard (should show real stats)
2. Create New Order (products from database)
3. View Inventory (real inventory data)
4. Manage Customers

---

**Need Help?** Check the backend logs in the terminal where you started the server.
