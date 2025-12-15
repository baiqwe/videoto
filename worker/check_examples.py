import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

urls = [
    "https://www.youtube.com/watch?v=ZVnjOPwW4ZA",
    "https://www.youtube.com/watch?v=yV6et8-Utbs",
    "https://www.youtube.com/watch?v=IW6Acf-RHRY"
]

print(f"Checking for {len(urls)} specific URLs...")

for url in urls:
    try:
        res = supabase.table('projects').select('*').eq('video_source_url', url).execute()
        if res.data:
            p = res.data[0]
            print(f"✅ Found: {p['title']}")
            print(f"   ID: {p['id']}")
            print(f"   Status: {p['status']}")
            
            # Fetch first step with image
            step_res = supabase.table('steps').select('image_path').eq('project_id', p['id']).not_.is_('image_path', 'null').limit(1).execute()
            if step_res.data:
                print(f"   Thumbnail: {step_res.data[0]['image_path']}")
            else:
                print("   ❌ No images found")
        else:
            print(f"❌ Missing: {url}")
    except Exception as e:
        print(f"Error checking {url}: {e}")
