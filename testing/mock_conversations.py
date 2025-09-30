#!/usr/bin/env python3
"""
Mock Conversations - Send test conversation data to backend every 5 seconds
"""

import requests
import time
from datetime import datetime
from colorama import init, Fore, Style

init(autoreset=True)

BASE_URL = "http://localhost:8000"

# Sample conversations to cycle through
MOCK_CONVERSATIONS = [
    {
        "user_message": "What are the top KPIs for Q4?",
        "polly_response": "Based on our analysis, the top KPIs for Q4 are: 1) Revenue Growth (15% target), 2) Customer Acquisition Cost (CAC), and 3) Net Promoter Score (NPS).",
        "prompt_name": "kpi_analysis"
    },
    {
        "user_message": "How is our customer retention looking?",
        "polly_response": "Customer retention is at 87% this quarter, which is above our 85% target. Key factors include improved onboarding and enhanced customer support.",
        "prompt_name": "retention_analysis"
    },
    {
        "user_message": "Show me sales data for last month",
        "polly_response": "Last month's sales totaled $1.2M, up 8% from the previous month. Top performing region was EMEA with 35% of total sales.",
        "prompt_name": "sales_query"
    },
    {
        "user_message": "What's our churn rate?",
        "polly_response": "Current churn rate is 3.5%, down from 4.2% last quarter. This improvement is due to our new customer success initiatives.",
        "prompt_name": "churn_analysis"
    },
    {
        "user_message": "Compare Q3 vs Q2 performance",
        "polly_response": "Q3 showed 12% revenue growth vs Q2, with improved margins of 2.3%. Customer acquisition increased by 18% while CAC decreased by 7%.",
        "prompt_name": "quarterly_comparison"
    }
]


def send_conversation(conversation, index):
    """Send a conversation to the webhook endpoint"""
    payload = {
        **conversation,
        "timestamp": datetime.now().isoformat(),
        "model": "gpt-4",
        "latency_ms": 800 + (index * 100),
        "tokens_used": {
            "prompt": 40 + (index * 5),
            "completion": 60 + (index * 10),
            "total": 100 + (index * 15)
        },
        "status": "success"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/webhook/conversation",
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            print(f"{Fore.GREEN}✅ [{index + 1}/5] Sent: {conversation['user_message'][:50]}...{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.RED}❌ [{index + 1}/5] Failed: {response.status_code}{Style.RESET_ALL}")
            return False

    except Exception as e:
        print(f"{Fore.RED}❌ [{index + 1}/5] Error: {e}{Style.RESET_ALL}")
        return False


def main():
    print(f"\n{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.BLUE}  Mock Conversations - Sending 5 messages over 25 seconds{Style.RESET_ALL}")
    print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}\n")

    # Check backend
    try:
        requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"{Fore.GREEN}✅ Backend is running{Style.RESET_ALL}\n")
    except:
        print(f"{Fore.RED}❌ Backend not running. Start it first:{Style.RESET_ALL}")
        print("  cd backend && python -m uvicorn main:app --reload --port 8000\n")
        return

    # Send 5 messages, one every 5 seconds
    for i in range(5):
        send_conversation(MOCK_CONVERSATIONS[i], i)

        if i < 4:  # Don't wait after the last message
            print(f"{Fore.CYAN}⏳ Waiting 5 seconds...{Style.RESET_ALL}\n")
            time.sleep(5)

    print(f"\n{Fore.GREEN}✨ All 5 messages sent! Check http://localhost:3000 to see them.{Style.RESET_ALL}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Interrupted by user{Style.RESET_ALL}")