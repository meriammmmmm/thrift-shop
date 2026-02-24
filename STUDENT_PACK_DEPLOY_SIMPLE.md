# 🎓 STUDENT PACK DEPLOYMENT - SUPER SIMPLE GUIDE

## 🎉 YOU HAVE GITHUB STUDENT PACK = 2+ YEARS FREE HOSTING!

With your $200 DigitalOcean credit, you can host everything for FREE for 33+ months!

---

## 🎯 WHAT YOU'LL DO (2 HOURS TOTAL)

1. **Claim DigitalOcean credit** (10 min)
2. **Create server** (10 min)
3. **Deploy backend + admin** (40 min)
4. **Deploy company websites** (30 min)
5. **Setup domain** (20 min) - Optional
6. **Test everything** (10 min)

---

## 📋 STEP 1: CLAIM YOUR $200 CREDIT (10 minutes)

### If you haven't claimed yet:

1. Go to: **https://www.digitalocean.com/github-students**
2. Click "Sign up with GitHub"
3. Verify your student status
4. Get $200 credit (valid 1 year)

### Check your credit:
- Login to DigitalOcean
- Top right → Billing
- Should see: $200.00 credit

✅ **You're ready when you see the $200 credit!**

---

## 📋 STEP 2: CREATE YOUR SERVER (10 minutes)

### On DigitalOcean:

1. Click **"Create"** → **"Droplets"**

2. **Choose settings:**
   - **Region**: Choose closest to you
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic
   - **CPU**: Regular - $6/month (1GB RAM)
   - **Authentication**: Password (easier) or SSH Key
   - **Hostname**: thrift-shop-server

3. Click **"Create Droplet"**

4. Wait 1 minute for server to start

5. **Copy your server IP address** (looks like: 123.45.67.89)

✅ **Save this IP**: ___________________________

---

## 📋 STEP 3: SETUP YOUR SERVER (20 minutes)

### Connect to your server:

**On Mac/Linux:**
```bash
ssh root@YOUR_SERVER_IP
# Enter password when prompted
```

**On Windows:**
- Download PuTTY: https://putty.org
- Enter your server IP
- Login as: root
- Enter password

### Install everything (copy/paste these commands):

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (keeps your apps running)
npm install -g pm2

# Install Nginx (web server)
apt install nginx -y

# Install SSL tool
apt install certbot python3-certbot-nginx -y

# Install Git
apt install git -y

# Check everything installed
node --version  # Should show v18.x.x
npm --version
pm2 --version
nginx -v
```

✅ **You're ready when all commands show version numbers!**

---

## 📋 STEP 4: UPLOAD YOUR CODE (10 minutes)

### Option A: Using Git (Recommended)

**If your code is on GitHub:**
```bash
cd /root
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git thrift-shop
cd thrift-shop
```

### Option B: Upload from your computer

**On your local machine:**
```bash
# Create archive
tar -czf thrift-shop.tar.gz backend/ admin-panel/ thrift-shop/

# Upload to server
scp thrift-shop.tar.gz root@YOUR_SERVER_IP:/root/
```

**On your server:**
```bash
cd /root
tar -xzf thrift-shop.tar.gz
```

✅ **You're ready when you see backend/, admin-panel/, and thrift-shop/ folders!**

---

## 📋 STEP 5: DEPLOY BACKEND (15 minutes)

### On your server:

```bash
cd /root/backend
npm install --production

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
JWT_SECRET=student-pack-secret-key-change-this-123456789
DATABASE_PATH=./database/thrift_shop.db
EOF

# Start backend
pm2 start server.js --name backend
pm2 save

# Check it's running
pm2 status
# Should show "backend" with status "online"

# Test it works
curl http://localhost:5001/api/health
# Should show: {"status":"OK"}
```

✅ **You're ready when you see "status":"OK"!**

---

## 📋 STEP 6: DEPLOY ADMIN PANEL (15 minutes)

### On your server:

```bash
cd /root/admin-panel
npm install
npm run build

# Start admin panel
pm2 start server.js --name admin
pm2 save

# Check it's running
pm2 status
# Should show both "backend" and "admin" online

# Test it works
curl http://localhost:3005
# Should show HTML
```

✅ **You're ready when both services show "online"!**

---

## 📋 STEP 7: SETUP WEB SERVER (15 minutes)

### Configure Nginx:

```bash
# Create configuration
cat > /etc/nginx/sites-available/thrift-shop << 'EOF'
# Backend API
server {
    listen 80;
    server_name _;
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    
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

# Enable configuration
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

### Test it works:

**On your local computer, open browser:**
- Go to: `http://YOUR_SERVER_IP`
- Should see admin panel login page!
- Go to: `http://YOUR_SERVER_IP/api/health`
- Should see: `{"status":"OK"}`

✅ **You're ready when you can see the admin panel in your browser!**

---

## 📋 STEP 8: DEPLOY COMPANY WEBSITES (30 minutes)

### Option A: Deploy on Vercel (FREE - Recommended)

**On your local machine:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy Company 1
cd thrift-shop
cp .env.company1 .env.local

# Edit .env.local - change API URL
nano .env.local
# Change to: NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP/api

# Deploy
vercel --prod
# Follow prompts, name it: company1-thrift

# Deploy Company 2
cp .env.company2 .env.local
# Update API URL again
vercel --prod
# Name it: company2-thrift

# Repeat for more companies...
```

### Option B: Deploy on same server

**On your server:**

```bash
cd /root/thrift-shop
npm install
cp .env.company1 .env.local

# Edit API URL
nano .env.local
# Change to: NEXT_PUBLIC_API_URL=http://localhost:5001/api

npm run build
pm2 start "npm start" --name company1
pm2 save
```

✅ **You're ready when you can access your company website!**

---

## 📋 STEP 9: TEST EVERYTHING (10 minutes)

### Open in your browser:

1. **Backend Health Check**
   - URL: `http://YOUR_SERVER_IP/api/health`
   - Should see: `{"status":"OK"}`

2. **Admin Panel**
   - URL: `http://YOUR_SERVER_IP`
   - Should see login page
   - Login with:
     - Email: `admin@thriftshop.com`
     - Password: `admin123`

3. **Company Website**
   - If on Vercel: `https://company1-thrift.vercel.app`
   - If on server: `http://YOUR_SERVER_IP:3000`
   - Should see your thrift shop!

### Test functionality:
- [ ] Can login to admin panel
- [ ] Can see dashboard
- [ ] Can browse products on company site
- [ ] Can register new user
- [ ] Can add to cart

✅ **If everything works, YOU'RE LIVE! 🎉**

---

## 📋 STEP 10: SETUP FREE DOMAIN (Optional - 15 minutes)

### Get a FREE domain name!

**Option 1: onweb.im (Easiest - No Registration!)** ⭐
- Your domain: `yourname.onweb.im`
- Example: `mythriftshop.onweb.im`
- No signup needed!

**Option 2: cu.ma**
- Your domain: `yourname.cu.ma`
- Visit: https://cu.ma

**Option 3: Student Pack .me domain**
- Go to: https://nc.me/
- Free .me domain with Student Pack

### Setup Your Free Domain:

**Step 1: Choose Your Domain Name**
```
Example: mythriftshop.onweb.im
```

**Step 2: Update Nginx Configuration**

```bash
# On your server
nano /etc/nginx/sites-available/thrift-shop

# Change this line:
# server_name _;
# To:
server_name mythriftshop.onweb.im;

# Save and exit (Ctrl+X, Y, Enter)

# Test and restart
nginx -t
systemctl restart nginx
```

**Step 3: Get FREE SSL Certificate**

```bash
# This makes your site HTTPS!
certbot --nginx -d mythriftshop.onweb.im

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

**Step 4: Update Company Websites**

```bash
# On your local machine
cd thrift-shop
nano .env.local

# Change API URL to:
NEXT_PUBLIC_API_URL=https://mythriftshop.onweb.im/api

# Save and redeploy
vercel --prod
```

**Step 5: Test Your Domain**

Open in browser:
- Admin: `https://mythriftshop.onweb.im`
- Backend: `https://mythriftshop.onweb.im/api/health`

✅ **Now you have HTTPS and a real domain!**

**For detailed domain setup, see: `FREE_DOMAINS_GUIDE.md`**

---

## 💰 YOUR COSTS

### With Student Pack:

**First Year:**
- DigitalOcean: $0 ($200 credit covers $6/month × 12 = $72)
- Vercel: $0 (free tier)
- Domain: $0 (free .me domain)
- **Total: $0/month** 🎉

**After Credit Runs Out:**
- DigitalOcean: $6/month
- Vercel: $0 (still free)
- Domain: $15/year (~$1.25/month)
- **Total: ~$7/month**

---

## 🆘 TROUBLESHOOTING

### Backend not working:
```bash
pm2 logs backend
pm2 restart backend
```

### Admin not loading:
```bash
pm2 logs admin
pm2 restart admin
```

### Can't connect from browser:
```bash
# Check firewall
ufw status
# Should show: 80/tcp ALLOW, 443/tcp ALLOW

# Check Nginx
systemctl status nginx
nginx -t
```

### Services stopped:
```bash
pm2 status
pm2 restart all
```

### After server reboot:
```bash
# Services should auto-start, but if not:
pm2 resurrect
```

---

## ✅ SUCCESS CHECKLIST

- [ ] DigitalOcean credit claimed ($200)
- [ ] Server created and running
- [ ] Backend deployed and responding
- [ ] Admin panel deployed and accessible
- [ ] Company website(s) deployed
- [ ] Can login to admin panel
- [ ] Can browse products
- [ ] Can register users
- [ ] All services auto-start on reboot

---

## 🎉 CONGRATULATIONS!

You've successfully deployed your multi-company thrift shop using your GitHub Student Pack!

**Your live URLs:**
- Admin Panel: `http://YOUR_SERVER_IP`
- Backend API: `http://YOUR_SERVER_IP/api`
- Company Sites: Vercel URLs or `http://YOUR_SERVER_IP:3000`

**What's next:**
1. Change admin password
2. Add your products
3. Customize company settings
4. Share your website!

**You're running a professional e-commerce platform for FREE! 🚀**

---

## 📝 SAVE THIS INFO

```
Server IP: _______________________________
Admin URL: http://_______________________
Backend URL: http://_____________________/api
Company 1 URL: ___________________________
Company 2 URL: ___________________________

Admin Login:
Email: admin@thriftshop.com
Password: admin123 (CHANGE THIS!)

SSH Access:
ssh root@YOUR_SERVER_IP
```

---

## 🚀 USEFUL COMMANDS

```bash
# Check services
pm2 status

# View logs
pm2 logs backend
pm2 logs admin

# Restart services
pm2 restart all

# Check Nginx
systemctl status nginx

# View Nginx logs
tail -f /var/log/nginx/error.log

# Update code (if using Git)
cd /root/thrift-shop
git pull
pm2 restart all
```

---

**Need help? All detailed guides are in your project folder!**

**You did it! 🎓🎉**
