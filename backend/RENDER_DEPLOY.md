# Deploy Backend to Render - Quick Guide

## Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `thrift-shop-db`
   - Database: `thriftshop`
   - User: `thriftshop`
   - Plan: **Free**
4. Click "Create Database"
5. Wait for it to be ready (takes ~2 minutes)
6. Copy the **Internal Database URL** (starts with `postgresql://`)

## Step 2: Deploy Backend Service

### Option A: Using Render Dashboard (Recommended)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `thrift-shop-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Plan**: Free
   - **Branch**: `master` (or your main branch)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   DATABASE_URL=<paste the Internal Database URL from Step 1>
   JWT_SECRET=<generate a random string, e.g., use: openssl rand -base64 32>
   ADMIN_EMAIL=admin@thriftshop.com
   ADMIN_PASSWORD=<choose a secure password>
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

5. Click "Create Web Service"

### Option B: Using render.yaml (Automatic)

1. Push your code to GitHub
2. In Render Dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will detect `render.yaml` and create both database and service
5. Update environment variables in the dashboard after creation

## Step 3: Fix Database Sequences (One-Time)

After your backend is deployed and running:

1. Visit: `https://your-backend-url.onrender.com/api/fix-sequences`
2. This fixes PostgreSQL auto-increment sequences
3. You should see: `{"success": true, "results": [...]}`

## Step 4: Fix Boolean Columns (One-Time)

1. Visit: `https://your-backend-url.onrender.com/api/fix-boolean-columns`
2. This converts SQLite boolean values to PostgreSQL format
3. You should see: `{"success": true, "results": [...]}`

## Step 5: Test Your Backend

Visit: `https://your-backend-url.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Thrift Shop Backend is running!",
  "timestamp": "2026-03-27T...",
  "cors": "enabled"
}
```

## Important Notes

- **Free tier sleeps after 15 minutes of inactivity** - first request after sleep takes ~30 seconds
- **Database has 90-day expiration on free tier** - backup your data regularly
- **Root Directory MUST be set to `backend`** - this is critical!
- Your backend URL will be: `https://thrift-shop-backend.onrender.com`

## Troubleshooting

### "Dockerfile not found"
- Make sure "Root Directory" is set to `backend` in settings
- Or set "Dockerfile Path" to `backend/Dockerfile`

### Database connection errors
- Verify DATABASE_URL is set correctly
- Use the **Internal Database URL** (not External)
- Make sure database is in "Available" status

### Build fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Try manual deploy: Settings → Manual Deploy → Deploy latest commit

## Generate Secure JWT Secret

Run this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as your JWT_SECRET.

## Next Steps

After backend is deployed:
1. Update your frontend `.env` files with the backend URL
2. Deploy your frontend to Vercel
3. Update FRONTEND_URL in backend environment variables
4. Test the complete flow

## Useful Commands

Check logs:
```bash
# In Render dashboard, go to your service → Logs
```

Redeploy:
```bash
# Push to GitHub, or use Manual Deploy in dashboard
```
