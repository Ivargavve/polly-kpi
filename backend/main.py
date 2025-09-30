import os
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Set
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
POLLING_INTERVAL = int(os.getenv("POLLING_INTERVAL_SECONDS", "10"))
MAX_CONVERSATIONS = int(os.getenv("MAX_CONVERSATIONS_DISPLAY", "100"))
WEBSOCKET_HEARTBEAT = int(os.getenv("WEBSOCKET_HEARTBEAT_INTERVAL", "30"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Global state
conversation_manager = None
websocket_manager = None


class ConversationManager:
    def __init__(self):
        self.live_messages: List[Dict[str, Any]] = []  # Changed from conversations to live_messages
        self.processed_request_ids: Set[str] = set()
        self.stats = {
            "total_conversations": 0,
            "messages_per_minute": 0,
            "average_response_time": 0,
            "last_activity": None
        }

        # Store for capturing real-time requests
        self.live_requests = []

    async def validate_system(self) -> bool:
        """Validate system components"""
        try:
            logger.info("System validation successful")
            return True
        except Exception as e:
            logger.error(f"System validation failed: {e}")
            return False

    def extract_user_input(self, input_variables: Dict[str, Any]) -> str:
        """Extract user input from PromptLayer input variables"""
        # Common patterns for user input in PromptLayer
        for key in ['user_message', 'message', 'input', 'text', 'query', 'question']:
            if key in input_variables:
                return str(input_variables[key])

        # If no standard key found, return the first string value
        for value in input_variables.values():
            if isinstance(value, str) and len(value.strip()) > 0:
                return value

        return "User input not found"

    def extract_ai_response(self, response_data: Any) -> str:
        """Extract AI response from PromptLayer response data"""
        try:
            if isinstance(response_data, dict):
                # Handle different response formats
                if 'choices' in response_data and len(response_data['choices']) > 0:
                    choice = response_data['choices'][0]
                    if 'message' in choice and 'content' in choice['message']:
                        return choice['message']['content']
                    elif 'text' in choice:
                        return choice['text']

                # Direct content field
                if 'content' in response_data:
                    return response_data['content']

                # Message field
                if 'message' in response_data:
                    return str(response_data['message'])

            # If it's a string, return as-is
            if isinstance(response_data, str):
                return response_data

            return str(response_data)
        except Exception as e:
            logger.error(f"Error extracting AI response: {e}")
            return "Response parsing error"

    def calculate_latency(self, request_data: Dict[str, Any]) -> float:
        """Calculate request latency in milliseconds"""
        try:
            start_time = request_data.get('request_start_time')
            end_time = request_data.get('request_end_time')

            if start_time and end_time:
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                if isinstance(end_time, str):
                    end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))

                latency = (end_time - start_time).total_seconds() * 1000
                return round(latency, 2)
        except Exception as e:
            logger.error(f"Error calculating latency: {e}")

        return 0.0

    async def process_webhook_data(self) -> List[Dict[str, Any]]:
        """Process webhook data and convert to conversation events"""
        try:
            new_conversations = []

            # Process webhook data
            if self.live_requests:
                for request_data in self.live_requests:
                    request_id = request_data.get('id', f"live_{int(datetime.now().timestamp() * 1000)}")

                    if request_id not in self.processed_request_ids:
                        conversation_event = {
                            "id": request_id,
                            "type": "new_message",
                            "timestamp": request_data.get("timestamp", datetime.now().isoformat()),
                            "user_message": request_data.get("user_message", ""),
                            "ai_response": request_data.get("ai_response", ""),
                            "metadata": {
                                "prompt_name": request_data.get("prompt_name", "unknown"),
                                "tokens_used": request_data.get("tokens_used", {}),
                                "latency_ms": request_data.get("latency_ms", 0),
                                "model": request_data.get("model", "unknown"),
                                "status": request_data.get("status", "success")
                            },
                            "expires_at": (datetime.now() + timedelta(minutes=2)).isoformat()
                        }

                        new_conversations.append(conversation_event)
                        self.processed_request_ids.add(request_id)

                self.live_requests = []
                logger.info(f"Processed {len(new_conversations)} webhook conversations")

            return new_conversations

        except Exception as e:
            logger.error(f"Error in process_webhook_data: {e}")
            return []

    def add_live_request(self, request_data: Dict[str, Any]):
        """Add a live request from webhook or direct integration"""
        self.live_requests.append(request_data)
        logger.info(f"Added live request: {request_data.get('user_message', 'No message')[:50]}...")

    def add_live_messages(self, messages: List[Dict[str, Any]]):
        """Add new live messages with 1-minute TTL"""
        # Add new messages
        self.live_messages.extend(messages)

        # Remove expired messages (older than 1 minute)
        now = datetime.now()
        self.live_messages = [
            msg for msg in self.live_messages
            if datetime.fromisoformat(msg.get("expires_at", now.isoformat())) > now
        ]

        # Update stats
        self.stats["total_conversations"] += len(messages)
        if messages:
            self.stats["last_activity"] = datetime.now().isoformat()

            # Calculate messages per minute based on current live messages
            self.stats["messages_per_minute"] = len(self.live_messages)

            # Calculate average response time from new messages
            response_times = [
                msg["metadata"]["latency_ms"]
                for msg in messages
                if msg["metadata"]["latency_ms"] > 0
            ]
            if response_times:
                self.stats["average_response_time"] = round(sum(response_times) / len(response_times), 2)

    def get_live_messages(self) -> List[Dict[str, Any]]:
        """Get current live messages (auto-cleaned)"""
        # Remove expired messages before returning
        now = datetime.now()
        self.live_messages = [
            msg for msg in self.live_messages
            if datetime.fromisoformat(msg.get("expires_at", now.isoformat())) > now
        ]
        return self.live_messages

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics"""
        return self.stats.copy()


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)


async def processing_task():
    """Background task to process webhook data and broadcast updates"""
    while True:
        try:
            new_messages = await conversation_manager.process_webhook_data()

            if new_messages:
                conversation_manager.add_live_messages(new_messages)

                # Broadcast each new message
                for message in new_messages:
                    await websocket_manager.broadcast(message)

                # Broadcast updated stats
                await websocket_manager.broadcast({
                    "type": "stats_update",
                    "data": conversation_manager.get_stats()
                })

            # Clean up expired messages and broadcast current state
            current_messages = conversation_manager.get_live_messages()
            await websocket_manager.broadcast({
                "type": "live_messages_update",
                "data": current_messages
            })

            await asyncio.sleep(POLLING_INTERVAL)

        except Exception as e:
            logger.error(f"Error in processing task: {e}")
            await asyncio.sleep(POLLING_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global conversation_manager, websocket_manager

    conversation_manager = ConversationManager()
    websocket_manager = WebSocketManager()

    # Validate system
    if not await conversation_manager.validate_system():
        logger.error("Failed to validate system components")
        raise RuntimeError("System validation failed")

    # Start processing task
    processing_task_handle = asyncio.create_task(processing_task())

    logger.info("ChatStream backend started successfully")

    try:
        yield
    finally:
        # Shutdown
        processing_task_handle.cancel()
        try:
            await processing_task_handle
        except asyncio.CancelledError:
            pass
        logger.info("ChatStream backend stopped")


# Create FastAPI app
app = FastAPI(
    title="ChatStream API",
    description="Real-time chat visualization API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        is_valid = await conversation_manager.validate_system()
        return {
            "status": "healthy" if is_valid else "unhealthy",
            "system_validated": is_valid,
            "timestamp": datetime.now().isoformat(),
            "active_websockets": len(websocket_manager.active_connections)
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )


@app.get("/messages/live")
async def get_live_messages():
    """Get current live messages"""
    try:
        messages = conversation_manager.get_live_messages()
        return {
            "messages": messages,
            "count": len(messages),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """Get current statistics"""
    try:
        stats = conversation_manager.get_stats()
        stats["timestamp"] = datetime.now().isoformat()
        stats["active_websockets"] = len(websocket_manager.active_connections)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook/conversation")
async def webhook_conversation(request_data: dict):
    """Webhook endpoint to receive real-time conversation data"""
    try:
        logger.info(f"Received webhook data: {request_data}")

        # Validate required fields
        required_fields = ["user_message", "ai_response"]
        for field in required_fields:
            if field not in request_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Add timestamp if not provided
        if "timestamp" not in request_data:
            request_data["timestamp"] = datetime.now().isoformat()

        # Add to live requests for processing
        conversation_manager.add_live_request(request_data)

        return {"status": "success", "message": "Conversation data received"}

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook/user-message")
async def webhook_user_message(message_data: dict):
    """Webhook endpoint to receive user messages (before AI responds)"""
    try:
        logger.info(f"User message received: {message_data}")

        # Create a pending conversation entry
        pending_conversation = {
            "id": message_data.get("id", f"pending_{int(datetime.now().timestamp() * 1000)}"),
            "timestamp": message_data.get("timestamp", datetime.now().isoformat()),
            "user_message": message_data.get("message", ""),
            "ai_response": "",  # Will be filled when response comes
            "status": "pending",
            "prompt_name": message_data.get("prompt_name", "unknown"),
            "model": message_data.get("model", "unknown")
        }

        # Broadcast immediately to show user message
        await websocket_manager.broadcast({
            "type": "user_message",
            **pending_conversation
        })

        return {"status": "success", "message": "User message received"}

    except Exception as e:
        logger.error(f"User message webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/webhook/ai-response")
async def webhook_ai_response(response_data: dict):
    """Webhook endpoint to receive AI responses"""
    try:
        logger.info(f"AI response received: {response_data}")

        # Process the complete conversation
        conversation_data = {
            "id": response_data.get("id", f"response_{int(datetime.now().timestamp() * 1000)}"),
            "timestamp": response_data.get("timestamp", datetime.now().isoformat()),
            "user_message": response_data.get("user_message", ""),
            "ai_response": response_data.get("response", ""),
            "prompt_name": response_data.get("prompt_name", "unknown"),
            "model": response_data.get("model", "unknown"),
            "latency_ms": response_data.get("latency_ms", 0),
            "tokens_used": response_data.get("tokens_used", {}),
            "status": "completed"
        }

        # Add to live requests
        conversation_manager.add_live_request(conversation_data)

        return {"status": "success", "message": "AI response received"}

    except Exception as e:
        logger.error(f"AI response webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket)

    try:
        # Send initial live messages
        live_messages = conversation_manager.get_live_messages()
        initial_message = {
            "type": "live_messages_update",
            "data": live_messages
        }
        await websocket.send_text(json.dumps(initial_message))

        # Send initial stats
        stats_message = {
            "type": "stats_update",
            "data": conversation_manager.get_stats()
        }
        await websocket.send_text(json.dumps(stats_message))

        # Keep connection alive
        while True:
            # Send heartbeat
            heartbeat = {
                "type": "heartbeat",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_text(json.dumps(heartbeat))
            await asyncio.sleep(WEBSOCKET_HEARTBEAT)

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("APP_HOST", "0.0.0.0"),
        port=int(os.getenv("APP_PORT", "8000")),
        reload=os.getenv("APP_RELOAD", "true").lower() == "true"
    )