#!/bin/bash

# VidStep Worker 本地测试启动脚本
# 用于测试 Storyboard 截图功能

echo "🚀 Starting VidStep Worker (Local Test Mode)"
echo "================================================"
echo ""

# 检查环境变量
echo "📋 Checking environment variables..."

if [ -f .env ]; then
    echo "✅ .env file found"
    source .env
else
    echo "❌ .env file not found in worker directory"
    echo "   Please create worker/.env with required variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"  
    echo "   - GEMINI_API_KEY"
    echo "   - OPENAI_BASE_URL (optional)"
    exit 1
fi

# 检查必需的环境变量
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "GEMINI_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    else
        echo "✅ $var is set"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo ""
echo "🎯 Worker Configuration:"
echo "   Supabase: ${SUPABASE_URL}"
echo "   Storage Bucket: ${STORAGE_BUCKET:-guide_images}"
echo "   AI Backend: ${OPENAI_BASE_URL:-Google Gemini}"
echo ""

# 启动 worker
echo "🔄 Starting worker loop..."
echo "   Press Ctrl+C to stop"
echo ""
echo "================================================"
echo ""

python3 main.py
