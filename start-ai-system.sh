#!/bin/bash

echo "🚀 Starting AI Image Analysis System..."
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run this from the project root."
    exit 1
fi

# Check if admin-panel directory exists
if [ ! -d "admin-panel" ]; then
    echo "❌ Admin-panel directory not found. Please run this from the project root."
    exit 1
fi

echo "📁 Project structure verified"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null || true
sleep 2

# Start backend
echo "🔧 Starting backend server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
nohup node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend started (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start. Check backend.log for errors."
    exit 1
fi

# Start admin panel
echo "🎨 Starting admin panel..."
cd admin-panel
if [ ! -d "node_modules" ]; then
    echo "📦 Installing admin panel dependencies..."
    npm install
fi

# Start admin panel in background
nohup node server.js > ../admin-panel.log 2>&1 &
ADMIN_PID=$!
cd ..

# Wait a moment for admin panel to start
sleep 3

# Check if admin panel is running
if ps -p $ADMIN_PID > /dev/null; then
    echo "✅ Admin panel started (PID: $ADMIN_PID)"
else
    echo "❌ Admin panel failed to start. Check admin-panel.log for errors."
    exit 1
fi

echo ""
echo "🎉 AI System Started Successfully!"
echo "=================================="
echo "🔧 Backend: http://localhost:5001"
echo "🎨 Admin Panel: http://localhost:3005"
echo ""
echo "📊 Testing AI functionality..."
echo ""

# Test the AI system
node test-ai-working.js

echo ""
echo "🔗 Quick Links:"
echo "   • Admin Panel: http://localhost:3005"
echo "   • Add Product (AI): http://localhost:3005 → Add Product"
echo "   • Test AI: open test-real-ai-now.html in browser"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $ADMIN_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Admin Panel: tail -f admin-panel.log"