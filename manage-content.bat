@echo off
cd /d "%~dp0"
title Neuevault Content Manager

echo Checking Neuevault content manager...
echo.

powershell -NoProfile -Command ^
"$port=4317; $inUse=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if($inUse){Start-Process 'http://127.0.0.1:4317'; exit 10}else{exit 0}"

if errorlevel 10 (
    echo Content manager is already running.
    echo Opened http://127.0.0.1:4317
    timeout /t 2 >nul
    exit /b 0
)

if not exist "package.json" (
    echo ERROR: package.json was not found.
    echo Place this BAT file in the Neuevault project root.
    pause
    exit /b 1
)

echo Starting Neuevault content manager...
start "" "http://127.0.0.1:4317"
call npm run manage:content

echo.
echo Content manager stopped.
pause