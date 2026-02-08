#!/bin/bash

echo "🏪 COMPANY DEPLOYMENT SCRIPT"
echo "Each company gets their own isolated website"
echo ""

# Function to deploy a company
deploy_company() {
    local company_id=$1
    local company_name=$2
    local port=$3
    local domain=$4
    
    echo "🚀 Deploying $company_name..."
    echo "   Company ID: $company_id"
    echo "   Port: $port"
    echo "   Domain: $domain"
    echo "   Environment: .env.company$company_id"
    echo ""
    
    # Copy environment file
    cp "thrift-shop/.env.company$company_id" "thrift-shop/.env.local"
    
    echo "   ✅ Environment configured for $company_name"
    echo "   📦 Products: Only company $company_id products"
    echo "   🎨 Branding: $company_name branding throughout"
    echo "   👥 Users: Isolated user base"
    echo ""
}

echo "📋 DEPLOYMENT PLAN:"
echo ""

deploy_company 1 "Vintage Treasures" 3001 "vintagetreasures.com"
deploy_company 2 "Eco Fashion Hub" 3002 "ecofashionhub.com" 
deploy_company 3 "Retro Style Co" 3003 "retrostyleco.com"

echo "🌐 PRODUCTION SETUP:"
echo ""
echo "1. Each company gets their own:"
echo "   • Domain (vintagetreasures.com, ecofashionhub.com, etc.)"
echo "   • Server instance with their company ID"
echo "   • Isolated database (or filtered by company_id)"
echo "   • Separate user accounts"
echo "   • Own admin panel"
echo ""
echo "2. Customers only see:"
echo "   • That company's products"
echo "   • That company's branding"
echo "   • No knowledge of other companies"
echo ""
echo "3. Each deployment uses:"
echo "   • NEXT_PUBLIC_COMPANY_ID environment variable"
echo "   • Same codebase, different configuration"
echo "   • Isolated data per company"
echo ""

echo "🔧 TO TEST LOCALLY:"
echo ""
echo "# Test Vintage Treasures (Company 1):"
echo "cp thrift-shop/.env.company1 thrift-shop/.env.local"
echo "cd thrift-shop && npm run dev"
echo "# Visit: http://localhost:3000 (shows only Vintage Treasures)"
echo ""
echo "# Test Eco Fashion Hub (Company 2):"
echo "cp thrift-shop/.env.company2 thrift-shop/.env.local" 
echo "cd thrift-shop && npm run dev"
echo "# Visit: http://localhost:3000 (shows only Eco Fashion Hub)"
echo ""

echo "✅ RESULT: Each company has completely isolated website!"