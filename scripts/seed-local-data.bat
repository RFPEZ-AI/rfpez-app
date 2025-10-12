@echo off
REM Seed Local Supabase Database with Test Data
REM Copyright Mark Skiba, 2025 All rights reserved

echo ================================
echo RFPEZ.AI Local Database Seeding
echo ================================
echo.

REM Check if Supabase is running
docker ps | findstr "supabase_db_rfpez-app-local" >nul 2>&1
if errorlevel 1 (
  echo ❌ Error: Supabase database container is not running
  echo    Please start Supabase first: supabase start
  exit /b 1
)

echo ✅ Supabase database container is running
echo.

REM Ask for confirmation
set /p CONFIRM="⚠️  This will TRUNCATE existing data. Continue? (y/N) "
if /i not "%CONFIRM%"=="y" (
  echo ❌ Seeding cancelled
  exit /b 0
)

echo.
echo 📥 Loading seed data into database...
echo.

REM Run the seed script
type scripts\seed-test-data.sql | docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

echo.
echo ✅ Seeding complete!
echo.
echo 🎯 Next Steps:
echo   1. Open http://localhost:3100 in your browser
echo   2. Login with your Supabase auth credentials (creates user profile)
echo   3. Create a new session or use existing session
echo   4. Set current RFP to 'LED Lighting Procurement'
echo   5. Check artifact dropdown - should now show 2 artifacts
echo   6. Check browser console logs for the debug output
echo.
echo 💡 The artifacts are created, but you need to:
echo    - Login first (to create user profile)
echo    - Set RFP context (to load artifacts)
echo.

pause
