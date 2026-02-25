# 🚂 Railway Persistent Database Setup

## Problem
Your products added through the admin dashboard disappear when Railway restarts because the database is in-memory.

## Solution
Add a persistent volume to Railway so your database survives restarts.

---

## Steps to Add Persistent Volume on Railway:

### 1. Go to Railway Dashboard
- Visit: https://railway.app/dashboard
- Select your backend service

### 2. Add a Volume
- Click on your backend service
- Go to the **"Variables"** tab
- Scroll down and click **"+ New Volume"**

### 3. Configure Volume
- **Mount Path**: `/app/database`
- **Name**: `thrift-shop-db`
- Click **"Add"**

### 4. Redeploy
- Railway will automatically redeploy
- Your database will now persist!

---

## What This Does:

✅ **Before**: Database stored in memory → Lost on restart
✅ **After**: Database stored on persistent volume → Survives restarts

---

## Verify It's Working:

1. Add a product through admin dashboard
2. Restart your Railway service
3. Product should still be there!

---

## Alternative: Use PostgreSQL (Recommended for Production)

If you want a more robust solution:

1. In Railway dashboard, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway will create a PostgreSQL database
3. Update your backend to use PostgreSQL instead of SQLite

But for now, the volume solution will work perfectly! 🎉

