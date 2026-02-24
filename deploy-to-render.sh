#!/bin/bash

# 🚀 Deploy to Render.com - Setup Helper Script
# This script helps you prepare for Render deployment

echo "🎯 Thrift Shop - Render.com Deployment Helper"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "admin-panel" ] || [ ! -d "thrift-shop" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}📋 Pre-Deployment Checklist${NC}"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js version $(node -v) detected. Render requires Node 18+${NC}"
fi

# Check if dependencies are installed
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Backend dependencies not installed. Run: cd backend && npm install${NC}"
fi

if [ -d "admin-panel/node_modules" ]; then
    echo -e "${GREEN}✅ Admin panel dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Admin panel dependencies not installed. Run: cd admin-panel && npm install${NC}"
fi

if [ -d "thrift-shop/node_modules" ]; then
    echo -e "${GREEN}✅ Thrift shop dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Thrift shop dependencies not installed. Run: cd thrift-shop && npm install${NC}"
fi

echo ""
echo -e "${BLUE}📝 Creating render.yaml configuration file...${NC}"

# Create render.yaml for easy deployment
cat > render.yaml << 'EOF'
services:
  # Backend API
  - type: web
    name: thrift-shop-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5001
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_PATH
        value: ./database/thrift_shop.db

  # Admin Panel
  - type: web
    name: thrift-shop-admin
    env: node
    region: oregon
    plan: free
    buildCommand: cd admin-panel && npm install && npm run build
    startCommand: cd admin-panel && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
      - key: REACT_APP_API_URL
        value: https://thrift-shop-backend.onrender.com/api

  # Company 1 - Vintage Treasures
  - type: web
    name: company1-vintage-treasures
    env: node
    region: oregon
    plan: free
    buildCommand: cd thrift-shop && npm install && npm run build
    startCommand: cd thrift-shop && npm start
    envVars:
      - key: NEXT_PUBLIC_COMPANY_ID
        value: 1
      - key: NEXT_PUBLIC_COMPANY_NAME
        value: Vintage Treasures
      - key: NEXT_PUBLIC_API_URL
        value: https://thrift-shop-backend.onrender.com/api

  # Company 2 - Eco Fashion Hub
  - type: web
    name: company2-eco-fashion
    env: node
    region: oregon
    plan: free
    buildCommand: cd thrift-shop && npm install && npm run build
    startCommand: cd thrift-shop && npm start
    envVars:
      - key: NEXT_PUBLIC_COMPANY_ID
        value: 2
      - key: NEXT_PUBLIC_COMPANY_NAME
        value: Eco Fashion Hub
      - key: NEXT_PUBLIC_API_URL
        value: https://thrift-shop-backend.onrender.com/api
EOF

echo -e "${GREEN}✅ Created render.yaml${NC}"

echo ""
echo -e "${BLUE}📝 Creating environment variable templates...${NC}"

# Create .env.example files
cat > backend/.env.example << 'EOF'
NODE_ENV=production
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_PATH=./database/thrift_shop.db
OPENAI_API_KEY=your-openai-api-key-optional
EOF

cat > admin-panel/.env.example << 'EOF'
NODE_ENV=production
PORT=8080
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
EOF

cat > thrift-shop/.env.example << 'EOF'
NEXT_PUBLIC_COMPANY_ID=1
NEXT_PUBLIC_COMPANY_NAME=Your Company Name
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
EOF

echo -e "${GREEN}✅ Created .env.example files${NC}"

echo ""
echo -e "${BLUE}📝 Creating deployment instructions...${NC}"

cat > RENDER_DEPLOYMENT_STEPS.md << 'EOF'
# 🚀 Render.com Deployment Steps

## Quick Deployment (5 minutes per service)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up (free, no credit card required)
3. Verify your email

### Step 2: Deploy Backend (FIRST)

1. Click "New +" → "Web Service"
2. Choose "Build and deploy from a Git repository"
3. Connect your GitHub/GitLab account
4. Select your repository
5. Configure:
   - **Name**: `thrift-shop-backend`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main` (or your branch)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

6. Add Environment Variables (click "Advanced"):
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secret-key-change-this-to-random-string
   DATABASE_PATH=./database/thrift_shop.db
   ```

7. Click "Create Web Service"
8. Wait for deployment (2-3 minutes)
9. **COPY YOUR BACKEND URL** (e.g., `https://thrift-shop-backend.onrender.com`)

### Step 3: Deploy Admin Panel

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `thrift-shop-admin`
   - **Root Directory**: `admin-panel`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=8080
   REACT_APP_API_URL=https://thrift-shop-backend.onrender.com/api
   ```
   (Replace with YOUR backend URL from Step 2)

5. Click "Create Web Service"

### Step 4: Deploy Company 1

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `company1-vintage-treasures`
   - **Root Directory**: `thrift-shop`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   NEXT_PUBLIC_COMPANY_ID=1
   NEXT_PUBLIC_COMPANY_NAME=Vintage Treasures
   NEXT_PUBLIC_API_URL=https://thrift-shop-backend.onrender.com/api
   ```
   (Replace with YOUR backend URL)

5. Click "Create Web Service"

### Step 5: Deploy More Companies (Optional)

Repeat Step 4 for each additional company, changing:
- Name: `company2-eco-fashion`, `company3-retro-style`, etc.
- NEXT_PUBLIC_COMPANY_ID: 2, 3, 4, etc.
- NEXT_PUBLIC_COMPANY_NAME: "Eco Fashion Hub", "Retro Style Co", etc.

### Step 6: Test Your Deployment

1. **Backend**: Visit `https://your-backend.onrender.com/api/health`
   - Should see: `{"status":"ok"}`

2. **Admin Panel**: Visit `https://your-admin.onrender.com`
   - Should see login page

3. **Company Website**: Visit `https://company1-vintage-treasures.onrender.com`
   - Should see your thrift shop

### Step 7: Update Backend URL (If Needed)

If you need to update the backend URL in admin or company sites:
1. Go to service in Render dashboard
2. Click "Environment"
3. Update `REACT_APP_API_URL` or `NEXT_PUBLIC_API_URL`
4. Service will auto-redeploy

## 🎉 You're Live!

Your URLs will be:
- Backend: `https://thrift-shop-backend.onrender.com`
- Admin: `https://thrift-shop-admin.onrender.com`
- Company 1: `https://company1-vintage-treasures.onrender.com`
- Company 2: `https://company2-eco-fashion.onrender.com`

## 💡 Tips

### Free Tier Limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to $7/month per service for always-on

### Custom Domains:
1. Go to service → Settings → Custom Domain
2. Add your domain (e.g., `shop.yourdomain.com`)
3. Update DNS records as instructed
4. SSL certificate is automatic!

### Monitoring:
- Check logs: Service → Logs
- View metrics: Service → Metrics
- Set up alerts: Service → Settings → Notifications

## 🆘 Troubleshooting

### Build Failed:
- Check logs in Render dashboard
- Verify build command is correct
- Ensure all dependencies are in package.json

### Service Won't Start:
- Check start command
- Verify PORT environment variable
- Check logs for errors

### Can't Connect to Backend:
- Verify backend URL in environment variables
- Check backend is running (visit /api/health)
- Ensure CORS is configured in backend

### Database Issues:
- Ensure database folder exists in backend
- Check DATABASE_PATH environment variable
- Database persists on Render's disk (not lost on redeploy)

## 📞 Need Help?

Check Render documentation: https://render.com/docs
Or ask for help in deployment!
EOF

echo -e "${GREEN}✅ Created RENDER_DEPLOYMENT_STEPS.md${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo ""
echo "1. Read RENDER_DEPLOYMENT_STEPS.md for detailed instructions"
echo "2. Go to https://render.com and create an account"
echo "3. Push your code to GitHub/GitLab (if not already)"
echo "4. Follow the steps in RENDER_DEPLOYMENT_STEPS.md"
echo ""
echo -e "${YELLOW}💡 Tip: Deploy backend FIRST, then admin, then company sites${NC}"
echo ""
echo -e "${BLUE}📁 Files created:${NC}"
echo "  - render.yaml (Render configuration)"
echo "  - RENDER_DEPLOYMENT_STEPS.md (Step-by-step guide)"
echo "  - backend/.env.example"
echo "  - admin-panel/.env.example"
echo "  - thrift-shop/.env.example"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"
