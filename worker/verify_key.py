import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ No GEMINI_API_KEY found in .env")
    exit(1)

print(f"Testing key ending in: ...{api_key[-4:]}")
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
        print("✅ Key is valid and can list models.")
        
except Exception as e:
    print(f"❌ Verification failed: {e}")
