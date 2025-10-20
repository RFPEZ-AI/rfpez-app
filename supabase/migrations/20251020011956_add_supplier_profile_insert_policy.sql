-- Add INSERT policy for supplier_profiles to allow auto-creation
-- Migration: 20251020011956_add_supplier_profile_insert_policy.sql
-- Purpose: Allow authenticated users to create supplier profiles via bid submission

BEGIN;

-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create supplier profiles" 
ON supplier_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant INSERT permission to authenticated role
GRANT INSERT ON supplier_profiles TO authenticated;

COMMIT;
