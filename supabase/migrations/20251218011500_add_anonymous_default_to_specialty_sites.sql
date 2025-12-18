-- Migration: Add anonymous default support for specialty site agents
-- 
-- Purpose: Support different default agents for anonymous vs authenticated users
-- - Anonymous users need welcoming, accessible default agents
-- - Authenticated users need working/design default agents
--
-- Changes:
-- 1. Add is_anonymous_default column to specialty_site_agents
-- 2. Set Corporate TMC RFP Welcome as anonymous default for corporate-tmc-rfp site
-- 3. Update get_specialty_site_agents function to include the new column

-- Step 1: Add is_anonymous_default column
ALTER TABLE public.specialty_site_agents 
ADD COLUMN IF NOT EXISTS is_anonymous_default boolean DEFAULT false;

-- Step 2: Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_specialty_site_agents_anonymous_default 
ON public.specialty_site_agents(specialty_site_id, is_anonymous_default) 
WHERE is_anonymous_default = true;

-- Step 3: Set Corporate TMC RFP Welcome as anonymous default for corporate-tmc-rfp site
UPDATE public.specialty_site_agents 
SET is_anonymous_default = true 
WHERE agent_id = (
  SELECT id FROM public.agents WHERE name = 'Corporate TMC RFP Welcome'
)
AND specialty_site_id = (
  SELECT id FROM public.specialty_sites WHERE slug = 'corporate-tmc-rfp'
);

-- Step 4: Update get_specialty_site_agents function to include is_anonymous_default
DROP FUNCTION IF EXISTS public.get_specialty_site_agents(text);

CREATE OR REPLACE FUNCTION public.get_specialty_site_agents(site_slug text)
RETURNS TABLE(
  agent_id uuid,
  agent_name text,
  agent_description text,
  agent_instructions text,
  agent_initial_prompt text,
  agent_avatar_url text,
  is_active boolean,
  is_default boolean,
  is_anonymous_default boolean,
  sort_order integer,
  is_free boolean,
  is_restricted boolean,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.description as agent_description,
    a.instructions as agent_instructions,
    a.initial_prompt as agent_initial_prompt,
    a.avatar_url as agent_avatar_url,
    a.is_active,
    ssa.is_default_agent as is_default,
    ssa.is_anonymous_default,
    ssa.sort_order,
    a.is_free,
    a.is_restricted,
    a.role
  FROM public.agents a
  INNER JOIN public.specialty_site_agents ssa ON a.id = ssa.agent_id
  INNER JOIN public.specialty_sites ss ON ssa.specialty_site_id = ss.id
  WHERE ss.slug = site_slug
    AND a.is_active = true
    AND a.is_abstract = false  -- Filter out abstract parent agents
  ORDER BY ssa.sort_order ASC, a.name ASC;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_specialty_site_agents IS 'Get agents for specialty site with anonymous default support';

-- Step 5: Verify the update
DO $$
DECLARE
  welcome_count integer;
  specialist_count integer;
BEGIN
  -- Check Corporate TMC RFP Welcome is anonymous default
  SELECT COUNT(*) INTO welcome_count
  FROM public.specialty_site_agents ssa
  INNER JOIN public.agents a ON ssa.agent_id = a.id
  INNER JOIN public.specialty_sites ss ON ssa.specialty_site_id = ss.id
  WHERE a.name = 'Corporate TMC RFP Welcome'
    AND ss.slug = 'corporate-tmc-rfp'
    AND ssa.is_anonymous_default = true;
    
  -- Check TMC Specialist is authenticated default
  SELECT COUNT(*) INTO specialist_count
  FROM public.specialty_site_agents ssa
  INNER JOIN public.agents a ON ssa.agent_id = a.id
  INNER JOIN public.specialty_sites ss ON ssa.specialty_site_id = ss.id
  WHERE a.name = 'TMC Specialist'
    AND ss.slug = 'corporate-tmc-rfp'
    AND ssa.is_default_agent = true;
    
  IF welcome_count = 0 THEN
    RAISE WARNING 'Corporate TMC RFP Welcome not set as anonymous default';
  END IF;
  
  IF specialist_count = 0 THEN
    RAISE WARNING 'TMC Specialist not set as authenticated default';
  END IF;
  
  IF welcome_count > 0 AND specialist_count > 0 THEN
    RAISE NOTICE 'Successfully configured dual defaults for corporate-tmc-rfp site';
  END IF;
END;
$$;
