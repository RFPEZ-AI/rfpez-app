-- Final migration to remove all Auth0 references
-- Run this in your Supabase SQL Editor after ensuring all users have been migrated to Supabase auth

-- 1. First, ensure all existing users have supabase_user_id populated
-- (This should be done manually before running this migration)

-- 2. Drop Auth0-related constraints and indexes
DROP INDEX IF EXISTS idx_user_profiles_auth0_id;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_auth0_or_supabase_check;

-- 3. Drop all existing RLS policies that reference auth0_id
-- User Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages from own sessions" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own sessions" ON messages;
DROP POLICY IF EXISTS "Users can delete messages from own sessions" ON messages;

-- Artifacts policies
DROP POLICY IF EXISTS "Users can view artifacts from own sessions" ON artifacts;
DROP POLICY IF EXISTS "Users can create artifacts in own sessions" ON artifacts;
DROP POLICY IF EXISTS "Users can update artifacts in own sessions" ON artifacts;
DROP POLICY IF EXISTS "Users can delete artifacts from own sessions" ON artifacts;

-- 4. Remove the auth0_id column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS auth0_id;

-- 5. Handle any remaining NULL supabase_user_id records
-- Option 1: Delete orphaned records (no Supabase user)
DELETE FROM user_profiles WHERE supabase_user_id IS NULL;

-- Option 2: If you prefer to keep them for manual review, comment out the DELETE above
-- and run this query to see what records need attention:
-- SELECT * FROM user_profiles WHERE supabase_user_id IS NULL;

-- 6. Add NOT NULL constraint to supabase_user_id (after cleaning up NULLs)
ALTER TABLE user_profiles ALTER COLUMN supabase_user_id SET NOT NULL;

-- 7. Recreate RLS policies using only Supabase auth
-- User Profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT 
  USING (auth.uid() = supabase_user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE 
  USING (auth.uid() = supabase_user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = supabase_user_id);

-- Sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT 
  USING (user_id IN (SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users can create own sessions" ON sessions FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE 
  USING (user_id IN (SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE 
  USING (user_id IN (SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()));

-- Messages
CREATE POLICY "Users can view messages from own sessions" ON messages FOR SELECT 
  USING (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can create messages in own sessions" ON messages FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can update messages in own sessions" ON messages FOR UPDATE 
  USING (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can delete messages from own sessions" ON messages FOR DELETE 
  USING (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));

-- Artifacts
CREATE POLICY "Users can view artifacts from own sessions" ON artifacts FOR SELECT 
  USING (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can create artifacts in own sessions" ON artifacts FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can update artifacts in own sessions" ON artifacts FOR UPDATE 
  USING (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can delete artifacts from own sessions" ON artifacts FOR DELETE 
  USING (session_id IN (
    SELECT s.id FROM sessions s 
    JOIN user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));

-- 8. Clean up any temporary migration tables
DROP TABLE IF EXISTS user_profiles_backup;

-- Migration complete - Auth0 references have been removed
