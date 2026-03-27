# 🚀 Fix Your Render Deployment - 3 Steps

## The Problem
Render can't find your Dockerfile because it's looking in the wrong directory.

## The Solution

### 1️⃣ In Render Dashboard - Settings

Go to your backend service → Settings → Build & Deploy:

```
Root Directory: backend
```

Click "Save Changes"

### 2️⃣ Create PostgreSQL Database

1. New + → PostgreSQL
2. Name: `thrift-shop-db`
3. Plan: Free
4. Create Database
5. **Copy the Internal Database URL**

### 3️⃣ Add Environment Variables

In your backend service → Environment:

```bash
DATABASE_URL=<paste Internal Database URL>
NODE_ENV=production
PORT=5001
JWT_SECRET=<generate random string>
ADMIN_EMAIL=admin@thriftshop.com
ADMIN_PASSWORD=<your secure password>
FRONTEND_URL=https://your-frontend.vercel.app
```

### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 4️⃣ Deploy

Click "Manual Deploy" → "Deploy latest commit"

## 5️⃣ After First Deploy (One-Time Setup)

Visit these URLs once:
1. `https://your-backend.onrender.com/api/fix-sequences`
2. `https://your-backend.onrender.com/api/fix-boolean-columns`

## ✅ Test It

Visit: `https://your-backend.onrender.com/api/health`

Should return:
```json
{"status": "OK", "message": "Thrift Shop Backend is running!"}
```

## 📝 Notes

- Free tier sleeps after 15 min inactivity
- First request after sleep takes ~30 seconds
- Database expires after 90 days on free tier

---

**Full guide:** See `backend/RENDER_DEPLOY.md`
