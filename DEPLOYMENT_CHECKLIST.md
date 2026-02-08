# ✅ DEPLOYMENT CHECKLIST

## 🎯 QUICK DEPLOYMENT GUIDE

### **Option 1: Simple VPS (Recommended for Beginners)**
**Cost**: ~$10-20/month | **Time**: 2-3 hours | **Difficulty**: Medium

### **Option 2: Cloud Platform (Easiest)**
**Cost**: ~$25-50/month | **Time**: 1 hour | **Difficulty**: Easy

### **Option 3: Docker (Advanced)**
**Cost**: ~$20-100/month | **Time**: 4-6 hours | **Difficulty**: Hard

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Pre-Deployment Testing**
```bash
# Test your project locally first
./test-before-deploy.sh
```
**✅ All tests must pass before deployment**

### **STEP 2: Choose Your Hosting**

#### **VPS Providers (Recommended):**
- **DigitalOcean**: $6/month - [Sign up](https://digitalocean.com)
- **Linode**: $5/month - [Sign up](https://linode.com)
- **Vultr**: $6/month - [Sign up](https://vultr.com)

#### **Cloud Platforms (Easiest):**
- **Vercel**: Free tier available - [Sign up](https://vercel.com)
- **Railway**: $5/month - [Sign up](https://railway.app)
- **Render**: $7/month - [Sign up](https://render.com)

### **STEP 3: Get Domain Names**
- **Main domain**: yourdomain.com ($10-15/year)
- **Subdomains** (free with main domain):
  - `api.yourdomain.com` (Backend)
  - `admin.yourdomain.com` (Admin Panel)
  - `vintage.yourdomain.com` (Company 1)
  - `eco.yourdomain.com` (Company 2)

**Domain Providers**: Namecheap, GoDaddy, Cloudflare

### **STEP 4: Setup Production Environment**
```bash
# Configure for your domain and companies
./setup-production-env.sh
```

### **STEP 5A: VPS Deployment**
```bash
# 1. Upload files to server
scp -r . root@your-server-ip:/root/thrift-shop/

# 2. Connect to server
ssh root@your-server-ip

# 3. Install dependencies
cd /root/thrift-shop
./deploy-production.sh server

# 4. Setup applications
./deploy-production.sh setup

# 5. Configure web server
./deploy-production.sh nginx

# 6. Setup SSL certificates
./deploy-production.sh ssl
```

### **STEP 5B: Cloud Platform Deployment**

#### **Vercel (Frontend Only):**
```bash
# Deploy each company website
cd thrift-shop
vercel --prod
# Repeat for each company with different env files
```

#### **Railway (Full Stack):**
1. Connect GitHub repository
2. Deploy backend service
3. Deploy admin panel service
4. Deploy frontend services (one per company)
5. Set environment variables

### **STEP 6: DNS Configuration**
Point your domains to your server:
```
A Record: api.yourdomain.com → YOUR_SERVER_IP
A Record: admin.yourdomain.com → YOUR_SERVER_IP
A Record: vintage.yourdomain.com → YOUR_SERVER_IP
A Record: eco.yourdomain.com → YOUR_SERVER_IP
```

### **STEP 7: Test Deployment**
- [ ] Backend API: `https://api.yourdomain.com/api/health`
- [ ] Admin Panel: `https://admin.yourdomain.com`
- [ ] Company 1: `https://vintage.yourdomain.com`
- [ ] Company 2: `https://eco.yourdomain.com`

---

## 🔧 PRODUCTION CONFIGURATION

### **Environment Variables Needed:**

#### **Backend (.env):**
```env
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-key
DATABASE_PATH=./database/thrift_shop.db
```

#### **Admin Panel (.env):**
```env
NODE_ENV=production
PORT=8080
API_URL=https://api.yourdomain.com/api
```

#### **Each Company Website (.env.local):**
```env
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME="Vintage Treasures"
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## 💰 COST BREAKDOWN

### **Minimal Setup (1-3 Companies):**
- **VPS**: $6/month (DigitalOcean)
- **Domain**: $12/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$8/month

### **Professional Setup (5-10 Companies):**
- **VPS**: $12/month (2GB RAM)
- **Domains**: $60/year (5 domains)
- **CDN**: $5/month (optional)
- **Total**: ~$22/month

### **Enterprise Setup (10+ Companies):**
- **Cloud Server**: $50/month
- **Database**: $20/month
- **CDN**: $10/month
- **Monitoring**: $10/month
- **Total**: ~$90/month

---

## 🛡️ SECURITY CHECKLIST

### **Before Going Live:**
- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up firewall (UFW on Ubuntu)
- [ ] Create non-root user for applications
- [ ] Set up database backups
- [ ] Configure fail2ban (optional)
- [ ] Set up monitoring (optional)

### **Security Commands:**
```bash
# Setup firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Create app user
sudo adduser appuser
sudo usermod -aG sudo appuser
```

---

## 📊 MONITORING & MAINTENANCE

### **Essential Monitoring:**
- [ ] Server resources (CPU, RAM, Disk)
- [ ] Application uptime
- [ ] Database size
- [ ] SSL certificate expiry

### **Maintenance Tasks:**
- [ ] Weekly database backups
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] SSL certificate renewal (automatic with certbot)

### **Backup Script:**
```bash
# Run weekly
./deploy-production.sh backup
```

---

## 🆘 TROUBLESHOOTING

### **Common Issues:**

#### **"Port already in use"**
```bash
# Find and kill process
sudo lsof -i :3000
sudo kill -9 PID
```

#### **"Database locked"**
```bash
# Restart backend
pm2 restart thrift-backend
```

#### **"SSL certificate error"**
```bash
# Renew certificates
sudo certbot renew
```

#### **"Out of memory"**
```bash
# Check memory usage
free -h
# Restart services
pm2 restart all
```

---

## 🎉 SUCCESS CHECKLIST

### **Your deployment is successful when:**
- [ ] All company websites load correctly
- [ ] Admin panel login works
- [ ] Users can register on company websites
- [ ] Admins can add products
- [ ] Orders can be placed
- [ ] SSL certificates are active
- [ ] All domains resolve correctly

### **Post-Deployment:**
- [ ] Test user registration flow
- [ ] Test admin product management
- [ ] Test order placement
- [ ] Set up monitoring alerts
- [ ] Document admin credentials
- [ ] Create backup schedule

---

## 📞 NEED HELP?

If you get stuck during deployment:

1. **Check logs**: `pm2 logs` or `sudo journalctl -u nginx`
2. **Verify configuration**: Double-check domain DNS settings
3. **Test locally first**: Make sure everything works on your machine
4. **Start simple**: Deploy 1 company first, then add more

**Remember**: Start with the simplest option (VPS) and scale up as needed!

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Test locally
./test-before-deploy.sh

# 2. Setup production config
./setup-production-env.sh

# 3. Deploy to VPS
./deploy-production.sh server
./deploy-production.sh setup
./deploy-production.sh nginx
./deploy-production.sh ssl

# 4. Check status
./deploy-production.sh status
```

**Your multi-company thrift shop is ready for the world! 🌍**