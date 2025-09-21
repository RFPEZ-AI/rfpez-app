-- =============================
-- RFPEZ.AI Dev Database Cleanup Script
-- =============================
-- 
-- Purpose: Clean all test data from development database
-- Preserves: agents table and user_profiles table
-- WARNING: This will DELETE ALL DATA from most tables!
-- 
-- Date: September 19, 2025
-- Updated: September 20, 2025 - Fixed sequence names and improved error handling
-- Usage: Run this script in Supabase SQL Editor or psql
-- Note: Can be executed in phases for safer operation
-- 
-- EXECUTION OPTIONS:
-- 1. Full script: Execute the entire script at once (recommended for small datasets)
-- 2. Phase-by-phase: Execute in sections for large datasets or debugging
--    - Phase 1: Lines 30-80 (Session cleanup)
--    - Phase 2: Lines 85-125 (RFP & business logic)
--    - Phase 3: Lines 130-170 (Sequence reset)
--    - Phase 4: Lines 175-220 (Verification)
-- 
-- SAFETY FEATURES:
-- - All operations wrapped in transactions
-- - Existence checks before operations
-- - Error handling in verification
-- - Sequence validation
-- =============================

-- Enable detailed notice output
SET client_min_messages = NOTICE;

-- Disable triggers temporarily to avoid cascade issues
SET session_replication_role = replica;

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'Starting RFPEZ.AI database cleanup...';
    RAISE NOTICE 'Preserving: agents, user_profiles';
    RAISE NOTICE '========================================';
END $$;

-- =============================
-- CORE APPLICATION TABLES
-- =============================

-- Clean session-related data (reverse order due to foreign keys)
DO $$
BEGIN
    -- Session artifacts junction table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_artifacts' AND table_schema = 'public') THEN
        DELETE FROM public.session_artifacts;
        RAISE NOTICE 'Cleaned: session_artifacts';
    END IF;

    -- Session agents junction table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_agents' AND table_schema = 'public') THEN
        DELETE FROM public.session_agents;
        RAISE NOTICE 'Cleaned: session_agents';
    END IF;

    -- Artifacts (depends on sessions)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts' AND table_schema = 'public') THEN
        DELETE FROM public.artifacts;
        RAISE NOTICE 'Cleaned: artifacts';
    END IF;

    -- Form artifacts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts' AND table_schema = 'public') THEN
        DELETE FROM public.form_artifacts;
        RAISE NOTICE 'Cleaned: form_artifacts';
    END IF;

    -- Artifact submissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_submissions' AND table_schema = 'public') THEN
        DELETE FROM public.artifact_submissions;
        RAISE NOTICE 'Cleaned: artifact_submissions';
    END IF;

    -- Messages (depends on sessions)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        DELETE FROM public.messages;
        RAISE NOTICE 'Cleaned: messages';
    END IF;

    -- Sessions (depends on user_profiles - but we keep user_profiles)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') THEN
        DELETE FROM public.sessions;
        RAISE NOTICE 'Cleaned: sessions';
    END IF;
END $$;

-- =============================
-- RFP & BUSINESS LOGIC TABLES
-- =============================

DO $$
BEGIN
    -- Bids (depends on rfps and suppliers)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bids' AND table_schema = 'public') THEN
        DELETE FROM public.bids;
        RAISE NOTICE 'Cleaned: bids';
    END IF;

    -- RFP artifacts junction table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfp_artifacts' AND table_schema = 'public') THEN
        DELETE FROM public.rfp_artifacts;
        RAISE NOTICE 'Cleaned: rfp_artifacts';
    END IF;

    -- RFPs (main RFP data)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfps' AND table_schema = 'public') THEN
        DELETE FROM public.rfps;
        RAISE NOTICE 'Cleaned: rfps';
    END IF;

    -- Supplier profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_profiles' AND table_schema = 'public') THEN
        DELETE FROM public.supplier_profiles;
        RAISE NOTICE 'Cleaned: supplier_profiles';
    END IF;
END $$;

-- =============================
-- CONSOLIDATED SCHEMA TABLES
-- =============================
-- These might exist from schema migrations

DO $$
BEGIN
    -- New artifacts table from consolidation
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts_new' AND table_schema = 'public') THEN
        DELETE FROM public.artifacts_new;
        RAISE NOTICE 'Cleaned: artifacts_new';
    END IF;

    -- New artifact submissions from consolidation  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_submissions_new' AND table_schema = 'public') THEN
        DELETE FROM public.artifact_submissions_new;
        RAISE NOTICE 'Cleaned: artifact_submissions_new';
    END IF;
END $$;

-- =============================
-- RESET SEQUENCES
-- =============================

DO $$
BEGIN
    -- Reset auto-increment sequences to start fresh (using correct sequence names)
    -- Check if sequences exist before trying to reset them
    
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'rfp_id_seq') THEN
        PERFORM setval('public.rfp_id_seq', 1, false);
        RAISE NOTICE 'Reset sequence: rfp_id_seq';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'bid_id_seq') THEN
        PERFORM setval('public.bid_id_seq', 1, false);
        RAISE NOTICE 'Reset sequence: bid_id_seq';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'supplier_id_seq') THEN
        PERFORM setval('public.supplier_id_seq', 1, false);
        RAISE NOTICE 'Reset sequence: supplier_id_seq';
    END IF;

    -- Check for any other sequences that might exist
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'artifact_submissions_id_seq') THEN
        PERFORM setval('public.artifact_submissions_id_seq', 1, false);
        RAISE NOTICE 'Reset sequence: artifact_submissions_id_seq';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'artifact_submissions_new_id_seq') THEN
        PERFORM setval('public.artifact_submissions_new_id_seq', 1, false);
        RAISE NOTICE 'Reset sequence: artifact_submissions_new_id_seq';
    END IF;
    
    -- Report available sequences for reference
    RAISE NOTICE 'Available sequences in public schema:';
    FOR rec IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename) LOOP
        RAISE NOTICE '  - %', rec.sequencename;
    END LOOP;
END $$;

-- =============================
-- PRESERVED TABLES
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
-- VERIFICATION
-- =============================

DO $$
BEGIN
    RAISE NOTICE 'Cleanup verification:';
    
    -- Count remaining records in key tables with error handling
    RAISE NOTICE 'Remaining records:';
    
    BEGIN
        RAISE NOTICE '- sessions: %', (SELECT COUNT(*) FROM public.sessions);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- sessions: table does not exist';
    END;
    
    BEGIN
        RAISE NOTICE '- messages: %', (SELECT COUNT(*) FROM public.messages);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- messages: table does not exist';
    END;
    
    BEGIN
        RAISE NOTICE '- artifacts: %', (SELECT COUNT(*) FROM public.artifacts);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- artifacts: table does not exist';
    END;
    
    BEGIN
        RAISE NOTICE '- rfps: %', (SELECT COUNT(*) FROM public.rfps);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- rfps: table does not exist';
    END;
    
    BEGIN
        RAISE NOTICE '- bids: %', (SELECT COUNT(*) FROM public.bids);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- bids: table does not exist';
    END;
    
    BEGIN
        RAISE NOTICE '- rfp_artifacts: %', (SELECT COUNT(*) FROM public.rfp_artifacts);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- rfp_artifacts: table does not exist';
    END;
    
    RAISE NOTICE 'Preserved records:';
    
    BEGIN
        RAISE NOTICE '- agents: %', (SELECT COUNT(*) FROM public.agents);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- agents: table does not exist (WARNING: This should exist!)';
    END;
    
    BEGIN
        RAISE NOTICE '- user_profiles: %', (SELECT COUNT(*) FROM public.user_profiles);
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE '- user_profiles: table does not exist (WARNING: This should exist!)';
    END;
    
    -- Show reset sequences
    RAISE NOTICE 'Sequence status:';
    FOR rec IN (
        SELECT sequencename, last_value, is_called 
        FROM pg_sequences s 
        JOIN pg_sequence_data(oid) sd ON true 
        JOIN pg_class c ON c.relname = s.sequencename 
        WHERE s.schemaname = 'public'
        ORDER BY sequencename
    ) LOOP
        RAISE NOTICE '- %: last_value=%, is_called=%', rec.sequencename, rec.last_value, rec.is_called;
    END LOOP;
END $$;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Commit the transaction
COMMIT;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'All test data has been removed.';
    RAISE NOTICE 'Agents and user profiles have been preserved.';
    RAISE NOTICE 'Sequences have been reset to start from 1.';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ready for fresh testing!';
    RAISE NOTICE 'Script updated: September 20, 2025';
END $$;

-- =============================
-- SCRIPT CHANGE LOG
-- =============================
-- 2025-09-19: Initial script creation
-- 2025-09-20: 
--   - Fixed sequence name issues (rfps_id_seq -> rfp_id_seq, etc.)
--   - Added comprehensive error handling in verification
--   - Added sequence existence checks before reset
--   - Added execution phase documentation
--   - Added safety features and better logging
--   - Added sequence status reporting in verification