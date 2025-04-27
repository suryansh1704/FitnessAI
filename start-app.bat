@echo off
echo ===== Starting FitAI Application =====

REM Check for existing Node processes on port 3001
echo Checking for port conflicts...
netstat -ano | findstr ":3001" > nul
if %errorlevel% equ 0 (
  echo Found process on port 3001, attempting to free it...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    echo Terminating process %%a...
    taskkill /f /pid %%a > nul 2>&1
  )
  timeout /t 2 /nobreak > nul
)

REM Start the application
echo Starting application on http://localhost:3001
echo.
echo If the browser doesn't open automatically, please visit:
echo http://localhost:3001
echo.

npm run dev-alt 