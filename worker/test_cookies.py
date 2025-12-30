#!/usr/bin/env python3
"""
测试 YouTube Cookies 是否有效

使用方法:
    python test_cookies.py <cookies_file_path>
    或
    python test_cookies.py --base64 <base64_encoded_cookies>
"""

import sys
import base64
import tempfile
from pathlib import Path
import yt_dlp

def test_cookies(cookies_path: str, test_url: str = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"):
    """测试 cookies 是否有效"""
    print(f"🧪 Testing cookies from: {cookies_path}")
    print(f"📺 Test video: {test_url}")
    print()
    
    # Check if file exists
    cookies_file = Path(cookies_path)
    if not cookies_file.exists():
        print(f"❌ Cookie file not found: {cookies_path}")
        return False
    
    file_size = cookies_file.stat().st_size
    print(f"📊 File size: {file_size} bytes")
    
    if file_size == 0:
        print(f"❌ Cookie file is empty")
        return False
    
    # Try to read first few lines
    try:
        with open(cookies_file, 'r', encoding='utf-8', errors='ignore') as f:
            first_lines = [f.readline() for _ in range(5)]
        print(f"📄 First lines:")
        for i, line in enumerate(first_lines, 1):
            if line.strip():
                print(f"   {i}: {line.strip()[:80]}")
        
        # Check if it's Netscape format
        if first_lines[0].startswith('# Netscape'):
            print(f"✅ Format: Netscape cookies format")
        elif 'youtube.com' in ''.join(first_lines).lower():
            print(f"✅ Format: Contains YouTube domain")
        else:
            print(f"⚠️ Format: Unknown format")
    except Exception as e:
        print(f"⚠️ Could not read as text: {e}")
        print(f"   (This is OK if cookies are in binary format)")
    
    # Test with yt-dlp
    print(f"\n🔄 Testing with yt-dlp...")
    ydl_opts = {
        'cookiefile': str(cookies_path),
        'skip_download': True,
        'quiet': False,
        'no_warnings': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(test_url, download=False)
            print(f"\n✅ SUCCESS! Cookies are working!")
            print(f"   Video title: {info.get('title', 'N/A')[:60]}")
            print(f"   Video ID: {info.get('id', 'N/A')}")
            print(f"   Duration: {info.get('duration', 0)} seconds")
            return True
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ FAILED: {error_msg}")
        
        if 'bot' in error_msg.lower() or 'sign in' in error_msg.lower():
            print(f"\n⚠️ YouTube is requiring verification")
            print(f"   Your cookies may be:")
            print(f"   - Expired (re-export from browser)")
            print(f"   - Invalid format")
            print(f"   - Not from a logged-in session")
        elif 'cookie' in error_msg.lower():
            print(f"\n⚠️ Cookie-related error")
            print(f"   Check if cookies are properly formatted")
        
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python test_cookies.py <cookies_file_path>")
        print("  python test_cookies.py --base64 <base64_encoded_cookies>")
        sys.exit(1)
    
    if sys.argv[1] == '--base64':
        if len(sys.argv) < 3:
            print("Error: Base64 string required")
            sys.exit(1)
        
        # Decode base64
        try:
            cookies_binary = base64.b64decode(sys.argv[2])
            temp_file = Path(tempfile.gettempdir()) / "test_cookies.txt"
            temp_file.write_bytes(cookies_binary)
            cookies_path = str(temp_file)
            print(f"📦 Decoded base64 to: {cookies_path}")
        except Exception as e:
            print(f"❌ Failed to decode base64: {e}")
            sys.exit(1)
    else:
        cookies_path = sys.argv[1]
    
    test_url = sys.argv[3] if len(sys.argv) > 3 else "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    success = test_cookies(cookies_path, test_url)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

