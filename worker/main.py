#!/usr/bin/env python3
"""
Vidoc Python Worker
Processes video projects by:
1. Downloading subtitles from YouTube (NO video download)
2. Analyzing with AI using transcript (via OpenAI-compatible relay platform)
3. Extracting screenshots from YouTube Storyboard (lightweight)
4. Uploading to Supabase Storage
5. Updating project status
"""

import os
import time
import json
import tempfile
import shutil
import re
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv

import yt_dlp
from supabase import create_client, Client
import requests

# Optional imports for fallback methods (not needed for Storyboard)
try:
    import cv2
    import numpy as np
    import ffmpeg
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️ cv2/ffmpeg not available - using Storyboard only mode")

# Import Storyboard extractor for lightweight screenshot extraction
from storyboard_extractor import StoryboardExtractor

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET") or os.getenv("STORAGE_BUCKET", "guide_images")

# API Configuration - OpenRouter
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY:
    print(f"🔌 Using OpenRouter API at {OPENAI_BASE_URL}")
else:
    print("⚠️ Warning: OPENAI_API_KEY not set - processing will fail")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create temp directory for processing
TEMP_DIR = Path(tempfile.gettempdir()) / "vidoc_worker"
TEMP_DIR.mkdir(exist_ok=True)


def format_time(seconds: float) -> str:
    """Format seconds to HH:MM:SS"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def get_dynamic_prompt(default_prompt: str, prompt_key: str = 'gemini_video_prompt') -> str:
    """
    从数据库获取最新的 Prompt，如果获取失败则返回默认的硬编码 Prompt
    
    Args:
        default_prompt: 默认的 Prompt 字符串（作为后备）
        prompt_key: 配置键名，默认为 'gemini_video_prompt'
    
    Returns:
        Prompt 内容字符串
    """
    try:
        # 从 system_configs 表获取 Prompt
        response = supabase.table('system_configs').select('value').eq('key', prompt_key).single().execute()
        if response.data and response.data.get('value'):
            print(f"✨ Loaded dynamic prompt from DB: {prompt_key}")
            return response.data['value']
    except Exception as e:
        print(f"⚠️  Failed to load dynamic prompt (key: {prompt_key}), using default. Error: {e}")
    
    return default_prompt


def get_youtube_cookies_path() -> Optional[str]:
    """
    Get YouTube cookies file path from environment or filesystem.
    
    Priority:
    1. YOUTUBE_COOKIES_B64 (decode to temp file)
    2. YOUTUBE_COOKIES (write to temp file)
    3. /data/cookies.txt (Zeabur persistent)
    4. /app/cookies.txt (container)
    5. cookies.txt (local development)
    
    Returns:
        Path to cookies file, or None if not found
    """
    import base64
    import tempfile
    
    # Option 1: Base64 encoded cookies (recommended for production)
    cookies_b64 = os.getenv("YOUTUBE_COOKIES_B64")
    if cookies_b64:
        try:
            cookies_content = base64.b64decode(cookies_b64).decode('utf-8')
            temp_file = Path(tempfile.gettempdir()) / "youtube_cookies.txt"
            temp_file.write_text(cookies_content)
            print(f"   🍪 Using cookies from YOUTUBE_COOKIES_B64 (decoded to {temp_file})")
            return str(temp_file)
        except Exception as e:
            print(f"   ⚠️ Failed to decode YOUTUBE_COOKIES_B64: {e}")
    
    # Option 2: Plain text environment variable
    cookies_plain = os.getenv("YOUTUBE_COOKIES")
    if cookies_plain:
        temp_file = Path(tempfile.gettempdir()) / "youtube_cookies.txt"
        temp_file.write_text(cookies_plain)
        print(f"   🍪 Using cookies from YOUTUBE_COOKIES (written to {temp_file})")
        return str(temp_file)
    
    # Option 3-5: File-based cookies (check priority order)
    cookie_paths = [
        Path("/data/cookies.txt"),      # Zeabur persistent
        Path("/app/cookies.txt"),        # Container
        Path(__file__).parent / "cookies.txt"  # Local development
    ]
    
    for path in cookie_paths:
        if path.exists() and path.stat().st_size > 0:
            print(f"   🍪 Using cookies from: {path}")
            return str(path)
    
    print("   ⚠️ No YouTube cookies found (subtitle downloads may fail for restricted content)")
    return None


def download_subtitles_only(url: str, output_path: Path) -> Dict:
    """
    Download ONLY subtitles from YouTube using yt-dlp
    
    NO VIDEO DOWNLOAD - Storyboard-only mode
    
    Returns:
        Dict with subtitle info and video metadata
    """
    print(f"📥 Downloading subtitles from: {url}")
    
    video_id = None
    duration = 0
    subtitle_path = None
    title = ""
    
    # Get cookies path once (will be used for all yt-dlp calls)
    cookies_path = get_youtube_cookies_path()
    
    # First, get video metadata (without downloading video)
    # Retry logic: Try with cookies first, then without cookies if failed
    
    info = None
    metadata_error = None
    
    # Attempt 1: With cookies (if available)
    if cookies_path:
        print(f"   ℹ️ Attempting metadata extraction WITH cookies...")
        ydl_opts_info = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'cookiefile': cookies_path
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
                info = ydl.extract_info(url, download=False)
                print("   ✅ Metadata extracted successfully with cookies")
        except Exception as e:
            print(f"   ⚠️ Metadata extraction with cookies failed: {e}")
            metadata_error = e

    # Attempt 2: Without cookies (if attempt 1 failed or no cookies)
    if not info:
        print(f"   ℹ️ Attempting metadata extraction WITHOUT cookies...")
        ydl_opts_info_no_cookies = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts_info_no_cookies) as ydl:
                info = ydl.extract_info(url, download=False)
                print("   ✅ Metadata extracted successfully WITHOUT cookies")
        except Exception as e:
            print(f"   ❌ Metadata extraction failed without cookies: {e}")
            # If both failed, raise the last error
            raise metadata_error or e

    if info:
        video_id = info.get('id')
        duration = info.get('duration', 0)
        title = info.get('title', '')
    
    if not video_id:
        raise Exception("Could not extract video ID")
    
    print(f"   Video ID: {video_id}")
    print(f"   Duration: {format_time(duration)}")
    print(f"   Title: {title[:50]}..." if len(title) > 50 else f"   Title: {title}")
    
    # Download subtitles (with retry and fallback)
    # Priority: Chinese first (for Chinese videos), then English
    subtitle_languages = [
        'zh-Hans',  # Simplified Chinese
        'zh-CN',    # China
        'zh-TW',    # Taiwan
        'zh',       # Generic Chinese
        'en',       # English
        'en-US',    # US English
        'en-GB',    # UK English
    ]
    
    for lang in subtitle_languages:
        try:
            print(f"   Trying to download {lang} subtitles...")
            ydl_opts_subs = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': [lang],
                'skip_download': True,  # Don't download video
                'outtmpl': str(output_path / '%(id)s'),
                'quiet': True,
                'no_warnings': True,
            }
            if cookies_path:
                ydl_opts_subs['cookiefile'] = cookies_path
            
            with yt_dlp.YoutubeDL(ydl_opts_subs) as ydl:
                ydl.download([url])
            
            # Check if subtitle was downloaded
            for file in output_path.glob(f"{video_id}.{lang}*.vtt"):
                subtitle_path = file
                print(f"   ✅ Found subtitle: {file.name}")
                break
            
            if subtitle_path:
                break
                
        except Exception as e:
            print(f"   ⚠️  Failed to download {lang} subtitles: {e}")
            continue
    
    # If no manual subtitles, try auto-generated (try multiple languages)
    if not subtitle_path:
        print("   ⚠️ No manual subtitles found, trying auto-generated...")
        auto_langs = ['zh-Hans', 'zh', 'en']  # Priority languages for auto-generated
        
        for auto_lang in auto_langs:
            try:
                print(f"   Trying auto-generated {auto_lang} subtitles...")
                ydl_opts_auto = {
                    'writeautomaticsub': True,
                    'subtitleslangs': [auto_lang],
                    'skip_download': True,
                    'outtmpl': str(output_path / '%(id)s'),
                    'quiet': True,
                    'no_warnings': True,
                }
                if cookies_path:
                    ydl_opts_auto['cookiefile'] = cookies_path
                
                with yt_dlp.YoutubeDL(ydl_opts_auto) as ydl:
                    ydl.download([url])
                
                # Check for any .vtt file
                for file in output_path.glob(f"{video_id}.*.vtt"):
                    subtitle_path = file
                    print(f"   ✅ Found auto-generated subtitle: {file.name}")
                    break
                
                if subtitle_path:
                    break
                    
            except Exception as e:
                print(f"   ⚠️ Auto-generated {auto_lang} subtitle failed: {e}")
                continue
    
    if not subtitle_path:
        print("   ⚠️ No subtitles found. Proceeding to Vision Mode fallback.")
        # Do NOT raise exception - return metadata only so we can fallback to Vision Mode
        pass
            
    return {
        'subtitle_path': subtitle_path,
        'duration': duration,
        'title': title,
        'video_id': video_id,
    }


def parse_vtt_to_text(vtt_path: Optional[Path]) -> str:
    """
    Parse VTT subtitle file to plain text
    
    Returns:
        Cleaned transcript text (limited to 25000 chars to avoid token limits)
    """
    if not vtt_path or not vtt_path.exists():
        return ""
        print("⚠️  No subtitle file to parse.")
        return ""
    
    text_content = []
    seen_lines = set()
    try:
        with open(vtt_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                # Filter out timecodes, WEBVTT header, empty lines, and sequence numbers
                if '-->' in line or line.strip() == '' or line.startswith('WEBVTT') or line.strip().isdigit():
                    continue
                # Remove HTML tags like <c>...</c>
                clean_line = re.sub(r'<[^>]+>', '', line.strip())
                # Deduplicate (subtitles often have repeated lines)
                if clean_line and clean_line not in seen_lines:
                    text_content.append(clean_line)
                    seen_lines.add(clean_line)
        
        full_text = " ".join(text_content)
        print(f"✅ Extracted transcript length: {len(full_text)} chars")
        # Limit length to prevent token overflow
        if len(full_text) > 25000:
            full_text = full_text[:25000] + "..."
        return full_text
    except Exception as e:
        print(f"❌ Error parsing VTT: {e}")
        return ""


# REMOVED: extract_smart_screenshot() - no longer needed in Storyboard-only mode
# This function required cv2/OpenCV which we've eliminated
# All screenshots now use StoryboardExtractor instead

def transcribe_with_whisper(audio_path: Path) -> str:
    """Fallback: Transcribe audio using Whisper API"""
    print(f"🎙️ Transcribing audio with Whisper: {audio_path.name}")
    try:
        if not USE_OPENAI_MODE or not OPENAI_BASE_URL:
             # If we are in native mode, we can't use Whisper API easily unless we init a client
             # But user is in Aggregator mode, so we use 'requests' as standardized in main.py
             pass
        
        # We need to construct the request manually or use openai client if valid
        # Given we switched to 'requests' to fix Broken Pipe, we'll use requests here too.
        
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}", 
        }
        
        # Note: Aggregators usually use standard OpenAI 'video/audio' endpoint
        url = f"{OPENAI_BASE_URL}/audio/transcriptions"
        
        with open(audio_path, "rb") as f:
            files = {
                "file": (audio_path.name, f, "audio/mp4"),
                "model": (None, "whisper-1")
            }
            response = requests.post(url, headers=headers, files=files, timeout=300)
            
        if response.status_code == 200:
            return response.json().get('text', '')
        else:
            print(f"⚠️ Whisper API failed: {response.text}")
            return ""
            
    except Exception as e:
        print(f"⚠️ Whisper Transcription failed: {e}")
        return ""


def extract_screenshot(video_path: Path, timestamp: float, output_path: Path) -> Path:
    """
    Extract a screenshot from video at specific timestamp using FFmpeg
    
    Returns:
        Path to the screenshot file
    """
    print(f"📸 Extracting screenshot at {format_time(timestamp)}")
    screenshot_path = output_path / f"screenshot_{int(timestamp)}.jpg"
    
    try:
        (
            ffmpeg
            .input(str(video_path), ss=timestamp)
            .output(str(screenshot_path), vframes=1, qscale=2)
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        if not screenshot_path.exists():
            raise Exception(f"Screenshot not created at {screenshot_path}")
        
        return screenshot_path
        
    except ffmpeg.Error as e:
        stderr_output = e.stderr.decode('utf-8') if e.stderr else 'No error output'
        print(f"❌ FFmpeg error: {stderr_output}")
        raise Exception(f"FFmpeg failed: {stderr_output[:200]}")
    except Exception as e:
        print(f"❌ Screenshot failed: {e}")
        raise


def upload_to_supabase_storage(file_path: Path, project_id: str, step_order: int) -> str:
    """
    Upload file to Supabase Storage
    
    Returns:
        Storage path (relative path, not full URL - frontend will construct it)
    """
    print(f"☁️  Uploading {file_path.name} to Supabase Storage...")
    
    storage_path = f"projects/{project_id}/step_{step_order}.jpg"
    
    try:
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload file
        supabase.storage.from_(STORAGE_BUCKET).upload(
            storage_path,
            file_data,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        
        # Return storage path (relative), frontend will construct full URL
        return storage_path
        
    except Exception as e:
        print(f"❌ Error uploading to Supabase Storage: {e}")
        raise


def save_step_to_db(project_id: str, step_data: Dict, image_path: Optional[str]):
    """Save step/section to database"""
    try:
        # Ensure content exists and is not empty
        content = step_data.get('content', '').strip()
        if not content:
            content = step_data.get('title', f"Section {step_data.get('section_order', '?')}")
            print(f"   ⚠️  Section {step_data.get('section_order')} has no content, using title as fallback")
        
        # Ensure title exists
        title = step_data.get('title', '').strip()
        if not title:
            title = f"Section {step_data.get('section_order', '?')}"
        
        step_record = {
            'project_id': project_id,
            'step_order': step_data['section_order'],
            'title': title,
            'description': content,  # Use content as description
            'timestamp_seconds': step_data['timestamp_seconds'],
            'image_path': image_path if image_path else None,  # NULL if no image
        }
        
        supabase.table('steps').insert(step_record).execute()
        has_image = "with image" if image_path else "text only"
        content_preview = content[:50] + "..." if len(content) > 50 else content
        print(f"✅ Saved section {step_data['section_order']} to database ({has_image})")
        print(f"   Title: {title}")
        print(f"   Content: {content_preview}")
    except Exception as e:
        print(f"❌ Error saving step to database: {e}")
        print(f"   Step data: {step_data}")
        raise


def analyze_content(video_path: Path, subtitle_path: Optional[Path], video_url: str, duration: float, generation_mode: str = 'text_with_images') -> Dict:
    """
    Analyze video content using Gemini AI
    
    Strategy:
    1. Priority: Use transcript/subtitles if available (faster, more reliable)
    2. Fallback: Upload video directly to Gemini (slower, may fail for large videos)
    
    Returns:
        Dict with:
        - summary: overall video summary
        - sections: List of section dictionaries with content and screenshot flags
    """
    
    # 1. Try to get transcript first (preferred method)
    transcript_text = parse_vtt_to_text(subtitle_path)
    
    # 2. Whisper Fallback
    if not transcript_text and video_path:
        print("⚠️ No VTT subtitles found. Attempting Whisper transcription...")
        # Find audio file (usually same name as video but m4a)
        # Note: In Storyboard mode, video_path is None, so we skip Whisper and go to Vision Mode
        audio_candidates = list(video_path.parent.glob(f"{video_path.stem}*.m4a"))
        if not audio_candidates:
             # Try extracting audio if not found? 
             # For now, just assume yt-dlp downloaded it or the video file itself can be sent (if small enough)
             # Sending large video file to whisper size limit is 25MB usually.
             pass
        else:
             audio_path = audio_candidates[0]
             transcript_text = transcribe_with_whisper(audio_path)
             if transcript_text:
                 print("✅ Whisper transcription successful!")
    
    has_transcript = bool(transcript_text)
    
    # 2. Get prompt template (adjust based on generation mode)
    if generation_mode == 'text_only':
        default_prompt_template = """
        You are an expert technical writer. Convert this video transcript into a structured, engaging blog post.
        
        Transcript:
        {transcript}
        
        Video Information:
        - URL: {video_url}
        - Duration: {duration_formatted} ({duration_seconds:.1f} seconds)
        
        Your task:
        1. First, provide a comprehensive summary of the entire video (2-3 paragraphs)
        2. Then, break down the content into 4-10 key sections that form a cohesive article
        3. Focus on clear, detailed text content - no screenshots needed
        
        Return a JSON object with this structure:
        {{
            "summary": "A comprehensive 2-3 paragraph summary of the entire video content, covering main topics, key points, and overall message.",
            "sections": [
                {{
                    "section_order": 1,
                    "title": "Actionable, Specific Heading (e.g. 'Setting up the environment')",
                    "content": "Detailed explanation of this step. Use 4-6 sentences. Be very specific and descriptive. Include all important details from the transcript.",
                    "timestamp_seconds": 10.5,
                    "needs_screenshot": false
                }},
                {{
                    "section_order": 2,
                    "title": "Another section",
                    "content": "More detailed content with comprehensive explanations...",
                    "timestamp_seconds": 120.0,
                    "needs_screenshot": false
                }}
            ]
        }}
        
        Guidelines:
        1. Summary should capture the essence of the entire video
        2. Sections should flow logically as an article, not just a list of steps
        3. Each section should have substantial content (4-6 sentences minimum) - be very detailed
        4. Since no screenshots are needed, make the text content comprehensive and self-explanatory
        5. Include all important details, explanations, and context in the text
        6. Aim for 4-10 sections depending on video length (roughly 1 section per 2-5 minutes)
        7. Timestamps should point to the most representative moment of each section
        8. Write content as article paragraphs, not step-by-step instructions
        9. Always set needs_screenshot=false (text-only mode)
        10. 'timestamp_seconds' should be the exact start time of that section
        
        Return ONLY valid JSON, no markdown, no code blocks, no explanations.
        """
    else:  # text_with_images
        default_prompt_template = """
        You are an expert technical writer creating a detailed, step-by-step tutorial from a video transcript.
        
        Transcript:
        {transcript}
        
        Video Information:
        - URL: {video_url}
        - Duration: {duration_formatted} ({duration_seconds:.1f} seconds)
        
        Your task:
        1. **Summary**: Create a structured summary with:
           - A brief overview paragraph (2-3 sentences).
           - A "Key Takeaways" list with 3-5 bullet points highlighting the most important concepts or results.
           
        2. **Step-by-Step Guide**: Break the video down into a granular, easy-to-follow guide.
           - Target **10-20 distinct steps** (or more for long videos). Do NOT compress multiple actions into one step.
           - Each step should represent a single, clear action or concept.
           
        3. **Visuals**: You MUST strictly identify where screenshots are needed.
           - **Rule**: If a step involves *any* visual element (seeing code, UI, gameplay, location, item stats, expected result), you MUST set `needs_screenshot: true`.
           - **Goal**: We want a "visual-heavy" guide. It is better to have too many screenshots than too few. Aim for >70% of steps having a screenshot.
        
        Return a JSON object with this structure:
        {{
            "summary": "## Overview\\n[Brief paragraph]\\n\\n## Key Takeaways\\n- [Point 1]\\n- [Point 2]...",
            "sections": [
                {{
                    "section_order": 1,
                    "title": "Action-Oriented Title (e.g. 'Open the settings menu')",
                    "content": "Detailed instruction for this specific step. Explain exactly what to do and what to look for. Use 2-4 sentences.",
                    "timestamp_seconds": 10.5,
                    "needs_screenshot": true
                }},
                {{
                    "section_order": 2,
                    "title": "Select the 'Advanced' tab",
                    "content": "Click on the Advanced tab in the top right corner...",
                    "timestamp_seconds": 15.0,
                    "needs_screenshot": true
                }}
            ]
        }}
        
        Guidelines:
        1. **Granularity is Key**: Don't say "Install and configure the app". Break it down: 1. Download, 2. Install, 3. Open settings, 4. Configure.
        2. **Content**: Write directly to the user ("Click here...", "You will see...").
        3. **Timestamps**: Must be precise. Point to the EXACT moment the action happens.
        4. **Screenshots**: BE AGGRESSIVE. If in doubt, set needs_screenshot=true.
        
        Return ONLY valid JSON, no markdown formatting (except inside the summary string), no code blocks.
        """
    
    prompt_template = get_dynamic_prompt(default_prompt_template, 'gemini_video_prompt')
    
    # Inject variables
    prompt = prompt_template.replace('{video_url}', video_url)
    prompt = prompt.replace('{duration_formatted}', format_time(duration))
    prompt = prompt.replace('{duration_seconds:.1f}', f'{duration:.1f}')
    prompt = prompt.replace('{duration_seconds}', f'{duration:.1f}')
    prompt = prompt.replace('{duration}', str(duration))

    # --- REFACTORED GENERATION LOGIC ---

    # Model priority for OpenRouter
    candidate_models = [
        'openai/gpt-4o',           # Best quality vision model
        'openai/gpt-4o-mini',      # Faster, cheaper fallback
        'anthropic/claude-3.5-sonnet',  # Alternative high-quality option
    ]
    
    last_exception = None

    # 1. Determine Analysis Mode
    use_vision_mode = False
    if transcript_text and len(transcript_text.strip()) > 0:
        print(f"✅ Found transcript ({len(transcript_text)} chars). Using Text Analysis Mode.")
    else:
        print("⚠️ No transcript found. Switching to Vision/Video Analysis Mode.")
        use_vision_mode = True

    # 2. Define System Prompt (Global for both modes)
    system_prompt = """You are an expert video content analyzer. You MUST return valid JSON with the exact structure specified.

CRITICAL INSTRUCTIONS:
1. STRICTLY base your response ON THE CONTENT provided (Transcript or Video). Do NOT hallucinate.
2. If the video is about cooking, acceptable steps are "Chopping onions", "Boiling water", etc.
3. If the video is about coding, acceptable steps are "Install library", "Run command", etc.
4. Your JSON response MUST include these fields for EACH section/step:
   - "section_order": integer (1, 2, 3, ...)
   - "title": string (descriptive action title)  
   - "content": string (detailed 2-4 sentence explanation, NOT just the title)
   - "timestamp_seconds": number (exact time in seconds)
   - "needs_screenshot": boolean (true if visual element is described)

Example of CORRECT output format:
{
  "summary": "This video explains...",
  "sections": [
    {
      "section_order": 1,
      "title": "First Step Title",
      "content": "Description of the first step based on the video content.",
      "timestamp_seconds": 10.5,
      "needs_screenshot": true
    }
  ]
}

Return ONLY valid JSON, no markdown, no code blocks."""

    for model_name in candidate_models:
        print(f"🔄 Attempting analysis with model: {model_name}")
        try:
            response_text = ""
            messages = []
            
            # 3. Construct Payload based on Mode
            if use_vision_mode:
                # === VISION MODE (Video URL in Text) ===
                print(f"   🎥 Constructing Vision Payload for {model_name} (Video URL in text)")
                
                # CRITICAL: Substitute ALL placeholders in the prompt
                # Replace {transcript} with instruction to analyze video URL
                # Replace {video_url}, {duration_formatted}, {duration_seconds} with actual values
                vision_text = f'''(Transcript unavailable. Please watch and analyze this YouTube video directly)

Video URL: {video_url}
Duration: {format_time(duration)} ({duration:.1f} seconds)

IMPORTANT: You MUST watch the video at the URL above to understand its content. Do not make up generic content.'''
                
                vision_prompt = prompt.replace('{transcript}', vision_text)
                vision_prompt = vision_prompt.replace('{video_url}', video_url)
                vision_prompt = vision_prompt.replace('{duration_formatted}', format_time(duration))
                vision_prompt = vision_prompt.replace('{duration_seconds:.1f}', f'{duration:.1f}')
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": vision_prompt}
                ]
            else:
                # === TEXT MODE (Transcript) ===
                print(f"   📄 Constructing Text Payload for {model_name}")
                final_prompt = prompt.replace('{transcript}', transcript_text)
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": final_prompt}
                ]

            # API Request with Retry Logic
            # OpenRouter requires specific headers
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://stepsnip.com",  # Required by OpenRouter
                "X-Title": "StepSnip"  # Optional but recommended
            }
            
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.7,
            }
            
            # Retry logic: 3 attempts with exponential backoff
            max_retries = 3
            retry_delay = 2  # Initial delay in seconds
            
            for attempt in range(max_retries):
                try:
                    print(f"   📡 Sending request to {OPENAI_BASE_URL}/chat/completions... (Attempt {attempt + 1}/{max_retries})")
                    response = requests.post(
                        f"{OPENAI_BASE_URL}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=180  # 3 min timeout for video analysis
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        response_text = data['choices'][0]['message']['content']
                        print(f"   ✅ API request successful with {model_name}")
                        break  # Success, exit retry loop
                    else:
                        error_msg = f"API Error {response.status_code}: {response.text[:200]}"
                        print(f"   ❌ API Request Failed (Status {response.status_code})")
                        print(f"   Response Body: {response.text}")
                        
                        # If this is the last retry, raise the exception
                        if attempt == max_retries - 1:
                            raise Exception(error_msg)
                        
                        # Exponential backoff: 2^attempt seconds (2s, 4s, 8s)
                        backoff_time = retry_delay * (2 ** attempt)
                        print(f"   ⏳ Retrying in {backoff_time}s...")
                        time.sleep(backoff_time)

                except requests.exceptions.Timeout:
                    # ... existing timeout handling ...
                    last_error = "Request timeout after 120s"
                    if attempt < max_retries - 1:
                        # ...
                        pass
                    else:
                         raise Exception(last_error)
                except requests.exceptions.RequestException as e:
                     # ...
                     pass
                except requests.exceptions.Timeout:
                    last_error = "Request timeout after 120s"
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)
                        print(f"   ⚠️  {last_error}")
                        print(f"   🔄 Retrying in {wait_time}s... (Attempt {attempt + 2}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception(last_error)
                except requests.exceptions.RequestException as e:
                    last_error = f"Network error: {str(e)}"
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)
                        print(f"   ⚠️  {last_error}")
                        print(f"   🔄 Retrying in {wait_time}s... (Attempt {attempt + 2}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception(last_error)
            
            if response.status_code != 200:
                raise Exception(f"API failed after {max_retries} attempts: {last_error}")
                
            resp_json = response.json()
            response_text = resp_json['choices'][0]['message']['content']

            # Parse JSON response with improved error handling
            try:
                text = response_text.strip()
                
                # Method 1: Remove markdown code blocks (```json...``` or ```...```)
                if '```json' in text:
                    text = text.split('```json')[1].split('```')[0].strip()
                elif '```' in text:
                    text = text.split('```')[1].split('```')[0].strip()
                
                # Method 2: Try regex to extract JSON object (handles extra text before/after)
                import re
                if not text.startswith('{'):
                    json_match = re.search(r'(\{.*\})', text, re.DOTALL)
                    if json_match:
                        text = json_match.group(1)
                        print("   📝 Extracted JSON using regex (had extra text)")
                
                # Method 3: Parse JSON
                data = json.loads(text)
                
                # Validate structure
                if not isinstance(data, dict):
                    raise ValueError("Response is not a dictionary")
                
                # Check for 'sections' or 'steps' (some models use different field names)
                if 'sections' in data:
                    sections_data = data['sections']
                elif 'steps' in data:
                    sections_data = data['steps']
                    print("   📝 Using 'steps' field (renamed from 'sections')")
                    data['sections'] = sections_data  # Normalize to 'sections'
                else:
                    raise ValueError("Response missing both 'sections' and 'steps' fields")
                
                if not isinstance(sections_data, list):
                    raise ValueError("'sections/steps' is not a list")
                
                if len(sections_data) == 0:
                     print(f"   ⚠️  Model {model_name} returned 0 sections. Treating as failure.")
                     print(f"   Response Preview: {response_text[:1000]}")
                     raise ValueError("Model returned 0 sections")

                # Normalize section fields for compatibility with different models
                normalized_sections = []
                for idx, section in enumerate(sections_data):
                    normalized = {}
                    
                    # Normalize section_order (various field names)
                    normalized['section_order'] = (
                        section.get('section_order') or 
                        section.get('step_order') or 
                        section.get('order') or 
                        section.get('step_number') or 
                        section.get('number') or 
                        idx + 1
                    )
                    
                    # Normalize title
                    normalized['title'] = (
                        section.get('title') or 
                        section.get('name') or 
                        section.get('heading') or 
                        section.get('step_title') or 
                        f"Section {normalized['section_order']}"
                    )
                    
                    # Normalize content/description
                    normalized['content'] = (
                        section.get('content') or 
                        section.get('instruction') or  # Used by database prompt
                        section.get('description') or 
                        section.get('text') or 
                        section.get('body') or 
                        section.get('step_content') or 
                        section.get('details') or 
                        section.get('visual_scene_description') or  # Used by database prompt
                        normalized['title']  # Fallback to title if no content
                    )
                    
                    # Normalize timestamp
                    raw_timestamp = (
                        section.get('timestamp_seconds') or 
                        section.get('timestamp') or 
                        section.get('time') or 
                        section.get('start_time') or 
                        section.get('time_seconds') or 
                        0
                    )
                    # Handle string timestamps like "1:30" or "01:30:00"
                    if isinstance(raw_timestamp, str):
                        parts = raw_timestamp.replace('s', '').split(':')
                        try:
                            if len(parts) == 1:
                                normalized['timestamp_seconds'] = float(parts[0])
                            elif len(parts) == 2:
                                normalized['timestamp_seconds'] = int(parts[0]) * 60 + float(parts[1])
                            elif len(parts) == 3:
                                normalized['timestamp_seconds'] = int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
                            else:
                                normalized['timestamp_seconds'] = 0
                        except:
                            normalized['timestamp_seconds'] = 0
                    else:
                        normalized['timestamp_seconds'] = float(raw_timestamp) if raw_timestamp else 0
                    
                    # Clamp timestamp to video duration
                    if normalized['timestamp_seconds'] > duration:
                        normalized['timestamp_seconds'] = max(5.0, duration - 10)
                    
                    # Normalize needs_screenshot
                    normalized['needs_screenshot'] = bool(
                        section.get('needs_screenshot') or 
                        section.get('screenshot') or 
                        section.get('has_screenshot') or 
                        section.get('visual') or 
                        False
                    )
                    
                    normalized_sections.append(normalized)
                
                data['sections'] = normalized_sections
                
                print(f"✅ Successfully parsed {len(data['sections'])} sections using {model_name}")
                return data

            except json.JSONDecodeError as e:
                # Enhanced error message with response preview
                preview = response_text[:500] if len(response_text) > 500 else response_text
                print(f"❌ JSON Decode Error: {e}")
                print(f"   Response preview: {preview}...")
                raise Exception(f"Failed to parse AI response as JSON. Error: {e}")
            except ValueError as e:
                print(f"❌ JSON Structure Error: {e}")
                print(f"   Parsed data keys: {data.keys() if isinstance(data, dict) else 'not a dict'}")
                raise Exception(f"AI response has invalid structure: {e}")

        except Exception as e:
            print(f"⚠️  Model {model_name} failed: {e}")
            last_exception = e
            continue
            
    print("❌ All models failed.")
    raise last_exception or Exception("All models failed")


def process_project(project: Dict):
    """Process a single project"""
    project_id = project['id']
    video_url = project['video_source_url']
    generation_mode = project.get('generation_mode', 'text_with_images')  # Default to text_with_images
    
    print(f"\n{'='*60}")
    print(f"🎬 Processing Project: {project_id}")
    print(f"Video URL: {video_url}")
    print(f"Generation Mode: {generation_mode}")
    print(f"{'='*60}\n")
    
    # Create temp directory for this project
    project_dir = TEMP_DIR / project_id
    
    try:
        # Update status to processing
        supabase.table('projects').update({
            'status': 'processing'
        }).eq('id', project_id).execute()
        
        # Clean previous run if exists
        if project_dir.exists():
            shutil.rmtree(project_dir)
        project_dir.mkdir(exist_ok=True)
        
        # ========================================
        # SIMPLIFIED: Pure Vision Mode
        # Skip all YouTube metadata/subtitle extraction
        # ========================================
        
        print("🎥 Using Pure Vision Mode (no subtitle download)")
        
        # Extract basic info from URL
        video_id = None
        if 'youtube.com' in video_url or 'youtu.be' in video_url:
            import re
            match = re.search(r'(?:v=|/)([a-zA-Z0-9_-]{11})', video_url)
            if match:
                video_id = match.group(1)
        
        if not video_id:
            video_id = "unknown"
        
        # Default duration for credit calculation (will be updated by model if it can detect)
        duration = 600  # Default 10 minutes
        
        # Update project with estimated duration
        supabase.table('projects').update({
            'video_duration_seconds': duration
        }).eq('id', project_id).execute()
        
        # Calculate credits cost based on default duration
        minutes = (duration + 59) // 60  # Round up
        credits_cost = max(10, int(minutes * 10))
        
        # Create video_info dict for compatibility
        video_info = {
            'subtitle_path': None,  # Always None - pure vision mode
            'duration': duration,
            'video_id': video_id,
            'title': ''
        }
        
        # Step 2: Analyze content with Gemini (get summary and sections)
        # Pass video_url instead of video_path for Storyboard
        analysis = analyze_content(None, video_info['subtitle_path'], video_url, duration, generation_mode)
        
        if not analysis or 'sections' not in analysis:
            raise Exception("No analysis extracted from video")
        
        summary = analysis.get('summary', '')
        sections = analysis['sections']
        
        # Update project with summary
        if summary:
            supabase.table('projects').update({
                'title': summary[:200] if len(summary) > 200 else summary  # Use summary as title if available
            }).eq('id', project_id).execute()
        
        # Step 3: Process sections - extract screenshots based on mode
        for section in sections:
            section_order = section['section_order']
            timestamp = section['timestamp_seconds']
            needs_screenshot = section.get('needs_screenshot', False)
            print(f"DEBUG: Section {section_order} timestamp={timestamp} needs_screenshot={needs_screenshot} mode={generation_mode}")
            
            # Ensure timestamp is within video duration
            if timestamp > duration:
                timestamp = max(5.0, duration - 10)
            
            image_path = None
            
            # Extract screenshot for ALL steps in text_with_images mode
            # (ignore needs_screenshot flag since user explicitly chose this mode)
            if generation_mode == 'text_with_images':
                screenshot_path = None
                
                # Extract screenshot using YouTube Storyboard (no video download needed!)
                try:
                    screenshot_filename = f"{video_info['video_id']}_{int(timestamp * 1000)}.jpg"
                    screenshot_path_obj = project_dir / screenshot_filename
                    
                    extractor = StoryboardExtractor(video_url)
                    extractor.get_thumbnail_at_timestamp(timestamp, screenshot_path_obj)
                    screenshot_path = str(screenshot_path_obj)
                    
                    print(f"   📸 Storyboard Screenshot captured for section {section_order}")
                except Exception as e:
                    print(f"   ❌ Storyboard extraction failed: {e}")
                    screenshot_path = None

                # Upload if we have a valid screenshot
                if screenshot_path:
                    try:
                        image_path = upload_to_supabase_storage(
                            Path(screenshot_path),
                            project_id,
                            section_order
                        )
                    except Exception as e_upload:
                         print(f"   ☁️ Upload failed: {e_upload}")
            elif generation_mode == 'text_only':
                # Force no screenshot in text-only mode
                section['needs_screenshot'] = False
                print(f"   📝 Text-only mode: skipping screenshot for section {section_order}")
            
            # Ensure content field exists and is not empty
            if not section.get('content') or section['content'].strip() == '':
                print(f"   ⚠️  Warning: Section {section_order} has empty content, using title as fallback")
                section['content'] = section.get('title', f'Section {section_order}')
            
            # Save section to database (as step)
            save_step_to_db(project_id, section, image_path)
        
        # Update project status to completed
        supabase.table('projects').update({
            'status': 'completed',
            'credits_cost': credits_cost,
        }).eq('id', project_id).execute()
        
        print(f"\n✅ Project {project_id} COMPLETED!")
        print(f"   Sections created: {len(sections)}")
        print(f"   Summary: {summary[:100]}..." if len(summary) > 100 else f"   Summary: {summary}")
        print(f"   Credits cost: {credits_cost}")
        
    except Exception as e:
        print(f"\n❌ Error processing project {project_id}: {e}")
        
        # Print full traceback for debugging
        import traceback
        print("\n📋 Full error traceback:")
        traceback.print_exc()
        
        # Update project status to failed
        try:
            supabase.table('projects').update({
                'status': 'failed',
                'error_message': str(e)
            }).eq('id', project_id).execute()
        except:
            pass
        
    finally:
        # Cleanup temp files
        try:
            if project_dir.exists():
                # shutil.rmtree(project_dir)
                # print(f"🧹 Cleaned up temp directory for {project_id}")
                pass
        except Exception as e:
            print(f"⚠️  Error cleaning up temp directory: {e}")


def worker_loop():
    """Main worker loop - polls for pending projects"""
    print("🚀 Vidoc Worker Started (Subtitle Enhanced Mode)")
    print("🚀 Vidoc Worker - Version: REMOVED_GOOGLE_CLIENT")
    print(f"   Supabase URL: {SUPABASE_URL}")
    print(f"   Storage Bucket: {STORAGE_BUCKET}")
    print(f"   Temp Directory: {TEMP_DIR}")
    print("\nWaiting for projects to process...\n")
    
    while True:
        try:
            # Fetch pending projects
            response = supabase.table('projects').select('*').eq('status', 'pending').limit(1).execute()
            
            if response.data and len(response.data) > 0:
                project = response.data[0]
                process_project(project)
            else:
                # No pending projects, wait a bit
                time.sleep(5)
                
        except KeyboardInterrupt:
            print("\n\n👋 Worker stopped by user")
            break
        except Exception as e:
            print(f"❌ Error in worker loop: {e}")
            time.sleep(10)  # Wait longer on error


if __name__ == "__main__":
    # Check required environment variables
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        exit(1)
    
    # Check relay platform API configuration
    if not OPENAI_BASE_URL:
        print("❌ Error: OPENAI_BASE_URL must be set")
        exit(1)
    
    if not OPENAI_API_KEY:
        print("❌ Error: OPENAI_API_KEY must be set")
        exit(1)
    
    print(f"✅ Configuration OK - Using relay platform: {OPENAI_BASE_URL}")
    worker_loop()

