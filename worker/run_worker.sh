#!/bin/bash

# Configuration
RESTART_DELAY=5
MAX_RESTARTS=1000

echo "🚀 Starting Worker Supervision..."
echo "Press [CTRL+C] to stop."

restart_count=0

while true; do
    echo "----------------------------------------"
    echo "📅 $(date): Starting worker process..."
    echo "----------------------------------------"
    
    # Run the worker module
    # Using python -u for unbuffered output so we see logs immediately
    if [ -f "venv/bin/python" ]; then
        ./venv/bin/python -u main.py
    else
        python3 -u main.py
    fi
    
    EXIT_CODE=$?
    
    echo "⚠️  Worker exited with code: $EXIT_CODE"
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Worker exited normally. Stopping loop."
        break
    fi
    
    restart_count=$((restart_count+1))
    
    echo "🔄 Restarting in $RESTART_DELAY seconds... (Restart #$restart_count)"
    sleep $RESTART_DELAY
done
