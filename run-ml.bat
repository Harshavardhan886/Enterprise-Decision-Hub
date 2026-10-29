@echo off
title EDH - ML Microservice (8000)
set "PATH=%~dp0.venv\Scripts;%PATH%"
cd /d "%~dp0ml-service"
if exist "..\.venv\Scripts\activate.bat" (
    call "..\.venv\Scripts\activate.bat"
)
python app.py
pause
