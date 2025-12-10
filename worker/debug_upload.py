
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "guide_images")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create a dummy file
with open("test_upload.txt", "w") as f:
    f.write("Test content")

print(f"☁️  Testing upload to {STORAGE_BUCKET}...")
try:
    with open("test_upload.txt", "rb") as f:
        response = supabase.storage.from_(STORAGE_BUCKET).upload(
            "debug/test_upload.txt",
            f.read(),
            file_options={"content-type": "text/plain", "upsert": "true"}
        )
    print("✅ Upload successful!")
    print(response)
except Exception as e:
    print(f"❌ Upload failed: {e}")
    import traceback
    traceback.print_exc()
