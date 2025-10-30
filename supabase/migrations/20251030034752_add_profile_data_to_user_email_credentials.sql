-- Add missing columns to user_email_credentials table for Gmail OAuth

-- Add scopes column to store OAuth scopes
ALTER TABLE user_email_credentials
ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}';

-- Add profile_data column to store user profile information
ALTER TABLE user_email_credentials
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN user_email_credentials.scopes IS 'OAuth scopes granted by the user';
COMMENT ON COLUMN user_email_credentials.profile_data IS 'User profile data from OAuth provider (name, picture, etc.)';
