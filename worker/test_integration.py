#!/usr/bin/env python3
"""
Test Storyboard integration with main worker logic
"""

import sys
sys.path.insert(0, '/Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1/worker')

from storyboard_extractor import StoryboardExtractor
from pathlib import Path
import tempfile

def test_storyboard_flow():
    """模拟 main.py 中的截图流程"""
    
    print("🧪 Testing Storyboard integration flow...")
    print("=" * 60)
    
    # Test video
    video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    video_id = "dQw4w9WgXcQ"
    timestamp = 45.5
    
    # Create temp directory
    project_dir = Path(tempfile.mkdtemp())
    
    print(f"\n1️⃣  Test Parameters:")
    print(f"   Video URL: {video_url}")
    print(f"   Video ID: {video_id}")
    print(f"   Timestamp: {timestamp}s")
    print(f"   Output dir: {project_dir}")
    
    try:
        # Simulate the code in main.py
        screenshot_filename = f"{video_id}_{int(timestamp * 1000)}.jpg"
        screenshot_path_obj = project_dir / screenshot_filename
        
        print(f"\n2️⃣  Creating Storyboard Extractor...")
        extractor = StoryboardExtractor(video_url)
        
        print(f"\n3️⃣  Extracting thumbnail...")
        extractor.get_thumbnail_at_timestamp(timestamp, screenshot_path_obj)
        screenshot_path = str(screenshot_path_obj)
        
        print(f"\n✅ Screenshot extraction successful!")
        print(f"   Path: {screenshot_path}")
        print(f"   Exists: {screenshot_path_obj.exists()}")
        print(f"   Size: {screenshot_path_obj.stat().st_size} bytes")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        import shutil
        if project_dir.exists():
            shutil.rmtree(project_dir)
            print(f"\n🧹 Cleaned up temp directory")

if __name__ == '__main__':
    success = test_storyboard_flow()
    sys.exit(0 if success else 1)
