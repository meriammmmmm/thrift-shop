# 🚀 Quick Start - GitHub Student Pack Deployment

## ⚡ 5-Minute Setup Guide

### **What You'll Get:**
- ✅ Backend API on DigitalOcean (FREE for 1 year)
- ✅ Admin Panel on DigitalOcean (FREE for 1 year)
- ✅ Unlimited company websites on Vercel (FREE forever)
- ✅ Free domain (.me) for 1 year
- ✅ Free SSL certificates

---

## 📋 Prerequisites

1. **GitHub Student Pack** - https://education.github.com/pack
2. **DigitalOcean Account** - Claim $200 credit
3. **Namecheap Account** - Get free .me domain
4. **Vercel Account** - Sign up with GitHub

---

## 🎯 Deployment Steps (30 minutes)

### **Step 1: Claim Benefits (10 min)**
```
1. Go to https://education.github.com/pack
2. Verify student status
3. Claim DigitalOcean $200 credit
4. Register free domain at nc.me
```

### **Step 2: Create DigitalOcean Server (5 min)**
```
1. Login to DigitalOcean
2. Create Droplet:
   - Ubuntu 22.04
   - Basic plan ($6/month)
   - 1GB RAM
   - Choose datacenter near you
3. Note your server IP address
```

### **Step 3: Run Deployment Script (10 min)**
```bash
# Make script executable
chmod +x deploy-student-pack.sh

# Run the script
./deploy-student-pack.sh

# Choose option 1: Setup DigitalOcean Server
# Enter your server IP when prompted
```

### **Step 4: Deploy Backend & Admin (5 min)**
```bash
# Run script again
./deploy-student-pack.sh

# Choose option 2: Deploy Backend
# Choose option 3: Deploy Admin Panel
```

### **Step 5: Deploy Company Websites (5 min)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Run deployment script
./deploy-student-pack.sh

# Choose option 4: Deploy Company Websites
# Enter your domain when prompted
```

### **Step 6: Configure DNS (5 min)**
```
Go to Namecheap → Your Domain → Advanced DNS

Add these records:
Type    Host    Value
A       api     YOUR_DIGITALOCEAN_IP
A       admin   YOUR_DIGITALOCEAN_IP
CNAME   vintage cname.vercel-dns.com
CNAME   eco     cname.vercel-dns.com
```

---

## ✅ Verify Deployment

Test these URLs (replace with your domain):

```bash
# Backend API
curl https://api.yourdomain.me/api/health

# Admin Panel
open https://admin.yourdomain.me

# Company Websites
open https://vintage.yourdomain.me
open https://eco.yourdomain.me
```

---

## 🎓 Your Free Resources

### **DigitalOcean ($200 credit)**
- Server: $6/month × 12 months = $72/year
- Remaining credit: $128 for upgrades
- Valid for: 1 year

### **Vercel (Free forever)**
- Unlimited deployments
- Automatic SSL
- Global CDN
- No credit card needed

### **Namecheap (Free domain)**
- Free .me domain for 1 year
- Free SSL certificate
- Free DNS management

---

## 💰 Cost After Free Period

### **Year 1: $0/month** 🎉
- Everything covered by student credits

### **Year 2+: ~$7/month**
- DigitalOcean: $6/month
- Domain renewal: $15/year (~$1.25/month)
- Vercel: Still FREE!

---

## 🔧 Common Commands

### **Check Status:**
```bash
# SSH to your server
ssh root@YOUR_SERVER_IP

# Check running services
pm2 status

# View logs
pm2 logs backend
pm2 logs admin
```

### **Update Code:**
```bash
# On server
cd /root/backend
git pull
npm install
pm2 restart backend

cd /root/admin-panel
git pull
npm install
npm run build
pm2 restart admin
```

### **Redeploy Vercel:**
```bash
# On local machine
cd thrift-shop
vercel --prod
```

---

## 🆘 Troubleshooting

### **Can't connect to server?**
```bash
# Check if server is running in DigitalOcean dashboard
# Try: ssh -v root@YOUR_SERVER_IP
```

### **Backend not responding?**
```bash
ssh root@YOUR_SERVER_IP
pm2 logs backend
pm2 restart backend
```

### **Domain not working?**
```bash
# Wait 24-48 hours for DNS propagation
# Check DNS: dig api.yourdomain.me
```

### **Vercel deployment failed?**
```bash
# Check environment variables
# Make sure .env.local has correct API URL
vercel logs
```

---

## 📞 Support Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Student Pack**: https://education.github.com/pack
- **This Project**: See GITHUB_STUDENT_DEPLOYMENT.md

---

## 🎉 You're Done!

Your multi-company thrift shop is now live!

**What you have:**
- ✅ Professional backend API
- ✅ Secure admin panel
- ✅ Multiple company storefronts
- ✅ SSL certificates
- ✅ Global CDN
- ✅ All for FREE (first year)!

**Next steps:**
1. Login to admin panel
2. Create your first company
3. Add products
4. Share your store URLs!

---

## 📊 Architecture Overview

```
Internet
   ↓
Namecheap DNS (FREE)
   ↓
   ├─→ api.yourdomain.me → DigitalOcean ($200 credit)
   │                        ├─ Backend (Node.js)
   │                        └─ Admin Panel (React)
   │
   └─→ vintage.yourdomain.me → Vercel (FREE)
       eco.yourdomain.me → Vercel (FREE)
       retro.yourdomain.me → Vercel (FREE)
       ... unlimited stores!
```

**Happy selling! 🛍️**
