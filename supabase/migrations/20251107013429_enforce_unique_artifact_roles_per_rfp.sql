-- Migration: Enforce Unique Artifact Roles per RFP
-- Purpose: Prevent duplicate artifacts with same role for the same RFP
-- Author: GitHub Copilot
-- Date: 2025-11-07

-- First, clean up duplicate artifacts across ALL RFPs
-- Keep the most recent one for each RFP+role combination and delete older duplicates
DO $$
DECLARE
    duplicate_record RECORD;
    latest_artifact_id UUID;
BEGIN
    -- Find and clean up duplicates for each RFP and role combination
    FOR duplicate_record IN 
        SELECT ra.rfp_id, a.artifact_role, COUNT(*) as count
        FROM rfp_artifacts ra
        JOIN artifacts a ON ra.artifact_id = a.id
        WHERE a.artifact_role IS NOT NULL
        GROUP BY ra.rfp_id, a.artifact_role
        HAVING COUNT(*) > 1
    LOOP
        -- Get the most recent artifact for this RFP+role combination
        SELECT a.id INTO latest_artifact_id
        FROM artifacts a
        JOIN rfp_artifacts ra ON a.id = ra.artifact_id
        WHERE ra.rfp_id = duplicate_record.rfp_id 
          AND a.artifact_role = duplicate_record.artifact_role
        ORDER BY a.created_at DESC
        LIMIT 1;

        -- Delete older duplicates
        DELETE FROM artifacts
        WHERE id IN (
            SELECT a.id
            FROM artifacts a
            JOIN rfp_artifacts ra ON a.id = ra.artifact_id
            WHERE ra.rfp_id = duplicate_record.rfp_id 
              AND a.artifact_role = duplicate_record.artifact_role
              AND a.id::text != latest_artifact_id::text
        );

        RAISE NOTICE 'RFP % - Kept % artifact: %, deleted % duplicates', 
            duplicate_record.rfp_id, 
            duplicate_record.artifact_role,
            latest_artifact_id,
            duplicate_record.count - 1;
    END LOOP;
END $$;

-- Add a new column to rfp_artifacts to denormalize artifact_role for uniqueness constraint
ALTER TABLE rfp_artifacts 
ADD COLUMN IF NOT EXISTS artifact_role TEXT;

-- Populate the new column with existing data
UPDATE rfp_artifacts ra
SET artifact_role = a.artifact_role
FROM artifacts a
WHERE ra.artifact_id = a.id;

-- Create unique constraint on the denormalized column
-- This enforces: one artifact per role per RFP (e.g., only one bid_form per RFP)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_artifact_role_per_rfp
ON rfp_artifacts (rfp_id, artifact_role)
WHERE artifact_role IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_unique_artifact_role_per_rfp IS 
'Ensures each RFP has at most one artifact per artifact_role (e.g., only one bid_form, one rfp_request_email, etc.)';

-- Add helper function to check if artifact role already exists for an RFP
CREATE OR REPLACE FUNCTION check_artifact_role_exists(
    p_rfp_id INTEGER,
    p_artifact_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_artifact_id UUID;
BEGIN
    -- Check if an artifact with this role already exists for this RFP
    SELECT a.id INTO existing_artifact_id
    FROM artifacts a
    JOIN rfp_artifacts ra ON a.id = ra.artifact_id
    WHERE ra.rfp_id = p_rfp_id
      AND a.artifact_role = p_artifact_role
    LIMIT 1;

    RETURN existing_artifact_id;
END;
$$;

COMMENT ON FUNCTION check_artifact_role_exists IS 
'Returns the artifact ID if an artifact with the given role already exists for the RFP, NULL otherwise. Use this before creating new artifacts to enforce update-instead-of-create pattern.';
