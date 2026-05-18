# Backend "Too Many Pending Requests" Fix

## Problem
Your backend on Render is stuck with "too many pending requests" because:
1. It was using Docker (slower startup)
2. Free tier has limited resources
3. Inventory migration was running on every startup

## Solutions Applied

### Code Changes
✅ Changed from Docker to Node.js runtime (faster)
✅ Simplified start.js (removed unnecessary checks)
✅ Disabled inventory migration in production
✅ Reduced body parser limit (10mb instead of 50mb)

### What You Need to Do

#### Option 1: Update Existing Service (Recommended)
1. Go to your backend service on Render dashboard
2. Go to "Settings" → "Build & Deploy"
3. Change these settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Go to "Environment" tab
5. Make sure these are set:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-secret-key
   FRONTEND_URL=https://mery-rose.onrender.com
   GEMINI_API_KEY=AIzaSyCGAohPFFGWBe4nKkZpPzgadglffo7bxrU
   GEMINI_API_KEY_2=AIzaSyBtLkFSx7G_7JaB4DpTS91ChXe-iCqHaIY
   ```
6. Click "Manual Deploy" → "Clear build cache & deploy"

#### Option 2: Create New Service (If Option 1 Fails)
1. Delete the old backend service
2. Create new Web Service
3. Connect your GitHub repo
4. Set Root Directory: `backend`
5. Set Environment: Node
6. Set Build Command: `npm install`
7. Set Start Command: `npm start`
8. Add environment variables (same as above)
9. Deploy

### After Deployment

**Test the backend:**
```bash
curl https://thrift-shop-backend-production-dbea.up.railway.app/api/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Thrift Shop Backend is running!",
  "timestamp": "...",
  "cors": "enabled",
  "env": "production"
}
```

### Why This Fixes It

1. **Node.js instead of Docker**: 
   - Docker adds ~30-60 seconds to startup
   - Node.js starts in ~10-20 seconds

2. **Simplified startup**:
   - Removed unnecessary file checks
   - Disabled inventory migration in production

3. **Reduced memory usage**:
   - Lower body parser limit
   - Faster request processing

### If Still Not Working

#### Check Render Logs
1. Go to backend service → Logs
2. Look for errors like:
   - "Out of memory"
   - "Connection timeout"
   - "Port already in use"

#### Common Issues

**Issue: "Out of memory"**
- Free tier has 512MB RAM
- Solution: Upgrade to paid tier ($7/month)

**Issue: "Connection timeout"**
- Backend taking too long to respond
- Solution: Already fixed with optimizations

**Issue: "Port already in use"**
- Render expects port from environment variable
- Solution: Already set PORT=5001 in env vars

**Issue: Database errors**
- SQLite might not persist on Render
- Solution: Use PostgreSQL (free tier available)

### Using PostgreSQL (Optional but Recommended)

Render's free tier doesn't persist SQLite files between deploys. To fix this:

1. In Render dashboard, create a PostgreSQL database
2. Copy the "Internal Database URL"
3. Add to backend environment variables:
   ```
   DATABASE_URL=your-postgres-connection-string
   ```
4. Redeploy

The backend will automatically use PostgreSQL if DATABASE_URL is set.

### Performance Tips

1. **Keep backend warm**: 
   - Free tier sleeps after 15 minutes of inactivity
   - Use a service like UptimeRobot to ping every 10 minutes
   - URL to ping: `https://thrift-shop-backend-production-dbea.up.railway.app/api/api/health`

2. **Upgrade if needed**:
   - Starter plan ($7/month) has better performance
   - No sleep, more RAM, faster CPU

3. **Monitor logs**:
   - Check logs regularly for errors
   - Set up log alerts in Render

### Timeline

- Push changes: Done ✅
- Render detects changes: 1-2 minutes
- Build time: 2-3 minutes
- Deploy time: 1-2 minutes
- **Total: ~5-7 minutes**

### Next Steps

1. Wait for deployment to complete
2. Test health endpoint
3. Test verification endpoint
4. If working, update frontend environment variables
5. Test full signup flow

---

**Still having issues?** The free tier might be too limited. Consider:
- Upgrading to Starter plan ($7/month)
- Using Railway (also has free tier)
- Using Vercel for backend (serverless)
