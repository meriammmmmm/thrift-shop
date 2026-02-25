# 🚀 DEPLOY WITH VERCEL (EASIEST!)

Vercel is made for Next.js - it's literally 2 clicks!

## STEP 1: Deploy Frontend (2 minutes)

1. Go to: https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repo: `meriammmmmm/thrift-shop`
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `thrift-shop`
   - Click "Edit" on Environment Variables and add:
     ```
     NEXT_PUBLIC_COMPANY_ID = 1
     NEXT_PUBLIC_COMPANY_NAME = Pearl Box
     NEXT_PUBLIC_API_URL = https://thrift-shop-backend.onrender.com/api
     ```
5. Click "Deploy"
6. Done! You'll get: `https://pearl-box.vercel.app`

---

## STEP 2: Deploy Backend on Render (5 minutes)

Backend needs to be on Render (Vercel doesn't support Express well):

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Select your repo
4. Settings:
   - **Name**: `thrift-shop-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Environment Variables:
   ```
   NODE_ENV = production
   PORT = 5001
   JWT_SECRET = your-secret-key-12345
   DATABASE_PATH = ./database/thrift_shop.db
   ADMIN_EMAIL = admin@thriftshop.com
   ADMIN_PASSWORD = admin123
   ```

6. Click "Create Web Service"
7. Copy backend URL: `https://thrift-shop-backend.onrender.com`

---

## STEP 3: Update Frontend with Backend URL

1. Go back to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL` with your Render backend URL
5. Redeploy (Deployments → click "..." → Redeploy)

---

## STEP 4: Deploy Admin (Optional - 5 minutes)

Same as backend but:
- **Root Directory**: `admin-panel`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- Environment Variables:
  ```
  NODE_ENV = production
  PORT = 3005
  REACT_APP_API_URL = https://thrift-shop-backend.onrender.com/api
  ```

---

## ✅ YOU'RE LIVE!

- **Store**: https://pearl-box.vercel.app
- **Backend**: https://thrift-shop-backend.onrender.com
- **Admin**: https://thrift-shop-admin.onrender.com

---

## Why This Works Better:

✅ Vercel is MADE for Next.js
✅ Auto-detects everything
✅ Instant deployments
✅ Free SSL
✅ Global CDN

Start here: https://vercel.com
