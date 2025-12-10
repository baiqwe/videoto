
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Configuration missing")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get latest project
response = supabase.table('projects').select('*').order('created_at', desc=True).limit(1).execute()

if not response.data:
    print("❌ No projects found")
    exit(0)

project = response.data[0]
print(f"📌 Project ID: {project['id']}")
print(f"   Title: {project.get('title')}")
print(f"   Status: {project['status']}")
print(f"   Generation Mode: {project.get('generation_mode')}")
print(f"   Video Duration: {project.get('video_duration_seconds')}")
print(f"   Error: {project.get('error_message')}")

# Get steps
steps_response = supabase.table('steps').select('*').eq('project_id', project['id']).order('step_order').execute()

print(f"\n📑 Steps Found: {len(steps_response.data)}")
for step in steps_response.data:
    print(f"   [{step['step_order']}] {step.get('image_path') or 'NO_IMAGE'} | {step['title']}")
