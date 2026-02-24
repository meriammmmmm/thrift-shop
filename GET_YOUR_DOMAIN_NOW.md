# 🎯 Get Your Website: yourcompany.com

## Super Simple: 3 Steps, 1 Hour

---

## STEP 1: Get Domain Name (10 minutes)

### What's your company name?
Let's say it's "Mery Rose Boutique"

### Choose ONE option:

#### Option A: FREE Domain ✅
1. Go to: **https://freenom.com**
2. Search: "meryrose"
3. Choose: **meryrose.tk** (FREE)
4. Register (no credit card needed)
5. **Cost: $0**

#### Option B: Professional Domain
1. Go to: **https://namecheap.com**
2. Search: "meryrose"
3. Buy: **meryrose.com** ($10/year)
4. Pay with card
5. **Cost: $10/year**

---

## STEP 2: Deploy Website (30 minutes)

### Go to Render.com:
**https://render.com**

### A. Sign Up (2 min)
- Click "Get Started"
- Sign up with GitHub
- **NO credit card needed!**

### B. Deploy Backend (5 min)
1. Click "New +" → "Web Service"
2. Connect GitHub → Your repo
3. Settings:
   - Name: `meryrose-backend`
   - Root: `backend`
   - Build: `npm install`
   - Start: `node server.js`
   - **Type: FREE** ✅
4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-random-secret-key
   DATABASE_PATH=./database/thrift_shop.db
   ```
5. Click "Create"
6. **Copy URL**: `https://meryrose-backend.onrender.com`

### C. Deploy Your Website (5 min)
1. Click "New +" → "Web Service"
2. Same repo
3. Settings:
   - Name: `meryrose`
   - Root: `thrift-shop`
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - **Type: FREE** ✅
4. Environment Variables:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Mery Rose Boutique
   NEXT_PUBLIC_API_URL=https://meryrose-backend.onrender.com/api
   ```
   (Use YOUR backend URL!)
5. Click "Create"
6. **Copy URL**: `https://meryrose.onrender.com`

### D. Deploy Admin (5 min)
1. Click "New +" → "Web Service"
2. Same repo
3. Settings:
   - Name: `meryrose-admin`
   - Root: `admin-panel`
   - Build: `npm install && npm run build`
   - Start: `node server.js`
   - **Type: FREE** ✅
4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=8080
   REACT_APP_API_URL=https://meryrose-backend.onrender.com/api
   ```
5. Click "Create"

---

## STEP 3: Connect Your Domain (20 minutes)

### On Render:
1. Go to your website service (meryrose)
2. Click "Settings"
3. Scroll to "Custom Domain"
4. Click "Add Custom Domain"
5. Enter: **meryrose.com** (or meryrose.tk)
6. Render shows DNS records - **COPY THEM**

### On Freenom/Namecheap:
1. Log in to your domain provider
2. Find "DNS Settings" or "Manage DNS"
3. Add these records:

**For Freenom (.tk):**
```
Type: CNAME
Name: www
Target: meryrose.onrender.com

Type: A
Name: @
Target: (IP from Render)
```

**For Namecheap (.com):**
```
Type: CNAME Record
Host: www
Value: meryrose.onrender.com

Type: A Record
Host: @
Value: (IP from Render)
```

4. Save
5. Wait 10-30 minutes

### Test:
- Go to: **yourcompany.com**
- Should see your website! ✅

---

## ✅ DONE!

### You Now Have:
- ✅ **yourcompany.com** - Your shop
- ✅ **HTTPS** - SSL certificate (automatic)
- ✅ **Admin panel** - Manage products
- ✅ **Backend** - Everything working

### Cost:
- **FREE domain**: $0/month
- **Paid domain**: $0.83/month ($10/year)
- **Hosting**: $0/month (Render free tier)
- **SSL**: $0/month (automatic)

---

## 🎯 QUICK REFERENCE

### Your URLs After Setup:
- **Main website**: yourcompany.com
- **Admin panel**: yourcompany-admin.onrender.com
- **Backend**: yourcompany-backend.onrender.com (hidden)

### Login to Admin:
- Go to: yourcompany-admin.onrender.com
- Use your admin credentials
- Add products, manage orders

---

## 💡 TIPS

### Keep Website Awake (Optional):
Free tier sleeps after 15 min. To keep awake:
1. Go to: **https://uptimerobot.com**
2. Sign up (free)
3. Add your website URL
4. Set ping: every 5 minutes
5. Website stays awake! ✅

### Get Professional Domain:
- .com is best for business
- .tk is fine for testing
- Can upgrade later

### Add More Features:
- Custom email: yourname@yourcompany.com
- Analytics: Google Analytics
- Marketing: Facebook Pixel

---

## 🆘 HELP

### "My domain isn't working"
- Wait 30 minutes for DNS
- Check DNS records are correct
- Try www.yourcompany.com

### "Website shows error"
- Check backend is running (green in Render)
- Verify environment variables
- Check logs in Render dashboard

### "Need to change something"
- Go to Render dashboard
- Click on service
- Update settings
- Redeploy

---

## 🚀 START NOW!

### Right Now:
1. **Pick domain name**: What's your company called?
2. **Register domain**: Freenom (free) or Namecheap ($10)
3. **Deploy on Render**: Follow Step 2
4. **Connect domain**: Follow Step 3
5. **Done**: Your website is live!

### Total Time: 1 hour
### Total Cost: $0 (or $10/year for .com)

---

## 📝 TELL ME YOUR COMPANY NAME

Just tell me:
- **Company name**: _____________
- **Domain preference**: FREE (.tk) or PAID (.com)

And I'll give you the EXACT steps with your company name! 🎯
