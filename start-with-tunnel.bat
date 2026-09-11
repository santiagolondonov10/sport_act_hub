@echo off
REM Script to build frontend and start both backend and frontend together
REM This allows access through a tunnel

setlocal enabledelayedexpansion

echo.
echo 🔨 Building frontend...
call npm run build

if errorlevel 1 (
  echo.
  echo ❌ Frontend build failed
  exit /b 1
)

echo.
echo ✅ Frontend built successfully
echo.
echo 🚀 Starting backend server...
echo    Backend will serve both API and frontend
echo    Access locally at: http://localhost:3001
echo    Access via tunnel at: https://w3fszsbv-5173.use2.devtunnels.ms/
echo.
echo Note: Make sure port 3001 is exposed in your tunnel configuration
echo.

cd server
npm start

pause
