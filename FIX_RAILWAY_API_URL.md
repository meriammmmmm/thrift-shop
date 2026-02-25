# 🔧 Fix Railway API URL - Step by Step

## The Problem
Your frontend is trying to access:
```
https://merryrose.up.railway.app/thrift-shop-backend-production.up.railway.app/api
```

But it should be:
```
https://thrift-shop-backend-production.up.railway.app/api
```

---

## How to Fix (5 minutes)

### Step 1: Go to Railway Dashboard
1. Open: https://railway.app/dashboard
2. Find your **frontend project** (the one called "merryrose" or similar)
3. Click on it

### Step 2: Open Variables Tab
1. Click on the **"Variables"** tab at the top
2. You'll see a list of environment variables

### Step 3: Find NEXT_PUBLIC_API_URL
1. Look for the variable named: `NEXT_PUBLIC_API_URL`
2. Click on it to edit

### Step 4: Update the Value
**Current (WRONG):**
```
merryrose.up.railway.app/thrift-shop-backend-production.up.railway.app/api
```

**Change to (CORRECT):**
```
https://thrift-shop-backend-production.up.railway.app/api
```

### Step 5: Save and Redeploy
1. Click **"Save"** or press Enter
2. Railway will automatically redeploy your app
3. Wait 2-3 minutes for the deployment to complete

---

## Alternative: If You Can't Find the Backend URL

### Find Your Backend URL:
1. Go to Railway dashboard
2. Find your **backend service** (should be named "thrift-shop-backend" or similar)
3. Click on it
4. Look for the **"Settings"** tab
5. Find **"Domains"** section
6. Copy the URL (it will look like: `https://something.up.railway.app`)

### Then Update Frontend:
1. Go back to your **frontend service**
2. Variables tab
3. Update `NEXT_PUBLIC_API_URL` to: `https://YOUR-BACKEND-URL/api`
4. Save

---

## Quick Check After Fix

1. Open your frontend URL: https://merryrose.up.railway.app
2. Open browser console (F12)
3. Check Network tab
4. The API calls should now go to: `https://thrift-shop-backend-production.up.railway.app/api`

---

## Still Not Working?

### Option 1: Add Variable Manually
1. In Railway frontend project → Variables
2. Click **"+ New Variable"**
3. Name: `NEXT_PUBLIC_API_URL`
4. Value: `https://thrift-shop-backend-production.up.railway.app/api`
5. Click **"Add"**

### Option 2: Check Backend is Running
1. Open: https://thrift-shop-backend-production.up.railway.app/api/health
2. Should see: `{"status":"OK"}`
3. If not, your backend isn't deployed yet

---

## Summary

✅ **What to do:**
1. Go to Railway dashboard
2. Open your frontend project
3. Variables tab
4. Update `NEXT_PUBLIC_API_URL` to: `https://thrift-shop-backend-production.up.railway.app/api`
5. Save
6. Wait for redeploy

That's it! Your site should work after this.
