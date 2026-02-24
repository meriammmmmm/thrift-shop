# 🚀 Deployment Quick Reference Card

## 📖 START HERE
**Read**: `START_DEPLOYMENT_HERE.md` - Your main guide!

---

## 🎯 Three Options (No Vercel)

### 1. Render.com - Easiest
- **Cost**: Free or $35/month
- **Time**: 30 minutes
- **Guide**: `RENDER_DEPLOYMENT_STEPS.md`
- **Prep**: `./deploy-to-render.sh` ✅ (already done)
- **URL**: https://render.com

### 2. Railway.app - Best Value ⭐
- **Cost**: $5-10/month
- **Time**: 20 minutes
- **Guide**: `RAILWAY_DEPLOYMENT.md`
- **URL**: https://railway.app

### 3. VPS - Cheapest
- **Cost**: $6/month
- **Time**: 2-3 hours
- **Guide**: `DEPLOY_WITHOUT_VERCEL.md`
- **Script**: `./deploy-vps-simple.sh`

---

## 📚 All Your Guides

### Start Here:
1. **START_DEPLOYMENT_HERE.md** ← Main guide
2. **DEPLOYMENT_OPTIONS_SUMMARY.md** ← Quick summary
3. **WHICH_DEPLOYMENT_TO_CHOOSE.md** ← Help me decide

### Platform Guides:
4. **RENDER_DEPLOYMENT_STEPS.md** ← Render.com
5. **RAILWAY_DEPLOYMENT.md** ← Railway.app
6. **DEPLOY_WITHOUT_VERCEL.md** ← All options + VPS

### Scripts:
7. **deploy-to-render.sh** ← Render prep (done ✅)
8. **deploy-vps-simple.sh** ← VPS automation
9. **render.yaml** ← Render config (created ✅)

---

## ⚡ Quick Commands

### Render Preparation:
```bash
./deploy-to-render.sh
# Then follow RENDER_DEPLOYMENT_STEPS.md
```

### Railway Deployment:
```bash
# Push to GitHub first
git push
# Then deploy on railway.app
```

### VPS Deployment:
```bash
# Upload code
tar -czf thrift-shop.tar.gz backend/ admin-panel/ thrift-shop/
scp thrift-shop.tar.gz root@YOUR_IP:/root/

# Deploy
ssh root@YOUR_IP
cd /root && tar -xzf thrift-shop.tar.gz
sudo bash deploy-vps-simple.sh
```

---

## 🎯 My Recommendation

**Use Railway.app** - Best balance of ease and cost

1. Read `RAILWAY_DEPLOYMENT.md`
2. Go to https://railway.app
3. Deploy in 20 minutes
4. Pay $5-10/month

---

## 📊 Cost Comparison

| Platform | Cost/Month | Setup Time |
|----------|-----------|------------|
| Render (Free) | $0 | 30 min |
| Render (Paid) | $35 | 30 min |
| Railway | $5-10 | 20 min |
| VPS | $6 | 2-3 hours |

---

## ✅ What's Deployed

You need to deploy 3 components:

1. **Backend** (Node.js API)
   - Port: 5001
   - Folder: `backend/`

2. **Admin Panel** (React)
   - Port: 8080
   - Folder: `admin-panel/`

3. **Company Websites** (Next.js)
   - Ports: 3000, 3001, 3002...
   - Folder: `thrift-shop/`
   - One per company

---

## 🔑 Environment Variables

### Backend:
```env
NODE_ENV=production
PORT=5001
JWT_SECRET=your-secret-key
DATABASE_PATH=./database/thrift_shop.db
```

### Admin:
```env
NODE_ENV=production
PORT=8080
REACT_APP_API_URL=https://your-backend-url/api
```

### Companies:
```env
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

---

## 🆘 Troubleshooting

**Build failed?**
→ Check logs, verify Node.js 18+

**Can't connect to backend?**
→ Verify backend URL in environment variables

**Service won't start?**
→ Check start command and PORT variable

**Need help?**
→ Check troubleshooting section in your platform guide

---

## 🎉 You're Ready!

1. Choose your platform
2. Read the guide
3. Follow the steps
4. Deploy!

**Good luck! 🚀**
