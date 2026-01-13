# Blissy Bakes CRM - Deployment Guide

## Overview
This guide covers deploying the Blissy Bakes CRM application to production using free-tier services.

## Architecture
- **Frontend**: React + Vite → Deploy to **Vercel** (Free Tier)
- **Backend**: FastAPI → Deploy to **Railway** or **Render** (Free Tier)
- **Database**: PostgreSQL (included with Railway/Render or use Supabase)

---

## Option 1: Frontend on Vercel + Backend on Railway (Recommended)

### Part A: Deploy Frontend to Vercel

#### Step 1: Prepare Frontend for Vercel

1. **Create `vercel.json` configuration file** (already created in project root):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. **Update API endpoints for production**:
   - Create environment variables in Vercel
   - Update `src/api/*.ts` files to use environment variable for backend URL

#### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (optional, can use web interface):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from project root**:
```bash
vercel
```

4. **Or use GitHub Integration** (Recommended):
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository: `xyratekinnovation/blissy-bakes-CRM`
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `./` (root)
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add Environment Variables:
     ```
     VITE_API_URL=https://your-backend-url.railway.app
     ```
   - Click "Deploy"

#### Step 3: Configure Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables:
- `VITE_API_URL`: Your backend URL (from Railway/Render)

---

### Part B: Deploy Backend to Railway

#### Step 1: Prepare Backend for Railway

1. **Create `Procfile`** in `backend/` directory:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

2. **Create `runtime.txt`** (optional, for Python version):
```
python-3.11
```

3. **Update `backend/app/main.py`** CORS settings:
```python
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "https://your-vercel-app.vercel.app",  # Add your Vercel URL
    "*"  # For development
]
```

#### Step 2: Deploy to Railway

1. **Sign up at Railway**: https://railway.app
   - Use GitHub to sign in

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `xyratekinnovation/blissy-bakes-CRM`

3. **Configure Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add PostgreSQL Database**:
   - In Railway project, click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection string automatically

5. **Set Environment Variables**:
   - `DATABASE_URL`: Auto-provided by Railway (from PostgreSQL service)
   - `SECRET_KEY`: Generate a secure key (e.g., `openssl rand -hex 32`)
   - `PORT`: Railway sets this automatically

6. **Deploy**:
   - Railway will automatically detect Python and deploy
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://blissy-bakes-backend.railway.app`)

#### Step 3: Update Frontend API URL

1. Go back to Vercel
2. Update environment variable:
   - `VITE_API_URL`: `https://your-railway-backend.railway.app`
3. Redeploy frontend

---

## Option 2: Frontend on Vercel + Backend on Render

### Deploy Backend to Render

1. **Sign up**: https://render.com
   - Use GitHub to sign in

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select `backend` as root directory
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add PostgreSQL Database**:
   - Create new PostgreSQL database
   - Copy connection string

4. **Set Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: Generate secure key
   - `PORT`: Auto-set by Render

5. **Deploy**:
   - Render will build and deploy automatically
   - Get your backend URL

---

## Option 3: Both on Vercel (Advanced - Serverless Functions)

This requires restructuring the FastAPI app into Vercel serverless functions. Not recommended for this project.

---

## Post-Deployment Steps

### 1. Update CORS in Backend
Update `backend/app/main.py` to include your Vercel frontend URL:
```python
origins = [
    "https://your-app.vercel.app",
    "https://your-app.vercel.app/*",
]
```

### 2. Run Database Migrations
SSH into your backend or use Railway/Render console:
```bash
cd backend
python add_order_number_column.py
python backfill_order_numbers.py
python create_admin.py
```

### 3. Test the Deployment
- Visit your Vercel frontend URL
- Test login functionality
- Verify API calls work

---

## Environment Variables Summary

### Frontend (Vercel)
- `VITE_API_URL`: Backend API URL

### Backend (Railway/Render)
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `PORT`: Server port (auto-set)

---

## Free Tier Limits

### Vercel
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains

### Railway
- ✅ $5 free credit/month
- ✅ 500 hours runtime/month
- ⚠️ Sleeps after inactivity (can upgrade)

### Render
- ✅ 750 hours/month free
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Slow cold starts

---

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `VITE_API_URL` environment variable
- Check backend is running and accessible

### Database connection errors
- Verify `DATABASE_URL` is set correctly
- Check database is running (Railway/Render)
- Test connection string format

### Build failures
- Check build logs in Vercel/Railway
- Verify all dependencies in `package.json` and `requirements.txt`
- Check for TypeScript/ESLint errors

---

## Recommended: Railway for Backend

Railway is recommended because:
- ✅ Better free tier than Render
- ✅ Faster deployments
- ✅ Better developer experience
- ✅ Automatic HTTPS
- ✅ Easy database setup

---

## Quick Start Commands

### Deploy Frontend (Vercel)
```bash
npm i -g vercel
vercel login
vercel
```

### Deploy Backend (Railway)
1. Go to railway.app
2. New Project → GitHub Repo
3. Select backend directory
4. Add PostgreSQL
5. Deploy!

---

## Support

For issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration
