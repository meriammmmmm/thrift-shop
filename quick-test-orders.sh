#!/bin/bash

echo "🔍 Testing Orders Endpoint"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="https://mertrosebackend-meec580k.b4a.run/api/"

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "OK"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Try to access orders without auth (should fail with 401)
echo "2️⃣  Testing orders endpoint without authentication..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/orders")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Correctly returns 401 Unauthorized${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Unexpected status code: $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Login and get token
echo "3️⃣  Please enter your credentials to test login:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

echo "   Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "   Token: ${TOKEN:0:30}..."
fi
echo ""

# Test 4: Get orders with authentication
echo "4️⃣  Testing orders endpoint with authentication..."
ORDERS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/orders" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$ORDERS_RESPONSE" | tail -n1)
BODY=$(echo "$ORDERS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    ORDER_COUNT=$(echo "$BODY" | grep -o '"orders":\[' | wc -l)
    echo -e "${GREEN}✅ Successfully fetched orders!${NC}"
    echo "   Response:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Failed to fetch orders (Status: $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

echo "=========================="
echo "✅ Test complete!"
