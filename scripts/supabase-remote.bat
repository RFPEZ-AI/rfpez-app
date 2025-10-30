@echo off

ECHO - dont' switch to remote accideentally
REM EXIT 
REM Windows batch script to switch to Supabase REMOTE production
echo 🔄 Switching to Supabase REMOTE production...

REM Backup current .env.local
copy .env.local .env.local.backup >nul

REM Create remote configuration
(
echo # Supabase Remote Configuration ^(ACTIVE^)
echo REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
echo REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM
echo SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
echo.
echo # Supabase Local Development Configuration ^(INACTIVE^)
echo # REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
echo # REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
echo # SUPABASE_URL=http://127.0.0.1:54321
echo.
echo # Supabase Remote Configuration ^(for MCP remote server^)
echo REACT_APP_SUPABASE_URL_REMOTE=https://jxlutaztoukwbbgtoulc.supabase.co
echo REACT_APP_SUPABASE_ANON_KEY_REMOTE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM
echo ACCESS_TOKEN=sbp_c2558d7ddb114f23dbcecbdab0dd947f09d4cf86
echo.
echo # Development server configuration
echo GENERATE_SOURCEMAP=false
echo WDS_SOCKET_HOST=localhost
echo WDS_SOCKET_PORT=3100
echo FAST_REFRESH=true
) > .env.local

pause