@echo off
setlocal enabledelayedexpansion
title EDH Debug Diagnostics
echo =======================================================
echo          CHECKING YOUR ENVIRONMENT SETUP
echo =======================================================
echo.

echo Checking Node / NPM:
where node
if %errorlevel% neq 0 (
    echo [!] Node.js not found in PATH! Checking default locations...
    if exist "C:\Program Files\nodejs\node.exe" (
        echo Found in C:\Program Files\nodejs
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        echo Found in %LOCALAPPDATA%\Programs\nodejs
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else (
        echo [ERROR] Node.js does not appear to be installed on your computer!
    )
) else (
    echo [OK] Node found:
    node -v
    npm -v
)

echo.
echo Checking Python:
where python
if exist "N:\enterprise-decision-hub\.venv\Scripts\python.exe" (
    echo [OK] Found Python venv in project: N:\enterprise-decision-hub\.venv\Scripts\python.exe
)

echo.
echo Checking Java:
java -version 2>&1

echo.
echo =======================================================
echo Attempting to start Frontend directly...
echo =======================================================
cd /d "N:\enterprise-decision-hub\frontend"
call npm start

echo.
echo [!] If npm start exited or failed, the error is shown above.
pause
