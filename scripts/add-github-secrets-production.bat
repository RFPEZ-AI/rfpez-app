@echo off
REM Add GitHub Secrets for Production using GitHub CLI
REM Requires: gh CLI installed and authenticated

echo ========================================
echo   Add GitHub Production Secrets
echo ========================================
echo.

REM Check if gh CLI is installed
where gh >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] GitHub CLI not found!
    echo Install from: https://cli.github.com/
    echo Or install with: winget install --id GitHub.cli
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Not authenticated with GitHub CLI
    echo Run: gh auth login
    exit /b 1
)

REM Check if secrets file exists
if not exist github-secrets-production.txt (
    echo [ERROR] github-secrets-production.txt not found!
    echo Run: scripts\setup-supabase-production.bat
    exit /b 1
)

echo Reading secrets from: github-secrets-production.txt
echo Target repository: markesphere/rfpez-app
echo.

REM Parse and set secrets
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /v "^#" github-secrets-production.txt ^| findstr "="`) do (
    set "SECRET_NAME=%%a"
    set "SECRET_VALUE=%%b"
    
    REM Skip empty lines and Azure secret placeholder
    if not "!SECRET_VALUE!"=="" (
        if not "!SECRET_VALUE!"=="[Get from Azure CLI]" (
            echo Adding secret: !SECRET_NAME!
            echo !SECRET_VALUE! | gh secret set !SECRET_NAME! --repo markesphere/rfpez-app
            
            if %errorlevel% equ 0 (
                echo   [SUCCESS] !SECRET_NAME! added
            ) else (
                echo   [ERROR] Failed to add !SECRET_NAME!
            )
            echo.
        )
    )
)

echo.
echo ========================================
echo   Secrets Added Successfully!
echo ========================================
echo.
echo Verify secrets at:
echo https://github.com/markesphere/rfpez-app/settings/secrets/actions
echo.
echo Next steps:
echo   1. Run Azure setup: scripts\setup-azure-production.bat
echo   2. Add Azure secret: AZURE_STATIC_WEB_APPS_API_TOKEN_PROD
echo   3. Deploy via GitHub Actions
echo.
pause
