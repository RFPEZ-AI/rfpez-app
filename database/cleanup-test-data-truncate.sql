-- =============================
-- RFPEZ.AI Dev Database Cleanup Script (TRUNCATE Version)
-- =============================
-- 
-- Purpose: Clean all test data from development database using TRUNCATE
-- Preserves: agents table and user_profiles table
-- WARNING: This will DELETE ALL DATA from most tables!
-- 
-- TRUNCATE vs DELETE:
-- - TRUNCATE is faster for large datasets
-- - TRUNCATE resets auto-increment sequences automatically
-- - TRUNCATE requires RESTART IDENTITY for sequence reset
-- 
-- Date: September 19, 2025
-- Usage: Run this script in Supabase SQL Editor or psql
-- =============================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'Starting RFPEZ.AI database cleanup (TRUNCATE version)...';
    RAISE NOTICE 'Preserving: agents, user_profiles';
    RAISE NOTICE 'Method: TRUNCATE CASCADE with RESTART IDENTITY';
    RAISE NOTICE '========================================';
END $$;

-- =============================
-- SAFETY CHECK
-- =============================

DO $$
DECLARE
    current_env TEXT;
BEGIN
    -- Check if this looks like a production environment
    SELECT current_database() INTO current_env;
    
    IF current_env ILIKE '%prod%' OR current_env ILIKE '%production%' THEN
        RAISE EXCEPTION 'SAFETY CHECK FAILED: Database name contains "prod" or "production". Aborting cleanup to prevent accidental data loss in production.';
    END IF;
    
    RAISE NOTICE 'Safety check passed: Database = %', current_env;
END $$;

-- =============================
-- PRE-CLEANUP COUNTS
-- =============================

DO $$
BEGIN
    RAISE NOTICE 'Pre-cleanup record counts:';
    
    -- Show counts before cleanup
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') THEN
        RAISE NOTICE '- sessions: %', (SELECT COUNT(*) FROM public.sessions);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        RAISE NOTICE '- messages: %', (SELECT COUNT(*) FROM public.messages);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts' AND table_schema = 'public') THEN
        RAISE NOTICE '- artifacts: %', (SELECT COUNT(*) FROM public.artifacts);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfps' AND table_schema = 'public') THEN
        RAISE NOTICE '- rfps: %', (SELECT COUNT(*) FROM public.rfps);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bids' AND table_schema = 'public') THEN
        RAISE NOTICE '- bids: %', (SELECT COUNT(*) FROM public.bids);
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- =============================
-- CLEANUP OPERATIONS
-- =============================

-- Clean junction tables first (no foreign key dependencies)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_artifacts' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.session_artifacts RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: session_artifacts';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_agents' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.session_agents RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: session_agents';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfp_artifacts' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.rfp_artifacts RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: rfp_artifacts';
    END IF;
END $$;

-- Clean dependent tables (have foreign key references)
DO $$
BEGIN
    -- Artifact submissions (references form_artifacts)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_submissions' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.artifact_submissions RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: artifact_submissions';
    END IF;

    -- Form artifacts 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.form_artifacts RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: form_artifacts';
    END IF;

    -- Artifacts (references sessions and messages)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.artifacts RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: artifacts';
    END IF;

    -- Messages (references sessions)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.messages RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: messages';
    END IF;

    -- Bids (references rfps and suppliers)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bids' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.bids RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: bids';
    END IF;
END $$;

-- Clean main tables
DO $$
BEGIN
    -- Sessions (references user_profiles - but we keep user_profiles)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.sessions RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: sessions';
    END IF;

    -- RFPs (main business data)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfps' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.rfps RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: rfps';
    END IF;

    -- Supplier profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_profiles' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.supplier_profiles RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: supplier_profiles';
    END IF;
END $$;

-- Clean any migration/consolidated tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts_new' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.artifacts_new RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: artifacts_new';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_submissions_new' AND table_schema = 'public') THEN
        TRUNCATE TABLE public.artifact_submissions_new RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Truncated: artifact_submissions_new';
    END IF;
END $$;

-- =============================
-- PRESERVED TABLES INFO
-- =============================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRESERVED TABLES (not cleaned):';
    RAISE NOTICE '- agents (contains agent definitions)';
    RAISE NOTICE '- user_profiles (contains user accounts)';
    RAISE NOTICE '========================================';
END $$;

-- =============================
-- POST-CLEANUP VERIFICATION
-- =============================

DO $$
BEGIN
    RAISE NOTICE 'Post-cleanup verification:';
    
    -- Verify tables are empty
    RAISE NOTICE 'Cleaned table counts (should all be 0):';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') THEN
        RAISE NOTICE '- sessions: %', (SELECT COUNT(*) FROM public.sessions);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        RAISE NOTICE '- messages: %', (SELECT COUNT(*) FROM public.messages);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts' AND table_schema = 'public') THEN
        RAISE NOTICE '- artifacts: %', (SELECT COUNT(*) FROM public.artifacts);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfps' AND table_schema = 'public') THEN
        RAISE NOTICE '- rfps: %', (SELECT COUNT(*) FROM public.rfps);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bids' AND table_schema = 'public') THEN
        RAISE NOTICE '- bids: %', (SELECT COUNT(*) FROM public.bids);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts' AND table_schema = 'public') THEN
        RAISE NOTICE '- form_artifacts: %', (SELECT COUNT(*) FROM public.form_artifacts);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_submissions' AND table_schema = 'public') THEN
        RAISE NOTICE '- artifact_submissions: %', (SELECT COUNT(*) FROM public.artifact_submissions);
    END IF;
    
    RAISE NOTICE 'Preserved table counts:';
    RAISE NOTICE '- agents: %', (SELECT COUNT(*) FROM public.agents);
    RAISE NOTICE '- user_profiles: %', (SELECT COUNT(*) FROM public.user_profiles);
END $$;

-- Commit the transaction
COMMIT;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'Method: TRUNCATE with RESTART IDENTITY CASCADE';
    RAISE NOTICE 'All test data removed, sequences reset to 1';
    RAISE NOTICE 'Agents and user profiles preserved';
    RAISE NOTICE '========================================';
END $$;