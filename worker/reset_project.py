
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get latest project
response = supabase.table('projects').select('*').order('created_at', desc=True).limit(1).execute()

if response.data:
    project_id = response.data[0]['id']
    print(f"🔄 Resetting project {project_id} to PENDING...")
    try:
        supabase.table('projects').update({
            'status': 'pending',
            'error_message': None
        }).eq('id', project_id).execute()
        
        # Delete existing steps to avoid duplicates
        supabase.table('steps').delete().eq('project_id', project_id).execute()
        print("✅ Reset complete.")
    except Exception as e:
        print(f"❌ Error resetting project: {e}")
else:
    print("❌ No project found.")
