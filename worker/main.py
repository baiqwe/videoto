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

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET") or os.getenv("STORAGE_BUCKET", "guide_images")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

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
    
    # First, download video only (no subtitles to avoid rate limiting)
    ydl_opts_video = {
        'format': 'best[height<=720]',  # Limit to 720p for faster download
        'outtmpl': str(output_path / '%(id)s.%(ext)s'),
        'quiet': False,
        'no_warnings': False,
        'skip_download': False,
    }
    
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
            .run(quiet=True)
        )
        
        if not screenshot_path.exists():
            raise Exception(f"Screenshot not created at {screenshot_path}")
        
        return screenshot_path
        
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
    # Initialize Gemini model
    # Try gemini-1.5-pro first (supports video), then gemini-1.5-flash, then gemini-pro
    model = None
    model_name = None
    
    for candidate in ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']:
        try:
            model = genai.GenerativeModel(candidate)
            model_name = candidate
            print(f"✅ Using {candidate} model")
            break
        except Exception as e:
            print(f"⚠️  {candidate} not available: {e}")
            continue
    
    if model is None:
        raise Exception("No Gemini model available. Please check your API key and model access.")
    
    # 1. Try to get transcript first (preferred method)
    transcript_text = parse_vtt_to_text(subtitle_path)
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
        You are an expert technical writer. Convert this video transcript into a structured, engaging blog post.
        
        Transcript:
        {transcript}
        
        Video Information:
        - URL: {video_url}
        - Duration: {duration_formatted} ({duration_seconds:.1f} seconds)
        
        Your task:
        1. First, provide a comprehensive summary of the entire video (2-3 paragraphs)
        2. Then, break down the content into 4-10 key sections that form a cohesive article
        3. For each section, identify if it needs a screenshot (core/visual moments)
        
        Return a JSON object with this structure:
        {{
            "summary": "A comprehensive 2-3 paragraph summary of the entire video content, covering main topics, key points, and overall message.",
            "sections": [
                {{
                    "section_order": 1,
                    "title": "Actionable, Specific Heading (e.g. 'Setting up the environment')",
                    "content": "Detailed explanation of this step. Use 3-5 sentences. Be specific.",
                    "timestamp_seconds": 10.5,
                    "needs_screenshot": true
                }},
                {{
                    "section_order": 2,
                    "title": "Another section",
                    "content": "More detailed content...",
                    "timestamp_seconds": 120.0,
                    "needs_screenshot": false
                }}
            ]
        }}
        
        Guidelines:
        1. Summary should capture the essence of the entire video
        2. Sections should flow logically as an article, not just a list of steps
        3. Each section should have substantial content (2-4 sentences minimum)
        4. Mark needs_screenshot=true for:
           - Visual demonstrations
           - Important UI/interface moments
           - Key concepts that benefit from visual aid
           - Core action moments
        5. Mark needs_screenshot=false for:
           - Explanatory/narrative sections
           - Introduction/overview parts
           - Summary/conclusion sections
        6. Aim for 4-10 sections depending on video length (roughly 1 section per 2-5 minutes)
        7. Timestamps should point to the most representative moment of each section
        8. Write content as article paragraphs, not step-by-step instructions
        9. 'needs_screenshot' should be true if the section describes a visual step (UI, code, action)
        10. 'timestamp_seconds' should be the exact start time of that step
        
        Return ONLY valid JSON, no markdown, no code blocks, no explanations.
        """
    
    prompt_template = get_dynamic_prompt(default_prompt_template, 'gemini_video_prompt')
    
    # Inject variables
    prompt = prompt_template.replace('{video_url}', video_url)
    prompt = prompt.replace('{duration_formatted}', format_time(duration))
    prompt = prompt.replace('{duration_seconds:.1f}', f'{duration:.1f}')
    prompt = prompt.replace('{duration_seconds}', f'{duration:.1f}')
    prompt = prompt.replace('{duration}', str(duration))
    
    try:
        if has_transcript:
            # A. Transcript mode (fast, stable)
            print("🚀 Sending TRANSCRIPT to Gemini (text-only mode)...")
            prompt = prompt.replace('{transcript}', transcript_text)
            response = model.generate_content(
                prompt,
                request_options={"timeout": 300}  # 5 minute timeout for text
            )
        else:
            # B. Video mode (fallback, slower and may fail)
            # Only gemini-1.5-pro supports video upload, gemini-pro does not
            print("⚠️  No transcript found. Attempting video upload to Gemini...")
            prompt = prompt.replace('{transcript}', "No transcript provided. Please analyze the video visual and audio.")
            
            # Check if we're using a model that supports video (1.5 series)
            if '1.5' not in str(model_name):
                raise Exception(
                    f"Video analysis requires gemini-1.5-pro or gemini-1.5-flash, but current model is {model_name}. "
                    "Please ensure your API key has access to gemini-1.5 models, or try a video with subtitles."
                )
            
            try:
                video_file = genai.upload_file(path=str(video_path), display_name=video_path.name)
                print(f"   Video uploading: {video_file.uri}")
                
                # Wait for processing
                while video_file.state.name == "PROCESSING":
                    print(".", end="", flush=True)
                    time.sleep(2)
                    video_file = genai.get_file(video_file.name)
                
                if video_file.state.name == "FAILED":
                    raise Exception("Gemini video processing failed.")
                
                print("   Video ready. Generating content...")
                response = model.generate_content(
                    [prompt, video_file],
                    request_options={"timeout": 600}  # 10 minute timeout
                )
                
                # Clean up uploaded file
                try:
                    genai.delete_file(video_file.name)
                    print("   Cleaned up uploaded video file")
                except:
                    pass
            except Exception as e:
                error_str = str(e)
                if '404' in error_str or 'not found' in error_str.lower() or 'not supported' in error_str.lower():
                    raise Exception(
                        f"Gemini model '{model_name}' does not support video analysis with your API key. "
                        "This usually means:\n"
                        "1. Your API key doesn't have access to gemini-1.5-pro or gemini-1.5-flash\n"
                        "2. The model requires a different API version\n"
                        "3. Try using a video with subtitles enabled (YouTube auto-generated subtitles work)\n\n"
                        f"Error details: {error_str}"
                    )
                raise
        
        # Parse JSON response
        try:
            text = response.text.strip()
            # Clean Markdown markers
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            data = json.loads(text)
            
            if not isinstance(data, dict) or 'sections' not in data:
                raise ValueError("Response does not have expected structure")
            
            # Validate and fix timestamps
            for section in data['sections']:
                if section['timestamp_seconds'] > duration:
                    section['timestamp_seconds'] = max(5.0, duration - 10)
                if section['timestamp_seconds'] < 0:
                    section['timestamp_seconds'] = 5.0
                # Ensure needs_screenshot is boolean
                section['needs_screenshot'] = bool(section.get('needs_screenshot', False))
            
            print(f"✅ Successfully parsed {len(data.get('sections', []))} sections")
            return data
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"Raw response preview: {response.text[:500] if hasattr(response, 'text') else 'N/A'}")
            raise Exception("AI response was not valid JSON")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        raise


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
            
            # Ensure timestamp is within video duration
            if timestamp > duration:
                timestamp = max(5.0, duration - 10)
            
            image_path = None
            
            # Extract screenshot only if:
            # 1. Generation mode is text_with_images AND
            # 2. Section needs screenshot
            if generation_mode == 'text_with_images' and needs_screenshot:
                try:
                    # Extract screenshot
                    screenshot_path = extract_screenshot(video_path, timestamp, project_dir)
                    
                    # Upload to Supabase Storage
                    image_path = upload_to_supabase_storage(
                        screenshot_path,
                        project_id,
                        section_order
                    )
                    print(f"   📸 Screenshot captured for section {section_order}")
                except Exception as e:
                    print(f"   ⚠️  Screenshot skipped for section {section_order}: {e}")
                    # Continue without screenshot
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
                shutil.rmtree(project_dir)
                print(f"🧹 Cleaned up temp directory for {project_id}")
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
