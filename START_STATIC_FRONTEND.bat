@echo off
title EDH - Instant Frontend
echo Starting Frontend instantly on http://localhost:3000...
cd /d "%~dp0frontend\build"
start http://localhost:3000
"%~dp0.venv\Scripts\python.exe" -m http.server 3000
pause
