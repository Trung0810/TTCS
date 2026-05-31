@echo off
REM LPR System - Quick Setup Script for Windows
REM This script will set up and start both backend and frontend

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo  LPR SYSTEM - LICENSE PLATE RECOGNITION - FULL STACK SETUP
echo ========================================================================
echo.

REM Colors (Windows 10+ supports ANSI codes)
for /F %%A in ('copy /Z "%~f0" nul') do set "BS=%%A"

:menu
echo.
echo Select an option:
echo [1] Install Python dependencies
echo [2] Install Node.js packages (npm install)
echo [3] Start Backend (FastAPI server)
echo [4] Start Frontend (React development server)
echo [5] Check Backend Health
echo [6] Open API Documentation
echo [7] View Integration Guide
echo [0] Exit
echo.
set /p choice="Enter your choice [0-7]: "

if "%choice%"=="1" goto install_deps
if "%choice%"=="2" goto install_npm
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto start_frontend
if "%choice%"=="5" goto health_check
if "%choice%"=="6" goto api_docs
if "%choice%"=="7" goto view_guide
if "%choice%"=="0" goto exit
goto menu

:install_deps
echo.
echo [*] Installing Python dependencies...
echo [*] This may take a few minutes...
echo.
pip install -r requirements.txt
if %errorlevel% equ 0 (
    echo.
    echo [✓] Dependencies installed successfully!
    echo [*] You can now start the backend with option 3
) else (
    echo.
    echo [✗] Failed to install dependencies
    echo [*] Please ensure Python 3.8+ and pip are installed
)
pause
goto menu

:install_npm
echo.
echo [*] Installing Node.js packages...
echo [*] This may take a few minutes...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [✗] Node.js not found!
    echo [*] Please install Node.js from https://nodejs.org/
    pause
    goto menu
)

if not exist package.json (
    echo [✗] package.json not found!
    echo [*] Make sure you're in the correct directory
    pause
    goto menu
)

npm install
if %errorlevel% equ 0 (
    echo.
    echo [✓] npm packages installed successfully!
    echo [*] You can now start the frontend with option 4
) else (
    echo.
    echo [✗] Failed to install npm packages
    echo [*] Please check your npm installation
)
pause
goto menu

:start_backend
echo.
echo [*] Starting LPR Backend Server...
echo [*] Checking for model files...
echo.

if not exist yolov11_detection.pt (
    echo [!] Warning: yolov11_detection.pt not found
    echo [*] The system will still start but YOLO detection may not work
)

if not exist crnn_recognition.pt (
    echo [!] Warning: crnn_recognition.pt not found
    echo [*] The system will still start but CRNN recognition may not work
)

echo.
echo [*] Starting FastAPI server on http://0.0.0.0:8000
echo [*] API Documentation: http://localhost:8000/docs
echo [*] Health Check: http://localhost:8000/api/health
echo.
echo [*] Press Ctrl+C to stop the server
echo.

python app.py
pause
goto menu

:start_frontend
echo.
echo [*] Starting React Frontend...
echo [*] Checking for Node.js...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [✗] Node.js not found!
    echo [*] Please install Node.js from https://nodejs.org/
    echo [*] Then run: npm start from your React project directory
    pause
    goto menu
)

echo [✓] Node.js found
echo.
echo [*] Starting development server on http://localhost:3000
echo [*] Press Ctrl+C to stop the server
echo.

npm start
pause
goto menu

:health_check
echo.
echo [*] Checking backend health...
echo [*] Sending request to http://localhost:8000/api/health
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/health' -ErrorAction Stop; Write-Host '[✓] Backend is RUNNING' -ForegroundColor Green; Write-Host $response.Content | ConvertFrom-Json | Format-Table -AutoSize } catch { Write-Host '[✗] Backend is NOT running' -ForegroundColor Red; Write-Host 'Please start the backend first with option 2' -ForegroundColor Yellow }"

echo.
pause
goto menu

:api_docs
echo.
echo [*] Opening API Documentation in browser...
echo [*] If the page doesn't load, ensure the backend is running (option 2)
echo.

start http://localhost:8000/docs
timeout /t 2
goto menu

:view_guide
echo.
echo [*] Opening Integration Guide...
echo.

if exist INTEGRATION_GUIDE.md (
    start INTEGRATION_GUIDE.md
) else (
    echo [!] Integration guide not found
)
timeout /t 2
goto menu

:exit
echo.
echo ========================================================================
echo  Goodbye! The LPR system is ready for use.
echo ========================================================================
echo.
exit /b 0
