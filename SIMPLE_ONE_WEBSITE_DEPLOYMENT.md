# 🎯 Deploy ONE Website with Your Domain Name

## Simple Plan: yourcompany.com

You just want ONE website with your company name. Here's the simplest way:

---

## 🚀 SUPER SIMPLE PLAN (1 Hour Total)

### What You'll Get:
- ✅ Your website at: **yourcompany.com**
- ✅ Backend API (hidden, automatic)
- ✅ Admin panel at: **yourcompany.com/admin**
- ✅ SSL certificate (https://)
- ✅ 100% FREE (or very cheap)

---

## 📋 STEP 1: Get a Domain Name (10 minutes)

### Option A: FREE Domain (.tk, .ml, .ga)
**Provider**: Freenom.com
- Go to: https://freenom.com
- Search: "yourcompany"
- Choose: .tk, .ml, .ga, .cf, or .gq
- Register: FREE for 12 months
- **Cost**: $0 ✅

### Option B: Cheap Domain (.com, .net)
**Provider**: Namecheap.com or Hostinger.com
- Go to: https://namecheap.com
- Search: "yourcompany.com"
- Buy: Usually $8-12/year
- **Cost**: ~$10/year

### Option C: Student Pack (FREE .me domain)
If you have GitHub Student Pack:
- Go to: https://nc.me
- Get FREE .me domain
- Example: yourcompany.me
- **Cost**: $0 ✅

---

## 📋 STEP 2: Deploy Your Website (30 minutes)

### Use Render.com (FREE, works in Tunisia)

**A. Deploy Backend** (5 min)
1. Go to: https://render.com
2. Sign up with GitHub (free, no credit card)
3. Click "New +" → "Web Service"
4. Connect GitHub → Select your repo
5. Configure:
   ```
   Name: yourcompany-backend
   Root Directory: backend
   Build Command: npm install
   Start Command: node server.js
   Instance Type: FREE
   ```
6. Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=change-this-to-random-string
   DATABASE_PATH=./database/thrift_shop.db
   ```
7. Click "Create Web Service"
8. **COPY URL**: `https://yourcompany-backend.onrender.com`

**B. Deploy Your Website** (5 min)
1. Click "New +" → "Web Service"
2. Same repo
3. Configure:
   ```
   Name: yourcompany
   Root Directory: thrift-shop
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: FREE
   ```
4. Environment Variables:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Your Company Name
   NEXT_PUBLIC_API_URL=https://yourcompany-backend.onrender.com/api
   ```
5. Click "Create Web Service"
6. **COPY URL**: `https://yourcompany.onrender.com`

**C. Deploy Admin Panel** (5 min)
1. Click "New +" → "Web Service"
2. Same repo
3. Configure:
   ```
   Name: yourcompany-admin
   Root Directory: admin-panel
   Build Command: npm install && npm run build
   Start Command: node server.js
   Instance Type: FREE
   ```
4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=8080
   REACT_APP_API_URL=https://yourcompany-backend.onrender.com/api
   ```
5. Click "Create Web Service"
6. **COPY URL**: `https://yourcompany-admin.onrender.com`

---

## 📋 STEP 3: Connect Your Domain (20 minutes)

### On Render.com:

**For Your Main Website:**
1. Go to your website service (yourcompany)
2. Click "Settings" → "Custom Domain"
3. Click "Add Custom Domain"
4. Enter: **yourcompany.com** (or whatever you bought)
5. Render will show you DNS records to add

### On Your Domain Provider (Namecheap/Freenom):

1. Log in to your domain provider
2. Go to DNS settings
3. Add these records:
   ```
   Type: CNAME
   Name: www
   Value: yourcompany.onrender.com
   
   Type: A
   Name: @
   Value: (IP address from Render)
   ```
4. Save changes
5. Wait 5-30 minutes for DNS to update

### Done! Your website is now at:
- **yourcompany.com** ✅
- **www.yourcompany.com** ✅

### Admin panel at:
- **yourcompany-admin.onrender.com** (or add custom domain too)

---

## 💰 TOTAL COST

### Option 1: 100% FREE
- Domain: FREE (.tk from Freenom)
- Hosting: FREE (Render.com)
- SSL: FREE (automatic)
- **Total: $0/month** ✅

### Option 2: Professional
- Domain: $10/year (.com from Namecheap)
- Hosting: FREE (Render.com)
- SSL: FREE (automatic)
- **Total: $0.83/month** ✅

---

## 🎯 QUICK START CHECKLIST

### Step 1: Domain (10 min)
- [ ] Go to Freenom.com (free) or Namecheap.com ($10/year)
- [ ] Search for your company name
- [ ] Register domain
- [ ] Write down your domain name

### Step 2: Deploy (30 min)
- [ ] Go to https://render.com
- [ ] Sign up with GitHub (free)
- [ ] Deploy backend (5 min)
- [ ] Deploy website (5 min)
- [ ] Deploy admin (5 min)
- [ ] Copy all URLs

### Step 3: Connect Domain (20 min)
- [ ] Add custom domain in Render
- [ ] Update DNS records in domain provider
- [ ] Wait for DNS to propagate
- [ ] Test: yourcompany.com ✅

---

## 📝 EXAMPLE

Let's say your company is "Mery Rose Boutique":

### Step 1: Get Domain
- Go to Freenom.com
- Search: "meryrose"
- Register: **meryrose.tk** (FREE)

### Step 2: Deploy on Render
- Backend: `meryrose-backend.onrender.com`
- Website: `meryrose.onrender.com`
- Admin: `meryrose-admin.onrender.com`

### Step 3: Connect Domain
- Add custom domain: **meryrose.tk**
- Update DNS records
- Wait 10-20 minutes

### Result:
- Your shop: **meryrose.tk** ✅
- Admin panel: **meryrose-admin.onrender.com** ✅
- **Cost: $0** ✅

---

## 🆘 TROUBLESHOOTING

### "Domain not working yet"
- DNS takes 5-30 minutes to update
- Sometimes up to 24 hours
- Be patient!

### "SSL certificate error"
- Render automatically creates SSL
- Takes 5-10 minutes after DNS is set
- Refresh and wait

### "Website shows error"
- Check backend is running
- Verify environment variables
- Check logs in Render dashboard

---

## 🎉 YOU'RE DONE!

After 1 hour, you'll have:
- ✅ Your website at **yourcompany.com**
- ✅ Professional look with SSL (https://)
- ✅ Admin panel to manage products
- ✅ Everything working!

**Cost**: $0 (free domain) or $10/year (.com domain)

---

## 🚀 START NOW

1. **Choose domain**: Freenom (free) or Namecheap ($10/year)
2. **Register**: yourcompany.com or yourcompany.tk
3. **Deploy**: Follow Step 2 above
4. **Connect**: Follow Step 3 above
5. **Done**: Your website is live!

---

## 💡 RECOMMENDED DOMAINS

### FREE Options:
- yourcompany.tk
- yourcompany.ml
- yourcompany.ga
- yourcompany.cf

### Paid Options ($10/year):
- yourcompany.com (best!)
- yourcompany.net
- yourcompany.shop
- yourcompany.store

### Student Pack (FREE):
- yourcompany.me (from Namecheap in Student Pack)

---

## 📞 NEED HELP?

Just tell me:
1. What's your company name?
2. Do you want free domain (.tk) or paid (.com)?
3. I'll give you exact steps!

**Let's get your website online! 🚀**
