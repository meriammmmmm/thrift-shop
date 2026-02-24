# 🎓 GitHub Student Pack Deployment Guide

## 🎉 FREE/DISCOUNTED SERVICES WITH GITHUB STUDENT PACK

Your GitHub Student Pack gives you access to amazing deployment options!

---

## 🚀 RECOMMENDED DEPLOYMENT STRATEGY

### **Best Option: DigitalOcean + Namecheap + Vercel**
- **Cost**: $0-10/month (with student credits)
- **Difficulty**: Medium
- **Best for**: Professional deployment with free credits

---

## 💎 GITHUB STUDENT PACK BENEFITS

### **1. DigitalOcean - $200 Credit (1 Year)**
- **Perfect for**: Backend + Admin Panel
- **What you get**: VPS server for 1 year free
- **Claim**: https://www.digitalocean.com/github-students

### **2. Namecheap - Free Domain (1 Year)**
- **Perfect for**: Your main domain
- **What you get**: Free .me domain + SSL
- **Claim**: https://nc.me/

### **3. Vercel - Free Hosting**
- **Perfect for**: Customer websites (Next.js)
- **What you get**: Unlimited deployments
- **Already included**: No claim needed

### **4. Azure - $100 Credit**
- **Alternative**: If you prefer Microsoft cloud
- **Claim**: https://azure.microsoft.com/en-us/free/students/

### **5. Heroku - Free Credits**
- **Alternative**: Simple deployment option
- **What you get**: Hobby tier credits

---

## 🎯 DEPLOYMENT PLAN (USING STUDENT PACK)

### **Architecture:**
```
┌─────────────────────────────────────────────┐
│  DigitalOcean VPS ($200 credit - FREE)      │
│  ├── Backend API (Node.js)                  │
│  └── Admin Panel (React)                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Vercel (FREE)                              │
│  ├── Company 1 Website                      │
│  ├── Company 2 Website                      │
│  ├── Company 3 Website                      │
│  └── ... (unlimited)                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Namecheap (FREE .me domain)                │
│  └── yourdomain.me                          │
└─────────────────────────────────────────────┘
```

---

## 📝 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Claim Your Student Benefits**

1. **Get GitHub Student Pack**
   - Go to: https://education.github.com/pack
   - Verify your student status
   - Wait for approval (usually 1-3 days)

2. **Claim DigitalOcean Credit**
   - Visit: https://www.digitalocean.com/github-students
   - Sign up with GitHub
   - Get $200 credit (valid 1 year)

3. **Get Free Domain**
   - Visit: https://nc.me/
   - Register free .me domain
   - Example: `mythriftshop.me`

---

### **STEP 2: Setup DigitalOcean VPS**

#### **Create Droplet:**
```bash
# Choose these settings:
- Image: Ubuntu 22.04 LTS
- Plan: Basic ($6/month - covered by credit)
- CPU: Regular (1GB RAM, 1 vCPU)
- Datacenter: Closest to your users
- Authentication: SSH Key (recommended)
```

#### **Connect to Server:**
```bash
# Get your server IP from DigitalOcean dashboard
ssh root@YOUR_SERVER_IP
```

#### **Initial Server Setup:**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install nginx -y

# Install SSL tool
apt install certbot python3-certbot-nginx -y

# Install Git
apt install git -y
```

---

### **STEP 3: Deploy Backend & Admin to DigitalOcean**

#### **Upload Your Code:**

**Option A: Using Git (Recommended)**
```bash
# On your server
cd /root
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git thrift-shop
cd thrift-shop
```

**Option B: Using SCP**
```bash
# On your local machine
tar -czf project.tar.gz backend/ admin-panel/
scp project.tar.gz root@YOUR_SERVER_IP:/root/
# Then on server: tar -xzf project.tar.gz
```

#### **Setup Backend:**
```bash
cd /root/thrift-shop/backend
npm install --production

# Create production environment
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_123456789
DATABASE_PATH=./database/thrift_shop.db
OPENAI_API_KEY=your_openai_key_if_needed
EOF

# Start with PM2
pm2 start server.js --name backend
pm2 save
```

#### **Setup Admin Panel:**
```bash
cd /root/thrift-shop/admin-panel
npm install
npm run build

# Start with PM2
pm2 start server.js --name admin
pm2 save
```

#### **Auto-start on reboot:**
```bash
pm2 startup
# Run the command it gives you
pm2 save
```

---

### **STEP 4: Deploy Customer Websites to Vercel**

#### **Install Vercel CLI:**
```bash
# On your local machine
npm install -g vercel
vercel login
```

#### **Deploy Each Company:**

**Company 1:**
```bash
cd thrift-shop
cp .env.company1 .env.local

# Edit .env.local to point to your DigitalOcean backend
# NEXT_PUBLIC_API_URL=https://api.yourdomain.me/api

vercel --prod
# Follow prompts, name it: company1-thrift
```

**Company 2:**
```bash
cp .env.company2 .env.local
# Update API URL
vercel --prod
# Name it: company2-thrift
```

**Repeat for all companies...**

---

### **STEP 5: Configure Domain (Namecheap)**

#### **DNS Settings:**

Go to Namecheap dashboard → Manage Domain → Advanced DNS

**Add these records:**
```
Type    Host    Value                   TTL
A       @       YOUR_DIGITALOCEAN_IP    Automatic
A       api     YOUR_DIGITALOCEAN_IP    Automatic
A       admin   YOUR_DIGITALOCEAN_IP    Automatic
CNAME   www     @                       Automatic
```

**For Vercel sites:**
```
CNAME   vintage    cname.vercel-dns.com    Automatic
CNAME   eco        cname.vercel-dns.com    Automatic
CNAME   retro      cname.vercel-dns.com    Automatic
```

---

### **STEP 6: Setup Nginx on DigitalOcean**

```bash
# On your server
cat > /etc/nginx/sites-available/thrift-shop << 'EOF'
# Backend API
server {
    listen 80;
    server_name api.yourdomain.me;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.yourdomain.me;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable configuration
ln -s /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

### **STEP 7: Setup SSL Certificates (FREE)**

```bash
# Get SSL for backend
certbot --nginx -d api.yourdomain.me

# Get SSL for admin
certbot --nginx -d admin.yourdomain.me

# Auto-renewal is automatic!
```

---

### **STEP 8: Configure Vercel Custom Domains**

For each Vercel deployment:

1. Go to Vercel dashboard
2. Select your project (e.g., company1-thrift)
3. Settings → Domains
4. Add custom domain: `vintage.yourdomain.me`
5. Vercel will provide DNS instructions
6. SSL is automatic!

---

## 🔧 ENVIRONMENT CONFIGURATION

### **Update Backend URLs in All .env Files:**

**For each company's .env file:**
```env
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME="Vintage Treasures"
NEXT_PUBLIC_API_URL=https://api.yourdomain.me/api
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_CURRENCY_SYMBOL=$
```

---

## 💰 COST BREAKDOWN (WITH STUDENT PACK)

### **First Year (FREE!):**
- DigitalOcean: $0 ($200 credit covers $6/month × 12 = $72)
- Vercel: $0 (free tier)
- Domain: $0 (free .me domain)
- SSL: $0 (Let's Encrypt)
- **Total: $0/month** 🎉

### **After First Year:**
- DigitalOcean: $6/month
- Vercel: $0 (still free)
- Domain renewal: $15/year (~$1.25/month)
- **Total: ~$7-8/month**

---

## ✅ DEPLOYMENT CHECKLIST

### **Before Deployment:**
- [ ] Claimed GitHub Student Pack
- [ ] Activated DigitalOcean credit
- [ ] Registered free domain
- [ ] Tested project locally
- [ ] Updated all API URLs

### **DigitalOcean Setup:**
- [ ] Created droplet
- [ ] Installed Node.js, PM2, Nginx
- [ ] Deployed backend
- [ ] Deployed admin panel
- [ ] Configured Nginx
- [ ] Setup SSL certificates

### **Vercel Setup:**
- [ ] Deployed all company websites
- [ ] Configured custom domains
- [ ] Updated environment variables
- [ ] Verified SSL works

### **Testing:**
- [ ] Backend API responds: `https://api.yourdomain.me/api/health`
- [ ] Admin panel loads: `https://admin.yourdomain.me`
- [ ] Company sites load: `https://vintage.yourdomain.me`
- [ ] Can login to admin
- [ ] Can register users
- [ ] Can add products
- [ ] Can place orders

---

## 🚀 QUICK DEPLOYMENT COMMANDS

### **On DigitalOcean Server:**
```bash
# Clone and setup
git clone YOUR_REPO thrift-shop
cd thrift-shop

# Backend
cd backend
npm install --production
# Edit .env with your settings
pm2 start server.js --name backend

# Admin
cd ../admin-panel
npm install && npm run build
pm2 start server.js --name admin

# Save PM2 config
pm2 save
pm2 startup
```

### **On Your Local Machine:**
```bash
# Deploy to Vercel
cd thrift-shop
for i in {1..5}; do
  cp .env.company$i .env.local
  # Update API URL in .env.local
  vercel --prod
done
```

---

## 🛡️ SECURITY SETUP

```bash
# On DigitalOcean server
# Setup firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Change JWT secret
cd /root/thrift-shop/backend
nano .env
# Change JWT_SECRET to a random string
pm2 restart backend
```

---

## 📊 MONITORING

### **Check Status:**
```bash
# On server
pm2 status
pm2 logs backend
pm2 logs admin

# Check Nginx
systemctl status nginx
```

### **Vercel Monitoring:**
- Dashboard: https://vercel.com/dashboard
- View deployments, logs, and analytics

---

## 🆘 TROUBLESHOOTING

### **Backend not responding:**
```bash
pm2 logs backend
pm2 restart backend
```

### **Admin panel not loading:**
```bash
pm2 logs admin
pm2 restart admin
```

### **Domain not resolving:**
- Wait 24-48 hours for DNS propagation
- Check DNS settings in Namecheap
- Use `dig api.yourdomain.me` to verify

### **SSL certificate issues:**
```bash
certbot renew --dry-run
certbot certificates
```

---

## 🎓 STUDENT PACK TIPS

1. **Maximize Credits**: Use the $200 DigitalOcean credit for 1 year
2. **Free Domain**: Renew before expiry to keep .me domain
3. **Vercel**: Unlimited free deployments for personal projects
4. **GitHub**: Keep your repo private (free with student pack)
5. **Azure**: Use $100 credit for database if needed

---

## 📈 SCALING UP

### **When you outgrow free tier:**

1. **More Companies**: Just deploy more Vercel sites (still free!)
2. **More Traffic**: Upgrade DigitalOcean to $12/month (2GB RAM)
3. **Database**: Move to managed PostgreSQL ($15/month)
4. **CDN**: Use Cloudflare (free tier)

---

## 🎉 SUCCESS!

Your deployment is complete when:
- ✅ Backend API is live and responding
- ✅ Admin panel is accessible
- ✅ All company websites are live
- ✅ SSL certificates are active
- ✅ Users can register and login
- ✅ Products can be managed
- ✅ Orders can be placed

**You now have a professional multi-company thrift shop running for FREE! 🚀**

---

## 📞 NEED HELP?

If you get stuck:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify DNS: `dig yourdomain.me`
4. Test backend: `curl https://api.yourdomain.me/api/health`

**Happy deploying! 🎓**
