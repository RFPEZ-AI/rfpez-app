-- Migration Fix for Auth0 to Supabase Authentication
-- Run this in your Supabase SQL Editor to fix the constraint issues

-- 1. Make auth0_id column nullable to allow Supabase-only users
ALTER TABLE user_profiles 
ALTER COLUMN auth0_id DROP NOT NULL;

-- 2. Add a constraint to ensure at least one auth ID exists
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_auth_check 
CHECK (auth0_id IS NOT NULL OR supabase_user_id IS NOT NULL);

-- 3. Update the unique constraint to handle both ID types
DROP INDEX IF EXISTS idx_user_profiles_supabase_user_id;
CREATE UNIQUE INDEX idx_user_profiles_supabase_user_id 
ON user_profiles(supabase_user_id) WHERE supabase_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_auth0_id 
ON user_profiles(auth0_id) WHERE auth0_id IS NOT NULL;

-- 4. Re-create the policies with proper logic
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles 
FOR SELECT USING (
  (supabase_user_id IS NOT NULL AND auth.uid() = supabase_user_id) OR 
  (auth0_id IS NOT NULL AND auth.jwt() ->> 'sub' = auth0_id)
);

CREATE POLICY "Users can update own profile" ON user_profiles 
FOR UPDATE USING (
  (supabase_user_id IS NOT NULL AND auth.uid() = supabase_user_id) OR 
  (auth0_id IS NOT NULL AND auth.jwt() ->> 'sub' = auth0_id)
);

CREATE POLICY "Users can insert own profile" ON user_profiles 
FOR INSERT WITH CHECK (
  (supabase_user_id IS NOT NULL AND auth.uid() = supabase_user_id) OR 
  (auth0_id IS NOT NULL AND auth.jwt() ->> 'sub' = auth0_id)
);

-- Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('auth0_id', 'supabase_user_id');
