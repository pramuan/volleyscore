@echo off
setlocal
echo Starting VolleyScore System...

:: Get the absolute directory of this script (includes trailing backslash)
set "SCRIPT_DIR=%~dp0"
echo Script location: %SCRIPT_DIR%

:: 1. Start PocketBase
set "PB_DIR=%SCRIPT_DIR%pocketbase"

if not exist "%PB_DIR%\pocketbase.exe" (
    echo [ERROR] Could not find pocketbase.exe at: %PB_DIR%
    echo.
    echo Please make sure the 'pocketbase' folder is inside the 'volleyscore' folder.
    pause
    exit /b
)

echo Found PocketBase at: %PB_DIR%
echo Starting PocketBase...
start "VolleyScore Database" /B /D "%PB_DIR%" pocketbase.exe serve

:: 2. Start Backend Server
echo Starting Server...
if exist "%SCRIPT_DIR%server" (
    cd /d "%SCRIPT_DIR%server"
    start "VolleyScore Server" /B npm run dev
) else (
    echo [ERROR] Could not find 'server' folder!
)

:: 3. Start Frontend Client
echo Starting Client...
if exist "%SCRIPT_DIR%client" (
    cd /d "%SCRIPT_DIR%client"
    :: --host 0.0.0.0 allows external access
    start "VolleyScore Client" /B npm run dev -- --host 0.0.0.0
) else (
    echo [ERROR] Could not find 'client' folder!
)

:: 4. Wait for services
echo Waiting for services to launch...
timeout /t 5 /nobreak >nul

:: 5. Open Browser
echo Opening Management Dashboard...
start http://localhost:5173/management

echo.
echo ===================================================
echo   VolleyScore System is Running
echo   - Local:    http://localhost:5173
echo   - Network:  Check your IP address (e.g. 192.168.x.x:5173)
echo ===================================================
echo.
echo To stop services, close this window.
pause
