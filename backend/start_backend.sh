#!/bin/bash

echo "Starting Blissy Bakes Backend Server..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file with default values..."
    cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
SECRET_KEY=blissy-bakes-secret-key-change-in-production
EOF
    echo ".env file created!"
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created!"
    echo ""
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -d "venv/lib/python*/site-packages/fastapi" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo ""
fi

echo "Starting FastAPI server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
uvicorn app.main:app --reload --port 8000
