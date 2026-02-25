# 🚀 Deploy Your Thrift Shop NOW!

## Choose Your Platform (Both FREE!)

### Option 1: Render (Recommended - Easiest)
**Time: 15 minutes | Cost: FREE**

1. **Sign Up**
   - Go to https://render.com
   - Click "Get Started" 
   - Sign up with GitHub (no credit card needed!)

2. **Deploy Everything at Once**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select this repository
   - Render will auto-detect `render.yaml`
   - Click "Apply"
   - Wait 10-15 minutes ☕

3. **Get Your URLs**
   - Backend: `https://thrift-shop-backend.onrender.com`
   - Admin: `https://thrift-shop-admin.onrender.com`
   - Store: `https://pearl-box-store.onrender.com`

4. **Test**
   - Open admin panel
   - Login: `admin@thriftshop.com` / `admin123`
   - Add products
   - Visit your store!

---

### Option 2: Vercel (Fastest for Frontend)
**Time: 10 minutes | Cost: FREE**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   cd thrift-shop
   vercel
   ```
   - Follow prompts
   - Get URL: `https://pearl-box.vercel.app`

3. **Deploy Backend** (Use Render for backend)
   - Go to https://render.com
   - New Web Service
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Add environment variables from `backend/.env`

4. **Update Frontend**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = your Render backend URL

---

## Quick Commands

### Test Locally First
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd thrift-shop
npm install
npm run dev

# Terminal 3 - Admin
cd admin-panel
npm install
npm run dev
```

### Deploy with Render CLI
```bash
# Install Render CLI
npm install -g render

# Deploy
render deploy
```

---

## Your URLs After Deployment

✅ **Backend API**: https://thrift-shop-backend.onrender.com
✅ **Admin Panel**: https://thrift-shop-admin.onrender.com  
✅ **Pearl Box Store**: https://pearl-box-store.onrender.com

---

## Troubleshooting

**"Service Unavailable"**
- Wait 30 seconds (free tier services sleep after inactivity)
- First request wakes them up

**"Build Failed"**
- Check Render logs
- Verify all dependencies in package.json

**"Can't Connect to Backend"**
- Verify backend URL in environment variables
- Check backend is running (visit /api/health)

**Database Issues**
- Render free tier uses ephemeral storage
- Database resets on restart
- Upgrade to paid tier for persistent storage
- Or use external database (PostgreSQL, MongoDB)

---

## Next Steps

1. ✅ Deploy to Render
2. ✅ Login to admin panel
3. ✅ Change admin password
4. ✅ Upload your logo
5. ✅ Add products
6. ✅ Customize theme
7. ✅ Share your store URL!

---

## Custom Domain (Optional)

1. Buy domain from Namecheap/GoDaddy ($10/year)
2. In Render dashboard → Settings → Custom Domain
3. Add your domain: `www.pearlbox.com`
4. Update DNS records (Render provides instructions)
5. Wait 24 hours for DNS propagation

---

## 🎉 You're Ready!

Start here: https://render.com

Questions? Check the logs in Render dashboard.
