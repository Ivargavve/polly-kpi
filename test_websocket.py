#!/usr/bin/env python3
"""
Simple WebSocket Connectivity Test for Polly Monitor

This script tests the WebSocket connection to verify real-time communication
between the backend and potential frontend clients.
"""

import asyncio
import json
import sys
from datetime import datetime

try:
    import websockets
except ImportError:
    print("Installing websockets...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "websockets"], check=True)
    import websockets

WS_URL = "ws://localhost:8000/ws"

async def test_websocket():
    print("🔌 Testing WebSocket Connection to Polly Monitor Backend")
    print(f"Connecting to: {WS_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)

    try:
        async with websockets.connect(WS_URL) as websocket:
            print("✅ WebSocket connection established successfully!")

            message_count = 0
            start_time = datetime.now()

            print("\n📡 Listening for real-time messages (will listen for 15 seconds)...")

            try:
                while True:
                    # Set a timeout so we don't wait forever
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=15.0)
                        message_count += 1

                        try:
                            data = json.loads(message)
                            message_type = data.get('type', 'unknown')
                            timestamp = data.get('timestamp', 'no timestamp')

                            print(f"\n📨 Message {message_count} received:")
                            print(f"   Type: {message_type}")
                            print(f"   Time: {timestamp}")

                            if message_type == "new_message":
                                user_msg = data.get('user_message', 'N/A')[:50]
                                polly_msg = data.get('polly_response', 'N/A')[:50]
                                print(f"   User: {user_msg}...")
                                print(f"   Polly: {polly_msg}...")

                                metadata = data.get('metadata', {})
                                if metadata:
                                    print(f"   Prompt: {metadata.get('prompt_name', 'N/A')}")
                                    print(f"   Latency: {metadata.get('latency_ms', 'N/A')}ms")
                                    print(f"   Model: {metadata.get('model', 'N/A')}")

                            elif message_type == "stats_update":
                                stats_data = data.get('data', {})
                                total_convs = stats_data.get('total_conversations', 0)
                                msg_per_min = stats_data.get('messages_per_minute', 0)
                                avg_time = stats_data.get('average_response_time', 0)
                                print(f"   Total Conversations: {total_convs}")
                                print(f"   Messages/Minute: {msg_per_min}")
                                print(f"   Avg Response Time: {avg_time}ms")

                            elif message_type == "heartbeat":
                                print(f"   💓 Heartbeat received")

                        except json.JSONDecodeError:
                            print(f"   ⚠️  Non-JSON message: {message[:100]}...")

                    except asyncio.TimeoutError:
                        print(f"\n⏰ Timeout reached (15 seconds) - no more messages received")
                        break

            except websockets.exceptions.ConnectionClosed:
                print("\n🔌 WebSocket connection closed by server")

            elapsed = (datetime.now() - start_time).total_seconds()

            print(f"\n📊 Test Results:")
            print(f"   Duration: {elapsed:.1f} seconds")
            print(f"   Total messages received: {message_count}")
            print(f"   Messages per second: {message_count / elapsed:.2f}")

            if message_count > 0:
                print(f"\n✅ WebSocket connectivity test PASSED!")
                print(f"   - Connection established successfully")
                print(f"   - Received {message_count} real-time messages")
                print(f"   - Backend is actively generating and broadcasting data")
            else:
                print(f"\n⚠️  WebSocket connectivity test PARTIAL:")
                print(f"   - Connection established successfully")
                print(f"   - No messages received (backend may be quiet)")
                print(f"   - This is normal if no conversations are being generated")

    except ConnectionRefusedError:
        print("❌ Connection refused - is the backend running on port 8000?")
        print("   Start the backend with: cd backend && python -m uvicorn main:app --reload --port 8000")
        return False

    except Exception as e:
        print(f"❌ WebSocket test failed: {str(e)}")
        return False

    return True

async def main():
    success = await test_websocket()

    print(f"\n{'='*60}")

    if success:
        print("🎉 Real-time connectivity confirmed!")
        print("   The frontend should be able to receive live updates")
        print("   Visit http://localhost:3000 to see the dashboard in action")
    else:
        print("💥 WebSocket connectivity issues detected")
        print("   Check that the backend is running and accessible")

    print(f"\n🔗 Quick Links:")
    print(f"   Frontend Dashboard: http://localhost:3000")
    print(f"   Backend API: http://localhost:8000")
    print(f"   Backend Health: http://localhost:8000/health")
    print(f"   Backend Stats: http://localhost:8000/stats")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")