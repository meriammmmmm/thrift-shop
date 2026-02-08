@echo off
echo 🚀 Starting AI Image Analysis System...
echo ======================================

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

:: Check directories
if not exist "backend" (
    echo ❌ Backend directory not found. Please run this from the project root.
    pause
    exit /b 1
)

if not exist "admin-panel" (
    echo ❌ Admin-panel directory not found. Please run this from the project root.
    pause
    exit /b 1
)

echo 📁 Project structure verified

:: Kill existing processes
echo 🧹 Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1

:: Start backend
echo 🔧 Starting backend server...
cd backend
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    npm install
)

start "Backend Server" cmd /k "node server.js"
cd ..

:: Wait for backend
timeout /t 3 /nobreak >nul

:: Start admin panel
echo 🎨 Starting admin panel...
cd admin-panel
if not exist "node_modules" (
    echo 📦 Installing admin panel dependencies...
    npm install
)

start "Admin Panel" cmd /k "node server.js"
cd ..

:: Wait for admin panel
timeout /t 3 /nobreak >nul

echo.
echo 🎉 AI System Started Successfully!
echo ==================================
echo 🔧 Backend: http://localhost:5001
echo 🎨 Admin Panel: http://localhost:3005
echo.
echo 📊 Testing AI functionality...
echo.

:: Test the AI system
node test-ai-working.js

echo.
echo 🔗 Quick Links:
echo    • Admin Panel: http://localhost:3005
echo    • Add Product (AI): http://localhost:3005 → Add Product
echo    • Test AI: open test-real-ai-now.html in browser
echo.
echo Press any key to continue...
pause >nul