# 🚀 DEPLOY IN 5 MINUTES

## FASTEST WAY - RENDER (100% FREE)

### Step 1: Push to GitHub (1 minute)
```bash
git add .
git commit -m "Ready to deploy Pearl Box"
git push
```

### Step 2: Deploy on Render (2 minutes)
1. Go to: **https://render.com**
2. Click **"Get Started"** (sign up with GitHub - NO CREDIT CARD!)
3. Click **"New +"** → **"Blueprint"**
4. Select your repository
5. Click **"Apply"**
6. ☕ Wait 10 minutes

### Step 3: Get Your URLs (1 minute)
After deployment completes:
- **Backend**: `https://thrift-shop-backend.onrender.com`
- **Admin**: `https://thrift-shop-admin.onrender.com`
- **Store**: `https://pearl-box-store.onrender.com`

### Step 4: Login & Add Products (1 minute)
1. Open admin URL
2. Login: `admin@thriftshop.com` / `admin123`
3. Add your products
4. Share your store URL!

---

## ALTERNATIVE - VERCEL (Frontend Only)

```bash
# Install Vercel
npm install -g vercel

# Deploy frontend
cd thrift-shop
vercel

# Follow prompts, get instant URL!
```

**Note**: You'll still need Render for the backend API.

---

## ⚡ SUPER QUICK - Railway

1. Go to: **https://railway.app**
2. Click **"Deploy from GitHub"**
3. Select your repo
4. Done!

---

## 🎯 RECOMMENDED: RENDER

Why? 
- ✅ Deploys all 3 services at once
- ✅ 100% free forever
- ✅ No credit card needed
- ✅ Auto-detects configuration
- ✅ Easy custom domains

**Start here**: https://render.com

---

## Your Store Name

Current: **Pearl Box**

To change:
1. Edit `thrift-shop/.env.local`
2. Change `NEXT_PUBLIC_COMPANY_NAME="Your Name"`
3. Redeploy

---

## 🆘 Need Help?

**Service sleeping?** 
- First request takes 30 seconds (free tier)

**Build failed?**
- Check Render logs
- Verify package.json files

**Can't connect?**
- Wait for all 3 services to finish deploying
- Check backend health: `/api/health`

---

## 🎉 YOU'RE READY!

Just run:
```bash
git add .
git commit -m "Deploy Pearl Box"
git push
```

Then go to: **https://render.com**
