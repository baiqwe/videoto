#!/usr/bin/env python3
"""
Verify relay platform (OPENAI_BASE_URL) API key
验证中转平台API key是否有效
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")

if not OPENAI_API_KEY:
    print("❌ No OPENAI_API_KEY found in .env")
    print("   For relay platform, you need OPENAI_API_KEY (not GEMINI_API_KEY)")
    exit(1)

if not OPENAI_BASE_URL:
    print("❌ No OPENAI_BASE_URL found in .env")
    print("   For relay platform, you need to set the base URL")
    print("   Example: OPENAI_BASE_URL=https://api.your-relay.com/v1")
    exit(1)

print(f"🔌 Testing relay platform API")
print(f"   Base URL: {OPENAI_BASE_URL}")
print(f"   API Key ending in: ...{OPENAI_API_KEY[-4:]}")
print()

# Test API call
headers = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json"
}

# Try a minimal API call
payload = {
    "model": "gpt-3.5-turbo",
    "messages": [
        {"role": "user", "content": "Say 'API test OK' in 3 words"}
    ],
    "max_tokens": 10
}

try:
    print("📡 Sending test request...")
    response = requests.post(
        f"{OPENAI_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        content = result['choices'][0]['message']['content']
        print(f"✅ API key is VALID!")
        print(f"   Response: {content}")
        print(f"   Model: {result.get('model', 'N/A')}")
        if 'usage' in result:
            print(f"   Tokens used: {result['usage'].get('total_tokens', 'N/A')}")
    else:
        print(f"❌ API call failed")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        exit(1)
        
except requests.exceptions.Timeout:
    print("❌ Request timeout - API endpoint may be slow or unreachable")
    exit(1)
except requests.exceptions.RequestException as e:
    print(f"❌ Network error: {e}")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

print()
print("🎉 Relay platform API key verification successful!")
