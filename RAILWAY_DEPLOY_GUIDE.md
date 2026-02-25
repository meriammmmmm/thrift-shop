# 🚂 Railway Deployment Guide - Complete Setup

## 🎯 Why Railway?
- ✅ Easiest deployment platform
- ✅ Auto-detects everything
- ✅ $5 free credit monthly
- ✅ No sleep issues (unlike Render free tier)
- ✅ Better performance

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Sign Up (2 minutes)

1. Go to: https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repositories
4. You get $5 free credit monthly (no credit card needed initially)

### Step 2: Deploy Backend API (5 minutes)

1. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will scan and detect all services

2. **Configure Backend Service**
   - Railway should auto-detect the `backend` folder
   - If not, click "Add Service" → "GitHub Repo" → Select `backend` folder
   
3. **Add Environment Variables**
   - Click on the backend service
   - Go to "Variables" tab
   - Add these variables:
   ```
   PORT=5001
   JWT_SECRET=your-super-secret-jwt-key-change-this-now
   DB_PATH=./database/thrift_shop.db
   FRONTEND_URL=https://your-frontend-url.railway.app
   ADMIN_EMAIL=admin@thriftshop.com
   ADMIN_PASSWORD=admin123
   OPENAI_API_KEY=your-openai-key-here
   GEMINI_API_KEY=AIzaSyBOu6JrIypefqgJejh3PZ5vaUVtpYjg_Lw
   HUGGINGFACE_API_KEY=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
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=Thrift Shop <your-email@gmail.com>
   ```

4. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Copy your backend URL (e.g., `https://backend-production-xxxx.up.railway.app`)
   - Save this URL - you'll need it for other services!

5. **Deploy**
   - Railway automatically deploys
   - Wait 2-3 minutes for build to complete
   - Check logs to ensure it's running

### Step 3: Deploy Admin Panel (5 minutes)

1. **Add Admin Service**
   - In your project, click "New Service"
   - Select "GitHub Repo"
   - Choose your repository
   - Set root directory to `admin-panel`

2. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=3005
   REACT_APP_API_URL=https://YOUR-BACKEND-URL.railway.app/api
   ```
   ⚠️ Replace `YOUR-BACKEND-URL` with the URL from Step 2!

3. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Copy your admin URL (e.g., `https://admin-production-xxxx.up.railway.app`)

4. **Deploy**
   - Railway automatically deploys
   - Wait 2-3 minutes

### Step 4: Deploy Company Website (5 minutes)

1. **Add Thrift Shop Service**
   - Click "New Service"
   - Select "GitHub Repo"
   - Choose your repository
   - Set root directory to `thrift-shop`

2. **Add Environment Variables**
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Pearl Box
   NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.railway.app/api
   ```
   ⚠️ Replace `YOUR-BACKEND-URL` with the URL from Step 2!

3. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Copy your website URL

4. **Deploy**
   - Railway automatically deploys
   - Wait 2-3 minutes

### Step 5: Update Backend CORS (Important!)

1. Go back to your backend service
2. Add/update the `FRONTEND_URL` variable with your actual frontend URLs:
   ```
   FRONTEND_URL=https://your-thrift-shop-url.railway.app,https://your-admin-url.railway.app
   ```

3. Railway will automatically redeploy

---

## ✅ VERIFY DEPLOYMENT

### Test Backend:
```bash
curl https://YOUR-BACKEND-URL.railway.app/api/health
```
Should return: `{"status":"OK"}`

### Test Admin Panel:
1. Open: `https://YOUR-ADMIN-URL.railway.app`
2. Try logging in with:
   - Email: `admin@thriftshop.com`
   - Password: `admin123`

### Test Company Website:
1. Open: `https://YOUR-THRIFT-SHOP-URL.railway.app`
2. Browse products
3. Try adding items to cart

---

## 🔄 AUTOMATIC DEPLOYMENTS

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin master

# Railway automatically detects and deploys! 🎉
```

---

## 💰 PRICING

### Free Tier:
- $5 credit per month
- Enough for testing and small projects
- No credit card required initially

### Paid Plans:
- Pay only for what you use
- Typically $5-10/month for all 3 services
- Much cheaper than Render ($35/month)

### Cost Breakdown:
- Backend: ~$2-3/month
- Admin Panel: ~$2-3/month
- Thrift Shop: ~$2-4/month
- **Total: ~$6-10/month**

---

## 🚀 DEPLOY MULTIPLE COMPANY WEBSITES

Want to deploy more company storefronts? Easy!

1. **Add New Service**
   - Click "New Service" in your Railway project
   - Select your GitHub repo
   - Set root directory to `thrift-shop`

2. **Configure for Different Company**
   ```
   NEXT_PUBLIC_COMPANY_ID=2
   NEXT_PUBLIC_COMPANY_NAME=Eco Fashion Hub
   NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.railway.app/api
   ```

3. **Generate Domain**
   - Each company gets its own URL
   - Or connect custom domains!

4. **Repeat for Companies 3, 4, 5...**

---

## 🌐 CUSTOM DOMAINS (Optional)

### Add Your Own Domain:

1. **In Railway Service Settings**
   - Go to service → "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter your domain (e.g., `shop.yourdomain.com`)

2. **Update DNS Records**
   - Add CNAME record in your domain provider:
   ```
   CNAME shop.yourdomain.com → your-service.railway.app
   ```

3. **SSL Certificate**
   - Railway automatically provisions SSL
   - Takes 5-10 minutes

### Recommended Domain Setup:
- `api.yourdomain.com` → Backend
- `admin.yourdomain.com` → Admin Panel
- `shop1.yourdomain.com` → Company 1
- `shop2.yourdomain.com` → Company 2
- etc.

---

## 🔧 TROUBLESHOOTING

### Build Failed?
- Check logs in Railway dashboard
- Verify `package.json` has correct scripts
- Ensure Node.js version is 18+

### Can't Connect to Backend?
- Verify backend is running (check logs)
- Check environment variables have correct backend URL
- Ensure URL ends with `/api`

### Database Issues?
- Railway provides persistent storage
- Database is created automatically on first run
- Check logs for any SQLite errors

### Environment Variables Not Working?
- Make sure to click "Save" after adding variables
- Railway redeploys automatically after variable changes
- Check variable names match exactly (case-sensitive)

---

## 📊 MONITORING

### View Logs:
1. Click on any service
2. Go to "Deployments" tab
3. Click on latest deployment
4. View real-time logs

### Check Metrics:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 🎉 YOU'RE LIVE!

Your multi-company thrift shop is now deployed on Railway!

### Your URLs:
- Backend API: `https://backend-production-xxxx.up.railway.app`
- Admin Panel: `https://admin-production-xxxx.up.railway.app`
- Company Website: `https://thrift-shop-production-xxxx.up.railway.app`

### Next Steps:
1. Test all functionality
2. Add custom domains (optional)
3. Deploy additional company websites
4. Monitor usage and costs
5. Set up automatic backups

---

## 🆘 NEED HELP?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check deployment logs in Railway dashboard

**Happy deploying! 🚂**
