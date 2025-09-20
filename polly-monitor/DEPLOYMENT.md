# Polly Monitor - Deployment Guide

## Production Deployment Options

### 1. Docker Deployment (Recommended)

Create `Dockerfile` for backend:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--worker-class", "uvicorn.workers.UvicornWorker"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - PROMPTLAYER_API_KEY=${PROMPTLAYER_API_KEY}
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

### 2. Cloud Platform Deployment

#### Railway.app (Backend)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

cd frontend
vercel --prod
```

#### Google Cloud Run
```bash
# Build and deploy backend
gcloud run deploy polly-monitor-backend \
  --source ./backend \
  --port 8000 \
  --allow-unauthenticated
```

### 3. Traditional VPS Deployment

#### Backend Setup (Ubuntu/CentOS)
```bash
# Install dependencies
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx

# Setup application
cd /opt
sudo git clone <your-repo> polly-monitor
cd polly-monitor/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install gunicorn for production
pip install gunicorn

# Create systemd service
sudo tee /etc/systemd/system/polly-monitor.service << EOF
[Unit]
Description=Polly Monitor Backend
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/polly-monitor/backend
Environment=PATH=/opt/polly-monitor/backend/venv/bin
ExecStart=/opt/polly-monitor/backend/venv/bin/gunicorn main:app --bind 0.0.0.0:8000 --worker-class uvicorn.workers.UvicornWorker
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl enable polly-monitor
sudo systemctl start polly-monitor
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (built React app)
    location / {
        root /opt/polly-monitor/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables for Production

### Backend (.env)
```env
# Production settings
PROMPTLAYER_API_KEY=your_production_api_key
POLLING_INTERVAL_SECONDS=5
MAX_CONVERSATIONS_DISPLAY=200
WEBSOCKET_HEARTBEAT_INTERVAL=30

# Server configuration
APP_HOST=0.0.0.0
APP_PORT=8000
APP_RELOAD=false

# Security
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Frontend (.env.production)
```env
REACT_APP_WS_URL=wss://your-backend-domain.com/ws
REACT_APP_API_URL=https://your-backend-domain.com
```

## Security Considerations

### 1. API Key Security
- Never commit API keys to version control
- Use environment variables or secret management
- Rotate keys regularly
- Monitor API usage

### 2. Network Security
- Use HTTPS/WSS in production
- Configure proper CORS origins
- Implement rate limiting
- Use Web Application Firewall (WAF)

### 3. Access Control
- Restrict backend access to frontend domains only
- Consider authentication for sensitive environments
- Monitor access logs

## Monitoring and Logging

### Application Monitoring
```python
# Add to main.py for production logging
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/polly-monitor.log'),
        logging.StreamHandler()
    ]
)
```

### Health Checks
```bash
# Automated health monitoring
curl -f http://localhost:8000/health || exit 1
```

### Performance Monitoring
- Monitor WebSocket connection counts
- Track PromptLayer API response times
- Monitor memory usage with conversation cache
- Set up alerts for API failures

## Backup and Recovery

### Configuration Backup
```bash
# Backup environment and configuration
tar -czf polly-monitor-config-$(date +%Y%m%d).tar.gz \
  backend/.env \
  frontend/.env.production \
  nginx/polly-monitor.conf
```

### Data Considerations
- No persistent data storage required
- Conversations are real-time only
- Backup configuration and deployment scripts

## Scaling Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Shared Redis for WebSocket session management
- CDN for frontend static assets

### Vertical Scaling
- Increase server resources for high-volume environments
- Optimize PromptLayer polling frequency
- Implement conversation pagination

## Troubleshooting Production Issues

### Common Production Issues

#### High Memory Usage
- Reduce `MAX_CONVERSATIONS_DISPLAY`
- Implement conversation cleanup
- Monitor memory with `htop` or monitoring tools

#### WebSocket Disconnections
- Check proxy timeout settings
- Verify SSL certificate configuration
- Monitor network connectivity

#### PromptLayer Rate Limiting
- Increase `POLLING_INTERVAL_SECONDS`
- Implement exponential backoff
- Contact PromptLayer for rate limit increase

### Debugging Tools
```bash
# Check service status
sudo systemctl status polly-monitor

# View logs
sudo journalctl -u polly-monitor -f

# Test API directly
curl http://localhost:8000/health

# Test WebSocket
wscat -c ws://localhost:8000/ws
```

## Maintenance

### Regular Tasks
1. Monitor API key usage and limits
2. Update dependencies monthly
3. Review logs for errors or issues
4. Test WebSocket connectivity
5. Verify PromptLayer integration

### Update Procedure
```bash
# 1. Backup current version
sudo systemctl stop polly-monitor
cp -r /opt/polly-monitor /opt/polly-monitor.backup

# 2. Pull updates
cd /opt/polly-monitor
git pull origin main

# 3. Update dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# 4. Restart services
sudo systemctl start polly-monitor
sudo systemctl reload nginx
```