# 🚀 Deploy to Render - Step by Step

## Step 1: Push to GitHub (if needed)

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin master
```

## Step 2: Deploy Frontend on Render

1. Go to **https://render.com** and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `meriammmmmm/thrift-shop`
4. Configure the service:

### Frontend Configuration:
```
Name: pearl-box-store
Root Directory: thrift-shop
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### Environment Variables:
```
NEXT_PUBLIC_COMPANY_ID = 1
NEXT_PUBLIC_COMPANY_NAME = Pearl Box
NEXT_PUBLIC_API_URL = https://thrift-shop-backend-production.up.railway.app/api
```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment
7. Your site will be live at: `https://pearl-box-store.onrender.com`

## Step 3: Test Your Deployment

Visit your URL and test:
- ✅ Homepage loads
- ✅ Products display
- ✅ Can add to cart
- ✅ Checkout works

## 🎉 Done!

Your frontend is now deployed on Render!

## Notes:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Backend is already on Railway, so we're using that URL
- You can deploy more company stores by repeating Step 2 with different COMPANY_ID

## Need Help?
- Check Render logs if deployment fails
- Make sure backend URL is correct
- Verify environment variables are set
