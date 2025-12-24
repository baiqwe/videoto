import os
import requests
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Check for Relay Platform (OpenAI Compatible)
openai_key = os.getenv("OPENAI_API_KEY")
openai_base = os.getenv("OPENAI_BASE_URL")

if not api_key:
    if openai_key and openai_base:
        print("ℹ️  No GEMINI_API_KEY, but Relay Platform detected.")
        print(f"🔌 Testing Relay: {openai_base}")
        
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        
        try:
            # Minimal test request
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 5
            }
            
            response = requests.post(
                f"{openai_base}/chat/completions",
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                print("✅ Relay Platform API is VALID!")
                print("   (Worker will use Relay for AI analysis)")
                exit(0)
            else:
                print(f"❌ Relay Platform Test Failed: {response.status_code} - {response.text[:100]}")
                exit(1)
                
        except Exception as e:
            print(f"❌ Relay Connection Error: {e}")
            exit(1)
            
    else:
        print("❌ No GEMINI_API_KEY found in .env")
        print("   AND no valid Relay Platform configuration (OPENAI_API_KEY + OPENAI_BASE_URL)")
        exit(1)

print(f"Testing Gemini key ending in: ...{api_key[-4:]}")
genai.configure(api_key=api_key)

try:
    print("Listing available models...")
    models = list(genai.list_models())
    found = False
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f" - {m.name}")
            found = True
    
    if not found:
        print("⚠️  No models found suitable for generateContent.")
    else:
        print("✅ Gemini Key is valid and can list models.")
        
except Exception as e:
    print(f"❌ Verification failed: {e}")
