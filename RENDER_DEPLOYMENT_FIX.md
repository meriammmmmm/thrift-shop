# Render Deployment Fix Guide

## Issues Fixed
1. ✅ Backend optimized for faster startup (reduced body parser limit, disabled inventory migration on production)
2. ✅ Environment variables properly configured in render.yaml
3. ✅ API URL fallback added to prevent `/undefined/` errors
4. ✅ Manual inventory fix endpoint added: `/api/fix-inventory`

## Immediate Actions Required

### 1. Backend Service (mery-rose-backend.onrender.com)

**Set Environment Variables:**
Go to your backend Render dashboard → Environment tab → Add:

```
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://mery-rose.onrender.com
GEMINI_API_KEY=AIzaSyCGAohPFFGWBe4nKkZpPzgadglffo7bxrU
GEMINI_API_KEY_2=AIzaSyBtLkFSx7G_7JaB4DpTS91ChXe-iCqHaIY
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=Thrift Shop <your-email@gmail.com>
```

**If using PostgreSQL, also add:**
```
DATABASE_URL=your-postgres-connection-string
```

### 2. Frontend Service (mery-rose.onrender.com)

**Set Environment Variables:**
Go to your frontend Render dashboard → Environment tab → Add:

```
NEXT_PUBLIC_API_URL=https://mertrosebackend-7wop5nev.b4a.run/api
NEXT_PUBLIC_COMPANY_ID=2
NEXT_PUBLIC_COMPANY_NAME=Pearl Box
NODE_ENV=production
```

### 3. Deploy Changes

**Option A: Automatic (Recommended)**
- Commit and push the changes to your Git repository
- Render will automatically detect and deploy

**Option B: Manual Deploy**
- Go to each service dashboard
- Click "Manual Deploy" → "Clear build cache & deploy"

### 4. After Deployment

**Test the backend:**
```bash
curl https://mertrosebackend-7wop5nev.b4a.run/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Thrift Shop Backend is running!",
  "timestamp": "2026-03-31T...",
  "cors": "enabled",
  "env": "production"
}
```

**Run inventory fix (if needed):**
```bash
curl https://mertrosebackend-7wop5nev.b4a.run/api/fix-inventory
```

**Test the frontend:**
Visit: https://mery-rose.onrender.com

## Troubleshooting

### Backend stuck in "Application Loading"
1. Check logs in Render dashboard
2. If timeout errors, the free tier might be overwhelmed
3. Try "Clear build cache & deploy"
4. Consider upgrading to paid tier for better performance

### Still getting `/undefined/` errors
1. Verify environment variables are set in Render dashboard (not just render.yaml)
2. Check browser console: `console.log(process.env.NEXT_PUBLIC_API_URL)`
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Too many pending requests
1. Backend is likely restarting repeatedly
2. Check backend logs for errors
3. Ensure DATABASE_URL is set if using PostgreSQL
4. The optimizations in server.js should help with this

### Email verification not working
1. Set EMAIL_USER and EMAIL_PASSWORD in backend environment
2. For Gmail: Enable 2FA and create app password at https://myaccount.google.com/apppasswords
3. Test with: POST to `/api/auth/send-verification-code`

## Performance Optimizations Applied

1. **Body parser limit reduced**: 50mb → 10mb (faster request parsing)
2. **Inventory migration disabled on production**: Runs only in development
3. **Manual inventory fix endpoint**: Call `/api/fix-inventory` when needed
4. **Environment-based startup**: Faster cold starts on Render

## Next Steps

1. Monitor deployment logs in Render dashboard
2. Test all critical endpoints after deployment
3. Set up custom domain (optional)
4. Configure email service for verification codes
5. Consider upgrading Render plan if performance issues persist

## Support

If issues persist:
1. Check Render status page: https://status.render.com
2. Review Render logs for specific errors
3. Test backend endpoints directly with curl/Postman
4. Verify all environment variables are set correctly
