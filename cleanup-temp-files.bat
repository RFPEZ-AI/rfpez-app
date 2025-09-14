@echo off
echo 🧹 Cleaning up temporary files from working tree...
echo.

REM Test and debugging files - HTML
echo Removing HTML test files...
if exist "test-mcp-server.html" (
    del "test-mcp-server.html"
    echo ✅ Removed test-mcp-server.html
)
if exist "test-agents-update.html" (
    del "test-agents-update.html" 
    echo ✅ Removed test-agents-update.html
)
if exist "test-rfp-workflow-automation.html" (
    del "test-rfp-workflow-automation.html"
    echo ✅ Removed test-rfp-workflow-automation.html
)

REM Test and debugging files - JavaScript
echo.
echo Removing JavaScript test files...
if exist "test-mcp-server.js" (
    del "test-mcp-server.js"
    echo ✅ Removed test-mcp-server.js
)
if exist "test-rfp-status-tracking.js" (
    del "test-rfp-status-tracking.js"
    echo ✅ Removed test-rfp-status-tracking.js
)
if exist "check-rfp-creation.js" (
    del "check-rfp-creation.js"
    echo ✅ Removed check-rfp-creation.js
)

REM Setup and utility scripts
echo.
echo Removing setup utility scripts...
if exist "setup-mcp-env.js" (
    del "setup-mcp-env.js"
    echo ✅ Removed setup-mcp-env.js
)
if exist "refresh-auth-token.js" (
    del "refresh-auth-token.js"
    echo ✅ Removed refresh-auth-token.js
)
if exist "update-agent-instructions.js" (
    del "update-agent-instructions.js"
    echo ✅ Removed update-agent-instructions.js
)

REM Database migration and SQL files (these should be applied manually first)
echo.
echo Removing temporary database files...
if exist "database\migration-add-rfp-status.sql" (
    del "database\migration-add-rfp-status.sql"
    echo ✅ Removed database\migration-add-rfp-status.sql
)
if exist "database\MANUAL-UPDATE-rfp-status.sql" (
    del "database\MANUAL-UPDATE-rfp-status.sql"
    echo ✅ Removed database\MANUAL-UPDATE-rfp-status.sql
)
if exist "database\FIX-CHECK-CONSTRAINTS.sql" (
    del "database\FIX-CHECK-CONSTRAINTS.sql"
    echo ✅ Removed database\FIX-CHECK-CONSTRAINTS.sql
)
if exist "database\migration-add-user-id-to-rfps.sql" (
    del "database\migration-add-user-id-to-rfps.sql"
    echo ✅ Removed database\migration-add-user-id-to-rfps.sql
)
if exist "update-rfp-design-agent.sql" (
    del "update-rfp-design-agent.sql"
    echo ✅ Removed update-rfp-design-agent.sql
)
if exist "update-rfp-design-agent-with-workflow.sql" (
    del "update-rfp-design-agent-with-workflow.sql"
    echo ✅ Removed update-rfp-design-agent-with-workflow.sql
)

REM Implementation documentation
echo.
echo Removing temporary documentation...
if exist "RFP-STATUS-IMPLEMENTATION.md" (
    del "RFP-STATUS-IMPLEMENTATION.md"
    echo ✅ Removed RFP-STATUS-IMPLEMENTATION.md
)

REM Binary downloads
echo.
echo Removing binary downloads...
if exist "supabase_windows_amd64.zip" (
    del "supabase_windows_amd64.zip"
    echo ✅ Removed supabase_windows_amd64.zip
)

REM Temporary CLI files
echo.
echo Removing temporary CLI files...
if exist "supabase\.temp\cli-latest" (
    del "supabase\.temp\cli-latest"
    echo ✅ Removed supabase\.temp\cli-latest
)

echo.
echo 🎉 Cleanup complete!
echo.
echo 📋 Files that remain and should be committed:
echo   ✅ supabase\functions\mcp-server\index.ts (core enhancement)
echo.
echo ⚠️  IMPORTANT: Before committing, manually apply these SQL migrations in Supabase:
echo   • database\MANUAL-UPDATE-rfp-status.sql (if not already applied)
echo   • database\FIX-CHECK-CONSTRAINTS.sql (if not already applied)
echo.
echo 🔧 After cleanup, your commit should only include the enhanced MCP server function.
pause