#!/usr/bin/env python3
"""
Vidoc Python Worker
Processes video projects by:
1. Downloading videos and subtitles from YouTube
2. Analyzing with Gemini AI using transcript (preferred) or video (fallback)
3. Extracting screenshots at key timestamps
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
import google.generativeai as genai
import ffmpeg
from supabase import create_client, Client
import google.api_core.exceptions
import google.api_core.exceptions
import requests
import json
import base64
import cv2
import numpy as np

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET") or os.getenv("STORAGE_BUCKET", "guide_images")

# Initialize clients
# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Determine backend mode
# If USER provided a Base URL (e.g. for aggregator), we use OpenAI Python Client
# If NOT, we default to Google Native Client
# Determine backend mode
# If USER provided a Base URL (e.g. for aggregator), we use generic Requests
# If NOT, we default to Google Native Client
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://www.dmxapi.cn/v1")
USE_OPENAI_MODE = True # Force enabled

if OPENAI_BASE_URL and "googleapis.com" not in OPENAI_BASE_URL:
    print(f"🔌 Using Schema-Compatible API at {OPENAI_BASE_URL} (via requests)")
    USE_NATIVE_GEMINI = False
else:
    print("🔌 Using Native Google Gemini Client")
    genai.configure(api_key=GEMINI_API_KEY)
    USE_NATIVE_GEMINI = True

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


def download_video(url: str, output_path: Path) -> Dict:
    """
    Download video and subtitles from YouTube using yt-dlp
    
    Strategy: Try to download subtitles with retry and fallback languages
    to avoid 429 rate limiting errors.
    
    Returns:
        Dict with video info including duration and subtitle path
    """
    print(f"📥 Downloading video and subtitles from: {url}")
    
    video_id = None
    duration = 0
    video_path = None
    subtitle_path = None
    
    # First, download video only
    # Inject Proxy if configured
    proxy_url = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy_url:
        print(f"   🛡️ Using Proxy: {proxy_url}")

    # First, download video only
    # Configure yt-dlp options
    ydl_opts_video = {
        # Force h264 (avc) for best OpenCV compatibility
        'format': 'bestvideo[height<=720][ext=mp4][vcodec^=avc]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]',
        'outtmpl': str(output_path / '%(id)s.%(ext)s'),
        'quiet': False,
        'no_warnings': False,
        'skip_download': False,
        'nopart': True, # Write directly to output file, avoid rename errors
        'external_downloader': 'native',
        
        # Use Android Client (The ONLY working bypass for 403 Forbidden)
        'extractor_args': {'youtube': {'player_client': ['android']}},
        # Imitate Android Phone
        'user_agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    }
    
    if proxy_url:
        ydl_opts_video['proxy'] = proxy_url

    # Anti-bot Measure: Use cookies.txt if available (Best practice)
    # If not, try browser cookies (Local dev fallback)
    cookies_file = Path('cookies.txt')
    if cookies_file.exists():
        print(f"   🍪 Using cookies from {cookies_file.name}")
        ydl_opts_video['cookiefile'] = str(cookies_file)
    else:
        # Fallback to chrome cookies for local dev if file missing
        # ydl_opts_video['cookiesfrombrowser'] = ('chrome',) 
        pass
    
    with yt_dlp.YoutubeDL(ydl_opts_video) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info.get('id')
        duration = info.get('duration', 0)
        
        # Find the downloaded video file
        for ext in ['mp4', 'webm', 'mkv']:
            potential_file = output_path / f"{video_id}.{ext}"
            if potential_file.exists():
                video_path = potential_file
                break
        
        if not video_path:
            raise Exception(f"Video not found for {video_id}")
    
    # Then, try to download subtitles separately (with retry and fallback)
    # Priority: English first (most common), then try others if needed
    subtitle_languages = ['en', 'en-US', 'en-GB']  # Start with English variants
    
    for lang in subtitle_languages:
        try:
            print(f"   Trying to download {lang} subtitles...")
            ydl_opts_subs = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': [lang],  # Only one language at a time
                'skip_download': True,  # Don't re-download video
                'quiet': True,
                'no_warnings': True,
            }
            
            if proxy_url:
                ydl_opts_subs['proxy'] = proxy_url
            
            with yt_dlp.YoutubeDL(ydl_opts_subs) as ydl:
                ydl.download([url])
            
            # Check if subtitle was downloaded
            for file in output_path.glob(f"{video_id}.{lang}*.vtt"):
                subtitle_path = file
                print(f"✅ Found subtitle: {file.name}")
                break
            
            if subtitle_path:
                break
                
        except Exception as e:
            if '429' in str(e) or 'Too Many Requests' in str(e):
                print(f"   ⚠️  Rate limited for {lang}, waiting 2 seconds...")
                time.sleep(2)
                continue
            else:
                print(f"   ⚠️  Failed to download {lang} subtitles: {e}")
                continue
    
    # If still no subtitle, try auto-generated (usually more available)
    if not subtitle_path:
        try:
            print("   Trying auto-generated subtitles...")
            ydl_opts_auto = {
                'writeautomaticsub': True,
                'subtitleslangs': ['en'],  # Auto-generated are usually in video's primary language
                'skip_download': True,
                'quiet': True,
                'no_warnings': True,
            }
            
            if proxy_url:
                ydl_opts_auto['proxy'] = proxy_url
            
            with yt_dlp.YoutubeDL(ydl_opts_auto) as ydl:
                ydl.download([url])
            
            # Check for any .vtt file
            for file in output_path.glob(f"{video_id}.*.vtt"):
                subtitle_path = file
                print(f"✅ Found auto-generated subtitle: {file.name}")
                break
        except Exception as e:
            print(f"   ⚠️  Auto-generated subtitle download failed: {e}")
    
    if not subtitle_path:
        print("⚠️  No subtitle file found. Will use video analysis instead (slower but works).")
            
    return {
        'file_path': video_path,
        'subtitle_path': subtitle_path,
        'duration': duration,
        'title': info.get('title', ''),
        'video_id': video_id,
    }


def parse_vtt_to_text(vtt_path: Optional[Path]) -> str:
    """
    Parse VTT subtitle file to plain text
    
    Returns:
        Cleaned transcript text (limited to 25000 chars to avoid token limits)
    """
    if not vtt_path or not vtt_path.exists():
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


def extract_smart_screenshot(video_path: Path, timestamp: float, output_dir: Path) -> str:
    """
    Extract the 'best' (sharpest) screenshot around the timestamp.
    Scans t-0.5s, t, t+0.5s
    """
    if timestamp < 0:
        timestamp = 0
        
    output_filename = f"{video_path.stem}_{int(timestamp * 1000)}.jpg"
    output_path = output_dir / output_filename
    
    # If already exists, return
    if output_path.exists():
        return str(output_path)
        
    print(f"📸 Smart extracting around {timestamp:.2f}s...")
    
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"❌ Failed to open video file in cv2: {video_path}")
        raise Exception(f"Failed to open video file: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    target_frame = int(timestamp * fps)
    
    candidates = []
    
    # Check 3 positions: -0.5s, current, +0.5s
    offsets = [-int(fps*0.5), 0, int(fps*0.5)]
    
    for offset in offsets:
        f_idx = max(0, target_frame + offset)
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        ret, frame = cap.read()
        if ret:
            # Calculate sharpness using Laplacian variance
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            score = cv2.Laplacian(gray, cv2.CV_64F).var()
            candidates.append((score, frame))
        else:
            print(f"⚠️ Could not read frame at offset {offset}")
            
    cap.release()
    
    if not candidates:
        raise Exception(f"Could not extract any frames around {timestamp}")
        
    # Sort by score (descending) -> best sharpness first
    candidates.sort(key=lambda x: x[0], reverse=True)
    best_score, best_frame = candidates[0]
    
    print(f"   ✨ Selected frame with sharpness score: {best_score:.1f}")
    
    # Resize if too large (save bandwidth/storage)
    height, width = best_frame.shape[:2]
    max_dim = 1280
    if width > max_dim or height > max_dim:
        scale = max_dim / max(width, height)
        best_frame = cv2.resize(best_frame, None, fx=scale, fy=scale)
    
    cv2.imwrite(str(output_path), best_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    
    return str(output_path)

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
            "Authorization": f"Bearer {GEMINI_API_KEY}", 
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
    if not transcript_text:
        print("⚠️ No VTT subtitles found. Attempting Whisper transcription...")
        # Find audio file (usually same name as video but m4a)
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

    # Adjust model names for Aggregator if needed
    # Aggregators usually support 'gemini-1.5-flash' directly.
    candidate_models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gpt-4o', # Fallback if gemini fails on aggregator
        'gpt-3.5-turbo'
    ]
    
    last_exception = None

    for model_name in candidate_models:
        print(f"🔄 Attempting analysis with model: {model_name} (Native: {USE_NATIVE_GEMINI})")
        try:
            response_text = ""
            
            if USE_NATIVE_GEMINI:
                # --- GOOGLE NATIVE PATH ---
                model = genai.GenerativeModel(model_name)
                if has_transcript:
                    current_prompt = prompt.replace('{transcript}', transcript_text)
                    response = model.generate_content(current_prompt)
                else:
                    # Video/Audio Upload Path
                    # Optimization: Try to extract and upload AUDIO only first (much faster)
                    media_file_to_upload = video_path
                    mime_type = "video/mp4"
                    
                    try:
                        audio_extract_path = video_path.with_suffix('.m4a')
                        if not audio_extract_path.exists():
                            print("   🔊 Extracting audio for faster AI analysis...")
                            # Extract audio using ffmpeg (fast copy if possible, or re-encode)
                            # -vn: no video, -acodec copy: copy audio stream (fastest)
                            (
                                ffmpeg
                                .input(str(video_path))
                                .output(str(audio_extract_path), vn=None, acodec='copy')
                                .overwrite_output()
                                .run(quiet=True)
                            )
                        
                        if audio_extract_path.exists():
                            print(f"   ✅ Audio extracted: {audio_extract_path.name}")
                            media_file_to_upload = audio_extract_path
                            mime_type = "audio/mp4"
                    except Exception as e:
                        print(f"   ⚠️ Audio extraction failed, falling back to video: {e}")
                        media_file_to_upload = video_path

                    print(f"   📤 Uploading {mime_type} to Gemini: {media_file_to_upload.name}...")
                    current_prompt = prompt.replace('{transcript}', "No transcript provided. Analyze this media file to extract the content.")
                    
                    uploaded_file = genai.upload_file(path=str(media_file_to_upload), mime_type=mime_type)
                    
                    # Wait for processing
                    while uploaded_file.state.name == "PROCESSING":
                        print("   ⏳ Specific file processing...", end='\r')
                        time.sleep(2)
                        uploaded_file = genai.get_file(uploaded_file.name)
                    
                    if uploaded_file.state.name == "FAILED":
                         raise Exception("Gemini File Processing Failed")
                         
                    print(f"   ✅ File ready: {uploaded_file.name}")
                    response = model.generate_content([current_prompt, uploaded_file])
                response_text = response.text

            else:
                # --- OPENAI / AGGREGATOR PATH (via requests) ---
                messages = []
                
                if has_transcript:
                    print("   📄 Using Transcript Mode (Requests/OpenAI Protocol)")
                    final_prompt = prompt.replace('{transcript}', transcript_text)
                    messages = [
                        {"role": "system", "content": "You are a helpful assistant. Return valid JSON only."},
                        {"role": "user", "content": final_prompt}
                    ]
                else:
                    # Vision Fallback for Aggregator
                    print("   🖼️  No transcript. Using Vision Mode (Screenshots) for Aggregator...")
                    frames = []
                    for t in [duration*0.2, duration*0.5, duration*0.8]:
                        f_path = extract_smart_screenshot(video_path, t, video_path.parent) # Use Smart Screenshot
                        with open(f_path, "rb") as image_file:
                            b64 = base64.b64encode(image_file.read()).decode('utf-8')
                            frames.append(b64)
                    
                    final_prompt = prompt.replace('{transcript}', "No transcript. Analyze these 3 key frames from the video.")
                    
                    content_payload = [{"type": "text", "text": final_prompt}]
                    for b64_img in frames:
                        content_payload.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}
                        })
                    
                    messages = [
                        {"role": "system", "content": "Return valid JSON."},
                        {"role": "user", "content": content_payload}
                    ]

                # Manual Requests Call
                headers = {
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "response_format": {"type": "json_object"}
                }
                
                print(f"   📡 Sending request to {OPENAI_BASE_URL}/chat/completions...")
                response = requests.post(
                    f"{OPENAI_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=120  # Longer timeout for aggregation
                )
                
                if response.status_code != 200:
                    raise Exception(f"API Error {response.status_code}: {response.text}")
                    
                resp_json = response.json()
                response_text = resp_json['choices'][0]['message']['content']

            # Parse JSON response common logic
            try:
                text = response_text.strip()
                if '```json' in text:
                    text = text.split('```json')[1].split('```')[0].strip()
                elif '```' in text:
                    text = text.split('```')[1].split('```')[0].strip()
                
                data = json.loads(text)
                if not isinstance(data, dict) or 'sections' not in data:
                    raise ValueError("Response structure invalid")
                    
                # Fix timestamps and needs_screenshot
                for section in data['sections']:
                    if section.get('timestamp_seconds', 0) > duration:
                        section['timestamp_seconds'] = max(5.0, duration - 10)
                    section['needs_screenshot'] = bool(section.get('needs_screenshot', False))
                
                print(f"✅ Successfully parsed {len(data['sections'])} sections using {model_name}")
                return data

            except json.JSONDecodeError as e:
                print(f"❌ JSON Error: {e}")
                raise e

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
        
        # Step 1: Download video and subtitles
        video_info = download_video(video_url, project_dir)
        video_path = video_info['file_path']
        subtitle_path = video_info.get('subtitle_path')
        duration = video_info['duration']
        
        # Update project with duration
        supabase.table('projects').update({
            'video_duration_seconds': duration
        }).eq('id', project_id).execute()
        
        # Recalculate credits cost based on duration
        minutes = (duration + 59) // 60  # Round up
        credits_cost = max(10, minutes * 10)
        
        # Step 2: Analyze content with Gemini (get summary and sections)
        analysis = analyze_content(video_path, subtitle_path, video_url, duration, generation_mode)
        
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
            
            # Extract screenshot only if:
            # Extract screenshot only if:
            # 1. Generation mode is text_with_images AND
            # 2. Section needs screenshot
            if generation_mode == 'text_with_images' and needs_screenshot:
                screenshot_path = None
                
                # --- Attempt 1: OpenCV Smart Screenshot (Sharpness Priority) ---
                try:
                    screenshot_path = extract_smart_screenshot(video_path, timestamp, project_dir)
                    print(f"   📸 Smart Screenshot (OpenCV) captured for section {section_order}")
                except Exception as e_cv:
                    print(f"   ⚠️ OpenCV extraction failed: {e_cv}")
                    
                    # --- Attempt 2: FFmpeg Fallback (Reliability Priority) ---
                    try:
                        print(f"   🔄 Falling back to FFmpeg for section {section_order}...")
                        # extract_screenshot returns Path, convert to str for consistency
                        screenshot_path = str(extract_screenshot(video_path, timestamp, project_dir))
                        print(f"   📸 FFmpeg Screenshot captured for section {section_order}")
                    except Exception as e_ffmpeg:
                        print(f"   ❌ All screenshot methods failed: {e_ffmpeg}")
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
    
    if not GEMINI_API_KEY:
        print("❌ Error: GEMINI_API_KEY must be set")
        exit(1)
    
    worker_loop()
