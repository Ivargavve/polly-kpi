@echo off
title Polly Monitor Startup

echo 🤖 Starting Polly Monitor...

REM Check if we're in the correct directory
if not exist "backend" (
    echo ❌ Error: backend directory not found
    echo Please run this script from the polly-monitor directory
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: frontend directory not found
    echo Please run this script from the polly-monitor directory
    pause
    exit /b 1
)

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is required but not installed
    pause
    exit /b 1
)

REM Check for npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js/npm is required but not installed
    pause
    exit /b 1
)

REM Check for .env file
if not exist "backend\.env" (
    echo ⚠️  Warning: No .env file found in backend directory
    echo 📋 Creating .env file from template...
    copy "backend\.env.example" "backend\.env"
    echo ✅ Created backend\.env - Please edit it with your PromptLayer API key
    echo 📝 Set PROMPTLAYER_API_KEY=your_actual_api_key
    pause
)

echo 🔧 Setting up backend...

REM Setup backend
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 🐍 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Start backend
echo 🚀 Starting FastAPI backend...
start "Polly Monitor Backend" python -m uvicorn main:app --reload --port 8000

cd ..

echo ⚛️  Setting up frontend...

REM Setup frontend
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Start frontend
echo 🚀 Starting React frontend...
start "Polly Monitor Frontend" npm start

cd ..

echo.
echo ✅ Polly Monitor is starting up!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend API: http://localhost:8000
echo 📊 Health Check: http://localhost:8000/health
echo.
echo Both services are running in separate windows.
echo Close the terminal windows to stop the services.
echo.
pause