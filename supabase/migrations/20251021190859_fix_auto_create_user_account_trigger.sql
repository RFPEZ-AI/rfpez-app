-- Fix auto_create_user_account Trigger Function
-- Issue: Function tries to insert account_type and status columns that don't exist
-- Solution: Update function to match simplified accounts table schema

CREATE OR REPLACE FUNCTION auto_create_user_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_account_id uuid;
    user_email text;
BEGIN
    -- Get user email
    user_email := NEW.email;

    -- Create a new account for the user (simplified - only name required)
    INSERT INTO accounts (name, created_at, updated_at)
    VALUES (
        COALESCE(NEW.email, 'User Account'),
        NOW(),
        NOW()
    )
    RETURNING id INTO new_account_id;

    -- Link user to the new account using supabase_user_id (auth.users.id)
    INSERT INTO account_users (account_id, user_id, role, created_at)
    VALUES (new_account_id, NEW.supabase_user_id, 'admin', NOW());

    -- Also create entry in user_accounts junction table  
    -- (user_profile_id here refers to user_profiles.id, NEW.id)
    INSERT INTO user_accounts (user_profile_id, account_id, created_at)
    VALUES (NEW.id, new_account_id, NOW())
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_create_user_account() IS 
'Automatically creates an account and links it when a new user_profile is created';
