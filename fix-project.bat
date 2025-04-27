@echo off
echo ===== FitAI Project Fixer =====

REM Stop any Node.js processes that might be running
echo Stopping any Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Successfully stopped Node.js processes.
) else (
  echo No Node.js processes needed to be stopped.
)

REM Check for port conflicts
echo Checking for port conflicts...
netstat -ano | findstr ":3000" >nul
if %ERRORLEVEL% EQU 0 (
  echo Found process on port 3000, freeing it up...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a
    echo Process %%a stopped.
  )
)

netstat -ano | findstr ":3001" >nul
if %ERRORLEVEL% EQU 0 (
  echo Found process on port 3001, freeing it up...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a
    echo Process %%a stopped.
  )
)

REM Clean Next.js cache
echo Cleaning Next.js cache...
if exist .next (
  rmdir /s /q .next
  echo Next.js cache cleaned.
) else (
  echo No Next.js cache found.
)

REM Verify project files
echo Verifying project files...
echo - Checking Firebase configuration...

REM Check if environment file exists
echo Setting up environment files...
if exist .env (
  echo Found .env file
) else (
  echo Creating .env file...
  (
    echo # Firebase Configuration 
    echo NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC_de-W4MKr9QWJt3ViFTE5fj3D7e-vzIs
    echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fitness-app-47f3f.firebaseapp.com
    echo NEXT_PUBLIC_FIREBASE_PROJECT_ID=fitness-app-47f3f
    echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fitness-app-47f3f.firebasestorage.app
    echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=843463635545
    echo NEXT_PUBLIC_FIREBASE_APP_ID=1:843463635545:web:b43b97cbd1a6919b6d3748
    echo NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-64FMHWDM85
  ) > .env
  echo Created .env file with Firebase configuration.
)

echo Running app on port 3001...
echo App will be available at http://localhost:3001
echo If the browser does not open automatically, please manually navigate to:
echo http://localhost:3001

npm run dev-alt 