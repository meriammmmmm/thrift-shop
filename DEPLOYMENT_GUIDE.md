# 🚀 MULTI-COMPANY THRIFT SHOP DEPLOYMENT GUIDE

## 📋 DEPLOYMENT OVERVIEW

Your system has 3 main components:
1. **Backend API** (Node.js + SQLite)
2. **Admin Panel** (React + Express)
3. **Customer Websites** (Next.js - one per company)

## 🌐 DEPLOYMENT OPTIONS

### **Option 1: Simple VPS Deployment (Recommended for Start)**
- **Cost**: $5-20/month
- **Complexity**: Medium
- **Best for**: Small to medium businesses
- **Providers**: DigitalOcean, Linode, Vultr

### **Option 2: Cloud Platform Deployment**
- **Cost**: $10-50/month
- **Complexity**: Low
- **Best for**: Easy scaling
- **Providers**: Vercel, Netlify, Railway, Render

### **Option 3: Docker + Cloud**
- **Cost**: $20-100/month
- **Complexity**: High
- **Best for**: Professional deployment
- **Providers**: AWS, Google Cloud, Azure

---

## 🎯 OPTION 1: VPS DEPLOYMENT (RECOMMENDED)

### **Step 1: Get a VPS Server**

**Recommended Providers:**
- **DigitalOcean**: $6/month (1GB RAM, 25GB SSD)
- **Linode**: $5/month (1GB RAM, 25GB SSD)
- **Vultr**: $6/month (1GB RAM, 25GB SSD)

**Server Requirements:**
- Ubuntu 20.04 or 22.04
- 1GB RAM minimum
- 25GB storage minimum
- Node.js 18+ support

### **Step 2: Server Setup**

```bash
# Connect to your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install nginx -y

# Install SSL certificate tool
apt install certbot python3-certbot-nginx -y
```

### **Step 3: Upload Your Project**

```bash
# On your local machine, create deployment package
tar -czf thrift-shop-deploy.tar.gz backend/ admin-panel/ thrift-shop/

# Upload to server
scp thrift-shop-deploy.tar.gz root@your-server-ip:/root/

# On server, extract
cd /root
tar -xzf thrift-shop-deploy.tar.gz
```

### **Step 4: Setup Backend**

```bash
# Setup backend
cd /root/backend
npm install --production

# Create production environment
cat > .env << EOF
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-here-change-this
DATABASE_PATH=./database/thrift_shop.db
EOF

# Start backend with PM2
pm2 start server.js --name "thrift-backend"
```

### **Step 5: Setup Admin Panel**

```bash
# Setup admin panel
cd /root/admin-panel
npm install --production
npm run build

# Start admin panel with PM2
pm2 start server.js --name "thrift-admin" --env production
```

### **Step 6: Setup Company Websites**

For each company, you'll create a separate deployment:

```bash
# Company 1 (Vintage Treasures)
cd /root/thrift-shop
cp .env.company1 .env.local
npm install --production
npm run build
pm2 start "npm start" --name "company1-site" --env production

# Company 2 (Eco Fashion Hub)
cd /root/thrift-shop-company2
cp /root/thrift-shop/.env.company2 .env.local
npm install --production
npm run build
pm2 start "npm start" --name "company2-site" --env production
```

### **Step 7: Setup Nginx (Web Server)**

Create Nginx configuration:

```bash
# Create main config
cat > /etc/nginx/sites-available/thrift-shop << 'EOF'
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Company 1 Website
server {
    listen 80;
    server_name vintagetreasures.com www.vintagetreasures.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Company 2 Website
server {
    listen 80;
    server_name ecofashionhub.com www.ecofashionhub.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the configuration
ln -s /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### **Step 8: Setup SSL Certificates**

```bash
# Get SSL certificates for all domains
certbot --nginx -d api.yourdomain.com
certbot --nginx -d admin.yourdomain.com
certbot --nginx -d vintagetreasures.com -d www.vintagetreasures.com
certbot --nginx -d ecofashionhub.com -d www.ecofashionhub.com
```

### **Step 9: Setup Auto-Start**

```bash
# Save PM2 processes
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it gives you

# Enable Nginx to start on boot
systemctl enable nginx
```

---

## 🌟 OPTION 2: CLOUD PLATFORM DEPLOYMENT

### **Vercel Deployment (Easiest)**

**For Customer Websites:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Company 1
cd thrift-shop
cp .env.company1 .env.local
vercel --prod

# Deploy Company 2
cp .env.company2 .env.local
vercel --prod --name company2-thrift
```

**For Backend + Admin:**
- Use **Railway** or **Render** for Node.js backend
- Upload your code and set environment variables

### **Railway Deployment**

1. **Go to**: https://railway.app
2. **Connect GitHub**: Link your repository
3. **Deploy Backend**: 
   - Select `backend` folder
   - Set environment variables
   - Deploy
4. **Deploy Admin Panel**:
   - Select `admin-panel` folder
   - Deploy
5. **Deploy Each Company Website**:
   - Select `thrift-shop` folder
   - Set `NEXT_PUBLIC_COMPANY_ID` environment variable
   - Deploy multiple times with different company IDs

---

## 🐳 OPTION 3: DOCKER DEPLOYMENT

### **Create Docker Files**

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5001
CMD ["node", "server.js"]
```

**Admin Panel Dockerfile:**
```dockerfile
# admin-panel/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "server.js"]
```

**Customer Website Dockerfile:**
```dockerfile
# thrift-shop/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG COMPANY_ID=1
ENV NEXT_PUBLIC_COMPANY_ID=$COMPANY_ID
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    volumes:
      - ./backend/database:/app/database

  admin:
    build: ./admin-panel
    ports:
      - "8080:8080"
    depends_on:
      - backend

  company1:
    build: 
      context: ./thrift-shop
      args:
        COMPANY_ID: 1
    ports:
      - "3000:3000"
    depends_on:
      - backend

  company2:
    build: 
      context: ./thrift-shop
      args:
        COMPANY_ID: 2
    ports:
      - "3001:3000"
    depends_on:
      - backend
```

---

## 🔧 PRODUCTION CHECKLIST

### **Before Deployment:**
- [ ] Change JWT_SECRET to a strong random key
- [ ] Update API URLs in environment files
- [ ] Test all company websites locally
- [ ] Backup your database
- [ ] Set up domain names

### **After Deployment:**
- [ ] Test all websites work
- [ ] Test admin panel login
- [ ] Test user registration
- [ ] Test product management
- [ ] Test order placement
- [ ] Set up SSL certificates
- [ ] Set up backups
- [ ] Monitor server resources

### **Domain Setup:**
- `api.yourdomain.com` → Backend API
- `admin.yourdomain.com` → Admin Panel
- `vintagetreasures.com` → Company 1 Website
- `ecofashionhub.com` → Company 2 Website
- `retrostyleco.com` → Company 3 Website

---

## 💰 COST ESTIMATES

### **VPS Deployment:**
- **Server**: $5-10/month
- **Domains**: $10-15/year each
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$15-25/month

### **Cloud Platform:**
- **Vercel**: $0-20/month per site
- **Railway**: $5-20/month per service
- **Total**: ~$25-100/month

### **Enterprise (AWS/GCP):**
- **Compute**: $50-200/month
- **Database**: $20-100/month
- **CDN**: $10-50/month
- **Total**: ~$100-500/month

---

## 🚀 QUICK START RECOMMENDATION

**For beginners, I recommend:**

1. **Start with VPS** (DigitalOcean $6/month)
2. **Deploy 1-2 companies first** to test
3. **Use free domains** initially (.tk, .ml) for testing
4. **Scale up** as you get more companies

**Need help with deployment? Let me know which option you prefer and I'll provide detailed step-by-step instructions!**