@echo off
REM run.bat
REM Quickly start the Syllabix Marks Analyzer development servers.
REM Skips installation checks for faster startup.

echo Starting Syllabix Marks Analyzer...
echo.

REM 1. Start Backend in a new window
echo [1/2] Launching Backend (Flask) on port 5000...
start "Syllabix Backend" cmd /k "call .venv\Scripts\activate.bat && python server.py"

REM 2. Start Frontend in a new window
echo [2/2] Launching Frontend (Vite) on port 3000...
cd frontend
start "Syllabix Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Servers are running!
echo Backend:   http://localhost:5000
echo Frontend:  http://localhost:3000
echo.
echo (You can close this window now)
pause
