# 🚀 Deploy Your Thrift Shop WITHOUT Vercel

## Quick Overview

You have 3 components to deploy:
1. **Backend** (Node.js API) - Port 5001
2. **Admin Panel** (React app) - Port 8080  
3. **Customer Websites** (Next.js) - One per company (ports 3000, 3001, etc.)

---

## 🎯 BEST OPTIONS (No Vercel)

### Option 1: Render.com (EASIEST - Recommended)
- Free tier available
- Automatic deployments
- Built-in SSL
- No credit card needed for free tier

### Option 2: Railway.app (SIMPLE)
- $5/month (includes everything)
- GitHub integration
- Easy environment variables
- Great for beginners

### Option 3: DigitalOcean App Platform (MEDIUM)
- $5/month per component
- Professional setup
- Good documentation

### Option 4: Traditional VPS (CHEAPEST)
- $5-6/month total
- Full control
- Requires more setup

---

## 🌟 OPTION 1: RENDER.COM (RECOMMENDED)

### Why Render?
- Free tier for testing
- Easy to use
- Automatic SSL certificates
- No credit card required initially

### Step-by-Step Deployment:

#### 1. Create Render Account
Go to https://render.com and sign up (free)

#### 2. Deploy Backend API

1. Click "New +" → "Web Service"
2. Connect your GitHub repository (or upload code)
3. Configure:
   - **Name**: `thrift-shop-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or $7/month for always-on)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secret-key-change-this
   DATABASE_PATH=./database/thrift_shop.db
   ```

5. Click "Create Web Service"
6. Copy your backend URL (e.g., `https://thrift-shop-backend.onrender.com`)

#### 3. Deploy Admin Panel

1. Click "New +" → "Web Service"
2. Configure:
   - **Name**: `thrift-shop-admin`
   - **Root Directory**: `admin-panel`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or $7/month)

3. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=8080
   REACT_APP_API_URL=https://thrift-shop-backend.onrender.com/api
   ```

4. Click "Create Web Service"
5. Copy your admin URL (e.g., `https://thrift-shop-admin.onrender.com`)

#### 4. Deploy Company Websites

For EACH company, repeat these steps:

1. Click "New +" → "Web Service"
2. Configure:
   - **Name**: `company1-vintage-treasures` (change per company)
   - **Root Directory**: `thrift-shop`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or $7/month)

3. Add Environment Variables (change per company):
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
   NEXT_PUBLIC_API_URL=https://thrift-shop-backend.onrender.com/api
   ```

4. Click "Create Web Service"
5. Repeat for Company 2, 3, 4, etc. (just change COMPANY_ID and NAME)

#### 5. Test Your Deployment

- Backend: `https://thrift-shop-backend.onrender.com/api/health`
- Admin: `https://thrift-shop-admin.onrender.com`
- Company 1: `https://company1-vintage-treasures.onrender.com`

### Render Costs:
- **Free Tier**: All services (spins down after 15 min inactivity)
- **Paid**: $7/month per service (always on)
- **Total for 3 companies**: Free or ~$35/month paid

---

## 🚂 OPTION 2: RAILWAY.APP

### Why Railway?
- Simple pricing: $5/month includes everything
- GitHub integration
- Easy environment management

### Step-by-Step:

#### 1. Create Railway Account
Go to https://railway.app and sign up

#### 2. Create New Project
Click "New Project" → "Deploy from GitHub repo"

#### 3. Deploy Backend
1. Select your repository
2. Click "Add Service" → "Backend"
3. Set root directory: `backend`
4. Add environment variables:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-secret-key
   ```
5. Railway will auto-deploy

#### 4. Deploy Admin Panel
1. Click "Add Service" → "Admin Panel"
2. Set root directory: `admin-panel`
3. Add build command: `npm run build`
4. Add environment variables:
   ```
   NODE_ENV=production
   REACT_APP_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
   ```

#### 5. Deploy Company Websites
1. For each company, click "Add Service"
2. Set root directory: `thrift-shop`
3. Add environment variables (change per company):
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
   ```

### Railway Costs:
- **$5/month** includes all services
- **$0.000231/GB-hour** for usage
- **Total**: ~$5-10/month for everything

---

## 💧 OPTION 3: DIGITALOCEAN APP PLATFORM

### Why DigitalOcean?
- Professional platform
- Good documentation
- Predictable pricing

### Step-by-Step:

#### 1. Create DigitalOcean Account
Go to https://www.digitalocean.com/products/app-platform

#### 2. Create New App
1. Click "Create App"
2. Connect GitHub repository
3. Select your repo

#### 3. Configure Components

**Backend:**
- Type: Web Service
- Source Directory: `backend`
- Build Command: `npm install`
- Run Command: `node server.js`
- HTTP Port: 5001
- Environment Variables: (add JWT_SECRET, etc.)

**Admin Panel:**
- Type: Web Service
- Source Directory: `admin-panel`
- Build Command: `npm install && npm run build`
- Run Command: `node server.js`
- HTTP Port: 8080

**Company Websites:**
- Type: Web Service (one per company)
- Source Directory: `thrift-shop`
- Build Command: `npm install && npm run build`
- Run Command: `npm start`
- HTTP Port: 3000
- Environment Variables: (COMPANY_ID, etc.)

#### 4. Deploy
Click "Create Resources" and wait for deployment

### DigitalOcean Costs:
- **$5/month** per component
- **Total for 5 components**: $25/month
- **Includes**: SSL, CDN, automatic deployments

---

## 🖥️ OPTION 4: VPS (CHEAPEST BUT MORE WORK)

### Why VPS?
- Cheapest option ($5-6/month total)
- Full control
- All services on one server

### Quick Setup:

#### 1. Get a VPS
- **DigitalOcean Droplet**: $6/month
- **Linode Nanode**: $5/month
- **Vultr**: $6/month

Choose: Ubuntu 22.04, 1GB RAM

#### 2. Connect to Server
```bash
ssh root@YOUR_SERVER_IP
```

#### 3. Install Requirements
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install -y nginx

# Install Certbot (SSL certificates)
apt install -y certbot python3-certbot-nginx
```

#### 4. Upload Your Code
```bash
# On your local machine
tar -czf thrift-shop.tar.gz backend/ admin-panel/ thrift-shop/
scp thrift-shop.tar.gz root@YOUR_SERVER_IP:/root/

# On server
cd /root
tar -xzf thrift-shop.tar.gz
```

#### 5. Setup Backend
```bash
cd /root/backend
npm install --production

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5001
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./database/thrift_shop.db
EOF

# Start with PM2
pm2 start server.js --name backend
```

#### 6. Setup Admin Panel
```bash
cd /root/admin-panel
npm install
npm run build
pm2 start server.js --name admin
```

#### 7. Setup Company Websites
```bash
# Company 1
cd /root/thrift-shop
cp .env.company1 .env.local
npm install
npm run build
pm2 start npm --name "company1" -- start

# For additional companies, copy the thrift-shop folder
# and repeat with different .env files
```

#### 8. Configure Nginx
```bash
cat > /etc/nginx/sites-available/thrift-shop << 'EOF'
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# Company 1
server {
    listen 80;
    server_name company1.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 9. Setup SSL Certificates
```bash
certbot --nginx -d api.yourdomain.com
certbot --nginx -d admin.yourdomain.com
certbot --nginx -d company1.yourdomain.com
```

#### 10. Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

### VPS Costs:
- **Server**: $5-6/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$6-7/month

---

## 📊 COST COMPARISON

| Option | Monthly Cost | Setup Time | Difficulty |
|--------|-------------|------------|------------|
| Render (Free) | $0 | 30 min | Easy |
| Render (Paid) | $35-50 | 30 min | Easy |
| Railway | $5-10 | 20 min | Easy |
| DigitalOcean App | $25-30 | 45 min | Medium |
| VPS | $6 | 2-3 hours | Hard |

---

## 🎯 MY RECOMMENDATION

### For Beginners:
**Use Render.com (Free tier)**
- Start with free tier to test
- Upgrade to paid ($7/service) when ready
- Easiest to set up and manage

### For Budget-Conscious:
**Use Railway.app**
- $5/month for everything
- Simple and reliable
- Good balance of cost and ease

### For Maximum Control:
**Use VPS (DigitalOcean/Linode)**
- Cheapest long-term
- Full control
- Requires technical knowledge

---

## 🚀 QUICK START GUIDE

### I recommend starting with Render.com:

1. **Sign up**: https://render.com (free, no credit card)
2. **Deploy backend** (5 minutes)
3. **Deploy admin** (5 minutes)
4. **Deploy company 1** (5 minutes)
5. **Test everything** (10 minutes)
6. **Deploy more companies** as needed

Total time: 30 minutes for basic setup!

---

## 📝 ENVIRONMENT VARIABLES REFERENCE

### Backend (.env):
```env
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-key-change-this-now
DATABASE_PATH=./database/thrift_shop.db
OPENAI_API_KEY=your-openai-key-if-using-ai
```

### Admin Panel:
```env
NODE_ENV=production
PORT=8080
REACT_APP_API_URL=https://your-backend-url.com/api
```

### Each Company Website:
```env
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

---

## ✅ DEPLOYMENT CHECKLIST

Before deploying:
- [ ] Test locally: `npm run dev` in each folder
- [ ] Update JWT_SECRET to a strong random key
- [ ] Have your company information ready
- [ ] Choose your deployment platform

After deploying:
- [ ] Test backend API endpoint
- [ ] Test admin panel login
- [ ] Test company website loads
- [ ] Test user registration
- [ ] Test product management

---

## 🆘 TROUBLESHOOTING

### "Build failed"
- Check Node.js version (needs 18+)
- Run `npm install` locally first
- Check for TypeScript errors

### "Database not found"
- Make sure database folder exists in backend
- Check DATABASE_PATH in environment variables

### "API connection failed"
- Verify backend URL in environment variables
- Check CORS settings in backend
- Ensure backend is running

### "Port already in use"
- Change PORT in environment variables
- Or stop conflicting service

---

## 🎉 READY TO DEPLOY?

Choose your platform and follow the steps above. I recommend:

1. **Start with Render.com** (easiest)
2. **Deploy backend first** (other services depend on it)
3. **Test each component** before moving to next
4. **Deploy one company** first, then add more

Need help with any specific step? Let me know!
