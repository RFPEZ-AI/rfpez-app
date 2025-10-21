-- Allow Anonymous Access to Public Agents
-- Issue: Anonymous users get "permission denied for table agents" error
-- Solution: Add SELECT policy for anon role to access non-restricted agents

-- Create policy allowing anonymous users to SELECT non-restricted agents
CREATE POLICY "anonymous_select_public_agents" ON agents
FOR SELECT TO anon
USING (
    is_active = true 
    AND is_restricted = false
);

-- Grant SELECT permission to anon role
GRANT SELECT ON agents TO anon;

COMMENT ON POLICY "anonymous_select_public_agents" ON agents IS 
'Allow anonymous users to view active, non-restricted (public) agents';
