# 🚀 Deploy Your Thrift Shop to Render.com (FREE)

## ✅ Prerequisites Completed
- ✅ render.yaml created
- ✅ .gitignore files added
- ✅ All code ready

## 📋 Step-by-Step Deployment

### Step 1: Push to GitHub (5 minutes)

If you haven't already pushed your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Sign Up for Render (2 minutes)

1. Go to: **https://render.com**
2. Click "Get Started"
3. Sign up with GitHub (recommended)
4. **NO CREDIT CARD REQUIRED!** ✅

### Step 3: Deploy Backend (5 minutes)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `thrift-shop-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free ⭐

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secret-key-min-32-chars-long-random-string
   DATABASE_PATH=./database/thrift_shop.db
   ```

5. Click "Create Web Service"
6. **WAIT** for deployment to complete (3-5 minutes)
7. **COPY YOUR BACKEND URL** (e.g., `https://thrift-shop-backend.onrender.com`)

### Step 4: Deploy Admin Panel (5 minutes)

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `thrift-shop-admin`
   - **Root Directory**: `admin-panel`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free ⭐

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=8080
   BACKEND_URL=https://thrift-shop-backend.onrender.com
   ```
   ⚠️ **IMPORTANT**: Use YOUR backend URL from Step 3!

5. Click "Create Web Service"
6. **WAIT** for deployment (3-5 minutes)
7. **COPY YOUR ADMIN URL** (e.g., `https://thrift-shop-admin.onrender.com`)

### Step 5: Deploy Company 1 (5 minutes)

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `company1-vintage-treasures`
   - **Root Directory**: `thrift-shop`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free ⭐

4. Add Environment Variables:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
   NEXT_PUBLIC_API_URL=https://thrift-shop-backend.onrender.com/api
   PORT=3000
   ```
   ⚠️ **IMPORTANT**: Use YOUR backend URL from Step 3!

5. Click "Create Web Service"
6. **WAIT** for deployment (5-7 minutes - Next.js takes longer)

### Step 6: Test Everything (5 minutes)

1. **Test Backend**:
   - Visit: `https://YOUR-BACKEND.onrender.com/api/health`
   - Should see: `{"status":"OK","message":"Thrift Shop Backend is running!"}`

2. **Test Admin Panel**:
   - Visit: `https://YOUR-ADMIN.onrender.com`
   - Should see login page
   - Try logging in with: `admin@vintagetreasures.com` / `admin123`

3. **Test Company Store**:
   - Visit: `https://YOUR-COMPANY1.onrender.com`
   - Should see your thrift shop homepage
   - Browse products

### Step 7: Deploy More Companies (Optional)

For each additional company, repeat Step 5 with different values:

**Company 2:**
- Name: `company2-eco-fashion`
- NEXT_PUBLIC_COMPANY_ID: `2`
- NEXT_PUBLIC_COMPANY_NAME: `Eco Fashion Hub`

**Company 3:**
- Name: `company3-retro-style`
- NEXT_PUBLIC_COMPANY_ID: `3`
- NEXT_PUBLIC_COMPANY_NAME: `Retro Style Co`

## 🎁 BONUS: Keep Services Awake (Optional)

Free tier services sleep after 15 minutes of inactivity. First request takes 30-60 seconds to wake up.

### Solution: UptimeRobot (Free)

1. Go to: **https://uptimerobot.com**
2. Sign up (free, no credit card)
3. Click "Add New Monitor"
4. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Thrift Shop Backend
   - **URL**: Your backend URL
   - **Monitoring Interval**: 5 minutes
5. Click "Create Monitor"
6. Repeat for admin and company sites

Now your services stay awake! ✅

## 📊 Your Live URLs

After deployment, you'll have:

- **Backend API**: `https://thrift-shop-backend.onrender.com`
- **Admin Panel**: `https://thrift-shop-admin.onrender.com`
- **Company 1**: `https://company1-vintage-treasures.onrender.com`
- **Company 2**: `https://company2-eco-fashion.onrender.com` (if deployed)
- **Company 3**: `https://company3-retro-style.onrender.com` (if deployed)

All with FREE SSL certificates! 🔒

## 🆘 Troubleshooting

### Build Failed?
- Check the logs in Render dashboard
- Verify Node.js version (should be 18+)
- Check that all dependencies are in package.json

### Backend Won't Start?
- Check environment variables are set correctly
- Verify DATABASE_PATH is set
- Check logs for errors

### Admin Can't Connect to Backend?
- Verify BACKEND_URL in admin environment variables
- Make sure backend is deployed and running
- Check backend URL is correct (no trailing slash)

### Company Site Shows Errors?
- Verify NEXT_PUBLIC_API_URL is correct
- Check NEXT_PUBLIC_COMPANY_ID matches database
- Verify backend is running

### Services Keep Sleeping?
- This is normal on free tier
- Set up UptimeRobot to keep them awake
- Or upgrade to paid tier ($7/month per service)

## 💰 Cost Breakdown

### Free Tier (What You're Using):
- Backend: **$0/month** ✅
- Admin: **$0/month** ✅
- Company 1: **$0/month** ✅
- Company 2: **$0/month** ✅
- Company 3: **$0/month** ✅
- **TOTAL: $0/month** ✅

### Paid Tier (If You Upgrade Later):
- Each service: **$7/month**
- 3 services: **$21/month**
- Benefits: No sleeping, faster, more resources

## 🎉 You're Live!

Your multi-company thrift shop is now deployed and accessible worldwide!

### Next Steps:
1. Share your URLs with users
2. Set up custom domains (optional)
3. Monitor your services
4. Add more companies as needed

### Need Help?
- Check Render docs: https://render.com/docs
- Check logs in Render dashboard
- Review troubleshooting section above

**Congratulations! 🎊**
