@echo off
cd /d "%~dp0"
title Neuevault Asset Refresh

echo.
echo Scanning Neuevault asset folders...
echo.

if not exist "package.json" (
    echo ERROR: package.json was not found.
    echo Place this BAT file in the Neuevault project root.
    echo.
    pause
    exit /b 1
)

call npm run assets:update -- --dry-run

if errorlevel 1 (
    echo.
    echo Dry-run found an error or unresolved issue.
    echo No changes were applied.
    echo.
    pause
    exit /b 1
)

echo.
choice /c YN /n /m "Apply these changes now? [Y/N]: "

if errorlevel 2 (
    echo.
    echo Update cancelled.
    timeout /t 2 >nul
    exit /b 0
)

echo.
echo Applying asset update...
echo.

call npm run assets:update

if errorlevel 1 (
    echo.
    echo ERROR: Asset update did not complete successfully.
    echo Review the messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo Asset refresh completed successfully.
echo Refresh the Neuevault Content Tool in your browser.
echo.
pause