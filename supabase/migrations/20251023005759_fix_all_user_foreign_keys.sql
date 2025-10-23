-- Fix all user_id foreign keys to point to auth.users instead of user_profiles
-- This ensures consistent use of auth.users.id throughout the application

-- ============================================================================
-- PART 1: Fix account_memories.user_id
-- ============================================================================

-- Drop existing constraint and RLS policies
ALTER TABLE account_memories DROP CONSTRAINT IF EXISTS account_memories_user_id_fkey;
DROP POLICY IF EXISTS "Users can view their account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can insert their account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can update their account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can delete their account memories" ON account_memories;

-- Update existing data to use auth.users.id
UPDATE account_memories am
SET user_id = up.supabase_user_id
FROM user_profiles up
WHERE am.user_id = up.id
  AND am.user_id != up.supabase_user_id;

-- Add new foreign key to auth.users
ALTER TABLE account_memories 
ADD CONSTRAINT account_memories_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Recreate RLS policies with corrected auth check
CREATE POLICY "Users can view their account memories" ON account_memories
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their account memories" ON account_memories
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account memories" ON account_memories
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their account memories" ON account_memories
  FOR DELETE
  USING (
    user_id = auth.uid() 
    OR account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 2: Fix sessions.user_id
-- ============================================================================

-- Drop existing constraint and RLS policies
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON sessions;

-- Update existing data to use auth.users.id
UPDATE sessions s
SET user_id = up.supabase_user_id
FROM user_profiles up
WHERE s.user_id = up.id
  AND s.user_id != up.supabase_user_id;

-- Add new foreign key to auth.users
ALTER TABLE sessions 
ADD CONSTRAINT sessions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Recreate RLS policies with corrected auth check
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON sessions
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 3: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_account_memories_user_id ON account_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ============================================================================
-- PART 4: Add comments documenting the changes
-- ============================================================================

COMMENT ON CONSTRAINT account_memories_user_id_fkey ON account_memories IS 
'Foreign key to auth.users.id - ensures consistent use of authentication user ID';

COMMENT ON CONSTRAINT sessions_user_id_fkey ON sessions IS 
'Foreign key to auth.users.id - ensures consistent use of authentication user ID';

-- ============================================================================
-- PART 5: Verify data integrity
-- ============================================================================

DO $$
DECLARE
  orphan_memories INTEGER;
  orphan_sessions INTEGER;
BEGIN
  -- Check for orphaned memories
  SELECT COUNT(*) INTO orphan_memories
  FROM account_memories am
  LEFT JOIN auth.users au ON am.user_id = au.id
  WHERE au.id IS NULL;
  
  IF orphan_memories > 0 THEN
    RAISE NOTICE 'Warning: Found % orphaned account_memories records', orphan_memories;
  END IF;
  
  -- Check for orphaned sessions
  SELECT COUNT(*) INTO orphan_sessions
  FROM sessions s
  LEFT JOIN auth.users au ON s.user_id = au.id
  WHERE au.id IS NULL;
  
  IF orphan_sessions > 0 THEN
    RAISE NOTICE 'Warning: Found % orphaned sessions records', orphan_sessions;
  END IF;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;
