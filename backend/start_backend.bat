@echo off
echo Starting Blissy Bakes Backend Server...
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file with default values...
    (
        echo DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
        echo SECRET_KEY=blissy-bakes-secret-key-change-in-production
    ) > .env
    echo .env file created!
    echo.
)

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created!
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if needed
if not exist venv\Lib\site-packages\fastapi (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo.
)

echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
uvicorn app.main:app --reload --port 8000
