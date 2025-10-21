-- Migration: Auto-assign accounts to new users
-- Date: 2025-10-20
-- Description: Creates a trigger to automatically create and assign a default account
--              when a new user_profile is created (OAuth or email signup).
--              Also fixes existing users without accounts.

-- Step 1: Create function to auto-create account for new user
CREATE OR REPLACE FUNCTION auto_create_user_account()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Create a personal account for the new user
  INSERT INTO accounts (name, created_at, updated_at)
  VALUES (
    COALESCE(NEW.full_name || '''s Account', NEW.email || '''s Account', 'Personal Account'),
    NOW(),
    NOW()
  )
  RETURNING id INTO new_account_id;
  
  -- Link the user to the account as owner
  INSERT INTO user_accounts (user_profile_id, account_id, role, created_at)
  VALUES (NEW.id, new_account_id, 'owner', NOW());
  
  -- Log account creation
  RAISE NOTICE 'Auto-created account % for user profile %', new_account_id, NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on user_profiles AFTER INSERT
DROP TRIGGER IF EXISTS trigger_auto_create_user_account ON user_profiles;
CREATE TRIGGER trigger_auto_create_user_account
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_account();

-- Step 3: Fix existing users without accounts (like OAuth users)
DO $$
DECLARE
  user_record RECORD;
  new_account_id UUID;
BEGIN
  -- Find all user_profiles without an account in user_accounts
  FOR user_record IN
    SELECT up.id, up.email, up.full_name
    FROM user_profiles up
    LEFT JOIN user_accounts ua ON up.id = ua.user_profile_id
    WHERE ua.account_id IS NULL
  LOOP
    -- Create account for this user
    INSERT INTO accounts (name, created_at, updated_at)
    VALUES (
      COALESCE(user_record.full_name || '''s Account', user_record.email || '''s Account', 'Personal Account'),
      NOW(),
      NOW()
    )
    RETURNING id INTO new_account_id;
    
    -- Link user to account
    INSERT INTO user_accounts (user_profile_id, account_id, role, created_at)
    VALUES (user_record.id, new_account_id, 'owner', NOW());
    
    RAISE NOTICE 'Created account % for existing user % (%)', 
      new_account_id, user_record.email, user_record.full_name;
  END LOOP;
END $$;

-- Step 4: Verify all users now have accounts
DO $$
DECLARE
  users_without_accounts INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_accounts
  FROM user_profiles up
  LEFT JOIN user_accounts ua ON up.id = ua.user_profile_id
  WHERE ua.account_id IS NULL;
  
  IF users_without_accounts > 0 THEN
    RAISE WARNING 'Still have % users without accounts!', users_without_accounts;
  ELSE
    RAISE NOTICE '✅ All users now have accounts assigned';
  END IF;
END $$;

COMMENT ON FUNCTION auto_create_user_account() IS 
  'Automatically creates a personal account and assigns it to new user profiles';
COMMENT ON TRIGGER trigger_auto_create_user_account ON user_profiles IS
  'Ensures every new user gets a default personal account upon profile creation';
