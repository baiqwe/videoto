#!/usr/bin/env python3
"""
Encode cookies.txt to Base64 for use in YOUTUBE_COOKIES_B64 environment variable

This solves the newline issue when pasting multi-line cookies into Zeabur environment variables.
"""

import base64
from pathlib import Path

def encode_cookies_to_base64(cookies_file: str = "cookies.txt"):
    """
    Read cookies.txt and encode to base64
    
    Args:
        cookies_file: Path to cookies.txt file
    
    Returns:
        Base64 encoded string
    """
    cookie_path = Path(cookies_file)
    
    if not cookie_path.exists():
        print(f"❌ Error: {cookies_file} not found!")
        print(f"   Expected location: {cookie_path.absolute()}")
        return None
    
    try:
        # Read cookies file
        with open(cookie_path, 'r', encoding='utf-8') as f:
            cookies_content = f.read()
        
        print(f"✅ Loaded cookies from: {cookie_path.absolute()}")
        print(f"📊 Original size: {len(cookies_content)} characters")
        
        # Encode to base64
        cookies_bytes = cookies_content.encode('utf-8')
        cookies_b64 = base64.b64encode(cookies_bytes).decode('utf-8')
        
        print(f"✅ Encoded to base64: {len(cookies_b64)} characters")
        print("\n" + "="*60)
        print("📋 Copy this value to Zeabur environment variable:")
        print("="*60)
        print(f"\nVariable name: YOUTUBE_COOKIES_B64")
        print(f"\nVariable value:\n")
        print(cookies_b64)
        print("\n" + "="*60)
        
        # Save to file for easy copying
        output_file = cookie_path.parent / "cookies_base64.txt"
        output_file.write_text(cookies_b64)
        print(f"\n💾 Also saved to: {output_file}")
        print(f"\nYou can copy from the file using:")
        print(f"   cat {output_file} | pbcopy   # macOS")
        print(f"   cat {output_file} | xclip    # Linux")
        
        return cookies_b64
        
    except Exception as e:
        print(f"❌ Error encoding cookies: {e}")
        return None


if __name__ == "__main__":
    import sys
    
    # Allow custom path as argument
    cookies_file = sys.argv[1] if len(sys.argv) > 1 else "cookies.txt"
    
    result = encode_cookies_to_base64(cookies_file)
    
    if result:
        print("\n✅ Success! Follow these steps:")
        print("   1. Go to Zeabur Dashboard → Your Worker Service → Variables")
        print("   2. Add/Update variable: YOUTUBE_COOKIES_B64")
        print("   3. Paste the base64 value shown above")
        print("   4. Remove the old YOUTUBE_COOKIES variable (if exists)")
        print("   5. Save and restart the service")
    else:
        sys.exit(1)
