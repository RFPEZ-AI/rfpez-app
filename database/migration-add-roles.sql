-- Migration to add role column to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add the role column with default value and constraint
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'administrator'));

-- Update existing rows to have the default role if they don't already have one
UPDATE public.user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Make the role column NOT NULL after setting defaults
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET NOT NULL;

-- Create an index on the role column for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add comment to the column
COMMENT ON COLUMN public.user_profiles.role IS 'User role in ascending order of access: user, developer, administrator';

-- Optional: Add a function to get users by role
CREATE OR REPLACE FUNCTION get_users_by_role(role_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  supabase_user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF role_filter IS NULL THEN
    RETURN QUERY 
    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at 
    FROM public.user_profiles u
    ORDER BY u.created_at DESC;
  ELSE
    RETURN QUERY 
    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at 
    FROM public.user_profiles u
    WHERE u.role = role_filter
    ORDER BY u.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_users_by_role(TEXT) TO authenticated;

-- Update RLS policies to allow role-based access (optional enhancement)
-- This allows administrators to view all users
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view profiles based on role" ON public.user_profiles FOR SELECT 
USING (
  auth.uid() = supabase_user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE supabase_user_id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Allow administrators to update user roles
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update profiles based on role" ON public.user_profiles FOR UPDATE 
USING (
  auth.uid() = supabase_user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE supabase_user_id = auth.uid() 
    AND role = 'administrator'
  )
);
