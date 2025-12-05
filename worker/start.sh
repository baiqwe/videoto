#!/bin/bash

# VidStep Worker Startup Script

echo "🚀 Starting VidStep Worker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  Warning: FFmpeg is not installed"
    echo "Please install FFmpeg for video processing:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt-get install ffmpeg"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Start worker
echo "✅ Starting worker..."
python main.py

