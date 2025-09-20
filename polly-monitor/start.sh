#!/bin/bash

echo "🤖 Starting Polly Monitor..."

# Check if we're in the correct directory
if [[ ! -d "backend" || ! -d "frontend" ]]; then
    echo "❌ Error: Please run this script from the polly-monitor directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists python3; then
    echo "❌ Error: Python 3 is required but not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: Node.js/npm is required but not installed"
    exit 1
fi

# Check for .env file
if [[ ! -f "backend/.env" ]]; then
    echo "⚠️  Warning: No .env file found in backend directory"
    echo "📋 Creating .env file from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please edit it with your PromptLayer API key"
    echo "📝 Set PROMPTLAYER_API_KEY=your_actual_api_key"
    read -p "Press Enter to continue after setting up your API key..."
fi

echo "🔧 Setting up backend..."

# Setup backend
cd backend

# Create virtual environment if it doesn't exist
if [[ ! -d "venv" ]]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Start backend in background
echo "🚀 Starting FastAPI backend..."
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

echo "⚛️  Setting up frontend..."

# Setup frontend
cd frontend

# Install dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start frontend
echo "🚀 Starting React frontend..."
npm start &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Polly Monitor is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "📊 Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait