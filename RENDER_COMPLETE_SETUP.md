# ✅ Complete Render Setup with Supabase

Your backend is working on Render! Here's the complete setup.

## Current Setup

**Backend:** https://mery-rose-backend.onrender.com
**Frontend:** https://pearl-box-store.onrender.com (or your domain)
**Database:** Supabase PostgreSQL

## Backend Configuration (Already Done ✅)

Your backend on Render should have these environment variables:

```
DATABASE_URL=postgresql://postgres:meryrose2024@db.oiwvvxyewszwwfnvsnza.supabase.co:5432/postgres
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=your-password
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://meryrose.me
ADMIN_EMAIL=admin@thriftshop.com
GEMINI_API_KEY=AIzaSyCGAohPFFGWBe4nKkZpPzgadglffo7bxrU
GEMINI_API_KEY_2=AIzaSyBtLkFSx7G_7JaB4DpTS91ChXe-iCqHaIY
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=meriammhadhbi916@gmail.com
EMAIL_PASSWORD=your-brevo-key
EMAIL_FROM=Mery Rose <meriammhadhbi916@gmail.com>
```

## Test Your Backend

```bash
# Health check
curl https://thrift-shop-backend-production-dbea.up.railway.app/api/api/health

# Should return:
# {"status":"OK","message":"Thrift Shop Backend is running!"}
```

## Frontend Configuration

Your frontend `.env.production` should have:

```env
NEXT_PUBLIC_API_URL=https://thrift-shop-backend-production-dbea.up.railway.app/api/api
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Mery Rose
```

## What's Working ✅

1. ✅ Backend deployed on Render
2. ✅ Connected to Supabase database
3. ✅ All your data is in Supabase
4. ✅ Free hosting (750 hours/month)
5. ✅ Automatic HTTPS
6. ✅ Auto-deploy from GitHub

## Important Notes

### Render Free Tier
- Spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free (enough for most apps)

### Keep Backend Awake (Optional)
Use a service like UptimeRobot to ping your backend every 5 minutes:
- URL to ping: `https://thrift-shop-backend-production-dbea.up.railway.app/api/api/health`
- Free at: https://uptimerobot.com/

### Supabase Database
- Your data is safe in Supabase
- 500MB free storage
- Daily backups
- Access at: https://supabase.com/dashboard

## Update Frontend to Use Render Backend

If your frontend is not using the Render backend yet:

1. Update `thrift-shop/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://thrift-shop-backend-production-dbea.up.railway.app/api/api
```

2. Redeploy frontend:
```bash
cd thrift-shop
git add .
git commit -m "Update API URL to Render"
git push
```

## Monitoring

### Check Backend Logs
1. Go to https://dashboard.render.com/
2. Click on your backend service
3. Click "Logs" tab
4. See real-time logs

### Check Database
1. Go to https://supabase.com/dashboard
2. Click your project
3. Click "Table Editor"
4. View your data

## Troubleshooting

### Backend not responding?
- Check if it's sleeping (first request takes 30s)
- Check logs in Render dashboard
- Verify DATABASE_URL is correct

### CORS errors?
- Verify FRONTEND_URL in Render matches your actual frontend domain
- Check backend logs for CORS errors

### Database connection fails?
- Verify DATABASE_URL in Render environment variables
- Test connection in Supabase SQL Editor: `SELECT NOW();`

## Cost

**Current Setup: $0/month**
- Render: Free (750 hours)
- Supabase: Free (500MB)

**When to Upgrade:**
- Need 24/7 uptime without sleep: Render Starter ($7/month)
- Need more database: Supabase Pro ($25/month)

## Next Steps

1. ✅ Backend is working on Render
2. ✅ Database is on Supabase
3. ⬜ Set up UptimeRobot to keep backend awake (optional)
4. ⬜ Add custom domain (optional)
5. ⬜ Set up monitoring alerts

---

**Your backend is live and working!** 🎉

Backend URL: https://mery-rose-backend.onrender.com
