@echo off
REM Workspace Startup Script for RFPEZ.AI (Windows)
REM Automatically starts all necessary development services
REM Copyright Mark Skiba, 2025 All rights reserved

echo 🚀 Starting RFPEZ.AI workspace...

REM Check prerequisites
echo 🔍 Checking prerequisites...

where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g @supabase/cli
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker first.
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Not in RFPEZ.AI workspace root. Please run from project root.
    exit /b 1
)

if not exist "supabase" (
    echo ❌ Supabase directory not found. Please run from project root.
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Check if port 54321 is in use
netstat -an | findstr :54321 >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️  Port 54321 in use - Supabase may already be running
) else (
    echo 📦 Starting fresh Supabase instance...
)

REM Start Supabase local stack
echo 🏗️  Starting Supabase local stack...
supabase start
if %errorlevel% == 0 (
    echo ✅ Supabase local stack started successfully
) else (
    echo ❌ Failed to start Supabase. Attempting to fix container conflicts...
    
    REM Try to fix container conflicts
    echo 🔧 Cleaning up conflicting containers...
    for /f "tokens=*" %%i in ('docker ps -a --filter name=supabase --format "{{.Names}}" 2^>nul ^| findstr rfpez-app-local') do (
        docker rm -f "%%i" >nul 2>&1
    )
    
    echo 🔄 Retrying Supabase start...
    supabase start
    if %errorlevel% neq 0 (
        echo ❌ Failed to start Supabase after cleanup. Please check Docker status.
        exit /b 1
    )
)

REM Install/update dependencies if needed
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo 🔄 Installing npm dependencies...
    npm install
) else (
    REM Check if package.json is newer than node_modules
    for %%i in (package.json) do set pkg_time=%%~ti
    for %%i in (node_modules) do set nm_time=%%~ti
    if "%pkg_time%" gtr "%nm_time%" (
        echo 🔄 Updating npm dependencies...
        npm install
    ) else (
        echo ✅ Dependencies are up to date
    )
)

REM Check for API server dependencies
if exist "api-server" (
    if not exist "api-server\node_modules" (
        echo 🔄 Installing API server dependencies...
        cd api-server
        npm install
        cd ..
    )
)

REM Start development servers info
echo 🖥️  Development servers will be started via VS Code tasks...
echo    - React Dev Server (port 3100): Use 'Start Development Server' task
echo    - API Server (port 3001): Use 'Start API' task
echo    - Test Runner: Use 'Run Tests (Watch Mode)' task

REM Verify edge functions
echo 🔧 Verifying edge functions...
curl -s -X POST "http://127.0.0.1:54321/functions/v1/claude-api-v3" -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -d "{\"userMessage\": \"startup test\", \"sessionId\": \"startup-test\"}" --max-time 10 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Edge functions are responding
) else (
    echo ⚠️  Edge functions may need time to initialize
)

REM Show status summary
echo.
echo 📊 Startup Status Summary:
curl -s http://127.0.0.1:54321/health >nul 2>&1
if %errorlevel% == 0 (
    echo    Supabase API: ✅ Running
) else (
    echo    Supabase API: ❌ Not responding
)
echo    Supabase Studio: http://127.0.0.1:54323

netstat -an | findstr :54322 >nul 2>&1
if %errorlevel% == 0 (
    echo    PostgreSQL: ✅ Running
) else (
    echo    PostgreSQL: ❌ Not running
)

REM Show next steps
echo.
echo 🎯 Next Steps:
echo    1. VS Code tasks should auto-start:
echo       • Tests (Watch Mode) - already running
echo       • Development Server - use Ctrl+Shift+P → 'Start Development Server'
echo    2. Open browser to: http://localhost:3100
echo    3. Supabase Studio: http://localhost:54323
echo.
echo ✨ Workspace startup complete! Happy coding! 🎉
echo.
pause