@echo off
title EDH - React Frontend (3000)
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo Starting React development server...
call npm start
pause
