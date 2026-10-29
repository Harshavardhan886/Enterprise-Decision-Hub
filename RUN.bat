@echo off
title Enterprise Decision Hub
color 0b

if exist "%~dp0.venv\Scripts\python.exe" (
    "%~dp0.venv\Scripts\python.exe" "%~dp0run_project.py"
) else if exist "C:\Users\phars\AppData\Local\Python\pythoncore-3.14-64\python.exe" (
    "C:\Users\phars\AppData\Local\Python\pythoncore-3.14-64\python.exe" "%~dp0run_project.py"
) else (
    python "%~dp0run_project.py"
)
pause
