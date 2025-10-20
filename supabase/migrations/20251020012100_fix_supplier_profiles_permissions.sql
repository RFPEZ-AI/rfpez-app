-- Fix supplier_profiles table permissions for bid submission
-- Migration: 20251020012100_fix_supplier_profiles_permissions.sql

BEGIN;

-- Grant full CRUD permissions to authenticated users on supplier_profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_profiles TO authenticated;
GRANT SELECT ON supplier_profiles TO anon;

-- Ensure RLS policies allow authenticated users to create suppliers
-- The "Authenticated users can create supplier profiles" policy should already exist
-- but let's verify it's correct

-- Drop and recreate the INSERT policy to ensure it's permissive
DROP POLICY IF EXISTS "Authenticated users can create supplier profiles" ON supplier_profiles;
DROP POLICY IF EXISTS insert_supplier_profiles ON supplier_profiles;

CREATE POLICY insert_supplier_profiles ON supplier_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow all authenticated users to create supplier profiles

-- Also ensure SELECT policy is permissive for authenticated users
DROP POLICY IF EXISTS "Allow public supplier viewing" ON supplier_profiles;
DROP POLICY IF EXISTS select_supplier_profiles ON supplier_profiles;

CREATE POLICY select_supplier_profiles ON supplier_profiles
FOR SELECT
USING (true);  -- All users can view supplier profiles

COMMIT;
