#!/bin/bash

# 🖥️ Simple VPS Deployment Script
# For Ubuntu 20.04/22.04 servers
# Run this ON YOUR VPS SERVER after uploading your code

set -e  # Exit on error

echo "🚀 Thrift Shop VPS Deployment"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root: sudo bash deploy-vps-simple.sh${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installed: $(node -v)${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed: $(node -v)${NC}"
fi

echo ""
echo -e "${BLUE}📦 Step 2: Installing PM2 (Process Manager)...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

echo ""
echo -e "${BLUE}📦 Step 3: Installing Nginx (Web Server)...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

echo ""
echo -e "${BLUE}📦 Step 4: Installing Certbot (SSL Certificates)...${NC}"
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot installed${NC}"
else
    echo -e "${GREEN}✅ Certbot already installed${NC}"
fi

# Get current directory
DEPLOY_DIR=$(pwd)

echo ""
echo -e "${BLUE}📁 Step 5: Setting up Backend...${NC}"
if [ -d "$DEPLOY_DIR/backend" ]; then
    cd "$DEPLOY_DIR/backend"
    
    # Install dependencies
    echo "Installing backend dependencies..."
    npm install --production
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "Creating backend .env file..."
        cat > .env << EOF
NODE_ENV=production
PORT=5001
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PATH=./database/thrift_shop.db
EOF
        echo -e "${YELLOW}⚠️  Generated random JWT_SECRET. Check backend/.env${NC}"
    fi
    
    # Start backend with PM2
    pm2 delete backend 2>/dev/null || true
    pm2 start server.js --name backend
    echo -e "${GREEN}✅ Backend started on port 5001${NC}"
else
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📁 Step 6: Setting up Admin Panel...${NC}"
if [ -d "$DEPLOY_DIR/admin-panel" ]; then
    cd "$DEPLOY_DIR/admin-panel"
    
    # Install dependencies
    echo "Installing admin panel dependencies..."
    npm install
    
    # Build admin panel
    echo "Building admin panel..."
    npm run build
    
    # Create .env if needed
    if [ ! -f ".env" ]; then
        cat > .env << EOF
NODE_ENV=production
PORT=8080
REACT_APP_API_URL=https://mery-rose-backend.onrender.comapi
EOF
    fi
    
    # Start admin with PM2
    pm2 delete admin 2>/dev/null || true
    pm2 start server.js --name admin
    echo -e "${GREEN}✅ Admin panel started on port 8080${NC}"
else
    echo -e "${RED}❌ Admin panel directory not found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📁 Step 7: Setting up Company Websites...${NC}"

# Function to deploy a company
deploy_company() {
    local COMPANY_ID=$1
    local COMPANY_NAME=$2
    local PORT=$3
    
    echo "Deploying Company $COMPANY_ID: $COMPANY_NAME on port $PORT..."
    
    # Create company directory
    local COMPANY_DIR="$DEPLOY_DIR/company$COMPANY_ID"
    
    if [ ! -d "$COMPANY_DIR" ]; then
        cp -r "$DEPLOY_DIR/thrift-shop" "$COMPANY_DIR"
    fi
    
    cd "$COMPANY_DIR"
    
    # Create .env.local
    cat > .env.local << EOF
NEXT_PUBLIC_COMPANY_ID=$COMPANY_ID
NEXT_PUBLIC_COMPANY_NAME=$COMPANY_NAME
NEXT_PUBLIC_API_URL=https://mery-rose-backend.onrender.comapi
EOF
    
    # Install and build
    npm install
    npm run build
    
    # Start with PM2
    pm2 delete "company$COMPANY_ID" 2>/dev/null || true
    PORT=$PORT pm2 start npm --name "company$COMPANY_ID" -- start
    
    echo -e "${GREEN}✅ Company $COMPANY_ID deployed on port $PORT${NC}"
}

# Deploy companies (you can add more)
if [ -d "$DEPLOY_DIR/thrift-shop" ]; then
    deploy_company 1 "Vintage Treasures" 3000
    deploy_company 2 "Eco Fashion Hub" 3001
    # Uncomment to add more companies:
    # deploy_company 3 "Retro Style Co" 3002
    # deploy_company 4 "Urban Vintage" 3003
else
    echo -e "${RED}❌ Thrift shop directory not found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🌐 Step 8: Configuring Nginx...${NC}"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

# Create Nginx configuration
cat > /etc/nginx/sites-available/thrift-shop << EOF
# Backend API
server {
    listen 80;
    server_name $SERVER_IP;
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /admin {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Company 2 (if you have a domain)
# server {
#     listen 80;
#     server_name company2.yourdomain.com;
#     
#     location / {
#         proxy_pass http://localhost:3001;
#         proxy_http_version 1.1;
#         proxy_set_header Host \$host;
#     }
# }
EOF

# Enable site
ln -sf /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

echo ""
echo -e "${BLUE}💾 Step 9: Saving PM2 configuration...${NC}"
pm2 save
pm2 startup | tail -n 1 | bash
echo -e "${GREEN}✅ PM2 will auto-start on server reboot${NC}"

echo ""
echo -e "${BLUE}🔥 Step 10: Configuring Firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not installed, skipping firewall setup${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📊 Your Services:${NC}"
echo ""
echo "Backend API:     http://$SERVER_IP/api"
echo "Admin Panel:     http://$SERVER_IP/admin"
echo "Company 1:       http://$SERVER_IP"
echo "Company 2:       http://$SERVER_IP:3001"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo ""
echo "View all services:    pm2 list"
echo "View logs:            pm2 logs"
echo "Restart service:      pm2 restart backend"
echo "Stop service:         pm2 stop backend"
echo "Nginx status:         systemctl status nginx"
echo "Nginx logs:           tail -f /var/log/nginx/error.log"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Test your services at the URLs above"
echo "2. If you have a domain, update Nginx config with your domain"
echo "3. Set up SSL certificates: certbot --nginx -d yourdomain.com"
echo "4. Update API URLs in .env files to use your domain"
echo ""
echo -e "${BLUE}🔐 Security Recommendations:${NC}"
echo ""
echo "1. Change JWT_SECRET in backend/.env to a secure random string"
echo "2. Set up SSL certificates with certbot"
echo "3. Create a non-root user for running applications"
echo "4. Set up regular database backups"
echo "5. Keep system updated: apt update && apt upgrade"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
