# 🚀 DEPLOY YOUR THRIFT SHOP - QUICK STEPS

## ✅ Backend Status
Your backend is ALREADY DEPLOYED on Railway:
- URL: `https://mery-rose-backend.onrender.com`
- Status: Check at `https://mery-rose-backend.onrender.com/health`

---

## 🎯 DEPLOY FRONTEND NOW (5 minutes)

### Option 1: Vercel (EASIEST - Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Click "Sign Up" or "Login" with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `thrift-shop`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Pearl Box
   NEXT_PUBLIC_API_URL=https://mery-rose-backend.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! You'll get a URL like: `https://your-project.vercel.app`

---

### Option 2: Railway (All-in-One)

1. **Go to Railway**
   - Visit: https://railway.app
   - Login with GitHub

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Frontend Service**
   - Click "Add Service" → "GitHub Repo"
   - Select `thrift-shop` folder
   - Railway auto-detects Next.js

4. **Add Environment Variables**
   In Railway dashboard, add:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Pearl Box
   NEXT_PUBLIC_API_URL=https://mery-rose-backend.onrender.com
   ```

5. **Deploy**
   - Railway deploys automatically
   - Get your URL from the dashboard

---

## 🎯 DEPLOY ADMIN PANEL (Optional - 5 minutes)

### On Vercel:

1. **Import Project Again**
   - Click "Add New..." → "Project"
   - Same repository

2. **Configure**
   - **Root Directory**: `admin-panel`
   - **Build Command**: `npm install && npm run build`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://mery-rose-backend.onrender.com
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Done!

---

## ✅ QUICK CHECKLIST

- [ ] Backend is running (check health endpoint)
- [ ] Deploy frontend to Vercel/Railway
- [ ] Add environment variables
- [ ] Test the deployed site
- [ ] (Optional) Deploy admin panel

---

## 🆘 TROUBLESHOOTING

### "Can't connect to backend"
- Check backend is running: `https://mery-rose-backend.onrender.com/health`
- Verify `NEXT_PUBLIC_API_URL` ends with `/api`
- Check Railway logs for backend errors

### "Build failed"
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### "Environment variables not working"
- Make sure they start with `NEXT_PUBLIC_` for Next.js
- Redeploy after adding variables
- Check they're set in the correct environment (Production)

---

## 🎉 YOU'RE DONE!

Once deployed, you'll have:
- ✅ Backend: Railway (already running)
- ✅ Frontend: Vercel/Railway (your store)
- ✅ Admin: Vercel/Railway (optional)

**Start here**: https://vercel.com (easiest!)

