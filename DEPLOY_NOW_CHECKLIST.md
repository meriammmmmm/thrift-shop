# 🚀 Deploy meryrose.me - Quick Checklist

## ✅ Configuration Complete

All localhost:5001 references have been removed from your frontend!

## 📋 Deployment Steps

### Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Configure meryrose.me with Render backend"
git push origin main
```

### Step 2: Deploy Backend to Render

1. Go to https://dashboard.render.com
2. Find your backend service: `mery-rose-backend`
3. Go to **Environment** tab
4. Update/Add these variables:
   ```
   FRONTEND_URL=https://meryrose.me
   JWT_SECRET=your-super-secret-jwt-key-here
   GEMINI_API_KEY=AIzaSyCGAohPFFGWBe4nKkZpPzgadglffo7bxrU
   GEMINI_API_KEY_2=AIzaSyBtLkFSx7G_7JaB4DpTS91ChXe-iCqHaIY
   ```
5. Click **Save Changes** (will auto-redeploy)

### Step 3: Deploy Frontend

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
cd thrift-shop
vercel --prod
```

When prompted:
- Link to existing project or create new
- Set environment variables:
  ```
  NEXT_PUBLIC_COMPANY_ID=2
  NEXT_PUBLIC_COMPANY_NAME=Mery Rose
  NEXT_PUBLIC_API_URL=https://mertrosebackend-meec580k.b4a.run/api
  ```

#### Option B: Netlify

```bash
# Install Netlify CLI if needed
npm i -g netlify-cli

# Deploy
cd thrift-shop
netlify deploy --prod
```

Set environment variables in Netlify dashboard.

#### Option C: GitHub Auto-Deploy

1. Go to https://vercel.com or https://netlify.com
2. Click **New Project**
3. Import your GitHub repository
4. Set build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
5. Add environment variables:
   ```
   NEXT_PUBLIC_COMPANY_ID=2
   NEXT_PUBLIC_COMPANY_NAME=Mery Rose
   NEXT_PUBLIC_API_URL=https://mertrosebackend-meec580k.b4a.run/api
   ```
6. Deploy!

### Step 4: Configure Custom Domain

#### On Vercel:
1. Go to your project → Settings → Domains
2. Add `meryrose.me`
3. Follow DNS configuration instructions
4. Add these records to your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

#### On Netlify:
1. Go to Site settings → Domain management
2. Add custom domain: `meryrose.me`
3. Follow DNS configuration instructions
4. Add these records:
   ```
   Type: CNAME
   Name: @
   Value: [your-site].netlify.app
   ```

### Step 5: Test Everything

```bash
# Test backend
curl https://mertrosebackend-meec580k.b4a.run/api/health

# Should return:
# {"status":"OK","message":"Thrift Shop Backend is running!","cors":"enabled"}
```

Then visit:
- https://meryrose.me - Should load your store
- Check browser console - No errors
- Try adding products to cart
- Test checkout flow

## 🎯 Quick Reference

| Item | Value |
|------|-------|
| Frontend Domain | meryrose.me |
| Backend API | https://mertrosebackend-meec580k.b4a.run/api |
| Company Name | Mery Rose |
| Company ID | 2 |

## 🔥 Files Changed

✅ All environment files updated
✅ API client default URL updated
✅ Page.tsx fallback URL updated
✅ Build cache cleared (.next folder removed)

## 🎉 Ready to Go Live!

Your configuration is complete. Just follow the deployment steps above and meryrose.me will be live!

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Render logs for backend errors
3. Verify environment variables are set correctly
4. Test backend health endpoint first
5. Make sure DNS records are properly configured
