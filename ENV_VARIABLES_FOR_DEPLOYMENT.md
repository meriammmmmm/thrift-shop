# 🔑 ENVIRONMENT VARIABLES FOR DEPLOYMENT

Copy and paste these into your deployment platform!

---

## 📦 BACKEND ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NODE_ENV=production
PORT=5001
JWT_SECRET=CHANGE-THIS-TO-A-RANDOM-STRING-NOW-abc123xyz789
DB_PATH=./database/thrift_shop.db
FRONTEND_URL=https://your-company-website.onrender.com
```

### ⚠️ IMPORTANT:
- **JWT_SECRET**: Change this to a random string! Use: https://randomkeygen.com/
- **FRONTEND_URL**: Update after deploying your company website

### Optional (AI Features):
```env
OPENAI_API_KEY=your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here
HUGGINGFACE_API_KEY=your-huggingface-key-here
```

---

## 🎨 ADMIN PANEL ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NODE_ENV=production
PORT=3005
REACT_APP_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

### ⚠️ IMPORTANT:
- **REACT_APP_API_URL**: Replace `YOUR-BACKEND-URL` with your actual backend URL from Step 2
- Must end with `/api`
- Example: `https://thrift-shop-backend.onrender.com/api`

---

## 🏪 COMPANY 1 ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

### ⚠️ IMPORTANT:
- **NEXT_PUBLIC_API_URL**: Replace `YOUR-BACKEND-URL` with your actual backend URL
- Must end with `/api`

---

## 🏪 COMPANY 2 ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NEXT_PUBLIC_COMPANY_ID=2
NEXT_PUBLIC_COMPANY_NAME=Eco Fashion Hub
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

---

## 🏪 COMPANY 3 ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NEXT_PUBLIC_COMPANY_ID=3
NEXT_PUBLIC_COMPANY_NAME=Retro Style Co
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

---

## 🏪 COMPANY 4 ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NEXT_PUBLIC_COMPANY_ID=4
NEXT_PUBLIC_COMPANY_NAME=Chic Boutique
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

---

## 🏪 COMPANY 5 ENVIRONMENT VARIABLES

### For Render.com / Railway / Any Platform:

```env
NEXT_PUBLIC_COMPANY_ID=5
NEXT_PUBLIC_COMPANY_NAME=Urban Threads
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

---

## 📋 QUICK COPY TEMPLATE

### Step-by-Step:

1. **Deploy Backend First**
   - Copy backend env variables above
   - Paste into Render/Railway
   - Change JWT_SECRET to random string
   - Deploy and copy URL

2. **Deploy Admin Panel**
   - Copy admin env variables above
   - Replace `YOUR-BACKEND-URL` with backend URL from step 1
   - Paste into Render/Railway
   - Deploy

3. **Deploy Company Websites**
   - Copy company env variables above
   - Replace `YOUR-BACKEND-URL` with backend URL from step 1
   - Change COMPANY_ID and COMPANY_NAME for each company
   - Paste into Render/Railway
   - Deploy

---

## 🔐 SECURITY TIPS

### JWT_SECRET:
- **NEVER** use the default value
- Use a random string (32+ characters)
- Generate one: https://randomkeygen.com/
- Example: `a8f5f167f44f4964e6c998dee827110c`

### API Keys:
- Only add if you need AI features
- Keep them secret
- Don't commit to GitHub
- Rotate regularly

---

## ✅ VERIFICATION

After deployment, verify:

1. **Backend Health Check**:
   ```
   https://YOUR-BACKEND-URL.onrender.com/api/health
   ```
   Should return: `{"status":"OK"}`

2. **Admin Panel**:
   ```
   https://YOUR-ADMIN-URL.onrender.com
   ```
   Should show login page

3. **Company Website**:
   ```
   https://YOUR-COMPANY-URL.onrender.com
   ```
   Should show homepage

---

## 🆘 TROUBLESHOOTING

### "Cannot connect to backend"
- Check REACT_APP_API_URL in admin
- Check NEXT_PUBLIC_API_URL in company
- Must end with `/api`
- Must be HTTPS URL

### "CORS error"
- Backend should allow all origins in production
- Check backend logs
- Verify backend is running

### "JWT error"
- Check JWT_SECRET is set
- Must be same across all deployments
- Don't use spaces or special characters

---

## 📝 SAVE YOUR CONFIGURATION

After deployment, save this:

```
BACKEND URL: https://________________________________.onrender.com
ADMIN URL:   https://________________________________.onrender.com
COMPANY 1:   https://________________________________.onrender.com
COMPANY 2:   https://________________________________.onrender.com

JWT_SECRET: ________________________________

Backend API URL (for admin/companies):
https://________________________________.onrender.com/api
```

---

## 🎉 READY TO DEPLOY!

1. Copy the environment variables above
2. Follow `DEPLOY_CHECKLIST_SIMPLE.md`
3. Paste env vars when prompted
4. Deploy and test!

**Good luck! 🚀**
