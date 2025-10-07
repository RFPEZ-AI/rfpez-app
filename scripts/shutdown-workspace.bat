@echo off
REM Workspace Shutdown Script for RFPEZ.AI (Windows)
REM Gracefully shuts down all local development services
REM Copyright Mark Skiba, 2025 All rights reserved

echo 🔄 Shutting down RFPEZ.AI workspace...

REM Stop Edge Functions (standalone)
echo ⏹️  Stopping Standalone Edge Functions...
taskkill /f /im "deno.exe" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Edge Functions stopped
) else (
    echo ⏸️  Edge Functions were not running
)

REM Stop npm development servers
echo ⏹️  Stopping NPM Development Servers...
taskkill /f /fi "WINDOWTITLE eq npm*" >nul 2>&1
taskkill /f /fi "IMAGENAME eq node.exe" /fi "COMMANDLINE eq *npm*start*" >nul 2>&1
echo ✅ NPM servers stopped

REM Stop Jest test runners
echo ⏹️  Stopping Jest Test Runners...
taskkill /f /fi "IMAGENAME eq node.exe" /fi "COMMANDLINE eq *jest*" >nul 2>&1
echo ✅ Jest runners stopped

REM Stop Supabase local stack
echo 🛑 Stopping Supabase local stack...
where supabase >nul 2>&1
if %errorlevel% == 0 (
    supabase stop
    echo ✅ Supabase local stack stopped successfully
) else (
    echo ⚠️  Supabase CLI not found - skipping Supabase shutdown
)

REM Clean up Docker containers
echo 🐳 Cleaning up Docker containers...
for /f "tokens=*" %%i in ('docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" 2^>nul') do (
    echo ⏹️  Stopping Docker container: %%i
    docker stop "%%i" >nul 2>&1
)

echo.
echo ✨ Workspace shutdown complete!
echo 🎯 Safe to close VS Code workspace now!
echo.
pause