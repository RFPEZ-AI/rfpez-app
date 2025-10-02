@echo off
REM Windows batch script to switch to Supabase LOCAL development

echo 🔄 Switching to Supabase LOCAL development...

REM Backup current .env.local
copy .env.local .env.local.backup >nul

REM Create local configuration
(
echo # Supabase Local Development Configuration ^(ACTIVE^)
echo REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
echo REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
echo SUPABASE_URL=http://127.0.0.1:54321
echo.
echo # Supabase Remote Configuration ^(INACTIVE^)
echo # REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
echo # REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM
echo # SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
echo.
echo # Development server configuration
echo GENERATE_SOURCEMAP=false
echo WDS_SOCKET_HOST=localhost
echo WDS_SOCKET_PORT=3100
echo FAST_REFRESH=true
) > .env.local

echo ✅ Switched to LOCAL Supabase
echo 🚀 Starting local Supabase stack...

REM Start local Supabase
supabase start

echo 🔗 Local Supabase URLs:
echo   - API: http://127.0.0.1:54321
echo   - Studio: http://127.0.0.1:54323
echo   - Database: http://127.0.0.1:54322
echo.
echo 💡 Restart your React app to connect to local Supabase
pause