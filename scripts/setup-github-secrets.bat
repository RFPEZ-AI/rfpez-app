@echo off
REM Setup GitHub Secrets for Production Deployment
REM 
REM Usage:
REM   1. Install GitHub CLI: https://cli.github.com/
REM   2. Run: gh auth login
REM   3. Run this script: scripts\setup-github-secrets.bat

echo.
echo 🔐 GitHub Secrets Setup for RFPEZ.AI Production Deployment
echo ============================================================
echo.

REM Check if gh CLI is installed
where gh >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI (gh) is not installed.
    echo.
    echo Install it:
    echo   winget install GitHub.cli
    echo.
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Not authenticated with GitHub CLI
    echo Run: gh auth login
    exit /b 1
)

echo ✅ GitHub CLI is installed and authenticated
echo.

REM Production Supabase Project Reference (known value)
set PROD_PROJECT_REF=jxlutaztoukwbbgtoulc

echo 📝 Setting up production secrets...
echo.
echo Secret 1: SUPABASE_PROD_PROJECT_REF
echo   Value: %PROD_PROJECT_REF% (auto-configured)
gh secret set SUPABASE_PROD_PROJECT_REF -b "%PROD_PROJECT_REF%"
echo   ✅ Set successfully
echo.

REM Access Token
echo Secret 2: SUPABASE_PROD_ACCESS_TOKEN
echo   Get this from: https://supabase.com/dashboard/account/tokens
echo.
set /p ACCESS_TOKEN="  Enter your Supabase Access Token: "
if "%ACCESS_TOKEN%"=="" (
    echo   ❌ Access token cannot be empty
    exit /b 1
)
gh secret set SUPABASE_PROD_ACCESS_TOKEN -b "%ACCESS_TOKEN%"
echo   ✅ Set successfully
echo.

REM Database Password
echo Secret 3: SUPABASE_PROD_DB_PASSWORD
echo   This is your production database password
echo   If you don't have it, reset it at:
echo   https://supabase.com/dashboard/project/%PROD_PROJECT_REF%/settings/database
echo.
set /p DB_PASSWORD="  Enter your Production Database Password: "
if "%DB_PASSWORD%"=="" (
    echo   ❌ Database password cannot be empty
    exit /b 1
)
gh secret set SUPABASE_PROD_DB_PASSWORD -b "%DB_PASSWORD%"
echo   ✅ Set successfully
echo.

echo ============================================================
echo ✅ All production secrets configured successfully!
echo.
echo You can now run production deployments:
echo   - Edge Functions: .github/workflows/deploy-edge-functions-production.yml
echo   - Migrations:     .github/workflows/deploy-migrations-production.yml
echo   - Full Deploy:    .github/workflows/production-deployment.yml
echo.
echo To verify secrets were set:
echo   gh secret list
echo.
