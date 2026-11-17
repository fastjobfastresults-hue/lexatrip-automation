@echo off
title Lexa Trip Jaisalmer - Social Media Automation Engine
color 0E
echo ======================================================================
echo          LEXA TRIP JAISALMER - SOCIAL MEDIA AUTOMATION ENGINE
echo ======================================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b
)

echo [2/3] Launching Lexa Trip Automation Engine on http://localhost:3800 ...
start "" http://localhost:3800

echo [3/3] Engine Running in background. Press Ctrl+C to stop anytime.
echo ======================================================================
node server.js
pause
