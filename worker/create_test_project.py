#!/usr/bin/env python3
"""
Test script to create a test project for the YouTube URL provided by the user.
This will test the complete end-to-end flow with cookie support.
"""

from supabase import create_client
from dotenv import load_dotenv
import os
import uuid
import sys

# Load environment variables
load_dotenv()

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ Error: Missing Supabase credentials in .env file")
    print("   Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

# Get a real user ID from the database
print("🔍 Fetching user ID from database...")
try:
    customer_result = supabase.table('customers').select('user_id').limit(1).execute()
    if not customer_result.data:
        print("❌ No customers found in database. Please create a user first.")
        sys.exit(1)
    user_id = customer_result.data[0]['user_id']
    print(f"✅ Using user ID: {user_id}")
except Exception as e:
    print(f"❌ Error fetching user: {e}")
    sys.exit(1)

# Test YouTube URL provided by user
test_url = "https://www.youtube.com/watch?v=zhI7bQyTmHw"

print("🧪 Creating test project for cookie verification...")
print(f"   URL: {test_url}")
print(f"   Title: Learn To Cook In Less Than 1 Hour")
print()

# Generate unique project ID
project_id = str(uuid.uuid4())

try:
    # Insert test project
    result = supabase.table('projects').insert({
        'id': project_id,
        'title': 'Test: Learn To Cook In Less Than 1 Hour (Cookie Fix Verification)',
        'video_source_url': test_url,
        'user_id': user_id,  # Use real user ID from database
        'status': 'pending',
        'generation_mode': 'text_with_images'
    }).execute()
    
    print(f"✅ Test project created successfully!")
    print(f"   Project ID: {project_id}")
    print(f"   Status: pending")
    print()
    print("📋 Next steps:")
    print("   1. Worker will pick up this project on next poll")
    print("   2. Watch worker logs for cookie usage messages")
    print("   3. Verify project status changes to 'completed'")
    print()
    print("🔍 Expected log output:")
    print("   📥 Downloading subtitles from: https://www.youtube.com/watch?v=zhI7bQyTmHw")
    print("   🍪 Using cookies from: /Users/.../worker/cookies.txt")
    print("   ✅ Found subtitle: zhI7bQyTmHw.en-US.vtt")
    print()
    print(f"💡 Monitor project: SELECT status FROM projects WHERE id = '{project_id}';")
    
except Exception as e:
    print(f"❌ Error creating test project: {e}")
    sys.exit(1)
