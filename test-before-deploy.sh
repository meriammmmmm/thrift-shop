#!/bin/bash

echo "🧪 PRE-DEPLOYMENT TESTING SCRIPT"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -e "${YELLOW}🧪 Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

# Test 1: Check if all required files exist
print_test "Checking required files..."

required_files=(
    "backend/server.js"
    "backend/package.json"
    "admin-panel/server.js"
    "admin-panel/package.json"
    "thrift-shop/package.json"
    "thrift-shop/.env.company1"
    "thrift-shop/.env.company2"
    "thrift-shop/.env.company3"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_pass "Found $file"
    else
        print_fail "Missing $file"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    print_pass "All required files exist"
else
    print_fail "Some required files are missing"
    exit 1
fi

echo ""

# Test 2: Check Node.js version
print_test "Checking Node.js version..."
node_version=$(node --version)
if [[ $node_version == v1[8-9]* ]] || [[ $node_version == v2[0-9]* ]]; then
    print_pass "Node.js version: $node_version"
else
    print_fail "Node.js version $node_version may not be compatible (need 18+)"
fi

echo ""

# Test 3: Check if ports are available
print_test "Checking if required ports are available..."

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        print_fail "Port $1 is already in use"
        return 1
    else
        print_pass "Port $1 is available"
        return 0
    fi
}

ports_available=true
check_port 5001 || ports_available=false  # Backend
check_port 8080 || ports_available=false  # Admin
check_port 3000 || ports_available=false  # Company 1
check_port 3001 || ports_available=false  # Company 2

if [ "$ports_available" = false ]; then
    print_fail "Some required ports are in use. Stop other services first."
    exit 1
fi

echo ""

# Test 4: Check database
print_test "Checking database..."
if [ -f "backend/database/thrift_shop.db" ]; then
    # Check if database has required tables
    tables=$(sqlite3 backend/database/thrift_shop.db ".tables" 2>/dev/null)
    if [[ $tables == *"users"* ]] && [[ $tables == *"companies"* ]] && [[ $tables == *"products"* ]]; then
        print_pass "Database exists with required tables"
    else
        print_fail "Database missing required tables"
    fi
else
    print_fail "Database file not found"
fi

echo ""

# Test 5: Check environment files
print_test "Checking environment files..."
for i in {1..3}; do
    env_file="thrift-shop/.env.company$i"
    if [ -f "$env_file" ]; then
        if grep -q "NEXT_PUBLIC_COMPANY_ID=$i" "$env_file"; then
            print_pass "Company $i environment file is correct"
        else
            print_fail "Company $i environment file has wrong COMPANY_ID"
        fi
    else
        print_fail "Missing environment file for company $i"
    fi
done

echo ""

# Test 6: Check dependencies
print_test "Checking dependencies..."

check_deps() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir/node_modules" ]; then
        print_pass "$name dependencies installed"
    else
        print_fail "$name dependencies not installed (run 'npm install' in $dir)"
    fi
}

check_deps "backend" "Backend"
check_deps "admin-panel" "Admin Panel"
check_deps "thrift-shop" "Frontend"

echo ""

# Test 7: Quick build test
print_test "Testing builds..."

# Test admin panel build
cd admin-panel
if npm run build >/dev/null 2>&1; then
    print_pass "Admin panel builds successfully"
else
    print_fail "Admin panel build failed"
fi
cd ..

# Test frontend build
cd thrift-shop
cp .env.company1 .env.local
if npm run build >/dev/null 2>&1; then
    print_pass "Frontend builds successfully"
else
    print_fail "Frontend build failed"
fi
cd ..

echo ""

# Summary
echo "🎯 PRE-DEPLOYMENT TEST SUMMARY"
echo "=============================="
echo ""
echo "If all tests passed, your project is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Choose deployment method from DEPLOYMENT_GUIDE.md"
echo "2. Get a server/hosting service"
echo "3. Upload your project files"
echo "4. Run deployment script"
echo ""
echo "Recommended: Start with VPS deployment (DigitalOcean, Linode, etc.)"