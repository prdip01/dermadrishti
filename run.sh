#!/bin/bash

# run.sh — DermaDrishti One-Click Launcher
# ========================================

echo "🚀 Starting DermaDrishti setup..."
echo "--------------------------------------------------------"

# 2. Navigate to backend
cd "$(dirname "$0")/backend"

# 3. Detect Python and check environment
echo "📦 Checking environment and dependencies..."

PYTHON_CMD="python3"
# Use virtual environment if it exists
if [ -d "../venv" ]; then
    PYTHON_CMD="../venv/bin/python"
    echo "🐍 Using virtual environment (Python 3.12)"
elif ! command -v $PYTHON_CMD &> /dev/null; then
    PYTHON_CMD="python"
fi

if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "❌ Error: Python is not installed. Please install Python 3."
    exit 1
fi

$PYTHON_CMD check_env.py
if [ $? -ne 0 ]; then
    echo "⚠️  Missing dependencies found. Attempting to install..."
    $PYTHON_CMD -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Error: Dependency installation failed. Please check your internet connection."
        exit 1
    fi
    # Re-verify
    $PYTHON_CMD check_env.py
    if [ $? -ne 0 ]; then
        echo "❌ Error: Environment check failed after install."
        exit 1
    fi
fi

# 4. Find an available port (starting from 5001)
PORT=5001
while lsof -i :$PORT &> /dev/null; do
    echo "⚠️  Port $PORT is busy, trying next..."
    PORT=$((PORT+1))
done

# 5. Launch the server
echo "✅ Server starting on http://localhost:$PORT"
echo "🌐 Open your browser and visit: http://localhost:$PORT"

echo "--------------------------------------------------------"
FLASK_DEBUG=false PORT=$PORT $PYTHON_CMD app.py
