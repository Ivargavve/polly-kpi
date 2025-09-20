# Polly Monitor - Development Guide

## Quick Start

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- Valid PromptLayer API key

### One-Command Setup

**Linux/macOS:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

This will:
1. Create Python virtual environment
2. Install all dependencies
3. Set up environment configuration
4. Start both backend and frontend services

### Manual Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate.bat  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PromptLayer API key

# Start server
python -m uvicorn main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Environment Configuration

Create `backend/.env` file:

```env
# Required: Your PromptLayer API key
PROMPTLAYER_API_KEY=pl-your-actual-api-key-here

# Optional: Application settings
POLLING_INTERVAL_SECONDS=10
MAX_CONVERSATIONS_DISPLAY=100
WEBSOCKET_HEARTBEAT_INTERVAL=30

# Optional: Server settings
APP_HOST=0.0.0.0
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

## API Endpoints

### Health Check
```
GET /health
```
Verifies PromptLayer connectivity and system status.

### Recent Conversations
```
GET /conversations/recent?limit=50
```
Retrieve recent conversation history.

### Statistics
```
GET /stats
```
Get current monitoring statistics.

### WebSocket Connection
```
WS /ws
```
Real-time updates for new conversations and statistics.

## WebSocket Events

### Client Receives:
- `new_message`: New conversation data
- `stats_update`: Updated statistics
- `typing_indicator`: Polly typing status
- `heartbeat`: Connection keepalive

### Message Format:
```json
{
  "type": "new_message",
  "id": "unique_id",
  "timestamp": "2024-01-01T12:00:00Z",
  "user_message": "User input text",
  "polly_response": "AI response text",
  "metadata": {
    "prompt_name": "template_name",
    "tokens_used": {"prompt_tokens": 50, "completion_tokens": 100},
    "latency_ms": 1500,
    "model": "gpt-4",
    "status": "success"
  }
}
```

## Development Features

### Hot Reload
- Backend: Automatically reloads on code changes
- Frontend: React hot reload for instant updates

### Error Handling
- Graceful WebSocket reconnection
- API key validation on startup
- Rate limiting for PromptLayer API

### Debugging
- Comprehensive logging in backend
- Browser console for frontend debugging
- Health check endpoint for connectivity testing

## Troubleshooting

### Common Issues

#### "Invalid PromptLayer API key"
- Verify your API key in `backend/.env`
- Test key directly with PromptLayer dashboard

#### "WebSocket connection failed"
- Ensure backend is running on port 8000
- Check firewall settings
- Verify CORS configuration

#### "No conversations appearing"
- Confirm Polly is making PromptLayer requests
- Check polling interval settings
- Verify conversation detection logic

#### "Frontend won't start"
- Run `npm install` in frontend directory
- Check Node.js version (16+ required)
- Clear npm cache: `npm cache clean --force`

#### "Backend dependencies failed"
- Ensure Python 3.8+ is installed
- Activate virtual environment before pip install
- Try: `pip install --upgrade pip setuptools wheel`

### Performance Optimization

#### Backend
- Adjust `POLLING_INTERVAL_SECONDS` for your load
- Tune `MAX_CONVERSATIONS_DISPLAY` for memory usage
- Monitor rate limiting with PromptLayer

#### Frontend
- Large conversation histories may impact performance
- Consider implementing conversation pagination
- Monitor WebSocket connection stability

## Architecture Notes

### Data Flow
1. Backend polls PromptLayer API every 10 seconds
2. New conversations are processed and formatted
3. Data is broadcast to all WebSocket clients
4. Frontend updates UI with animations

### State Management
- Backend maintains conversation cache
- Frontend uses React state for real-time updates
- WebSocket reconnection preserves data consistency

### Security
- API keys stored in environment variables
- CORS protection for frontend access
- Rate limiting prevents API abuse

## Contributing

### Code Style
- Backend: Follow PEP 8 Python conventions
- Frontend: ESLint + Prettier formatting
- Use meaningful variable names
- Add comments for complex logic

### Testing
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Backend
pip install gunicorn
gunicorn main:app --host 0.0.0.0 --port 8000

# Frontend
npm run build
```