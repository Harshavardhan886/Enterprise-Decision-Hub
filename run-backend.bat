@echo off
SET "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot"
SET "PATH=C:\Windows\System32;C:\Windows;%JAVA_HOME%\bin;%PATH%"
SET "MVN=%USERPROFILE%\maven\apache-maven-3.9.16\bin\mvn.cmd"
if not exist "%MVN%" SET "MVN=mvn"
echo Using Java:
java -version
echo.

:: Load .env variables if present
if exist "%~dp0.env" (
    echo Loading configuration from .env...
    for /f "usebackq tokens=1,* delims==" %%A in ("%~dp0.env") do (
        echo %%A | findstr /r "^#" >nul
        if errorlevel 1 (
            if not "%%A"=="" set "%%A=%%B"
        )
    )
)

SET "SERVER_PORT=8081"
echo Starting Spring Boot backend on port 8081...
cd /d "%~dp0backend"
if exist "target\enterprise-decision-hub-1.0.0.jar" (
    java -jar target\enterprise-decision-hub-1.0.0.jar --server.port=8081
) else (
    call "%MVN%" spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
)
