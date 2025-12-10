
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get latest project
response = supabase.table('projects').select('*').order('created_at', desc=True).limit(1).execute()
if response.data:
    project_id = response.data[0]['id']
    print(f"🔄 Resetting project {project_id} to PENDING...")
    supabase.table('projects').update({'status': 'pending'}).eq('id', project_id).execute()
    
    # Delete existing steps to avoid duplicates (logic in main.py usually handles overwrites but cleaner to wipe)
    supabase.table('steps').delete().eq('project_id', project_id).execute()
    print("✅ Reset complete.")
else:
    print("❌ No project found.")
