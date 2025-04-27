@echo off
echo ===== FitAI Application Launcher =====
echo.
echo Starting application...

:: Change to the directory containing the batch file
cd /d "%~dp0"

:: Attempt to kill any processes on port 3001 first
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
  taskkill /f /pid %%a >nul 2>&1
)

:: Start the application and open browser
start http://localhost:3001
timeout /t 3 /nobreak >nul

:: Run the npm command
call npm run dev-alt

:: If we get here, something went wrong
echo.
echo If the application didn't start, try running:
echo    .\fix-project.bat
echo.
echo Or manually run:
echo    npm run dev-alt 