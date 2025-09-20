# Polly Monitor - Real-time AI Chatbot Visualization

A full-stack application for monitoring your AI chatbot "Polly" in real-time through PromptLayer integration.

## System Architecture

- **Backend**: FastAPI application that polls PromptLayer's REST API
- **Frontend**: React application with real-time WebSocket chat visualization
- **Data Flow**: Backend polls PromptLayer → processes conversation data → streams to frontend

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Configure .env file with your PromptLayer API key
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Configuration

Create a `.env` file in the backend directory:

```env
PROMPTLAYER_API_KEY=your_api_key_here
POLLING_INTERVAL_SECONDS=10
MAX_CONVERSATIONS_DISPLAY=100
WEBSOCKET_HEARTBEAT_INTERVAL=30
APP_HOST=0.0.0.0
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Features

- Real-time chat interface showing Polly's conversations
- "Polly is typing..." indicators during response generation
- Conversation metadata display (tokens, response time, prompt names)
- TV-friendly large text display
- Live statistics and monitoring
- WebSocket-based real-time updates

## API Endpoints

- `/health` - Health check and PromptLayer connectivity
- `/ws` - WebSocket endpoint for real-time updates
- `/conversations/recent` - Get recent conversation history
- `/stats` - Get aggregate statistics