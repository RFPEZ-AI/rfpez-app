-- =======================================================
-- FIX SUBMIT_BID FUNCTION - ADD ACCOUNT_ID SUPPORT
-- Date: October 24, 2025
-- Purpose: Fix bid submission failures caused by missing account_id in RLS policies
-- Root Cause: submit_bid function doesn't set account_id, but RLS requires it
-- =======================================================

-- Drop and recreate the submit_bid function with account_id support
DROP FUNCTION IF EXISTS public.submit_bid(INTEGER, TEXT, INTEGER, INTEGER, UUID, UUID);

CREATE OR REPLACE FUNCTION public.submit_bid(
  rfp_id_param INTEGER,
  artifact_id_param TEXT,
  supplier_id_param INTEGER DEFAULT NULL,
  agent_id_param INTEGER DEFAULT NULL,
  session_id_param UUID DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  account_id_param UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  bid_id INTEGER;
  submission_id UUID;
  form_data JSONB;
  bid_amount_extracted DECIMAL(15,2);
  delivery_date_extracted DATE;
  supplier_notes_extracted TEXT;
  resolved_account_id UUID;
BEGIN
  -- Resolve account_id from session if not provided
  IF account_id_param IS NULL AND session_id_param IS NOT NULL THEN
    SELECT account_id INTO resolved_account_id
    FROM public.sessions
    WHERE id = session_id_param;
  ELSE
    resolved_account_id := account_id_param;
  END IF;

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
  bid_amount_extracted := COALESCE((form_data->>'bid_amount')::DECIMAL, (form_data->>'amount')::DECIMAL, (form_data->>'price')::DECIMAL);
  delivery_date_extracted := COALESCE((form_data->>'delivery_date')::DATE, (form_data->>'deliveryDate')::DATE);
  supplier_notes_extracted := COALESCE(form_data->>'notes', form_data->>'comments', form_data->>'additional_information');
  
  -- Create or update the bid record with account_id
  INSERT INTO public.bids (
    rfp_id, 
    agent_id, 
    supplier_id, 
    artifact_submission_id,
    account_id,
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
    resolved_account_id,
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
      'extracted_amount', bid_amount_extracted,
      'account_id', resolved_account_id
    )
  )
  RETURNING id INTO submission_id;
  
  -- Link the submission back to the bid
  UPDATE public.bids 
  SET artifact_submission_id = submission_id
  WHERE id = bid_id;
  
  RETURN submission_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error submitting bid: %', SQLERRM;
    RAISE NOTICE 'Error detail: %', SQLSTATE;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.submit_bid(INTEGER, TEXT, INTEGER, INTEGER, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_bid(INTEGER, TEXT, INTEGER, INTEGER, UUID, UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_bid(INTEGER, TEXT, INTEGER, INTEGER, UUID, UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.submit_bid IS 'Submits a bid for an RFP with proper account_id resolution from session for RLS compliance';
