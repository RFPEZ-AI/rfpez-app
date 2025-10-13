-- Fix submit_bid function to properly handle RLS and improve field extraction
-- Date: October 13, 2025
-- Issue: submit_bid function needs enhanced field extraction for various form field names

-- NOTE: The postgres role already has BYPASSRLS privilege (checked via pg_roles)
-- The actual issue was tool filtering in edge function, not RLS (see DOCUMENTATION/FIX-BID-SUBMISSION-TOOL-PERMISSIONS.md)

-- Ensure the function owner (postgres) has necessary grants
-- This is already handled by SECURITY DEFINER, but we're being explicit
GRANT ALL ON TABLE public.artifact_submissions TO postgres;
GRANT ALL ON TABLE public.bids TO postgres;

-- Recreate the function to ensure it has all necessary grants
-- No changes to function logic, just ensuring proper security context
CREATE OR REPLACE FUNCTION public.submit_bid(
  rfp_id_param INTEGER,
  artifact_id_param TEXT,
  supplier_id_param INTEGER DEFAULT NULL,
  agent_id_param INTEGER DEFAULT NULL,
  session_id_param UUID DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  bid_id INTEGER;
  submission_id UUID;
  form_data JSONB;
  bid_amount_extracted DECIMAL(15,2);
  delivery_date_extracted DATE;
  supplier_notes_extracted TEXT;
BEGIN
  -- Get the latest form submission data
  SELECT submission_data INTO form_data
  FROM public.artifact_submissions
  WHERE artifact_id = artifact_id_param
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  -- If no submission found, get from artifact default_values
  IF form_data IS NULL THEN
    SELECT default_values INTO form_data
    FROM public.artifacts
    WHERE id = artifact_id_param;
  END IF;
  
  -- Extract key bid information from form data
  bid_amount_extracted := COALESCE((form_data->>'bid_amount')::DECIMAL, (form_data->>'amount')::DECIMAL, (form_data->>'price')::DECIMAL, (form_data->>'total_bid_amount')::DECIMAL, (form_data->>'unit_price_per_ton')::DECIMAL);
  delivery_date_extracted := COALESCE((form_data->>'delivery_date')::DATE, (form_data->>'deliveryDate')::DATE);
  supplier_notes_extracted := COALESCE(form_data->>'notes', form_data->>'comments', form_data->>'additional_information', form_data->>'additional_notes', form_data->>'supplier_notes');
  
  -- Create or update the bid record
  INSERT INTO public.bids (
    rfp_id, 
    agent_id, 
    supplier_id, 
    artifact_submission_id,
    status,
    submitted_at,
    bid_amount,
    delivery_date,
    supplier_notes,
    response,
    created_at,
    updated_at
  ) 
  VALUES (
    rfp_id_param,
    COALESCE(agent_id_param, 1),
    supplier_id_param,
    NULL,
    'submitted',
    NOW(),
    bid_amount_extracted,
    delivery_date_extracted,
    supplier_notes_extracted,
    form_data,
    NOW(),
    NOW()
  )
  RETURNING id INTO bid_id;
  
  -- Create artifact submission record
  INSERT INTO public.artifact_submissions (
    artifact_id,
    session_id,
    user_id,
    submission_data,
    form_version,
    metadata
  )
  VALUES (
    artifact_id_param,
    session_id_param,
    user_id_param,
    form_data,
    '1.0',
    jsonb_build_object(
      'bid_id', bid_id,
      'rfp_id', rfp_id_param,
      'submission_type', 'bid_submission',
      'extracted_amount', bid_amount_extracted
    )
  )
  RETURNING id INTO submission_id;
  
  -- Link the submission back to the bid
  UPDATE public.bids 
  SET artifact_submission_id = submission_id
  WHERE id = bid_id;
  
  -- Log successful submission
  RAISE NOTICE 'Bid submitted successfully: bid_id=%, submission_id=%', bid_id, submission_id;
  
  RETURN submission_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error submitting bid: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function can be called by authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.submit_bid TO authenticated, anon;

COMMENT ON FUNCTION public.submit_bid IS 'Submits a bid for an RFP. Runs with SECURITY DEFINER to bypass RLS policies. The postgres role has BYPASSRLS privilege to ensure successful execution.';
