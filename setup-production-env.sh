#!/bin/bash

echo "🔧 PRODUCTION ENVIRONMENT SETUP"
echo "==============================="
echo ""

# Get user input
read -p "Enter your server IP address: " SERVER_IP
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
read -p "How many companies do you want to deploy? (1-10): " NUM_COMPANIES

echo ""
echo "Setting up environment files for production..."

# Update backend environment
cat > backend/.env.production << EOF
NODE_ENV=production
PORT=5001
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PATH=./database/thrift_shop.db
CORS_ORIGIN=https://admin.$DOMAIN,https://api.$DOMAIN
EOF

echo "✅ Created backend/.env.production"

# Update admin panel environment
cat > admin-panel/.env.production << EOF
NODE_ENV=production
PORT=8080
API_URL=https://api.$DOMAIN/api
EOF

echo "✅ Created admin-panel/.env.production"

# Create company environment files
for ((i=1; i<=NUM_COMPANIES; i++)); do
    # Get company name
    read -p "Enter name for Company $i: " COMPANY_NAME
    read -p "Enter subdomain for Company $i (e.g., vintage): " SUBDOMAIN
    
    cat > thrift-shop/.env.company$i.production << EOF
# $COMPANY_NAME Production Configuration
NEXT_PUBLIC_COMPANY_ID=$i
NEXT_PUBLIC_COMPANY_NAME="$COMPANY_NAME"
NEXT_PUBLIC_API_URL=https://api.$DOMAIN/api
NEXTAUTH_URL=https://$SUBDOMAIN.$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF
    
    echo "✅ Created production environment for Company $i ($COMPANY_NAME)"
    echo "   Will be deployed at: https://$SUBDOMAIN.$DOMAIN"
done

echo ""
echo "🌐 NGINX CONFIGURATION"
echo "======================"

# Generate Nginx config
cat > nginx-production.conf << EOF
# Backend API
server {
    listen 80;
    server_name api.$DOMAIN;
    
    location / {
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
}

# Admin Panel
server {
    listen 80;
    server_name admin.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

EOF

# Add company configurations
port=3000
for ((i=1; i<=NUM_COMPANIES; i++)); do
    # Get the subdomain from the environment file
    subdomain=$(grep "NEXTAUTH_URL" thrift-shop/.env.company$i.production | cut -d'/' -f3 | cut -d'.' -f1)
    
    cat >> nginx-production.conf << EOF
# Company $i Website
server {
    listen 80;
    server_name $subdomain.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:$port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

EOF
    ((port++))
done

echo "✅ Created nginx-production.conf"

echo ""
echo "📋 DEPLOYMENT SUMMARY"
echo "===================="
echo "Server IP: $SERVER_IP"
echo "Domain: $DOMAIN"
echo "Companies: $NUM_COMPANIES"
echo ""
echo "URLs that will be created:"
echo "• Backend API: https://api.$DOMAIN"
echo "• Admin Panel: https://admin.$DOMAIN"

for ((i=1; i<=NUM_COMPANIES; i++)); do
    subdomain=$(grep "NEXTAUTH_URL" thrift-shop/.env.company$i.production | cut -d'/' -f3 | cut -d'.' -f1)
    company_name=$(grep "NEXT_PUBLIC_COMPANY_NAME" thrift-shop/.env.company$i.production | cut -d'"' -f2)
    echo "• Company $i ($company_name): https://$subdomain.$DOMAIN"
done

echo ""
echo "📦 FILES TO UPLOAD TO SERVER:"
echo "• All project files"
echo "• nginx-production.conf"
echo "• All .env.production files"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Point your domain DNS to $SERVER_IP"
echo "2. Upload files to your server"
echo "3. Run: ./deploy-production.sh server"
echo "4. Run: ./deploy-production.sh setup"
echo "5. Copy nginx-production.conf to server and configure"
echo "6. Run: ./deploy-production.sh ssl"
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"