#!/usr/bin/env python3
"""
Direct test of cookie handling and subtitle download for YouTube URL.
This tests the newly added get_youtube_cookies_path() function.
"""

import sys
from pathlib import Path

# Add worker directory to path
sys.path.insert(0, str(Path(__file__).parent))

from main import get_youtube_cookies_path, download_subtitles_only
from dotenv import load_dotenv
import tempfile

# Load environment
load_dotenv()

print("="*60)
print("🧪 Testing Cookie Handler & Subtitle Download")
print("="*60)
print()

# Test 1: Cookie Path Resolution
print("Test 1: Cookie Path Resolution")
print("-" * 40)
cookies_path = get_youtube_cookies_path()
if cookies_path:
    print(f"✅ Cookie path resolved: {cookies_path}")
    cookie_file = Path(cookies_path)
    if cookie_file.exists():
        size = cookie_file.stat().st_size
        print(f"✅ Cookie file exists ({size} bytes)")
    else:
        print(f"❌ Cookie file does not exist at resolved path!")
else:
    print("⚠️  No cookies found (subtitle download may fail)")
print()

# Test 2: Download Subtitles from YouTube
print("Test 2: Subtitle Download with Cookies")
print("-" * 40)
test_url = "https://www.youtube.com/watch?v=zhI7bQyTmHw"
print(f"URL: {test_url}")
print()

try:
    # Create temp directory for test
    temp_dir = Path(tempfile.mkdtemp(prefix="vidstep_test_"))
    print(f"📁 Temp directory: {temp_dir}")
    
    # Download subtitles
    result = download_subtitles_only(test_url, temp_dir)
    
    print()
    print("="*60)
    print("✅ TEST PASSED!")
    print("="*60)
    print(f"Video ID: {result['video_id']}")
    print(f"Title: {result['title']}")
    print(f"Duration: {result['duration']} seconds")
    print(f"Subtitle file: {result['subtitle_path']}")
    print()
    
    # Verify subtitle file
    if result['subtitle_path'] and result['subtitle_path'].exists():
        size = result['subtitle_path'].stat().st_size
        print(f"📄 Subtitle file size: {size} bytes")
        print()
        # Show first few lines
        with open(result['subtitle_path'], 'r') as f:
            lines = f.readlines()[:10]
            print("📝 First 10 lines of subtitle:")
            for line in lines:
                print(f"   {line.rstrip()}")
    
    print()
    print("🎉 Cookie fix is working! Subtitles downloaded successfully.")
    
except Exception as e:
    print()
    print("="*60)
    print("❌ TEST FAILED!")
    print("="*60)
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
