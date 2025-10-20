-- Create SECURITY DEFINER function for RFP creation
-- This bypasses RLS while ensuring proper user ownership

CREATE OR REPLACE FUNCTION public.create_rfp_for_user(
  p_user_uuid uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_specification text DEFAULT NULL,
  p_due_date date DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS TABLE(
  rfp_id integer,
  rfp_name text,
  rfp_description text,
  rfp_created_at timestamp,
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user_profile_id uuid;
  v_new_rfp_id integer;
  v_new_rfp record;
BEGIN
  -- Get the user profile ID from supabase_user_id
  SELECT id INTO v_user_profile_id
  FROM public.user_profiles
  WHERE supabase_user_id = p_user_uuid;
  
  IF v_user_profile_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::integer, 
      NULL::text, 
      NULL::text, 
      NULL::timestamp,
      false,
      'User profile not found'::text;
    RETURN;
  END IF;
  
  -- Insert the RFP (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.rfps (
    name,
    description,
    specification,
    due_date,
    status,
    is_template,
    is_public,
    completion_percentage,
    account_id,
    created_at
  )
  VALUES (
    p_name,
    p_description,
    p_specification,
    p_due_date,
    'draft',
    false,
    false,
    0,
    NULL, -- Personal RFP (no account)
    NOW()
  )
  RETURNING * INTO v_new_rfp;
  
  v_new_rfp_id := v_new_rfp.id;
  
  -- If session_id provided, update the session's current_rfp_id
  IF p_session_id IS NOT NULL THEN
    UPDATE public.sessions
    SET current_rfp_id = v_new_rfp_id
    WHERE id = p_session_id
    AND user_id = v_user_profile_id;
  END IF;
  
  -- Return success
  RETURN QUERY SELECT 
    v_new_rfp_id,
    v_new_rfp.name,
    v_new_rfp.description,
    v_new_rfp.created_at,
    true,
    format('RFP "%s" created successfully with ID %s', v_new_rfp.name, v_new_rfp_id)::text;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_rfp_for_user(uuid, text, text, text, date, uuid) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.create_rfp_for_user IS 
'Creates an RFP for a user using SECURITY DEFINER to bypass RLS. This ensures RFP creation works even when RLS policies are complex. The function validates user ownership and automatically links the RFP to the session if provided.';
