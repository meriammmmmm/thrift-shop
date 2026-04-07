# Deploy Backend to Vercel

## Important Notes

⚠️ **Vercel Limitations for This Backend:**
- SQLite won't work on Vercel (no persistent file system)
- You MUST use PostgreSQL database
- 10 second timeout on free plan
- Cold starts when not used

## Prerequisites

1. **PostgreSQL Database** - Get a free one from:
   - [Neon](https://neon.tech) - Recommended, free tier
   - [Supabase](https://supabase.com) - Free tier
   - [Railway](https://railway.app) - $5/month credit

2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)

## Deployment Steps

### 1. Get PostgreSQL Connection String

From Neon/Supabase/Railway, copy your connection string:
```
postgresql://user:password@host:5432/database?sslmode=require
```

### 2. Deploy to Vercel

```bash
cd backend
vercel
```

Or use Vercel Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select the `backend` folder as root directory
4. Add environment variables (see below)
5. Deploy!

### 3. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
FRONTEND_URL=https://meryrose.me
ADMIN_EMAIL=admin@thriftshop.com
ADMIN_PASSWORD=admin123
GEMINI_API_KEY=your-gemini-key
GEMINI_API_KEY_2=your-second-key
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-brevo-smtp-key
EMAIL_FROM=Mery Rose <your-email@gmail.com>
```

### 4. Update Frontend

Update your frontend `.env` files to point to Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

### 5. Test Deployment

```bash
curl https://your-backend.vercel.app/api/health
```

## Alternative: Keep Back4App

Your backend is already working on Back4App:
- `https://thrift-shop-backend-production-9cad.up.railway.app/api`
- Supports SQLite
- Always-on server
- No cold starts

**Recommendation:** Keep using Back4App for backend, use Vercel only for frontend!

## Troubleshooting

### Database Connection Issues
- Make sure DATABASE_URL includes `?sslmode=require`
- Check if your PostgreSQL allows external connections

### Timeout Errors
- Vercel free tier has 10 second limit
- Optimize slow queries
- Consider upgrading to Pro plan

### Cold Starts
- First request after inactivity will be slow
- Use a service like UptimeRobot to ping every 5 minutes
