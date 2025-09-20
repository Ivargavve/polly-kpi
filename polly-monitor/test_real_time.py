#!/usr/bin/env python3
"""
Real-Time Polly Monitor Test

This script demonstrates how your Polly system can send real-time data
to the monitoring dashboard using webhook endpoints.
"""

import requests
import json
import time
import asyncio
from datetime import datetime

MONITOR_BASE_URL = "http://localhost:8000"

def send_user_message(user_message: str, conversation_id: str = None):
    """Simulate sending a user message to Polly"""
    if not conversation_id:
        conversation_id = f"conv_{int(time.time() * 1000)}"

    payload = {
        "id": conversation_id,
        "message": user_message,
        "timestamp": datetime.now().isoformat(),
        "prompt_name": "user_query",
        "model": "gpt-4"
    }

    print(f"📤 Sending user message: {user_message}")

    try:
        response = requests.post(f"{MONITOR_BASE_URL}/webhook/user-message", json=payload)
        if response.status_code == 200:
            print(f"✅ User message sent successfully")
        else:
            print(f"❌ Error sending user message: {response.status_code}")
        return conversation_id
    except Exception as e:
        print(f"❌ Error: {e}")
        return conversation_id

def send_polly_response(user_message: str, polly_response: str, conversation_id: str, latency_ms: int = 1500):
    """Simulate Polly responding to the user"""
    payload = {
        "id": conversation_id,
        "user_message": user_message,
        "response": polly_response,
        "timestamp": datetime.now().isoformat(),
        "prompt_name": "polly_assistant",
        "model": "gpt-4",
        "latency_ms": latency_ms,
        "tokens_used": {
            "prompt_tokens": len(user_message.split()) * 2,
            "completion_tokens": len(polly_response.split()) * 2
        }
    }

    print(f"🤖 Sending Polly response: {polly_response[:50]}...")

    try:
        response = requests.post(f"{MONITOR_BASE_URL}/webhook/polly-response", json=payload)
        if response.status_code == 200:
            print(f"✅ Polly response sent successfully")
        else:
            print(f"❌ Error sending Polly response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def send_complete_conversation(user_message: str, polly_response: str):
    """Send a complete conversation in one go"""
    conversation_id = f"conv_{int(time.time() * 1000)}"

    payload = {
        "id": conversation_id,
        "user_message": user_message,
        "polly_response": polly_response,
        "timestamp": datetime.now().isoformat(),
        "prompt_name": "polly_chat",
        "model": "gpt-4",
        "latency_ms": 1200,
        "tokens_used": {
            "prompt_tokens": len(user_message.split()) * 2,
            "completion_tokens": len(polly_response.split()) * 2
        }
    }

    print(f"💬 Sending complete conversation:")
    print(f"   User: {user_message}")
    print(f"   Polly: {polly_response[:50]}...")

    try:
        response = requests.post(f"{MONITOR_BASE_URL}/webhook/conversation", json=payload)
        if response.status_code == 200:
            print(f"✅ Complete conversation sent successfully")
        else:
            print(f"❌ Error sending conversation: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def demo_real_time_conversation():
    """Demonstrate a real-time conversation flow"""
    print("🎬 Starting Real-Time Conversation Demo")
    print("=" * 50)

    # Conversation 1: Step by step
    print("\\n📍 Demo 1: Step-by-step conversation")
    conv_id = send_user_message("What's the weather like today?")
    time.sleep(2)  # Simulate processing time
    send_polly_response(
        "What's the weather like today?",
        "I don't have access to real-time weather data, but I can help you find weather information through weather websites or apps like Weather.com or your local weather service.",
        conv_id,
        1800
    )

    time.sleep(3)

    # Conversation 2: Complete conversation
    print("\\n📍 Demo 2: Complete conversation")
    send_complete_conversation(
        "Can you help me write a Python function to calculate fibonacci numbers?",
        "Sure! Here's a Python function to calculate Fibonacci numbers:\\n\\n```python\\ndef fibonacci(n):\\n    if n <= 1:\\n        return n\\n    return fibonacci(n-1) + fibonacci(n-2)\\n```\\n\\nThis recursive function calculates the nth Fibonacci number. For better performance with larger numbers, you might want to use memoization or an iterative approach."
    )

    time.sleep(3)

    # Conversation 3: Another step-by-step
    print("\\n📍 Demo 3: Another real-time conversation")
    conv_id = send_user_message("Explain machine learning in simple terms")
    time.sleep(2.5)  # Simulate longer processing
    send_polly_response(
        "Explain machine learning in simple terms",
        "Machine learning is like teaching a computer to recognize patterns and make predictions, similar to how humans learn from experience. Instead of programming explicit rules, we show the computer lots of examples, and it learns to identify patterns and make decisions on its own.",
        conv_id,
        2100
    )

def demo_continuous_monitoring():
    """Demonstrate continuous real-time monitoring"""
    print("\\n🔄 Starting Continuous Monitoring Demo")
    print("This will send conversations every 5-10 seconds for 30 seconds...")
    print("Watch your frontend dashboard at http://localhost:3000")

    conversations = [
        ("How do I bake a chocolate cake?", "To bake a chocolate cake, you'll need flour, sugar, cocoa powder, eggs, and butter. Mix the dry ingredients, add wet ingredients, bake at 350°F for 30-35 minutes."),
        ("What's the capital of France?", "The capital of France is Paris. It's located in the north-central part of the country and is known for landmarks like the Eiffel Tower and the Louvre Museum."),
        ("How does photosynthesis work?", "Photosynthesis is the process plants use to convert sunlight, carbon dioxide, and water into glucose and oxygen. It occurs mainly in the leaves using chlorophyll."),
        ("What's the difference between HTTP and HTTPS?", "HTTP transmits data in plain text, while HTTPS encrypts data using SSL/TLS. HTTPS is more secure and is now the standard for most websites."),
        ("How do I improve my sleep quality?", "To improve sleep quality: maintain a consistent schedule, create a relaxing bedtime routine, avoid screens before bed, keep your room cool and dark, and avoid caffeine late in the day.")
    ]

    for i, (user_msg, polly_resp) in enumerate(conversations):
        print(f"\\n🔄 Sending conversation {i+1}/5")
        send_complete_conversation(user_msg, polly_resp)
        time.sleep(6)  # Wait 6 seconds between conversations

def main():
    print("🤖 Polly Monitor - Real-Time Data Sender")
    print("🌐 Monitor Dashboard: http://localhost:3000")
    print("🔌 Backend API: http://localhost:8000")
    print("=" * 60)

    # Check if backend is running
    try:
        response = requests.get(f"{MONITOR_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
        else:
            print("⚠️ Backend responded but may have issues")
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("Make sure the backend is running with:")
        print("cd backend && python -m uvicorn main:app --reload --port 8000")
        return

    print("\\nChoose demo mode:")
    print("1. Single conversation demo")
    print("2. Continuous monitoring demo (30 seconds)")
    print("3. Both demos")

    try:
        choice = input("\\nEnter choice (1-3): ").strip()

        if choice in ["1", "3"]:
            demo_real_time_conversation()

        if choice in ["2", "3"]:
            if choice == "3":
                time.sleep(5)
            demo_continuous_monitoring()

        print("\\n🎉 Demo completed!")
        print("Visit http://localhost:3000 to see the real-time dashboard")

    except KeyboardInterrupt:
        print("\\n⚠️ Demo interrupted by user")
    except Exception as e:
        print(f"\\n❌ Demo failed: {e}")

if __name__ == "__main__":
    main()