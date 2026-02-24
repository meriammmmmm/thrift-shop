# 🚂 Railway.app Deployment Guide

## Why Railway?
- **Simple pricing**: $5/month includes everything
- **Easy setup**: 10-15 minutes total
- **GitHub integration**: Auto-deploy on push
- **Great for beginners**: Simpler than VPS, cheaper than multiple services

---

## 🚀 Quick Deployment (15 minutes)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repositories
4. You get $5 free credit to start!

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your thrift shop repository
4. Railway will create an empty project

### Step 3: Deploy Backend (FIRST)

1. In your project, click "New"
2. Select "GitHub Repo" → Choose your repo
3. Click "Add variables" and add:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secret-random-key-here
   DATABASE_PATH=./database/thrift_shop.db
   ```

4. Click "Settings" tab:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Watch Paths**: `backend/**`

5. Click "Deploy"

6. Once deployed, click "Settings" → "Networking"
   - Click "Generate Domain"
   - **COPY THIS URL** (e.g., `backend-production-xxxx.up.railway.app`)

### Step 4: Deploy Admin Panel

1. Click "New" → "GitHub Repo" → Same repo
2. Add variables:
   ```
   NODE_ENV=production
   PORT=8080
   REACT_APP_API_URL=https://your-backend-url.up.railway.app/api
   ```
   (Replace with YOUR backend URL from Step 3)

3. Click "Settings":
   - **Root Directory**: `admin-panel`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Watch Paths**: `admin-panel/**`

4. Click "Deploy"

5. Generate domain: Settings → Networking → Generate Domain

### Step 5: Deploy Company 1

1. Click "New" → "GitHub Repo" → Same repo
2. Add variables:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
   NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app/api
   ```

3. Click "Settings":
   - **Root Directory**: `thrift-shop`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `thrift-shop/**`

4. Click "Deploy"
5. Generate domain

### Step 6: Deploy More Companies

Repeat Step 5 for each company, changing:
- Service name: `Company 2`, `Company 3`, etc.
- `NEXT_PUBLIC_COMPANY_ID`: 2, 3, 4, etc.
- `NEXT_PUBLIC_COMPANY_NAME`: Different company names

---

## 📋 Environment Variables Reference

### Backend
```env
NODE_ENV=production
PORT=5001
JWT_SECRET=change-this-to-a-random-string-min-32-chars
DATABASE_PATH=./database/thrift_shop.db
OPENAI_API_KEY=sk-... (optional, for AI features)
```

### Admin Panel
```env
NODE_ENV=production
PORT=8080
REACT_APP_API_URL=https://your-backend.up.railway.app/api
```

### Each Company Website
```env
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

---

## 💰 Pricing

Railway uses usage-based pricing:

### Free Trial:
- $5 free credit
- Good for testing (1-2 weeks)

### Paid Plan ($5/month):
- Includes $5 usage credit
- Additional usage: $0.000231/GB-hour
- **Typical cost for 3-5 services**: $5-10/month

### What You Get:
- Unlimited deployments
- Automatic SSL certificates
- GitHub integration
- Logs and metrics
- Custom domains

---

## 🌐 Custom Domains

### Add Your Own Domain:

1. Go to service → Settings → Networking
2. Click "Custom Domain"
3. Enter your domain (e.g., `shop.yourdomain.com`)
4. Add CNAME record to your DNS:
   ```
   CNAME: shop.yourdomain.com → your-service.up.railway.app
   ```
5. Wait for DNS propagation (5-30 minutes)
6. SSL certificate is automatic!

### Recommended Domain Structure:
- `api.yourdomain.com` → Backend
- `admin.yourdomain.com` → Admin Panel
- `vintage.yourdomain.com` → Company 1
- `eco.yourdomain.com` → Company 2

---

## 📊 Monitoring & Logs

### View Logs:
1. Click on any service
2. Click "Deployments" tab
3. Click on latest deployment
4. View real-time logs

### View Metrics:
1. Click on service
2. Click "Metrics" tab
3. See CPU, Memory, Network usage

### Set Up Alerts:
1. Project Settings → Notifications
2. Add webhook or email
3. Get notified of deployment failures

---

## 🔄 Auto-Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push to GitHub
3. Railway detects changes
4. Automatically rebuilds and deploys
5. Zero downtime deployment!

### Disable Auto-Deploy:
- Service → Settings → Uncheck "Auto Deploy"

---

## 🆘 Troubleshooting

### Build Failed

**Check build logs:**
1. Click service → Deployments
2. Click failed deployment
3. Read error messages

**Common fixes:**
- Ensure `package.json` exists in root directory
- Check Node.js version compatibility
- Verify build command is correct

### Service Won't Start

**Check start logs:**
- Look for port binding errors
- Verify start command
- Check environment variables

**Common fixes:**
```bash
# Make sure your app listens on PORT from env
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0');
```

### Can't Connect to Backend

**Verify backend URL:**
1. Go to backend service
2. Settings → Networking
3. Copy the generated domain
4. Update in admin/company environment variables

**Check CORS:**
Make sure backend allows requests from your domains:
```javascript
// backend/server.js
app.use(cors({
  origin: [
    'https://your-admin.up.railway.app',
    'https://company1.up.railway.app',
    // Add all your domains
  ]
}));
```

### Database Issues

**Railway provides persistent storage:**
- Database file persists across deployments
- Located at `DATABASE_PATH` in environment

**Backup database:**
1. Use Railway CLI: `railway run bash`
2. Copy database file: `cp database/thrift_shop.db backup.db`

### Out of Memory

**Increase memory:**
1. Service → Settings
2. Scroll to "Resources"
3. Increase memory limit (costs more)

**Or optimize your app:**
- Reduce build artifacts
- Optimize images
- Use production builds

---

## 🎯 Best Practices

### 1. Use Environment Variables
Never hardcode URLs or secrets in code

### 2. Enable Health Checks
Add a health endpoint:
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

### 3. Set Up Monitoring
- Enable Railway notifications
- Monitor usage in dashboard
- Set up external monitoring (optional)

### 4. Regular Backups
```bash
# Use Railway CLI to backup database
railway run bash
tar -czf backup.tar.gz database/
# Download backup.tar.gz
```

### 5. Use Staging Environment
- Create separate Railway project for testing
- Test changes before deploying to production

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] All dependencies in package.json
- [ ] Environment variables documented
- [ ] Database initialized
- [ ] Test locally first

After deploying:
- [ ] All services running
- [ ] Backend health check works
- [ ] Admin panel loads
- [ ] Company websites load
- [ ] Test user registration
- [ ] Test product management
- [ ] Set up custom domains (optional)
- [ ] Enable monitoring

---

## 💡 Tips for Success

### Start Small:
1. Deploy backend first
2. Test backend API
3. Deploy admin panel
4. Deploy one company site
5. Test everything
6. Add more companies

### Monitor Costs:
- Check usage in Railway dashboard
- Set up billing alerts
- Optimize if costs increase

### Keep It Simple:
- Use Railway's defaults when possible
- Don't over-configure
- Let Railway handle the infrastructure

---

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

## 🎉 You're Done!

Your thrift shop is now live on Railway! 

**Your URLs:**
- Backend: `https://backend-production-xxxx.up.railway.app`
- Admin: `https://admin-production-xxxx.up.railway.app`
- Companies: `https://company1-production-xxxx.up.railway.app`

**Total time**: 15-20 minutes
**Total cost**: $5-10/month

Enjoy your deployment! 🚀
