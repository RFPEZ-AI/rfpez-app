@echo off
REM Supabase Production Setup Helper Script (Windows)
REM This script guides you through setting up the RFPEZ-PROD Supabase project

echo ========================================
echo   RFPEZ.AI Production Supabase Setup
echo ========================================
echo.

echo [WARNING] Prerequisites:
echo   1. RFPEZ-PROD project created in Supabase
echo   2. Supabase CLI installed (supabase --version)
echo   3. Access to Supabase dashboard
echo.
pause

REM Step 1: Get project details
echo.
echo [Step 1] Get Production Project Details
echo ---
echo Go to: https://supabase.com/dashboard
echo Select: RFPEZ-PROD project
echo Navigate to: Settings - General
echo.

set /p PROD_PROJECT_REF="fyvudrxvbwywazswrgpm"
set /p PROD_API_URL="https://fyvudrxvbwywazswrgpm.supabase.co"
set /p PROD_ANON_KEY="sb_publishable_p9cdx5pJP5cHBWCVUfFtGw_VQgDhGKy"
set /p PROD_DB_PASSWORD="cN3ff5xRK%tbY9f"

REM Step 2: Generate access token
echo.
echo [Step 2] Generate Access Token
echo ---
echo Go to: https://supabase.com/dashboard/account/tokens
echo Click: Generate New Token
echo Name: RFPEZ-PROD GitHub Actions
echo.
set /p PROD_ACCESS_TOKEN="sbp_cf69df7dbb985af1811bf17b1ef555bae1f5b449"

REM Step 3: Verify credentials
echo.
echo [Step 3] Verify Credentials
echo ---
echo Project Ref: %PROD_PROJECT_REF%
echo API URL: %PROD_API_URL%
echo Anon Key: %PROD_ANON_KEY:~0,20%...
echo DB Password: ********
echo Access Token: %PROD_ACCESS_TOKEN:~0,20%...
echo.
set /p CONFIRM="Are these credentials correct? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo [ERROR] Setup cancelled. Please run again with correct credentials.
    exit /b 1
)

REM Step 4: Create .env.production.local file
echo.
echo [Step 4] Create Local Production Environment File
echo ---

(
echo # RFPEZ.AI Production Environment (Local Reference^)
echo # DO NOT COMMIT THIS FILE - IT'S IN .gitignore
echo.
echo # Supabase Production Configuration
echo REACT_APP_SUPABASE_URL=%PROD_API_URL%
echo REACT_APP_SUPABASE_ANON_KEY=%PROD_ANON_KEY%
echo.
echo # Production Mode
echo NODE_ENV=production
echo REACT_APP_ENVIRONMENT=production
echo.
echo # Beta Test Configuration (Production - requires billing^)
echo REACT_APP_BETA_TEST=false
echo.
echo # Build Configuration
echo GENERATE_SOURCEMAP=false
echo FAST_REFRESH=false
) > .env.production.local

echo [SUCCESS] Created .env.production.local
echo.

REM Step 5: Create secrets file for GitHub reference
echo [Step 5] Create GitHub Secrets Reference File
echo ---

(
echo # GitHub Secrets for Production Deployment
echo # Add these to: https://github.com/markesphere/rfpez-app/settings/secrets/actions
echo # DO NOT COMMIT THIS FILE - IT'S IN .gitignore
echo.
echo # Supabase Production Secrets
echo SUPABASE_PROD_ACCESS_TOKEN=%PROD_ACCESS_TOKEN%
echo SUPABASE_PROD_PROJECT_REF=%PROD_PROJECT_REF%
echo SUPABASE_PROD_DB_PASSWORD=%PROD_DB_PASSWORD%
echo REACT_APP_SUPABASE_URL_PROD=%PROD_API_URL%
echo REACT_APP_SUPABASE_ANON_KEY_PROD=%PROD_ANON_KEY%
echo.
echo # Azure Production Secret (to be added after Azure setup^)
echo # AZURE_STATIC_WEB_APPS_API_TOKEN_PROD=[Get from Azure CLI]
echo.
echo ---
echo Setup completed: %date% %time%
) > github-secrets-production.txt

echo [SUCCESS] Created github-secrets-production.txt
echo [WARNING] Keep this file secure and do not commit it!
echo.

REM Step 6: Test connection
echo [Step 6] Test Supabase Connection
echo ---
echo Testing connection to production Supabase...
echo.

where supabase >nul 2>nul
if %errorlevel% equ 0 (
    echo Attempting to link to production project...
    supabase link --project-ref %PROD_PROJECT_REF% --password %PROD_DB_PASSWORD%
    
    echo.
    echo Your Supabase projects:
    supabase projects list
) else (
    echo [WARNING] Supabase CLI not found. Install with: npm install -g supabase
)
echo.

REM Step 7: Update .gitignore
echo [Step 7] Update .gitignore
echo ---

findstr /C:".env.production.local" .gitignore >nul 2>nul
if %errorlevel% neq 0 (
    echo .env.production.local>> .gitignore
    echo github-secrets-production.txt>> .gitignore
    echo [SUCCESS] Updated .gitignore
) else (
    echo [SUCCESS] .gitignore already configured
)
echo.

REM Summary
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Files created:
echo   - .env.production.local (local production env^)
echo   - github-secrets-production.txt (GitHub secrets reference^)
echo.
echo Next Steps:
echo.
echo 1. Add GitHub Secrets:
echo    - Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions
echo    - Add all secrets from: github-secrets-production.txt
echo    - Delete the file after adding secrets (for security^)
echo.
echo 2. Setup Azure Static Web App:
echo    - Run: scripts\setup-azure-production.bat
echo    - Or follow: PRODUCTION-DEPLOYMENT-GUIDE.md
echo.
echo 3. Keep Local Environment Separate:
echo    - DO NOT run: supabase link --project-ref [PROD_REF]
echo    - Local Docker instance stays linked to: rfpez-app-local
echo    - Production accessed only via GitHub Actions
echo.
echo 4. Deploy Database Migrations:
echo    - Go to: https://github.com/markesphere/rfpez-app/actions
echo    - Run: Deploy Migrations to Production workflow
echo.
echo 5. Deploy Edge Functions:
echo    - Go to: https://github.com/markesphere/rfpez-app/actions
echo    - Run: Deploy Edge Functions to Production workflow
echo.
echo 6. Deploy Application:
echo    - Go to: https://github.com/markesphere/rfpez-app/actions
echo    - Run: Production Deployment (rfpez.ai^) workflow
echo.
echo Documentation:
echo   - Setup Guide: PRODUCTION-DEPLOYMENT-GUIDE.md
echo   - Checklist: PRODUCTION-DEPLOYMENT-CHECKLIST.md
echo   - Config: PRODUCTION-DEPLOYMENT-CONFIG.md
echo.
echo Good luck with your production deployment!
echo.
pause
