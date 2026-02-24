#!/bin/bash

# 🎓 GitHub Student Pack Deployment Script
# This script helps you deploy your multi-company thrift shop

set -e

echo "🎓 GitHub Student Pack Deployment Helper"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "1) Setup DigitalOcean Server (first time)"
    echo "2) Deploy Backend to DigitalOcean"
    echo "3) Deploy Admin Panel to DigitalOcean"
    echo "4) Deploy Company Websites to Vercel"
    echo "5) Update Environment Variables"
    echo "6) Check Deployment Status"
    echo "7) View Logs"
    echo "8) Exit"
    echo ""
    read -p "Enter your choice [1-8]: " choice
}

# Setup DigitalOcean server
setup_digitalocean() {
    echo ""
    print_info "Setting up DigitalOcean server..."
    echo ""
    
    read -p "Enter your DigitalOcean server IP: " SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        print_error "Server IP is required!"
        return
    fi
    
    echo ""
    print_info "Connecting to server and installing dependencies..."
    
    ssh root@$SERVER_IP << 'ENDSSH'
        # Update system
        apt update && apt upgrade -y
        
        # Install Node.js 18
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        apt-get install -y nodejs
        
        # Install PM2
        npm install -g pm2
        
        # Install Nginx
        apt install nginx -y
        
        # Install Certbot
        apt install certbot python3-certbot-nginx -y
        
        # Install Git
        apt install git -y
        
        # Setup firewall
        ufw allow ssh
        ufw allow http
        ufw allow https
        ufw --force enable
        
        echo "✓ Server setup complete!"
ENDSSH
    
    print_success "DigitalOcean server is ready!"
    echo ""
    print_info "Save this IP for later: $SERVER_IP"
}

# Deploy backend
deploy_backend() {
    echo ""
    print_info "Deploying Backend to DigitalOcean..."
    echo ""
    
    read -p "Enter your DigitalOcean server IP: " SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        print_error "Server IP is required!"
        return
    fi
    
    # Create deployment package
    print_info "Creating deployment package..."
    tar -czf backend-deploy.tar.gz backend/
    
    # Upload to server
    print_info "Uploading to server..."
    scp backend-deploy.tar.gz root@$SERVER_IP:/root/
    
    # Deploy on server
    print_info "Installing and starting backend..."
    ssh root@$SERVER_IP << 'ENDSSH'
        cd /root
        
        # Extract
        tar -xzf backend-deploy.tar.gz
        cd backend
        
        # Install dependencies
        npm install --production
        
        # Create .env if not exists
        if [ ! -f .env ]; then
            cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_123456789
DATABASE_PATH=./database/thrift_shop.db
EOF
            echo "⚠ Created .env file - PLEASE UPDATE JWT_SECRET!"
        fi
        
        # Stop existing process
        pm2 delete backend 2>/dev/null || true
        
        # Start with PM2
        pm2 start server.js --name backend
        pm2 save
        
        echo "✓ Backend deployed!"
ENDSSH
    
    # Cleanup
    rm backend-deploy.tar.gz
    
    print_success "Backend deployed successfully!"
    echo ""
    print_warning "Don't forget to update JWT_SECRET in /root/backend/.env on server!"
}

# Deploy admin panel
deploy_admin() {
    echo ""
    print_info "Deploying Admin Panel to DigitalOcean..."
    echo ""
    
    read -p "Enter your DigitalOcean server IP: " SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        print_error "Server IP is required!"
        return
    fi
    
    # Build admin panel locally
    print_info "Building admin panel..."
    cd admin-panel
    npm install
    npm run build
    cd ..
    
    # Create deployment package
    print_info "Creating deployment package..."
    tar -czf admin-deploy.tar.gz admin-panel/
    
    # Upload to server
    print_info "Uploading to server..."
    scp admin-deploy.tar.gz root@$SERVER_IP:/root/
    
    # Deploy on server
    print_info "Installing and starting admin panel..."
    ssh root@$SERVER_IP << 'ENDSSH'
        cd /root
        
        # Extract
        tar -xzf admin-deploy.tar.gz
        cd admin-panel
        
        # Install dependencies
        npm install --production
        
        # Stop existing process
        pm2 delete admin 2>/dev/null || true
        
        # Start with PM2
        pm2 start server.js --name admin
        pm2 save
        
        echo "✓ Admin panel deployed!"
ENDSSH
    
    # Cleanup
    rm admin-deploy.tar.gz
    
    print_success "Admin panel deployed successfully!"
}

# Deploy to Vercel
deploy_vercel() {
    echo ""
    print_info "Deploying Company Websites to Vercel..."
    echo ""
    
    # Check if vercel is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    read -p "Enter your domain (e.g., mythriftshop.me): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_error "Domain is required!"
        return
    fi
    
    cd thrift-shop
    
    # Deploy each company
    for i in {1..5}; do
        if [ -f ".env.company$i" ]; then
            echo ""
            print_info "Deploying Company $i..."
            
            # Copy env file
            cp .env.company$i .env.local
            
            # Update API URL
            sed -i.bak "s|http://localhost:5001/api|https://api.$DOMAIN/api|g" .env.local
            
            # Deploy
            vercel --prod --yes
            
            print_success "Company $i deployed!"
        fi
    done
    
    cd ..
    
    print_success "All companies deployed to Vercel!"
    echo ""
    print_info "Configure custom domains in Vercel dashboard:"
    echo "  - vintage.$DOMAIN"
    echo "  - eco.$DOMAIN"
    echo "  - retro.$DOMAIN"
    echo "  - urban.$DOMAIN"
    echo "  - sustainable.$DOMAIN"
}

# Update environment variables
update_env() {
    echo ""
    print_info "Updating Environment Variables..."
    echo ""
    
    read -p "Enter your domain (e.g., mythriftshop.me): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_error "Domain is required!"
        return
    fi
    
    API_URL="https://api.$DOMAIN/api"
    
    # Update all company env files
    for i in {1..10}; do
        if [ -f "thrift-shop/.env.company$i" ]; then
            print_info "Updating .env.company$i..."
            sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|g" "thrift-shop/.env.company$i"
        fi
    done
    
    print_success "Environment variables updated!"
    echo ""
    print_warning "Redeploy your sites for changes to take effect"
}

# Check deployment status
check_status() {
    echo ""
    print_info "Checking Deployment Status..."
    echo ""
    
    read -p "Enter your DigitalOcean server IP: " SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        print_error "Server IP is required!"
        return
    fi
    
    ssh root@$SERVER_IP << 'ENDSSH'
        echo "=== PM2 Status ==="
        pm2 status
        
        echo ""
        echo "=== Nginx Status ==="
        systemctl status nginx --no-pager
        
        echo ""
        echo "=== Disk Usage ==="
        df -h /
        
        echo ""
        echo "=== Memory Usage ==="
        free -h
ENDSSH
}

# View logs
view_logs() {
    echo ""
    print_info "Viewing Logs..."
    echo ""
    
    read -p "Enter your DigitalOcean server IP: " SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        print_error "Server IP is required!"
        return
    fi
    
    echo "Which logs do you want to view?"
    echo "1) Backend logs"
    echo "2) Admin panel logs"
    echo "3) Nginx error logs"
    echo "4) All logs"
    read -p "Enter choice [1-4]: " log_choice
    
    case $log_choice in
        1)
            ssh root@$SERVER_IP "pm2 logs backend --lines 50"
            ;;
        2)
            ssh root@$SERVER_IP "pm2 logs admin --lines 50"
            ;;
        3)
            ssh root@$SERVER_IP "tail -n 50 /var/log/nginx/error.log"
            ;;
        4)
            ssh root@$SERVER_IP << 'ENDSSH'
                echo "=== Backend Logs ==="
                pm2 logs backend --lines 20 --nostream
                echo ""
                echo "=== Admin Logs ==="
                pm2 logs admin --lines 20 --nostream
                echo ""
                echo "=== Nginx Errors ==="
                tail -n 20 /var/log/nginx/error.log
ENDSSH
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            setup_digitalocean
            ;;
        2)
            deploy_backend
            ;;
        3)
            deploy_admin
            ;;
        4)
            deploy_vercel
            ;;
        5)
            update_env
            ;;
        6)
            check_status
            ;;
        7)
            view_logs
            ;;
        8)
            echo ""
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
