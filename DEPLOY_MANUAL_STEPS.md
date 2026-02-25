# 🚀 DEPLOY MANUALLY (THIS WILL WORK!)

The Blueprint feature doesn't work with your monorepo structure. Deploy each service manually instead:

---

## ⚡ OPTION 1: VERCEL (FASTEST - 5 MINUTES)

### Deploy Frontend Only:
1. Go to: **https://vercel.com/new**
2. Import your repo: `meriammmmmm/thrift-shop`
3. Settings:
   - **Root Directory**: Click "Edit" → Select `thrift-shop`
   - **Framework**: Next.js (auto-detected)
   - **Environment Variables**: Add these:
     ```
     NEXT_PUBLIC_COMPANY_ID = 1
     NEXT_PUBLIC_COMPANY_NAME = Pearl Box
     NEXT_PUBLIC_API_URL = http://localhost:5001/api
     ```
     (We'll update the API URL after deploying backend)
4. Click **Deploy**
5. Done! You get: `https://your-project.vercel.app`

### Deploy Backend on Render:
1. Go to: **https://dashboard.render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. **IMPORTANT Settings**:
   - Name: `thrift-shop-backend`
   - Root Directory: `backend` ← TYPE THIS!
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
5. **Environment Variables** (click "Add Environment Variable"):
   ```
   NODE_ENV = production
   PORT = 5001
   JWT_SECRET = super-secret-key-12345
   DATABASE_PATH = ./database/thrift_shop.db
   ADMIN_EMAIL = admin@thriftshop.com
   ADMIN_PASSWORD = admin123
   ```
6. Click **"Create Web Service"**
7. Wait 5 minutes
8. Copy your backend URL: `https://thrift-shop-backend.onrender.com`

### Update Frontend with Backend URL:
1. Go back to Vercel dashboard
2. Your project → Settings → Environment Variables
3. Edit `NEXT_PUBLIC_API_URL` to: `https://thrift-shop-backend.onrender.com/api`
4. Go to Deployments → Click "..." → Redeploy

---

## 🎯 OPTION 2: ALL ON RENDER (10 MINUTES)

### 1. Deploy Backend:
- Dashboard → New + → Web Service
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Add environment variables (see above)

### 2. Deploy Frontend:
- Dashboard → New + → Web Service
- Root Directory: `thrift-shop`
- Build: `npm install && npm run build`
- Start: `npm start`
- Environment Variables:
  ```
  NEXT_PUBLIC_COMPANY_ID = 1
  NEXT_PUBLIC_COMPANY_NAME = Pearl Box
  NEXT_PUBLIC_API_URL = https://thrift-shop-backend.onrender.com/api
  ```

### 3. Deploy Admin (Optional):
- Dashboard → New + → Web Service
- Root Directory: `admin-panel`
- Build: `npm install && npm run build`
- Start: `npm start`
- Environment Variables:
  ```
  NODE_ENV = production
  PORT = 3005
  REACT_APP_API_URL = https://thrift-shop-backend.onrender.com/api
  ```

---

## ✅ FINAL URLS:

- **Store**: https://your-project.vercel.app (or Render URL)
- **Backend**: https://thrift-shop-backend.onrender.com
- **Admin**: https://thrift-shop-admin.onrender.com

---

## 🆘 TROUBLESHOOTING:

**"npm: not found"**
- Make sure you set **Root Directory** correctly!
- It should be `backend`, `thrift-shop`, or `admin-panel`

**"Service Unavailable"**
- Free tier services sleep after 15 min of inactivity
- First request takes 30 seconds to wake up

**"Can't connect to backend"**
- Check backend is running: visit `https://your-backend.onrender.com/api/health`
- Verify API URL in frontend environment variables

---

## 🚀 RECOMMENDED: Start with Vercel

Vercel is the easiest for Next.js:
1. Deploy frontend to Vercel (2 minutes)
2. Deploy backend to Render (5 minutes)
3. Update frontend env vars (1 minute)
4. Done!

**Start here**: https://vercel.com/new
