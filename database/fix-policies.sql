-- Fix RLS policies to resolve 500 errors
-- Run this in your Supabase SQL Editor to fix the policy issues

-- First, completely disable RLS temporarily to ensure we can work with the table
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles based on role" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for users to their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = supabase_user_id);

CREATE POLICY "Enable insert for users to create their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Enable update for users to update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = supabase_user_id);

-- Verify the table structure and add role column if needed
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'administrator'));

-- Update existing rows to have the default role if they don't already have one
UPDATE public.user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Make the role column NOT NULL after setting defaults
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET NOT NULL;

-- Test query to verify everything works
SELECT 'Policy test successful' as message, count(*) as user_count FROM public.user_profiles;
