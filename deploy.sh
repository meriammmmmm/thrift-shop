#!/bin/bash

echo "🚀 DEPLOYING PEARL BOX THRIFT SHOP 🚀"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Pearl Box Thrift Shop"
fi

echo ""
echo "✅ DEPLOYMENT OPTIONS:"
echo ""
echo "1️⃣  RENDER (Recommended - Easiest)"
echo "   → Go to: https://render.com"
echo "   → Click 'New +' → 'Blueprint'"
echo "   → Connect this GitHub repo"
echo "   → Done! (Auto-deploys from render.yaml)"
echo ""
echo "2️⃣  VERCEL (Fastest)"
echo "   → Run: npm install -g vercel"
echo "   → Run: cd thrift-shop && vercel"
echo "   → Follow prompts"
echo ""
echo "3️⃣  RAILWAY"
echo "   → Go to: https://railway.app"
echo "   → Click 'Deploy from GitHub'"
echo "   → Select this repo"
echo ""
echo "======================================"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Push to GitHub (if not already)"
echo "2. Choose a platform above"
echo "3. Deploy!"
echo ""
echo "💡 TIP: Render is easiest - just connect GitHub and click deploy!"
echo ""
