#!/bin/bash

echo "🚀 Starting Frontend for Forgot Password Testing..."
echo ""
echo "📍 Frontend will run at: http://localhost:3000"
echo "🔗 Forgot Password URL: http://localhost:3000/forgot-password"
echo "🔗 Login Page: http://localhost:3000/login"
echo ""
echo "⚠️  Make sure your backend is running on port 5001!"
echo ""
echo "📝 To test:"
echo "   1. Go to http://localhost:3000/login"
echo "   2. Click 'Forgot password?'"
echo "   3. Enter your email"
echo "   4. Check backend console for the code"
echo "   5. Enter the code and reset your password"
echo ""
echo "Starting in 3 seconds..."
sleep 3

cd thrift-shop
npm run dev
