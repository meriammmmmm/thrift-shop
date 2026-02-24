# 🌐 FREE DOMAIN NAMES FOR YOUR PROJECT

## 🎉 Get a Real Domain Name for FREE!

Instead of using IP addresses, get a real domain like:
- `yourname.onweb.im`
- `yourname.cu.ma`
- `yourname.is-a.dev`

---

## 🚀 OPTION 1: ONWEB.IM (RECOMMENDED)

### What You Get:
- ✅ Free subdomain: `yourname.onweb.im`
- ✅ No registration required
- ✅ Instant setup
- ✅ Perfect for testing

### How to Get It:

**Step 1: Go to OnWeb.im**
- Visit: https://onweb.im
- Or just use their DNS directly (no signup needed!)

**Step 2: Configure DNS**

You don't need to register! Just point your subdomain to your server:

```bash
# On your DigitalOcean server
# Install DNS tools
apt install dnsutils -y

# Your domain will be: yourname.onweb.im
# Just use it directly!
```

**Step 3: Update Nginx**

```bash
# On your server
nano /etc/nginx/sites-available/thrift-shop

# Update server_name lines:
server_name yourname.onweb.im;  # For admin
server_name api.yourname.onweb.im;  # For backend (if supported)
```

**Step 4: Get SSL Certificate**

```bash
certbot --nginx -d yourname.onweb.im
```

### Your URLs:
- Admin: `https://yourname.onweb.im`
- Backend: `https://yourname.onweb.im/api`

---

## 🚀 OPTION 2: CU.MA

### What You Get:
- ✅ Free subdomain: `yourname.cu.ma`
- ✅ Cool domain name
- ✅ Free forever

### How to Get It:

**Step 1: Visit CU.MA**
- Go to: https://cu.ma
- Look for free subdomain registration

**Step 2: Register Your Subdomain**
- Choose: `yourname.cu.ma`
- Point to your DigitalOcean IP

**Step 3: Configure DNS**
- Add A record: `@` → `YOUR_SERVER_IP`
- Add A record: `api` → `YOUR_SERVER_IP` (if supported)

**Step 4: Update Nginx & Get SSL**

```bash
# Update Nginx
nano /etc/nginx/sites-available/thrift-shop
# Change server_name to: yourname.cu.ma

# Get SSL
certbot --nginx -d yourname.cu.ma
```

---

## 🚀 OPTION 3: IS-A.DEV (FOR DEVELOPERS)

### What You Get:
- ✅ Free subdomain: `yourname.is-a.dev`
- ✅ Professional looking
- ✅ Perfect for portfolios

### How to Get It:

**Step 1: GitHub Repository**
- Go to: https://github.com/is-a-dev/register
- Fork the repository

**Step 2: Add Your Domain**
- Create a file: `domains/yourname.json`
- Content:
```json
{
  "owner": {
    "username": "your-github-username",
    "email": "your-email@example.com"
  },
  "record": {
    "A": ["YOUR_SERVER_IP"]
  }
}
```

**Step 3: Submit Pull Request**
- Wait for approval (usually 24 hours)
- Your domain will be active!

---

## 🎯 EASIEST OPTION: USE RENDER/RAILWAY SUBDOMAINS

### If you deploy on Render.com or Railway:

**Render.com:**
- Automatic subdomain: `yourapp.onrender.com`
- Free SSL included
- No configuration needed!

**Railway.app:**
- Automatic subdomain: `yourapp.up.railway.app`
- Free SSL included
- No configuration needed!

---

## 📋 COMPLETE SETUP WITH FREE DOMAIN

### Using onweb.im (Easiest):

**Step 1: Deploy to DigitalOcean**
```bash
# Follow STUDENT_PACK_DEPLOY_SIMPLE.md
# Get your server IP
```

**Step 2: Choose Your Domain**
```
Your domain: mythriftshop.onweb.im
```

**Step 3: Update Nginx Configuration**

```bash
# On your server
cat > /etc/nginx/sites-available/thrift-shop << 'EOF'
# Admin Panel & Backend
server {
    listen 80;
    server_name mythriftshop.onweb.im;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Admin Panel
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable and restart
ln -s /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**Step 4: Get SSL Certificate**

```bash
certbot --nginx -d mythriftshop.onweb.im
```

**Step 5: Update Company Websites**

```bash
# On your local machine
cd thrift-shop
nano .env.local

# Change to:
NEXT_PUBLIC_API_URL=https://mythriftshop.onweb.im/api

# Redeploy to Vercel
vercel --prod
```

**Step 6: Test Everything**

Open in browser:
- Admin: `https://mythriftshop.onweb.im`
- Backend: `https://mythriftshop.onweb.im/api/health`
- Company: Your Vercel URL

✅ **You now have a real domain with HTTPS!**

---

## 🌟 RECOMMENDED SETUP

### Best Free Domain Strategy:

**For Backend + Admin (DigitalOcean):**
- Use: `yourname.onweb.im` or `yourname.cu.ma`
- Free, instant, works great!

**For Company Websites (Vercel):**
- Use Vercel's free subdomain: `company1.vercel.app`
- Or add custom domain later

### Your Final URLs:
```
Admin Panel:  https://mythriftshop.onweb.im
Backend API:  https://mythriftshop.onweb.im/api
Company 1:    https://company1-vintage.vercel.app
Company 2:    https://company2-eco.vercel.app
```

---

## 💡 TIPS FOR FREE DOMAINS

### 1. Choose a Good Name
- Keep it short and memorable
- Use your business name
- Examples:
  - `vintageshop.onweb.im`
  - `thriftstore.cu.ma`
  - `ecofashion.onweb.im`

### 2. Test Before SSL
- First test with HTTP
- Make sure everything works
- Then add SSL certificate

### 3. Update All Environment Variables
- Backend .env: Update FRONTEND_URL
- Admin .env: Update API URL
- Company .env: Update API URL

### 4. Keep Your IP Handy
- Save your DigitalOcean IP
- You'll need it for DNS configuration
- Write it down somewhere safe

---

## 🔧 TROUBLESHOOTING

### Domain Not Working?

**Check DNS:**
```bash
# On your computer
nslookup yourname.onweb.im
# Should show your server IP
```

**Check Nginx:**
```bash
# On your server
nginx -t
systemctl status nginx
```

**Check Firewall:**
```bash
ufw status
# Should show: 80/tcp ALLOW, 443/tcp ALLOW
```

### SSL Certificate Failed?

**Make sure:**
- Domain points to your IP
- Nginx is running
- Port 80 and 443 are open
- Domain has propagated (wait 5-10 minutes)

**Try again:**
```bash
certbot --nginx -d yourname.onweb.im
```

---

## 📝 COMPLETE EXAMPLE

### Let's say you choose: `mythriftshop.onweb.im`

**1. Deploy Backend & Admin to DigitalOcean**
```bash
# Follow STUDENT_PACK_DEPLOY_SIMPLE.md
# Server IP: 123.45.67.89
```

**2. Configure Nginx with Domain**
```bash
# Update server_name to: mythriftshop.onweb.im
nano /etc/nginx/sites-available/thrift-shop
nginx -t
systemctl restart nginx
```

**3. Get SSL Certificate**
```bash
certbot --nginx -d mythriftshop.onweb.im
```

**4. Update Company Websites**
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://mythriftshop.onweb.im/api
```

**5. Deploy to Vercel**
```bash
vercel --prod
```

**6. Test Everything**
- ✅ Admin: https://mythriftshop.onweb.im
- ✅ Backend: https://mythriftshop.onweb.im/api/health
- ✅ Company: https://company1.vercel.app

---

## 🎉 SUCCESS!

You now have:
- ✅ Real domain name (FREE)
- ✅ HTTPS/SSL certificate (FREE)
- ✅ Professional URLs
- ✅ Ready for customers!

---

## 💰 TOTAL COST

With Student Pack + Free Domain:
- DigitalOcean: $0 (Student Pack credit)
- Domain: $0 (onweb.im or cu.ma)
- Vercel: $0 (free tier)
- SSL: $0 (Let's Encrypt)

**Total: $0/month** 🎉

---

## 🚀 QUICK COMMANDS REFERENCE

```bash
# Update Nginx with domain
nano /etc/nginx/sites-available/thrift-shop

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d yourname.onweb.im

# Check DNS
nslookup yourname.onweb.im

# Check SSL expiry
certbot certificates

# Renew SSL (automatic, but manual command)
certbot renew
```

---

## 📋 CHECKLIST

- [ ] Choose domain name (yourname.onweb.im or yourname.cu.ma)
- [ ] Deploy backend & admin to DigitalOcean
- [ ] Update Nginx configuration with domain
- [ ] Test HTTP works first
- [ ] Get SSL certificate with certbot
- [ ] Update company website environment variables
- [ ] Redeploy company websites to Vercel
- [ ] Test all URLs with HTTPS
- [ ] Save all URLs somewhere safe

---

## 🎓 NEXT STEPS

1. **Choose your domain**: `yourname.onweb.im` (easiest!)
2. **Follow**: `STUDENT_PACK_DEPLOY_SIMPLE.md`
3. **Add domain**: Use this guide when you reach Step 10
4. **Get SSL**: Run certbot command
5. **Update URLs**: Change API URLs in company websites
6. **Test**: Verify everything works with HTTPS

---

**You're ready to deploy with a real domain name! 🚀**
