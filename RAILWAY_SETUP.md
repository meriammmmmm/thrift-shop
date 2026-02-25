# 🚂 Railway Deployment Setup

## Environment Variables to Set in Railway

### Backend Service
Go to your backend service → Variables → Add these:

```
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_PATH=./database/thrift_shop.db
ADMIN_EMAIL=admin@thriftshop.com
ADMIN_PASSWORD=admin123
```

### Frontend Service (thrift-shop)
Go to your frontend service → Variables → Add these:

```
NEXT_PUBLIC_API_URL=https://thrift-shop-backend-production.up.railway.app/api
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Pearl Box
```

**IMPORTANT**: Replace `thrift-shop-backend-production.up.railway.app` with YOUR actual backend URL from Railway!

---

## How to Find Your Backend URL

1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Settings" tab
4. Look for "Domains" section
5. Copy the URL (looks like: `https://something.up.railway.app`)
6. Use that URL + `/api` in your frontend's `NEXT_PUBLIC_API_URL`

---

## After Setting Variables

1. Railway will automatically redeploy
2. Wait 2-3 minutes
3. Your site should work!

---

## Test Your Deployment

### Test Backend:
Open: `https://YOUR-BACKEND-URL/api/health`
Should see: `{"status":"OK"}`

### Test Frontend:
Open: `https://YOUR-FRONTEND-URL`
Should load your Pearl Box store!

---

## Common Issues

**"Failed to fetch"**
- Check backend URL is correct
- Make sure backend is deployed and running
- Check backend health endpoint

**"CORS error"**
- Backend needs to allow your frontend domain
- Check backend CORS configuration

**"Theme not loading"**
- Backend might not be responding
- Check API URL is correct
- Check browser console for errors
