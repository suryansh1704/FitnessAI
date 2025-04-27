@echo off
echo ===== FitAI Reset Tool =====

echo Stopping any running Next.js processes...
taskkill /f /im node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Successfully stopped existing processes.
) else (
  echo No processes needed to be stopped.
)

echo.
echo Cleaning Next.js cache...
if exist .next (
  rmdir /s /q .next
  echo Next.js cache cleaned.
) else (
  echo No Next.js cache found.
)

echo.
echo Verifying environment files...
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
)

echo.
echo Starting Next.js development server...
npm run dev 