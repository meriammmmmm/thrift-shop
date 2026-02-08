#!/bin/bash

echo "🚀 THRIFT SHOP MULTI-COMPANY DEPLOYMENT SCRIPT"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on server
if [ "$1" = "server" ]; then
    echo "Running server deployment..."
    
    # Update system
    print_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js
    print_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install PM2
    print_info "Installing PM2..."
    sudo npm install -g pm2
    
    # Install Nginx
    print_info "Installing Nginx..."
    sudo apt install nginx -y
    
    # Install Certbot
    print_info "Installing Certbot for SSL..."
    sudo apt install certbot python3-certbot-nginx -y
    
    print_status "Server setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Upload your project files to /root/"
    echo "2. Run: ./deploy-production.sh setup"
    
elif [ "$1" = "setup" ]; then
    echo "Setting up applications..."
    
    # Setup Backend
    print_info "Setting up backend..."
    cd backend
    npm install --production
    
    # Create production .env
    if [ ! -f .env ]; then
        cat > .env << EOF
NODE_ENV=production
PORT=5001
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PATH=./database/thrift_shop.db
EOF
        print_status "Created backend .env file"
    fi
    
    # Start backend
    pm2 start server.js --name "thrift-backend"
    print_status "Backend started with PM2"
    
    # Setup Admin Panel
    print_info "Setting up admin panel..."
    cd ../admin-panel
    npm install --production
    npm run build
    pm2 start server.js --name "thrift-admin"
    print_status "Admin panel started with PM2"
    
    # Setup Company Websites
    print_info "Setting up company websites..."
    cd ../thrift-shop
    npm install --production
    
    # Get list of company environment files
    for env_file in .env.company*; do
        if [ -f "$env_file" ]; then
            company_num=$(echo $env_file | grep -o '[0-9]\+')
            print_info "Setting up company $company_num website..."
            
            # Create separate directory for each company
            company_dir="../thrift-shop-company$company_num"
            cp -r . "$company_dir"
            cd "$company_dir"
            
            # Copy environment file
            cp "$env_file" .env.local
            
            # Build and start
            npm run build
            pm2 start "npm start" --name "company$company_num-site"
            print_status "Company $company_num website started"
            
            cd ../thrift-shop
        fi
    done
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    print_status "All applications set up and running!"
    echo ""
    echo "PM2 Status:"
    pm2 status
    
elif [ "$1" = "nginx" ]; then
    echo "Setting up Nginx configuration..."
    
    # Create Nginx config
    sudo tee /etc/nginx/sites-available/thrift-shop > /dev/null << 'EOF'
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Company Websites (add more as needed)
server {
    listen 80;
    server_name company1.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/thrift-shop /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    
    print_status "Nginx configured and restarted"
    print_warning "Remember to update domain names in /etc/nginx/sites-available/thrift-shop"
    
elif [ "$1" = "ssl" ]; then
    echo "Setting up SSL certificates..."
    print_warning "Make sure your domains are pointing to this server first!"
    
    read -p "Enter your API domain (e.g., api.yourdomain.com): " api_domain
    read -p "Enter your admin domain (e.g., admin.yourdomain.com): " admin_domain
    read -p "Enter your company domain (e.g., company1.yourdomain.com): " company_domain
    
    sudo certbot --nginx -d $api_domain
    sudo certbot --nginx -d $admin_domain
    sudo certbot --nginx -d $company_domain
    
    print_status "SSL certificates installed"
    
elif [ "$1" = "backup" ]; then
    echo "Creating backup..."
    
    backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $backup_dir
    
    # Backup database
    cp backend/database/thrift_shop.db $backup_dir/
    
    # Backup environment files
    cp backend/.env $backup_dir/backend.env 2>/dev/null || true
    cp thrift-shop/.env.* $backup_dir/ 2>/dev/null || true
    
    # Create archive
    tar -czf $backup_dir.tar.gz $backup_dir
    rm -rf $backup_dir
    
    print_status "Backup created: $backup_dir.tar.gz"
    
elif [ "$1" = "status" ]; then
    echo "System Status:"
    echo "=============="
    
    print_info "PM2 Processes:"
    pm2 status
    
    echo ""
    print_info "Nginx Status:"
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    print_info "Disk Usage:"
    df -h
    
    echo ""
    print_info "Memory Usage:"
    free -h
    
else
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  server  - Install server dependencies (run on fresh server)"
    echo "  setup   - Setup and start all applications"
    echo "  nginx   - Configure Nginx web server"
    echo "  ssl     - Setup SSL certificates"
    echo "  backup  - Create backup of database and configs"
    echo "  status  - Show system status"
    echo ""
    echo "Example deployment process:"
    echo "1. ./deploy-production.sh server"
    echo "2. ./deploy-production.sh setup"
    echo "3. ./deploy-production.sh nginx"
    echo "4. ./deploy-production.sh ssl"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
fi