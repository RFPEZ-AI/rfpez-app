-- Test script to check current RFP table schema
-- Run this in Supabase SQL Editor to see the current table structure

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rfp' 
ORDER BY ordinal_position;

-- Check existing constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'rfp';

-- Check existing data (sample)
SELECT 
    id,
    name,
    description,
    specification,
    created_at
FROM public.rfp 
LIMIT 5;
