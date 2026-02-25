#!/bin/bash

# 🚀 Railway Deployment Helper Script
# This script helps you deploy to Railway

echo "🚀 RAILWAY DEPLOYMENT HELPER"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "📦 Install Railway CLI:"
    echo "   npm install -g @railway/cli"
    echo ""
    echo "Or use the Railway dashboard: https://railway.app"
    exit 1
fi

echo "✅ Railway CLI found!"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

echo ""
echo "📋 What would you like to deploy?"
echo ""
echo "1) Backend (Node.js API)"
echo "2) Frontend (Next.js Store)"
echo "3) Admin Panel (React)"
echo "4) Everything"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying Backend..."
        cd backend
        railway up
        echo "✅ Backend deployed!"
        ;;
    2)
        echo ""
        echo "🚀 Deploying Frontend..."
        cd thrift-shop
        railway up
        echo "✅ Frontend deployed!"
        ;;
    3)
        echo ""
        echo "🚀 Deploying Admin Panel..."
        cd admin-panel
        railway up
        echo "✅ Admin Panel deployed!"
        ;;
    4)
        echo ""
        echo "🚀 Deploying Everything..."
        echo ""
        echo "📦 Deploying Backend..."
        cd backend
        railway up
        cd ..
        echo ""
        echo "📦 Deploying Frontend..."
        cd thrift-shop
        railway up
        cd ..
        echo ""
        echo "📦 Deploying Admin Panel..."
        cd admin-panel
        railway up
        cd ..
        echo ""
        echo "✅ Everything deployed!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://railway.app/dashboard"
echo "2. Check your deployments"
echo "3. Copy your URLs"
echo "4. Update environment variables if needed"
echo ""
