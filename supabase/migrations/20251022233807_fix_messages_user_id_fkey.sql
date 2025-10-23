-- Fix messages.user_id foreign key to point to auth.users instead of user_profiles
-- This allows us to use the auth user ID consistently throughout the application

-- Step 1: Drop the old foreign key constraint
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- Step 2: Update existing messages to use auth.users.id instead of user_profiles.id
-- This converts the user_id from user_profiles.id to the corresponding supabase_user_id (auth.users.id)
UPDATE messages m
SET user_id = up.supabase_user_id
FROM user_profiles up
WHERE m.user_id = up.id
  AND m.user_id != up.supabase_user_id;  -- Only update if they're different

-- Step 3: Verify data integrity - log any orphaned records
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM messages m
  LEFT JOIN auth.users au ON m.user_id = au.id
  WHERE au.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Warning: Found % messages with invalid user_id references', orphan_count;
  END IF;
END $$;

-- Step 4: Add new foreign key constraint pointing to auth.users
ALTER TABLE messages 
ADD CONSTRAINT messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Step 6: Add comment explaining the change
COMMENT ON CONSTRAINT messages_user_id_fkey ON messages IS 
'Foreign key to auth.users.id - allows consistent use of authentication user ID throughout application';
