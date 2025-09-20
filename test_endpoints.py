#!/usr/bin/env python3
"""
Polly Monitor - Comprehensive Endpoint and WebSocket Tester

This script tests all API endpoints and WebSocket connectivity to verify
the application is working correctly.
"""

import asyncio
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any

import requests
import websockets
from colorama import init, Fore, Back, Style

# Initialize colorama for cross-platform colored output
init(autoreset=True)

# Configuration
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"
TIMEOUT = 10

class PollyMonitorTester:
    def __init__(self):
        self.test_results = []
        self.ws_messages = []

    def log_success(self, message: str):
        print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")
        self.test_results.append(("PASS", message))

    def log_error(self, message: str):
        print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")
        self.test_results.append(("FAIL", message))

    def log_info(self, message: str):
        print(f"{Fore.CYAN}ℹ️  {message}{Style.RESET_ALL}")

    def log_warning(self, message: str):
        print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")

    def test_server_connectivity(self) -> bool:
        """Test if the backend server is running"""
        self.log_info("Testing server connectivity...")
        try:
            response = requests.get(f"{BASE_URL}/", timeout=5)
            if response.status_code in [200, 404]:  # 404 is ok, means server is running
                self.log_success("Backend server is running")
                return True
            else:
                self.log_error(f"Server returned status code: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            self.log_error("Cannot connect to backend server. Is it running on port 8000?")
            return False
        except Exception as e:
            self.log_error(f"Server connectivity test failed: {str(e)}")
            return False

    def test_health_endpoint(self) -> Dict[str, Any]:
        """Test the /health endpoint"""
        self.log_info("Testing /health endpoint...")
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)

            if response.status_code == 200:
                data = response.json()
                self.log_success("Health endpoint responded successfully")

                # Check required fields
                required_fields = ["status", "promptlayer_connected", "timestamp"]
                for field in required_fields:
                    if field in data:
                        self.log_success(f"  ✓ {field}: {data[field]}")
                    else:
                        self.log_error(f"  ✗ Missing field: {field}")

                if data.get("promptlayer_connected"):
                    self.log_success("  ✓ PromptLayer API connection is working")
                else:
                    self.log_warning("  ⚠ PromptLayer API connection failed - check API key")

                return data
            else:
                self.log_error(f"Health endpoint returned status: {response.status_code}")
                return {}

        except Exception as e:
            self.log_error(f"Health endpoint test failed: {str(e)}")
            return {}

    def test_conversations_endpoint(self) -> Dict[str, Any]:
        """Test the /conversations/recent endpoint"""
        self.log_info("Testing /conversations/recent endpoint...")
        try:
            response = requests.get(f"{BASE_URL}/conversations/recent?limit=10", timeout=TIMEOUT)

            if response.status_code == 200:
                data = response.json()
                self.log_success("Conversations endpoint responded successfully")

                # Check response structure
                if "conversations" in data:
                    conversations = data["conversations"]
                    self.log_success(f"  ✓ Found {len(conversations)} conversations")

                    if conversations:
                        # Check first conversation structure
                        conv = conversations[0]
                        required_fields = ["id", "type", "timestamp", "user_message", "polly_response", "metadata"]
                        for field in required_fields:
                            if field in conv:
                                self.log_success(f"    ✓ {field}: present")
                            else:
                                self.log_warning(f"    ⚠ {field}: missing")
                    else:
                        self.log_info("  No conversations found (this is normal if no data exists)")

                    return data
                else:
                    self.log_error("  ✗ Response missing 'conversations' field")
                    return {}
            else:
                self.log_error(f"Conversations endpoint returned status: {response.status_code}")
                return {}

        except Exception as e:
            self.log_error(f"Conversations endpoint test failed: {str(e)}")
            return {}

    def test_stats_endpoint(self) -> Dict[str, Any]:
        """Test the /stats endpoint"""
        self.log_info("Testing /stats endpoint...")
        try:
            response = requests.get(f"{BASE_URL}/stats", timeout=TIMEOUT)

            if response.status_code == 200:
                data = response.json()
                self.log_success("Stats endpoint responded successfully")

                # Check expected fields
                expected_fields = [
                    "total_conversations", "messages_per_minute",
                    "average_response_time", "timestamp"
                ]
                for field in expected_fields:
                    if field in data:
                        self.log_success(f"  ✓ {field}: {data[field]}")
                    else:
                        self.log_warning(f"  ⚠ {field}: missing")

                return data
            else:
                self.log_error(f"Stats endpoint returned status: {response.status_code}")
                return {}

        except Exception as e:
            self.log_error(f"Stats endpoint test failed: {str(e)}")
            return {}

    async def test_websocket_connection(self) -> bool:
        """Test WebSocket connectivity and message reception"""
        self.log_info("Testing WebSocket connection...")
        try:
            async with websockets.connect(WS_URL, timeout=TIMEOUT) as websocket:
                self.log_success("WebSocket connection established")

                # Wait for initial messages
                messages_received = 0
                start_time = time.time()

                while time.time() - start_time < 5 and messages_received < 3:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                        data = json.loads(message)
                        messages_received += 1

                        self.log_success(f"  ✓ Received message {messages_received}: {data.get('type', 'unknown')}")
                        self.ws_messages.append(data)

                        # Analyze message types
                        if data.get("type") == "new_message":
                            self.log_success("    → New conversation message received")
                        elif data.get("type") == "stats_update":
                            self.log_success("    → Stats update received")
                        elif data.get("type") == "heartbeat":
                            self.log_success("    → Heartbeat received")
                        else:
                            self.log_info(f"    → Unknown message type: {data.get('type')}")

                    except asyncio.TimeoutError:
                        break

                if messages_received > 0:
                    self.log_success(f"WebSocket test completed - received {messages_received} messages")
                    return True
                else:
                    self.log_warning("WebSocket connected but no messages received (this may be normal)")
                    return True

        except Exception as e:
            self.log_error(f"WebSocket test failed: {str(e)}")
            return False

    def test_cors_headers(self) -> bool:
        """Test CORS headers for frontend compatibility"""
        self.log_info("Testing CORS headers...")
        try:
            # Simulate a browser preflight request
            headers = {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }

            response = requests.options(f"{BASE_URL}/health", headers=headers, timeout=TIMEOUT)

            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            }

            if cors_headers['Access-Control-Allow-Origin']:
                self.log_success(f"  ✓ CORS Origin: {cors_headers['Access-Control-Allow-Origin']}")
            else:
                self.log_warning("  ⚠ CORS headers not found - frontend may have connection issues")

            return True

        except Exception as e:
            self.log_error(f"CORS test failed: {str(e)}")
            return False

    def generate_test_summary(self):
        """Generate a comprehensive test summary"""
        print(f"\n{Back.BLUE}{Fore.WHITE} TEST SUMMARY {Style.RESET_ALL}")
        print("=" * 50)

        passed = len([r for r in self.test_results if r[0] == "PASS"])
        failed = len([r for r in self.test_results if r[0] == "FAIL"])

        print(f"Total Tests: {len(self.test_results)}")
        print(f"{Fore.GREEN}Passed: {passed}{Style.RESET_ALL}")
        print(f"{Fore.RED}Failed: {failed}{Style.RESET_ALL}")

        if failed > 0:
            print(f"\n{Fore.RED}Failed Tests:{Style.RESET_ALL}")
            for result_type, message in self.test_results:
                if result_type == "FAIL":
                    print(f"  ❌ {message}")

        if self.ws_messages:
            print(f"\n{Fore.CYAN}WebSocket Messages Received:{Style.RESET_ALL}")
            for i, msg in enumerate(self.ws_messages[:3], 1):
                print(f"  {i}. Type: {msg.get('type', 'unknown')}")
                if msg.get('type') == 'new_message':
                    print(f"     User: {msg.get('user_message', 'N/A')[:50]}...")
                    print(f"     Polly: {msg.get('polly_response', 'N/A')[:50]}...")

        print(f"\n{Back.GREEN if failed == 0 else Back.RED}{Fore.WHITE} " +
              f"{'ALL TESTS PASSED' if failed == 0 else 'SOME TESTS FAILED'} " +
              f"{Style.RESET_ALL}")

    async def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"{Back.BLUE}{Fore.WHITE} POLLY MONITOR - ENDPOINT TESTER {Style.RESET_ALL}")
        print(f"Testing backend at: {BASE_URL}")
        print(f"Testing WebSocket at: {WS_URL}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)

        # Test 1: Server connectivity
        if not self.test_server_connectivity():
            self.log_error("Cannot proceed - backend server is not running")
            print(f"\n{Fore.YELLOW}To start the backend server:{Style.RESET_ALL}")
            print("cd backend")
            print("python -m uvicorn main:app --reload --port 8000")
            return

        # Test 2: Health endpoint
        health_data = self.test_health_endpoint()

        # Test 3: Conversations endpoint
        conversations_data = self.test_conversations_endpoint()

        # Test 4: Stats endpoint
        stats_data = self.test_stats_endpoint()

        # Test 5: CORS headers
        self.test_cors_headers()

        # Test 6: WebSocket connection
        await self.test_websocket_connection()

        # Generate summary
        self.generate_test_summary()

        # Additional recommendations
        print(f"\n{Fore.CYAN}Recommendations:{Style.RESET_ALL}")

        if health_data.get("promptlayer_connected") is False:
            print("  • Update your PromptLayer API key in backend/.env")
            print("  • Verify the API key is valid in PromptLayer dashboard")

        if not conversations_data.get("conversations"):
            print("  • No conversation data found - this is normal for new installations")
            print("  • Conversations will appear when Polly processes requests through PromptLayer")

        print("  • Start the frontend with: cd frontend && npm start")
        print("  • Visit http://localhost:3000 to see the dashboard")

def main():
    """Main function to run the tester"""
    tester = PollyMonitorTester()

    try:
        # Install required packages if not present
        try:
            import colorama
            import websockets
        except ImportError:
            print("Installing required packages...")
            import subprocess
            subprocess.run([sys.executable, "-m", "pip", "install", "colorama", "websockets"], check=True)
            import colorama
            import websockets
            colorama.init(autoreset=True)

        # Run tests
        asyncio.run(tester.run_all_tests())

    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted by user{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}Test runner failed: {str(e)}{Style.RESET_ALL}")

if __name__ == "__main__":
    main()