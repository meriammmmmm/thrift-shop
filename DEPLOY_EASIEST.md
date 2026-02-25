# 🚀 EASIEST DEPLOYMENT - MANUAL STEPS

Render Blueprint isn't working with subdirectories. Let's deploy manually (still super easy!):

## STEP 1: Deploy Backend (5 min)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `meriammmmmm/thrift-shop`
4. Configure:
   - **Name**: `thrift-shop-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 5001
   JWT_SECRET = your-secret-key-12345
   DATABASE_PATH = ./database/thrift_shop.db
   ADMIN_EMAIL = admin@thriftshop.com
   ADMIN_PASSWORD = admin123
   ```

6. Click "Create Web Service"
7. **COPY YOUR URL**: `https://thrift-shop-backend.onrender.com`

---

## STEP 2: Deploy Frontend (5 min)

1. Click "New +" → "Web Service"
2. Same repo: `meriammmmmm/thrift-shop`
3. Configure:
   - **Name**: `pearl-box-store`
   - **Root Directory**: `thrift-shop`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. Add Environment Variables:
   ```
   NEXT_PUBLIC_COMPANY_ID = 1
   NEXT_PUBLIC_COMPANY_NAME = Pearl Box
   NEXT_PUBLIC_API_URL = https://thrift-shop-backend.onrender.com/api
   ```
   ⚠️ **USE YOUR BACKEND URL FROM STEP 1!**

5. Click "Create Web Service"
6. **COPY YOUR URL**: `https://pearl-box-store.onrender.com`

---

## STEP 3: Deploy Admin (5 min)

1. Click "New +" → "Web Service"
2. Same repo: `meriammmmmm/thrift-shop`
3. Configure:
   - **Name**: `thrift-shop-admin`
   - **Root Directory**: `admin-panel`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 3005
   REACT_APP_API_URL = https://thrift-shop-backend.onrender.com/api
   ```
   ⚠️ **USE YOUR BACKEND URL FROM STEP 1!**

5. Click "Create Web Service"
6. **COPY YOUR URL**: `https://thrift-shop-admin.onrender.com`

---

## ✅ DONE!

Your URLs:
- **Backend**: https://thrift-shop-backend.onrender.com
- **Store**: https://pearl-box-store.onrender.com
- **Admin**: https://thrift-shop-admin.onrender.com

Login to admin: `admin@thriftshop.com` / `admin123`

---

## 🆘 Troubleshooting

**"Service Unavailable"**
- Wait 30 seconds (free services sleep)

**Build Failed**
- Check the logs in Render dashboard
- Make sure Root Directory is correct

**Can't connect to backend**
- Verify backend URL in environment variables
- Check backend is running: visit `/api/health`

---

Start here: https://render.com
