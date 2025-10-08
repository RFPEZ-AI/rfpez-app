-- =======================================================
-- BID SUBMISSION SYSTEM ENHANCEMENT
-- Date: October 7, 2025
-- Purpose: Complete the bid submission workflow
-- =======================================================

-- 1. ENHANCE BIDS TABLE WITH STATUS TRACKING
-- =======================================================

-- Add comprehensive status tracking to bids table
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (
  status IN ('draft', 'submitted', 'under_review', 'clarification_requested', 
            'shortlisted', 'accepted', 'rejected', 'withdrawn', 'expired')
),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_reason TEXT, -- Reason for rejection/clarification
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(15,2), -- Primary bid amount
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS validity_period INTEGER DEFAULT 30, -- Days the bid is valid
ADD COLUMN IF NOT EXISTS supplier_notes TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT, -- Internal reviewer notes
ADD COLUMN IF NOT EXISTS score DECIMAL(5,2), -- Bid evaluation score
ADD COLUMN IF NOT EXISTS ranking INTEGER; -- Ranking against other bids

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_rfp_status ON public.bids(rfp_id, status);
CREATE INDEX IF NOT EXISTS idx_bids_submitted_at ON public.bids(submitted_at);

-- 2. CREATE BID SUBMISSION FUNCTION
-- =======================================================

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
  bid_amount_extracted := COALESCE((form_data->>'bid_amount')::DECIMAL, (form_data->>'amount')::DECIMAL, (form_data->>'price')::DECIMAL);
  delivery_date_extracted := COALESCE((form_data->>'delivery_date')::DATE, (form_data->>'deliveryDate')::DATE);
  supplier_notes_extracted := COALESCE(form_data->>'notes', form_data->>'comments', form_data->>'additional_information');
  
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
    response, -- Keep for backward compatibility
    created_at,
    updated_at
  ) 
  VALUES (
    rfp_id_param,
    COALESCE(agent_id_param, 1), -- Default agent if not provided
    supplier_id_param,
    NULL, -- Will be set after creating submission
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
  
  RETURN submission_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error submitting bid: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREATE BID STATUS UPDATE FUNCTION
-- =======================================================

CREATE OR REPLACE FUNCTION public.update_bid_status(
  bid_id_param INTEGER,
  new_status VARCHAR(50),
  status_reason_param TEXT DEFAULT NULL,
  reviewer_id_param UUID DEFAULT NULL,
  score_param DECIMAL(5,2) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  old_status VARCHAR(50);
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM public.bids WHERE id = bid_id_param;
  
  -- Update bid status
  UPDATE public.bids 
  SET 
    status = new_status,
    status_reason = status_reason_param,
    reviewer_id = reviewer_id_param,
    score = score_param,
    reviewed_at = CASE WHEN new_status IN ('accepted', 'rejected', 'shortlisted') THEN NOW() ELSE reviewed_at END,
    updated_at = NOW()
  WHERE id = bid_id_param;
  
  -- Log status change (could be expanded to audit table)
  RAISE NOTICE 'Bid % status changed from % to %', bid_id_param, old_status, new_status;
  
  RETURN FOUND;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating bid status: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE BID RETRIEVAL FUNCTIONS
-- =======================================================

-- Get bids for an RFP with full details
CREATE OR REPLACE FUNCTION public.get_rfp_bids(rfp_id_param INTEGER)
RETURNS TABLE (
  bid_id INTEGER,
  rfp_id INTEGER,
  supplier_id INTEGER,
  status VARCHAR(50),
  bid_amount DECIMAL(15,2),
  currency VARCHAR(3),
  submitted_at TIMESTAMP WITH TIME ZONE,
  delivery_date DATE,
  supplier_notes TEXT,
  score DECIMAL(5,2),
  ranking INTEGER,
  form_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bid_id,
    b.rfp_id,
    b.supplier_id,
    b.status,
    b.bid_amount,
    b.currency,
    b.submitted_at,
    b.delivery_date,
    b.supplier_notes,
    b.score,
    b.ranking,
    COALESCE(s.submission_data, b.response) as form_data
  FROM public.bids b
  LEFT JOIN public.artifact_submissions s ON b.artifact_submission_id = s.id
  WHERE b.rfp_id = rfp_id_param
  ORDER BY b.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE BID RANKING FUNCTION
-- =======================================================

CREATE OR REPLACE FUNCTION public.rank_bids_for_rfp(rfp_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  bid_record RECORD;
  current_rank INTEGER := 1;
BEGIN
  -- Rank bids by score (highest first), then by amount (lowest first)
  FOR bid_record IN
    SELECT id
    FROM public.bids
    WHERE rfp_id = rfp_id_param 
      AND status IN ('submitted', 'under_review', 'shortlisted')
    ORDER BY 
      COALESCE(score, 0) DESC,
      COALESCE(bid_amount, 999999999) ASC,
      submitted_at ASC
  LOOP
    UPDATE public.bids 
    SET ranking = current_rank, updated_at = NOW()
    WHERE id = bid_record.id;
    
    current_rank := current_rank + 1;
  END LOOP;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error ranking bids: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ADD RLS POLICIES FOR BID SECURITY
-- =======================================================

-- Enable RLS on bids table if not already enabled
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view bids for RFPs they created or are involved with
CREATE POLICY IF NOT EXISTS "Users can view relevant bids" ON public.bids
  FOR SELECT
  USING (
    -- RFP owner can see bids
    rfp_id IN (
      SELECT id FROM public.rfps 
      WHERE auth.uid() = (
        SELECT user_id FROM public.sessions 
        WHERE id IN (
          SELECT session_id FROM public.artifacts 
          WHERE id::text LIKE '%' || rfp_id::text || '%'
        )
      )
    )
    OR
    -- Supplier can see their own bids
    supplier_id IN (
      SELECT id FROM public.supplier_profiles 
      WHERE user_id = auth.uid()
    )
    OR
    -- Admin users can see all bids (if admin role exists)
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Only suppliers can insert bids
CREATE POLICY IF NOT EXISTS "Suppliers can create bids" ON public.bids
  FOR INSERT
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM public.supplier_profiles 
      WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Bid owners and RFP owners can update bid status
CREATE POLICY IF NOT EXISTS "Authorized users can update bids" ON public.bids
  FOR UPDATE
  USING (
    -- Supplier can update their own draft bids
    (supplier_id IN (
      SELECT id FROM public.supplier_profiles 
      WHERE user_id = auth.uid()
    ) AND status = 'draft')
    OR
    -- RFP owner can update bid status
    rfp_id IN (
      SELECT id FROM public.rfps 
      WHERE auth.uid() = (
        SELECT user_id FROM public.sessions 
        WHERE id IN (
          SELECT session_id FROM public.artifacts 
          WHERE id::text LIKE '%' || rfp_id::text || '%'
        )
      )
    )
    OR
    -- Admin can update any bid
    auth.jwt() ->> 'role' = 'admin'
  );

-- 7. CREATE HELPER VIEWS
-- =======================================================

-- View: Bid summary with supplier information
CREATE OR REPLACE VIEW public.bid_summary AS
SELECT 
  b.id as bid_id,
  b.rfp_id,
  r.name as rfp_name,
  b.supplier_id,
  sp.company_name as supplier_name,
  sp.contact_email as supplier_email,
  b.status,
  b.bid_amount,
  b.currency,
  b.submitted_at,
  b.delivery_date,
  b.score,
  b.ranking,
  b.supplier_notes,
  b.created_at,
  b.updated_at
FROM public.bids b
LEFT JOIN public.rfps r ON b.rfp_id = r.id
LEFT JOIN public.supplier_profiles sp ON b.supplier_id = sp.id
WHERE b.status != 'draft' -- Only show submitted bids
ORDER BY b.rfp_id, b.ranking NULLS LAST, b.submitted_at DESC;

-- Add comments for documentation
COMMENT ON TABLE public.bids IS 'Stores bid submissions from suppliers in response to RFPs';
COMMENT ON COLUMN public.bids.status IS 'Current status of the bid: draft, submitted, under_review, clarification_requested, shortlisted, accepted, rejected, withdrawn, expired';
COMMENT ON COLUMN public.bids.artifact_submission_id IS 'Links to the artifact_submissions table for full form data';
COMMENT ON COLUMN public.bids.bid_amount IS 'Primary bid amount extracted from form data';
COMMENT ON COLUMN public.bids.score IS 'Evaluation score assigned during bid review (0-100)';
COMMENT ON COLUMN public.bids.ranking IS 'Ranking of this bid compared to other bids for the same RFP';
COMMENT ON FUNCTION public.submit_bid IS 'Creates a bid record from form submission data and links it to artifact_submissions';
COMMENT ON FUNCTION public.update_bid_status IS 'Updates bid status with audit trail and reviewer information';
COMMENT ON FUNCTION public.get_rfp_bids IS 'Retrieves all bids for an RFP with full form data';
COMMENT ON FUNCTION public.rank_bids_for_rfp IS 'Automatically ranks bids for an RFP based on score and amount';