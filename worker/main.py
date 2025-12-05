#!/usr/bin/env python3
"""
VidStep Python Worker
Processes video projects by:
1. Downloading videos from YouTube
2. Analyzing with Gemini AI
3. Extracting screenshots at key timestamps
4. Uploading to Supabase Storage
5. Updating project status
"""

import os
import time
import json
import tempfile
import shutil
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
TEMP_DIR = Path(tempfile.gettempdir()) / "vidstep_worker"
TEMP_DIR.mkdir(exist_ok=True)


def format_time(seconds: float) -> str:
    """Format seconds to HH:MM:SS"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def download_video(url: str, output_path: Path) -> Dict:
    """
    Download video from YouTube using yt-dlp
    
    Returns:
        Dict with video info including duration
    """
    print(f"Downloading video from: {url}")
    
    ydl_opts = {
        'format': 'best[height<=720]',  # Download 720p or lower to save bandwidth
        'outtmpl': str(output_path / '%(id)s.%(ext)s'),
        'quiet': False,
        'no_warnings': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info.get('id')
        duration = info.get('duration', 0)
        
        # Find the downloaded file
        downloaded_file = None
        for ext in ['mp4', 'webm', 'mkv']:
            potential_file = output_path / f"{video_id}.{ext}"
            if potential_file.exists():
                downloaded_file = potential_file
                break
        
        if not downloaded_file:
            raise Exception(f"Downloaded video file not found for {video_id}")
        
        return {
            'file_path': downloaded_file,
            'duration': duration,
            'title': info.get('title', ''),
            'video_id': video_id,
        }


def extract_key_frames(video_path: Path, duration: float, num_frames: int = 10) -> List[float]:
    """
    Extract evenly distributed timestamps for key frames
    
    Returns:
        List of timestamps in seconds
    """
    if duration <= 0:
        return [5.0]
    
    # Extract frames at regular intervals
    interval = duration / (num_frames + 1)
    timestamps = [interval * (i + 1) for i in range(num_frames)]
    
    # Ensure first frame is not too early
    if timestamps[0] < 5.0:
        timestamps[0] = 5.0
    
    return timestamps


def analyze_video_with_gemini(video_path: Path, video_url: str, duration: float) -> Dict:
    """
    Use Gemini 1.5 Pro to analyze video and extract content as article sections
    
    Strategy:
    1. Upload video directly to Gemini 1.5 Pro (supports video files)
    2. Get comprehensive summary and analysis
    3. Extract key sections as article paragraphs
    4. Identify which sections need screenshots
    
    Returns:
        Dict with:
        - summary: overall video summary
        - sections: List of section dictionaries with content and screenshot flags
    """
    print("Analyzing video with Gemini AI...")
    print(f"Video duration: {format_time(duration)}")
    
    # Initialize Gemini model
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    # Upload video file to Gemini
    print("Uploading video to Gemini for analysis...")
    try:
        video_file = genai.upload_file(path=str(video_path), display_name=video_path.name)
        print(f"Video uploaded: {video_file.uri}")
    except Exception as e:
        print(f"Error uploading video: {e}")
        # Fallback to text-only analysis
        return analyze_video_text_only(video_url, duration)
    
    # Prepare comprehensive prompt
    prompt = f"""
    Analyze this video comprehensively and create a structured article-style guide.
    
    Video Information:
    - URL: {video_url}
    - Duration: {format_time(duration)} ({duration:.1f} seconds)
    
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
                "title": "Section title (clear and descriptive)",
                "content": "Detailed paragraph content for this section. Should be 2-4 sentences, written as part of an article. Focus on explaining concepts, insights, or key information from this part of the video.",
                "timestamp_seconds": 15.5,
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
    
    Return ONLY valid JSON, no markdown, no code blocks, no explanations.
    """
    
    try:
        # Generate content with video file
        print("Generating analysis with Gemini...")
        response = model.generate_content(
            [prompt, video_file],
            request_options={"timeout": 600}  # 10 minute timeout
        )
        
        # Clean up uploaded file
        try:
            genai.delete_file(video_file.name)
            print("Cleaned up uploaded video file")
        except:
            pass
        
        response_text = response.text.strip()
        
        # Clean JSON response
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        # Parse JSON
        result = json.loads(response_text)
        
        if not isinstance(result, dict) or 'sections' not in result:
            raise ValueError("Response does not have expected structure")
        
        # Validate and fix timestamps
        for section in result['sections']:
            if section['timestamp_seconds'] > duration:
                section['timestamp_seconds'] = max(5.0, duration - 10)
            if section['timestamp_seconds'] < 0:
                section['timestamp_seconds'] = 5.0
            # Ensure needs_screenshot is boolean
            section['needs_screenshot'] = bool(section.get('needs_screenshot', False))
        
        print(f"Analysis complete: {len(result['sections'])} sections extracted")
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Response was: {response_text[:500] if 'response_text' in locals() else 'N/A'}")
        # Clean up uploaded file
        try:
            genai.delete_file(video_file.name)
        except:
            pass
        return generate_fallback_analysis(duration)
    except Exception as e:
        print(f"Error analyzing video with Gemini: {e}")
        # Clean up uploaded file
        try:
            genai.delete_file(video_file.name)
        except:
            pass
        return generate_fallback_analysis(duration)


def analyze_video_text_only(video_url: str, duration: float) -> Dict:
    """Fallback: analyze video using text-only prompt (when video upload fails)"""
    print("Using text-only analysis (fallback mode)...")
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    prompt = f"""
    Based on the video URL and duration, create a structured article-style guide.
    
    Video URL: {video_url}
    Duration: {format_time(duration)}
    
    Create a JSON object with summary and sections as described in the main prompt.
    """
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        result = json.loads(response_text)
        return result
    except:
        return generate_fallback_analysis(duration)


def generate_fallback_analysis(duration: float) -> Dict:
    """Generate fallback analysis if AI analysis fails"""
    num_sections = max(3, min(8, int(duration / 120)))  # 1 section per 2 minutes, 3-8 sections
    interval = duration / (num_sections + 1)
    
    sections = []
    for i in range(num_sections):
        timestamp = interval * (i + 1)
        if timestamp < 5.0:
            timestamp = 5.0 + i * 30
        
        sections.append({
            "section_order": i + 1,
            "title": f"Section {i + 1}",
            "content": f"This is section {i + 1} of the video content.",
            "timestamp_seconds": timestamp,
            "needs_screenshot": (i % 2 == 0)  # Alternate screenshots
        })
    
    return {
        "summary": f"This video covers {num_sections} main topics over {format_time(duration)}.",
        "sections": sections
    }


def generate_fallback_steps(duration: float) -> List[Dict]:
    """Generate fallback steps if AI analysis fails"""
    num_steps = max(3, min(10, int(duration / 60)))  # 1 step per minute, 3-10 steps
    interval = duration / (num_steps + 1)
    
    steps = []
    for i in range(num_steps):
        timestamp = interval * (i + 1)
        if timestamp < 5.0:
            timestamp = 5.0 + i * 10
        
        steps.append({
            "step_order": i + 1,
            "title": f"Step {i + 1}",
            "description": f"This is step {i + 1} of the tutorial.",
            "timestamp_seconds": timestamp
        })
    
    return steps


def extract_screenshot(video_path: Path, timestamp: float, output_path: Path) -> Path:
    """
    Extract a screenshot from video at specific timestamp using FFmpeg
    
    Returns:
        Path to the screenshot file
    """
    print(f"Extracting screenshot at {format_time(timestamp)}")
    
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
        print(f"Error extracting screenshot: {e}")
        raise


def upload_to_supabase_storage(file_path: Path, project_id: str, step_order: int) -> str:
    """
    Upload file to Supabase Storage
    
    Returns:
        Public URL of the uploaded file
    """
    print(f"Uploading {file_path.name} to Supabase Storage...")
    
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
        
        # Get public URL
        response = supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)
        
        return storage_path  # Return storage path, not full URL (frontend will construct it)
        
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
        raise


def save_step_to_db(project_id: str, step_data: Dict, image_path: str):
    """Save step/section to database"""
    try:
        supabase.table('steps').insert({
            'project_id': project_id,
            'step_order': step_data['step_order'],
            'title': step_data['title'],
            'description': step_data['description'],
            'timestamp_seconds': step_data['timestamp_seconds'],
            'image_path': image_path if image_path else None,  # NULL if no image
        }).execute()
        has_image = "with image" if image_path else "text only"
        print(f"Saved section {step_data['step_order']} to database ({has_image})")
    except Exception as e:
        print(f"Error saving step to database: {e}")
        raise


def process_project(project: Dict):
    """Process a single project"""
    project_id = project['id']
    video_url = project['video_source_url']
    
    print(f"\n{'='*60}")
    print(f"Processing project: {project_id}")
    print(f"Video URL: {video_url}")
    print(f"{'='*60}\n")
    
    # Update status to processing
    try:
        supabase.table('projects').update({
            'status': 'processing'
        }).eq('id', project_id).execute()
    except Exception as e:
        print(f"Error updating project status: {e}")
        return
    
    # Create temp directory for this project
    project_temp_dir = TEMP_DIR / project_id
    project_temp_dir.mkdir(exist_ok=True)
    
    try:
        # Step 1: Download video
        video_info = download_video(video_url, project_temp_dir)
        video_path = video_info['file_path']
        duration = video_info['duration']
        
        # Update project with duration
        supabase.table('projects').update({
            'video_duration_seconds': duration
        }).eq('id', project_id).execute()
        
        # Recalculate credits cost based on duration
        minutes = (duration + 59) // 60  # Round up
        credits_cost = max(10, minutes * 10)
        
        # Step 2: Analyze video with Gemini (get summary and sections)
        analysis = analyze_video_with_gemini(video_path, video_url, duration)
        
        if not analysis or 'sections' not in analysis:
            raise Exception("No analysis extracted from video")
        
        summary = analysis.get('summary', '')
        sections = analysis['sections']
        
        # Update project with summary
        if summary:
            supabase.table('projects').update({
                'title': summary[:200] if len(summary) > 200 else summary  # Use summary as title if available
            }).eq('id', project_id).execute()
        
        # Step 3: Process sections - extract screenshots only for sections that need them
        for section in sections:
            section_order = section['section_order']
            timestamp = section['timestamp_seconds']
            needs_screenshot = section.get('needs_screenshot', False)
            
            # Ensure timestamp is within video duration
            if timestamp > duration:
                timestamp = max(5.0, duration - 10)
            
            image_path = None
            
            # Only extract screenshot if needed
            if needs_screenshot:
                try:
                    # Extract screenshot
                    screenshot_path = extract_screenshot(video_path, timestamp, project_temp_dir)
                    
                    # Upload to Supabase Storage
                    image_path = upload_to_supabase_storage(
                        screenshot_path,
                        project_id,
                        section_order
                    )
                except Exception as e:
                    print(f"Warning: Could not extract screenshot for section {section_order}: {e}")
                    # Continue without screenshot
            
            # Save section to database (as step)
            save_step_to_db(project_id, {
                'step_order': section_order,
                'title': section['title'],
                'description': section['content'],  # Use content as description
                'timestamp_seconds': timestamp
            }, image_path or '')  # Empty string if no screenshot
        
        # Update project status to completed
        supabase.table('projects').update({
            'status': 'completed',
            'credits_cost': credits_cost,
        }).eq('id', project_id).execute()
        
        print(f"\n✅ Project {project_id} completed successfully!")
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
            if project_temp_dir.exists():
                shutil.rmtree(project_temp_dir)
                print(f"Cleaned up temp directory for {project_id}")
        except Exception as e:
            print(f"Error cleaning up temp directory: {e}")


def worker_loop():
    """Main worker loop - polls for pending projects"""
    print("🚀 VidStep Worker started")
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
            print(f"Error in worker loop: {e}")
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

