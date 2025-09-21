-- Migration: Remove artifact_templates Table
-- Date: September 20, 2025
-- Reason: Table was never used in the application
-- 
-- This migration removes the artifact_templates table which was created
-- but never actually utilized in the RFPEZ.AI application.

BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'Starting artifact_templates table removal migration...';
    
    -- Check if table exists and show its status before removal
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'artifact_templates' 
               AND table_schema = 'public') THEN
        
        -- Log table details before removal
        RAISE NOTICE 'Found artifact_templates table with % records', 
            (SELECT COUNT(*) FROM public.artifact_templates);
        
        -- Check for any dependencies (should be none)
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu 
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'artifact_templates'
        ) THEN
            RAISE EXCEPTION 'Cannot drop artifact_templates: foreign key dependencies exist';
        END IF;
        
        -- Drop the table
        DROP TABLE public.artifact_templates;
        
        RAISE NOTICE 'Successfully removed artifact_templates table';
        RAISE NOTICE 'Reason: Table was never used in the application';
        
    ELSE
        RAISE NOTICE 'artifact_templates table does not exist - migration already applied or not needed';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

COMMIT;

-- Verification
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'artifact_templates' 
               AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Migration failed: artifact_templates table still exists';
    ELSE
        RAISE NOTICE 'Verification passed: artifact_templates table successfully removed';
    END IF;
END $$;