# Keep Render Backend Awake (FREE Solution)

## Problem
Render free tier sleeps after 15 minutes of inactivity, causing 30+ second delays on first request.

## Solution: UptimeRobot (FREE)
Ping your backend every 5 minutes to keep it awake 24/7.

## Setup (2 minutes)

### Step 1: Sign Up for UptimeRobot
1. Go to: https://uptimerobot.com/
2. Click "Sign Up Free"
3. Verify your email

### Step 2: Create Monitor
1. Click **"+ Add New Monitor"**
2. Fill in:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Mery Rose Backend
   - **URL:** `https://thrift-shop-backend-production-9cad.up.railway.app/api/health`
   - **Monitoring Interval:** 5 minutes
3. Click **"Create Monitor"**

### Step 3: Done! ✅

That's it! UptimeRobot will ping your backend every 5 minutes, keeping it awake 24/7.

## What You Get

✅ **No more cold starts** - Backend stays warm
✅ **Fast response times** - Always ready
✅ **100% FREE** - UptimeRobot free tier allows 50 monitors
✅ **Bonus:** Email alerts if backend goes down
✅ **Works forever** - No time limits

## Alternative: Cron-job.org

If you want a backup, also add:

1. Go to: https://cron-job.org/
2. Sign up free
3. Create job:
   - URL: `https://thrift-shop-backend-production-9cad.up.railway.app/api/health`
   - Interval: Every 5 minutes
4. Enable job

## Cost Comparison

| Solution | Cost | Speed | Limits |
|----------|------|-------|--------|
| **Render + UptimeRobot** | $0 | Fast | None |
| Railway | $5/month credit | Fast | Runs out in 2 weeks |
| Leapcell | $0 | Fast | Can't get it working |
| Render alone | $0 | Slow (30s cold start) | None |

## Your Current Setup

**Backend:** https://mery-rose-backend.onrender.com
**Database:** Supabase (your data is here)
**Keep Awake:** UptimeRobot (set up above)

## Test It

After setting up UptimeRobot, test your backend:

```bash
# Should respond in < 1 second (not 30 seconds)
curl https://thrift-shop-backend-production-9cad.up.railway.app/api/health
```

## Monitoring

UptimeRobot dashboard shows:
- ✅ Uptime percentage
- ✅ Response times
- ✅ Downtime alerts
- ✅ Historical data

---

**This is the best free solution!** Render works perfectly, and UptimeRobot keeps it fast. 🚀
