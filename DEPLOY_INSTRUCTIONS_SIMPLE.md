# 🚀 DEPLOY IN 3 STEPS

Your backend is already on Railway! Now deploy the frontend:

## ✅ STEP 1: Go to Vercel (2 minutes)

1. Visit: **https://vercel.com**
2. Click **"Sign Up"** with GitHub (free)
3. Click **"Add New..."** → **"Project"**

## ✅ STEP 2: Import & Configure (2 minutes)

1. Select your GitHub repository
2. Click **"Import"**
3. Set **Root Directory** to: `thrift-shop`
4. Click **"Environment Variables"** and add these 3 variables:

```
NEXT_PUBLIC_COMPANY_ID = 1
NEXT_PUBLIC_COMPANY_NAME = Pearl Box
NEXT_PUBLIC_API_URL = https://thrift-shop-backend-production.up.railway.app/api
```

## ✅ STEP 3: Deploy (1 minute)

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. **DONE!** 🎉

You'll get a URL like: `https://your-store.vercel.app`

---

## 🎯 Alternative: Deploy on Railway

If you prefer Railway (where your backend is):

1. Go to: **https://railway.app/dashboard**
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Choose the `thrift-shop` folder
5. Add the same 3 environment variables above
6. Railway deploys automatically!

---

## 🆘 Need Help?

### Backend not responding?
Check: `https://thrift-shop-backend-production.up.railway.app/api/health`

Should return: `{"status":"healthy"}`

### Build failed?
- Check Node.js version is 18+
- Make sure all dependencies are installed
- Check deployment logs

---

## 🎉 That's It!

**Easiest**: Use Vercel (made for Next.js)
**All-in-one**: Use Railway (backend + frontend together)

**Start here**: https://vercel.com

