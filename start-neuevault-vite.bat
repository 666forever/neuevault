@echo off
setlocal
title Neuevault Vite Dev Server

cd /d "%~dp0"

echo.
echo  Neuevault Vite localhost
echo  ------------------------
echo  Folder: %CD%
echo.

if not exist "package.json" (
    echo ERROR: package.json was not found.
    echo Place this BAT file in the root Neuevault project folder.
    echo.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js was not found.
    echo Install the current Node.js LTS version, then run this file again.
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found.
    echo Reinstall Node.js with npm included.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Installing project dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo Starting Vite...
echo Press Ctrl+C to stop the server.
echo.

call npm run dev -- --host 127.0.0.1 --open

echo.
echo The Vite server has stopped.
pause
endlocal
