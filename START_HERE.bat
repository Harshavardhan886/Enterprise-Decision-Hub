@echo off
setlocal enabledelayedexpansion
set "PATH=C:\Windows\System32;C:\Windows;%PATH%"
title Enterprise Decision Hub - Launcher
color 0A

echo =======================================================================
echo              ENTERPRISE DECISION HUB - LAUNCHER
echo =======================================================================
echo.

set "PROJECT_DIR=%~dp0"
set "PYTHON_EXE=%PROJECT_DIR%.venv\Scripts\python.exe"

:: 1. Launch ML Service
echo [1/3] Starting Python ML Microservice (Port 8000)...
start "EDH - ML Service (8000)" cmd /k "cd /d "%PROJECT_DIR%ml-service" && "%PYTHON_EXE%" app.py"

:: 2. Launch Backend
echo [2/3] Starting Spring Boot Backend (Port 8081)...
start "EDH - Backend Spring Boot (8081)" cmd /k "cd /d "%PROJECT_DIR%" && call run-backend.bat"

:: 3. Launch Frontend
echo [3/3] Starting Frontend (Port 3000)...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting React via npm...
    start "EDH - Frontend (3000)" cmd /k "cd /d "%PROJECT_DIR%frontend" && npm start"
) else if exist "C:\Program Files\nodejs\npm.cmd" (
    echo Starting React via C:\Program Files\nodejs...
    start "EDH - Frontend (3000)" cmd /k "set PATH=C:\Program Files\nodejs;!PATH! && cd /d "%PROJECT_DIR%frontend" && npm start"
) else (
    echo Serving pre-built Frontend via Python on port 3000...
    start "EDH - Frontend (3000)" cmd /k "cd /d "%PROJECT_DIR%frontend\build" && "%PYTHON_EXE%" -m http.server 3000"
)

echo.
echo [*] Opening application in your browser...
timeout /t 4 /nobreak >nul
start http://localhost:3000

echo.
echo =======================================================================
echo  App launched! Keep the opened black windows open in the background.
echo =======================================================================
pause
