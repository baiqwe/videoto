import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

EXAMPLES = [
    {
        "url": "https://www.youtube.com/watch?v=ZVnjOPwW4ZA",
        "title": "Build a Next.js App",
        "category": "Coding"
    },
    {
        "url": "https://www.youtube.com/watch?v=yV6et8-Utbs",
        "title": "Mastering Photoshop Layers",
        "category": "Design"
    },
    {
        "url": "https://www.youtube.com/watch?v=IW6Acf-RHRY",
        "title": "Fix WiFi Connection",
        "category": "Tech Support"
    }
]

def create_examples():
    # 1. Get a user ID (First user found)
    print("🔍 Finding a user to assign projects to...")
    # Try querying auth.users via generic query if possible, or just customers table
    # Since we can't query auth.users easily with simple client sometimes, let's try customers
    try:
        res = supabase.table('customers').select('user_id').limit(1).execute()
        if not res.data:
            print("❌ No customers found. Please sign up a user first.")
            return
        
        user_id = res.data[0]['user_id']
        print(f"✅ Found User ID: {user_id}")
    except Exception as e:
        print(f"❌ Error finding user: {e}")
        return

    created_ids = []

    for ex in EXAMPLES:
        print(f"🚀 Creating project: {ex['title']} ({ex['url']})")
        
        project_data = {
            "user_id": user_id,
            "title": ex['title'],
            "video_source_url": ex['url'],
            "status": "pending",
            "credits_cost": 0, # Free for examples
            "generation_mode": "text_with_images"
        }
        
        try:
            res = supabase.table('projects').insert(project_data).execute()
            if res.data:
                pid = res.data[0]['id']
                print(f"   ✅ Created Project ID: {pid}")
                created_ids.append({
                    "id": pid,
                    "title": ex['title'],
                    "category": ex['category']
                })
            else:
                print("   ❌ Failed to insert project.")
        except Exception as e:
            print(f"   ❌ Error inserting project: {e}")

    print("\n🎉 All projects created! The worker should pick them up shortly.")
    print("\n--- COPY THESE IDs FOR FRONTEND ---")
    print("const EXAMPLES = [")
    for item in created_ids:
        print(f"  {{")
        print(f"    id: \"{item['id']}\",")
        print(f"    title: \"{item['title']}\",")
        print(f"    category: \"{item['category']}\",")
        print(f"    image: \"/examples/coding.jpg\", // TODO: Replace with real screenshot url or placeholder")
        print(f"    steps: 12 // Dynamic?")
        print(f"  }},")
    print("];")

if __name__ == "__main__":
    create_examples()
