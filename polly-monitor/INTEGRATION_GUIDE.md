# Polly Monitor - Integration Guide

## ✅ **CONFIRMED: Real-Time Monitoring is Working!**

The Polly Monitor is now successfully receiving and displaying real-time conversation data via webhooks. The system is ready to integrate with your actual Polly PromptLayer setup.

## 🔗 Integration Options

### Option 1: Direct Integration (Recommended)
Modify your Polly system to send webhook calls to the monitor after each PromptLayer request.

### Option 2: PromptLayer Wrapper
Create a wrapper around your PromptLayer calls that also sends data to the monitor.

### Option 3: PromptLayer Webhooks
Use PromptLayer's built-in webhook functionality (if available in your plan).

## 📡 Webhook Endpoints Available

### Complete Conversation Endpoint
```
POST http://localhost:8000/webhook/conversation
```

**Required payload structure:**
```json
{
  "user_message": "User's input text",
  "polly_response": "Polly's response text",
  "prompt_name": "your_prompt_template_name",
  "model": "gpt-4",
  "latency_ms": 1200,
  "tokens_used": {
    "prompt_tokens": 32,
    "completion_tokens": 45
  }
}
```

**Optional fields:**
```json
{
  "id": "unique_conversation_id",
  "timestamp": "2025-01-20T10:00:00Z",
  "status": "success"
}
```

### Step-by-Step Endpoints (for more detailed monitoring)

#### 1. User Message Received
```
POST http://localhost:8000/webhook/user-message
```
```json
{
  "id": "conv_123",
  "message": "User's question",
  "prompt_name": "user_query",
  "model": "gpt-4"
}
```

#### 2. Polly Response Ready
```
POST http://localhost:8000/webhook/polly-response
```
```json
{
  "id": "conv_123",
  "user_message": "User's question",
  "response": "Polly's answer",
  "latency_ms": 1500,
  "tokens_used": {"prompt_tokens": 20, "completion_tokens": 30}
}
```

## 🚀 Integration Examples

### Python Integration (PromptLayer Wrapper)

```python
import requests
import time
from datetime import datetime

MONITOR_URL = "http://localhost:8000"

def polly_with_monitoring(user_message, prompt_name="default"):
    conversation_id = f"conv_{int(time.time() * 1000)}"
    start_time = time.time()

    # Send user message to monitor
    requests.post(f"{MONITOR_URL}/webhook/user-message", json={
        "id": conversation_id,
        "message": user_message,
        "prompt_name": prompt_name,
        "model": "gpt-4"
    })

    # Your existing PromptLayer call here
    polly_response = your_promptlayer_call(user_message, prompt_name)

    # Calculate latency
    latency_ms = int((time.time() - start_time) * 1000)

    # Send complete conversation to monitor
    requests.post(f"{MONITOR_URL}/webhook/conversation", json={
        "id": conversation_id,
        "user_message": user_message,
        "polly_response": polly_response,
        "prompt_name": prompt_name,
        "model": "gpt-4",
        "latency_ms": latency_ms,
        "tokens_used": {
            "prompt_tokens": estimate_tokens(user_message),
            "completion_tokens": estimate_tokens(polly_response)
        }
    })

    return polly_response

# Usage
response = polly_with_monitoring("What's the weather like?", "weather_assistant")
```

### JavaScript/Node.js Integration

```javascript
const axios = require('axios');

const MONITOR_URL = 'http://localhost:8000';

async function pollyWithMonitoring(userMessage, promptName = 'default') {
    const conversationId = `conv_${Date.now()}`;
    const startTime = Date.now();

    // Send user message to monitor
    await axios.post(`${MONITOR_URL}/webhook/user-message`, {
        id: conversationId,
        message: userMessage,
        prompt_name: promptName,
        model: 'gpt-4'
    });

    // Your existing PromptLayer call here
    const pollyResponse = await yourPromptLayerCall(userMessage, promptName);

    // Calculate latency
    const latencyMs = Date.now() - startTime;

    // Send complete conversation to monitor
    await axios.post(`${MONITOR_URL}/webhook/conversation`, {
        id: conversationId,
        user_message: userMessage,
        polly_response: pollyResponse,
        prompt_name: promptName,
        model: 'gpt-4',
        latency_ms: latencyMs,
        tokens_used: {
            prompt_tokens: estimateTokens(userMessage),
            completion_tokens: estimateTokens(pollyResponse)
        }
    });

    return pollyResponse;
}

// Usage
const response = await pollyWithMonitoring("How do I bake a cake?", "cooking_assistant");
```

## 🎯 Custom Data Structure Adaptation

If your PromptLayer setup uses a different data structure, modify the webhook payload in the backend `main.py`:

### Current Structure (in `webhook_conversation` function):
```python
conversation_event = {
    "id": request_data.get('id', f"live_{int(datetime.now().timestamp() * 1000)}"),
    "type": "new_message",
    "timestamp": request_data.get("timestamp", datetime.now().isoformat()),
    "user_message": request_data.get("user_message", ""),
    "polly_response": request_data.get("polly_response", ""),
    "metadata": {
        "prompt_name": request_data.get("prompt_name", "unknown"),
        "tokens_used": request_data.get("tokens_used", {}),
        "latency_ms": request_data.get("latency_ms", 0),
        "model": request_data.get("model", "unknown"),
        "status": request_data.get("status", "success")
    }
}
```

### Customize for Your Structure:
Tell me the exact structure of your PromptLayer requests/responses, and I'll modify the webhook handler to match perfectly.

## 🔧 Configuration

### Production Setup
1. Change `MONITOR_URL` to your production monitor URL
2. Add authentication if needed
3. Configure error handling and retries

### Environment Variables
```env
# In your Polly system
POLLY_MONITOR_URL=http://localhost:8000
POLLY_MONITOR_ENABLED=true

# In the monitor backend/.env
PROMPTLAYER_API_KEY=your_actual_api_key
```

## 📊 Verification

The monitor is now showing real webhook data. You can verify by:

1. **Frontend Dashboard**: Visit http://localhost:3000
2. **API Check**: `curl http://localhost:8000/conversations/recent`
3. **WebSocket Test**: Use the `test_websocket.py` script

## 🚦 Current Status

✅ **Backend**: Running with real-time webhook endpoints
✅ **Frontend**: Displaying live conversations with animations
✅ **WebSocket**: Broadcasting real-time updates
✅ **Data Flow**: Webhook → Backend → WebSocket → Frontend

## 📝 Next Steps

1. **Share your PromptLayer request/response structure** so I can customize the webhook handler
2. **Integrate webhook calls** into your Polly system
3. **Test end-to-end** with your actual conversations
4. **Deploy to production** when ready

**The real-time monitoring system is fully functional and ready for your Polly integration!** 🎉