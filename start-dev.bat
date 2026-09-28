@echo off
echo.
echo  ╔═══════════════════════════════════╗
echo  ║       AIT — AI Tools Platform     ║
echo  ╚═══════════════════════════════════╝
echo.
echo  Starting all services...
echo.

echo  [1/2] Starting Backend API (port 3000)...
start "AIT Backend" cmd /k "cd /d "%~dp0ait-backend" && bun run dev"

timeout /t 2 /nobreak > nul

echo  [2/2] Starting Frontend (port 5173)...
start "AIT Frontend" cmd /k "cd /d "%~dp0ait-frontend" && bun run dev"

echo.
echo  ✓ Backend  → http://localhost:3000
echo  ✓ Frontend → http://localhost:5173
echo  ✓ API Docs → http://localhost:3000/docs
echo.
echo  NOTE: Make sure PostgreSQL is running and .env files are configured!
echo.
pause
