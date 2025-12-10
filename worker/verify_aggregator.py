import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ No GEMINI_API_KEY found")
    exit(1)

print(f"Testing key ending in: ...{api_key[-4:]}")

# Common aggregator patterns
base_urls = [
    "https://www.dmxapi.cn/v1",
]

# Aggregators often support standard model names better
model_to_test = "gpt-3.5-turbo"

print("\n--- Testing OpenAI Compatibility Mode ---")
for base_url in base_urls:
    print(f"Trying Base URL: {base_url}")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model_to_test,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 10
    }
    
    try:
        response = requests.post(
            f"{base_url}/chat/completions", 
            headers=headers, 
            json=data, 
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ SUCCESS! Response: {response.text[:100]}...")
            print(f"   👉 Working URL: {base_url}")
            break
        else:
            print(f"   ❌ Failed: {response.text[:100]}...")
    except Exception as e:
        print(f"   ⚠️ Connection Error: {e}")

print("\n--- Testing Google Native Mode (unlikely for aggregators) ---")
# This rarely works for aggregators unless they proxy the exact GRPC/REST path
import google.generativeai as genai
try:
    genai.configure(api_key=api_key, transport='rest')
    model = genai.GenerativeModel('gemini-1.5-flash')
    # Note: Client library doesn't easily support custom base_url for the whole service without digging into transport
    print("   Skipping native test as standard library doesn't easily support arbitrary custom domains.")
except:
    pass
