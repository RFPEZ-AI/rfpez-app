-- Agent Inheritance System Migration
-- Copyright Mark Skiba, 2025 All rights reserved
-- Adds support for hierarchical agent inheritance

-- Add inheritance columns to agents table
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_abstract BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inheritance_depth INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS access_override BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.agents.parent_agent_id IS 'UUID of parent agent for inheritance - enables recursive instruction and tool merging';
COMMENT ON COLUMN public.agents.is_abstract IS 'True if agent is abstract (not selectable in UI, used only as parent)';
COMMENT ON COLUMN public.agents.inheritance_depth IS 'Cached depth in inheritance tree (0 = root, updated by trigger)';
COMMENT ON COLUMN public.agents.access_override IS 'True to replace parent tools instead of merging (default: false = merge)';

-- Index for inheritance queries
CREATE INDEX IF NOT EXISTS idx_agents_parent ON public.agents(parent_agent_id) WHERE parent_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_abstract ON public.agents(is_abstract) WHERE is_abstract = TRUE;
CREATE INDEX IF NOT EXISTS idx_agents_selectable ON public.agents(is_active, is_abstract) WHERE is_active = TRUE AND is_abstract = FALSE;

-- Prevent self-referencing (agent cannot be its own parent)
ALTER TABLE public.agents 
  ADD CONSTRAINT chk_no_self_parent CHECK (id != parent_agent_id);

-- Function to calculate inheritance depth
CREATE OR REPLACE FUNCTION calculate_inheritance_depth(agent_id UUID) 
RETURNS INTEGER AS $$
DECLARE
  depth INTEGER := 0;
  current_id UUID := agent_id;
  parent_id UUID;
  visited_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  LOOP
    -- Check for circular reference
    IF current_id = ANY(visited_ids) THEN
      RAISE EXCEPTION 'Circular inheritance detected for agent %', agent_id;
    END IF;
    
    -- Add to visited list
    visited_ids := array_append(visited_ids, current_id);
    
    -- Get parent
    SELECT parent_agent_id INTO parent_id FROM agents WHERE id = current_id;
    EXIT WHEN parent_id IS NULL;
    
    depth := depth + 1;
    current_id := parent_id;
    
    -- Prevent infinite loops (max 10 levels)
    IF depth > 10 THEN
      RAISE EXCEPTION 'Inheritance depth exceeds maximum (10 levels) for agent %', agent_id;
    END IF;
  END LOOP;
  
  RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update inheritance depth
CREATE OR REPLACE FUNCTION update_inheritance_depth()
RETURNS TRIGGER AS $$
BEGIN
  NEW.inheritance_depth := calculate_inheritance_depth(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic depth calculation
DROP TRIGGER IF EXISTS trg_update_inheritance_depth ON public.agents;
CREATE TRIGGER trg_update_inheritance_depth
  BEFORE INSERT OR UPDATE OF parent_agent_id ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION update_inheritance_depth();

-- Create recursive view for agent hierarchy (useful for debugging)
CREATE OR REPLACE VIEW agent_hierarchy AS
WITH RECURSIVE agent_tree AS (
  -- Base case: agents with no parent (root agents)
  SELECT 
    id,
    name,
    parent_agent_id,
    is_abstract,
    0 as depth,
    ARRAY[name] as inheritance_chain,
    name::text as chain_display
  FROM agents
  WHERE parent_agent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: agents with parents
  SELECT 
    a.id,
    a.name,
    a.parent_agent_id,
    a.is_abstract,
    at.depth + 1,
    at.inheritance_chain || a.name,
    at.chain_display || ' → ' || a.name
  FROM agents a
  INNER JOIN agent_tree at ON a.parent_agent_id = at.id
)
SELECT 
  id,
  name,
  parent_agent_id,
  is_abstract,
  depth,
  inheritance_chain,
  chain_display
FROM agent_tree
ORDER BY depth, name;

-- Grant necessary permissions
GRANT SELECT ON agent_hierarchy TO authenticated;
GRANT SELECT ON agent_hierarchy TO anon;

-- Add RLS policy update for abstract agent filtering
-- Users should not be able to select abstract agents directly
DROP POLICY IF EXISTS "Anyone can view active non-abstract agents" ON public.agents;
CREATE POLICY "Anyone can view active non-abstract agents" ON public.agents 
  FOR SELECT 
  USING (is_active = true);

-- Note: Abstract agents can still be loaded via inheritance, but not directly selected
-- The application layer will filter out is_abstract = true from agent selectors
