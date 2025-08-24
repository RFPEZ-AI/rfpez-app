-- Migration from Auth0 to Supabase Authentication
-- Run this in your Supabase SQL Editor

-- 1. First, backup existing data
CREATE TABLE IF NOT EXISTS user_profiles_backup AS SELECT * FROM user_profiles;

-- 2. Add new column for Supabase user ID
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id);

-- 3. Make supabase_user_id unique (but allow nulls during migration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_supabase_user_id 
ON user_profiles(supabase_user_id) WHERE supabase_user_id IS NOT NULL;

-- 4. Update RLS policies to work with both systems during migration
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow both auth0_id and supabase_user_id during migration
CREATE POLICY "Users can view own profile" ON user_profiles 
FOR SELECT USING (
  auth.uid() = supabase_user_id OR 
  auth.jwt() ->> 'sub' = auth0_id
);

CREATE POLICY "Users can update own profile" ON user_profiles 
FOR UPDATE USING (
  auth.uid() = supabase_user_id OR 
  auth.jwt() ->> 'sub' = auth0_id
);

CREATE POLICY "Users can insert own profile" ON user_profiles 
FOR INSERT WITH CHECK (
  auth.uid() = supabase_user_id OR 
  auth.jwt() ->> 'sub' = auth0_id
);

-- 5. Update sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

CREATE POLICY "Users can view own sessions" ON sessions 
FOR SELECT USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid() OR auth.jwt() ->> 'sub' = auth0_id
  )
);

CREATE POLICY "Users can create own sessions" ON sessions 
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid() OR auth.jwt() ->> 'sub' = auth0_id
  )
);

CREATE POLICY "Users can update own sessions" ON sessions 
FOR UPDATE USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid() OR auth.jwt() ->> 'sub' = auth0_id
  )
);

CREATE POLICY "Users can delete own sessions" ON sessions 
FOR DELETE USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid() OR auth.jwt() ->> 'sub' = auth0_id
  )
);

-- 6. Update messages policies
DROP POLICY IF EXISTS "Users can view messages from own sessions" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON messages;

CREATE POLICY "Users can view messages from own sessions" ON messages 
FOR SELECT USING (
  session_id IN (
    SELECT s.id FROM sessions s
    JOIN user_profiles up ON s.user_id = up.id
    WHERE up.supabase_user_id = auth.uid() OR auth.jwt() ->> 'sub' = up.auth0_id
  )
);

CREATE POLICY "Users can create messages in own sessions" ON messages 
FOR INSERT WITH CHECK (
  session_id IN (
    SELECT s.id FROM sessions s
    JOIN user_profiles up ON s.user_id = up.id
    WHERE up.supabase_user_id = auth.uid() OR auth.jwt() ->> 'sub' = up.auth0_id
  )
);

-- Note: After all users have migrated, you can run the cleanup script to:
-- 1. Remove auth0_id column
-- 2. Make supabase_user_id NOT NULL
-- 3. Simplify RLS policies
-- 4. Drop backup table
