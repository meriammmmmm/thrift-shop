# Mery Rose (meryrose.me) Configuration Guide

## ✅ Configuration Complete

Your frontend and backend are now configured to work together:

### Frontend: meryrose.me
- **Domain**: meryrose.me
- **Backend API**: https://thrift-shop-backend-production-9cad.up.railway.app/api
- **Company**: Mery Rose (ID: 2)

### Backend: Render
- **URL**: https://mery-rose-backend.onrender.com
- **Frontend URL**: https://meryrose.me

## 📝 Files Updated

1. **thrift-shop/.env.production** - Production environment for meryrose.me
2. **backend/.env** - Backend FRONTEND_URL updated to meryrose.me

## 🚀 Deployment Steps

### 1. Deploy Backend to Render (if not already deployed)

```bash
cd backend
git add .
git commit -m "Update FRONTEND_URL for meryrose.me"
git push
```

On Render dashboard:
- Go to your backend service
- Add environment variable: `FRONTEND_URL=https://meryrose.me`
- The service will auto-deploy

### 2. Deploy Frontend to Vercel/Netlify

```bash
cd thrift-shop
```

**For Vercel:**
```bash
vercel --prod
```

**For Netlify:**
```bash
netlify deploy --prod
```

Or connect your GitHub repo to Vercel/Netlify for automatic deployments.

### 3. Set Environment Variables on Hosting Platform

Make sure these are set in your hosting dashboard:

```
NEXT_PUBLIC_COMPANY_ID=2
NEXT_PUBLIC_COMPANY_NAME=Mery Rose
NEXT_PUBLIC_API_URL=https://thrift-shop-backend-production-9cad.up.railway.app/api
```

## 🔧 Backend Environment Variables on Render

Ensure these are set in your Render dashboard:

```
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://meryrose.me
GEMINI_API_KEY=AIzaSyCGAohPFFGWBe4nKkZpPzgadglffo7bxrU
GEMINI_API_KEY_2=AIzaSyBtLkFSx7G_7JaB4DpTS91ChXe-iCqHaIY
```

## 🌐 CORS Configuration

Your backend is already configured to accept requests from any origin, including meryrose.me. The CORS settings in `backend/server.js` allow:
- All origins
- Credentials
- All standard HTTP methods

## 🧪 Testing

### Test Backend Health
```bash
curl https://thrift-shop-backend-production-9cad.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Thrift Shop Backend is running!",
  "cors": "enabled"
}
```

### Test Frontend Connection
1. Visit https://meryrose.me
2. Open browser DevTools (F12)
3. Check Network tab for API calls to `mery-rose-backend.onrender.com`
4. Products should load successfully

## 🐛 Troubleshooting

### Products Not Loading
1. Check browser console for errors
2. Verify API URL in Network tab
3. Test backend health endpoint
4. Check Render logs for backend errors

### CORS Errors
- Backend already configured for all origins
- If issues persist, check Render environment variables

### 404 Errors
- Ensure backend is deployed and running on Render
- Check that API routes are accessible
- Verify NEXT_PUBLIC_API_URL is correct

## 📱 Admin Panel

If you need to update the admin panel:

**admin-panel/.env.production:**
```
VITE_API_URL=https://thrift-shop-backend-production-9cad.up.railway.app/api
VITE_COMPANY_ID=2
```

## 🎉 You're All Set!

Your configuration is complete. Deploy both frontend and backend, and meryrose.me will be live!
