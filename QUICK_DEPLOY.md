# Quick Deployment Guide - Blissy Bakes CRM

## 🚀 Deployment Strategy

**Frontend**: Vercel (Free Tier)  
**Backend**: Railway (Free Tier) - Recommended  
**Alternative Backend**: Render (Free Tier)

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy Backend to Railway

1. **Sign up at Railway**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `xyratekinnovation/blissy-bakes-CRM`

3. **Configure Service**
   - Click on the service
   - Go to "Settings"
   - Set **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add PostgreSQL Database**
   - In Railway project, click "New" → "Database" → "PostgreSQL"
   - Railway automatically provides connection string

5. **Set Environment Variables**
   - Go to "Variables" tab
   - Add:
     ```
     DATABASE_URL = (auto-provided by Railway PostgreSQL)
     SECRET_KEY = (generate with: openssl rand -hex 32)
     PORT = (auto-set by Railway)
     ALLOWED_ORIGINS = https://your-vercel-app.vercel.app
     ```

6. **Deploy**
   - Railway auto-deploys on push
   - Wait for deployment
   - Copy your backend URL (e.g., `https://blissy-bakes-backend.railway.app`)

---

### Step 2: Deploy Frontend to Vercel

1. **Sign up at Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import `xyratekinnovation/blissy-bakes-CRM`

3. **Configure Build**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     VITE_API_URL = https://your-railway-backend.railway.app
     ```
   - Select "Production", "Preview", and "Development"

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your frontend URL (e.g., `https://blissy-bakes.vercel.app`)

---

### Step 3: Update CORS in Backend

1. **Go back to Railway**
2. **Update Environment Variable**:
   ```
   ALLOWED_ORIGINS = https://your-vercel-app.vercel.app
   ```
3. **Redeploy** (Railway auto-redeploys when env vars change)

---

### Step 4: Run Database Migrations

1. **In Railway**, go to your backend service
2. **Click "Deploy Logs"** or use **Railway CLI**:
   ```bash
   railway login
   railway link
   railway run python add_order_number_column.py
   railway run python backfill_order_numbers.py
   railway run python create_admin.py
   ```

---

## ✅ Verification Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] CORS configured
- [ ] Database migrations run
- [ ] Can login to the app
- [ ] API calls working

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
- Check `VITE_API_URL` in Vercel
- Verify backend URL is correct
- Check CORS settings in backend

### Database connection errors
- Verify `DATABASE_URL` in Railway
- Check database is running
- Test connection string

### Build failures
- Check build logs
- Verify all dependencies installed
- Check for TypeScript errors

---

## 📝 Environment Variables Reference

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.railway.app
```

### Backend (Railway)
```
DATABASE_URL=postgresql://... (auto-provided)
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=https://your-frontend.vercel.app
PORT=auto-set
```

---

## 🎉 You're Done!

Your app should now be live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app
