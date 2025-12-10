import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
base_url = "https://www.dmxapi.cn/v1"

print(f"Testing huge payload on: {base_url}")
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Generate a large "transcript" (approx 50kb)
fake_transcript = "This is a sentence about video analysis. " * 2000 

data = {
    "model": "gpt-3.5-turbo",
    "messages": [
        {"role": "system", "content": "Summarize this."},
        {"role": "user", "content": fake_transcript}
    ],
    "max_tokens": 100
}

try:
    print("Sending request...")
    response = requests.post(
        f"{base_url}/chat/completions", 
        headers=headers, 
        json=data, 
        timeout=30
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Success!")
    else:
        print(f"❌ Failed: {response.text[:200]}")

except Exception as e:
    print(f"❌ Connection Error: {e}")
