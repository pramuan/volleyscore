@echo off
echo Starting VolleyScore System...

:: 1. Start PocketBase
:: Using relative path assuming the folder structure provided
echo Starting PocketBase...
start "" /B /D "..\pocketbase" pocketbase.exe serve

:: 2. Start Backend Server
echo Starting Server...
cd server
start "" /B npm run dev
cd ..

:: 3. Start Frontend Client
echo Starting Client...
cd client
start "" /B npm run dev -- --host 0.0.0.0
cd ..

:: 4. Wait for services to initialize (approx 5 seconds)
echo Waiting for services to launch...
timeout /t 5 /nobreak >nul

:: 5. Open Browser
echo Opening Management Dashboard...
start http://localhost:5173/management

echo Done! The services are running in the background of this window.
echo To stop them, simply close this window.
pause
