-- Migration: Grant suppliers read access to RFPs they're responding to
-- Created: 2025-11-17
-- Purpose: Allow suppliers to read RFP details when:
--   1. They have created a bid for the RFP
--   2. They have been invited to the RFP via email

-- Policy 1: Allow suppliers to read RFPs they have bids for
-- This allows suppliers to view RFPs they're actively responding to
CREATE POLICY "select_rfps_with_supplier_bids" ON rfps
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user's account has a bid for this RFP
    EXISTS (
      SELECT 1
      FROM bids b
      JOIN supplier_accounts sa ON b.supplier_id = sa.supplier_id
      JOIN account_users au ON sa.account_id = au.account_id
      WHERE b.rfp_id = rfps.id
        AND au.user_id = auth.uid()
    )
  );

-- Policy 2: Allow suppliers to read RFPs they've been invited to via email
-- This allows suppliers to view RFPs BEFORE creating their first bid
CREATE POLICY "select_rfps_from_email_invitations" ON rfps
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user received an email about this RFP
    EXISTS (
      SELECT 1
      FROM email_messages em
      JOIN auth.users u ON em.user_id = u.id
      WHERE em.rfp_id = rfps.id
        AND em.direction = 'received'
        AND u.id = auth.uid()
    )
    OR
    -- Allow if user's email is in the to_emails array of a sent RFP email
    EXISTS (
      SELECT 1
      FROM email_messages em
      JOIN auth.users u ON u.id = auth.uid()
      WHERE em.rfp_id = rfps.id
        AND em.direction = 'sent'
        AND (
          u.email = ANY(em.to_emails) 
          OR u.email = ANY(em.cc_emails)
        )
    )
  );

-- Add comment documenting the supplier access model
COMMENT ON POLICY "select_rfps_with_supplier_bids" ON rfps IS 
  'Grants suppliers read access to RFPs they have submitted bids for, enabling them to view RFP details while drafting or updating their bid responses.';

COMMENT ON POLICY "select_rfps_from_email_invitations" ON rfps IS 
  'Grants suppliers read access to RFPs they have been invited to via email, allowing them to view RFP details before creating their first bid. Supports both direct user_id email tracking and email address matching in sent RFP emails.';
