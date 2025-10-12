-- Fix get_rfp_artifacts function to use correct column names
-- The function was referencing 'form_data' which doesn't exist in the artifacts table
-- The correct field is 'default_values'

-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_rfp_artifacts(integer);

CREATE OR REPLACE FUNCTION get_rfp_artifacts(rfp_id_param integer)
RETURNS TABLE (
  artifact_id text,
  artifact_name text,
  artifact_type text,
  artifact_role text,
  schema jsonb,
  ui_schema jsonb,
  default_values jsonb,  -- Changed from form_data
  submit_action jsonb,   -- Added missing field
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as artifact_id,
    a.name as artifact_name,
    a.type as artifact_type,
    ra.role as artifact_role,
    a.schema,
    a.ui_schema,
    a.default_values,     -- Changed from form_data
    a.submit_action,      -- Added missing field
    a.created_at
  FROM public.artifacts a
  JOIN public.rfp_artifacts ra ON a.id = ra.artifact_id
  WHERE ra.rfp_id = rfp_id_param
    AND a.status = 'active'
  ORDER BY ra.role, a.created_at;
END;
$$;
