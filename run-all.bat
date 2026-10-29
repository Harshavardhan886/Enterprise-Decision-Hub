@echo off
echo ===================================================
echo   Enterprise Decision Hub - Starting All Services
echo ===================================================
echo.
echo [1/3] Launching ML Microservice (FastAPI on Port 8000)...
start "EDH - ML Service (8000)" "%~dp0run-ml.bat"

timeout /t 2 /nobreak >nul

echo [2/3] Launching Backend (Spring Boot on Port 8081)...
start "EDH - Backend Spring Boot (8081)" "%~dp0run-backend.bat"

timeout /t 2 /nobreak >nul

echo [3/3] Launching Frontend (React on Port 3000)...
start "EDH - Frontend React (3000)" "%~dp0run-frontend.bat"

echo.
echo ===================================================
echo All 3 services are launching in separate windows!
echo Once started, open: http://localhost:3000
echo ===================================================
pause
