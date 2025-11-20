-- Fix infinite recursion in RFPs table RLS policies
-- Issue: Multiple complex SELECT policies with subqueries create circular dependencies

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "select_rfps_from_email_invitations" ON rfps;
DROP POLICY IF EXISTS "select_rfps_with_supplier_bids" ON rfps;
DROP POLICY IF EXISTS "Allow authenticated users to view RFPs" ON rfps;

-- Keep the main select_rfps policy which is sufficient
-- It allows:
-- 1. Public RFPs (is_public = true)
-- 2. RFPs owned by accounts the user is a member of

-- Recreate email_invitations policy with SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION can_view_rfp_via_email(rfp_id_param INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM email_messages em
    JOIN auth.users u ON (u.id = auth.uid())
    WHERE em.rfp_id = rfp_id_param
    AND (
      (em.direction = 'received' AND em.user_id = u.id)
      OR (em.direction = 'sent' AND (u.email::text = ANY(em.to_emails) OR u.email::text = ANY(em.cc_emails)))
    )
  );
END;
$$;

-- Recreate supplier_bids policy with SECURITY DEFINER function
CREATE OR REPLACE FUNCTION can_view_rfp_via_supplier_bid(rfp_id_param INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM bids b
    JOIN supplier_accounts sa ON b.supplier_id = sa.supplier_id
    JOIN account_users au ON sa.account_id = au.account_id
    WHERE b.rfp_id = rfp_id_param
    AND au.user_id = auth.uid()
  );
END;
$$;

-- Add back simplified policies using SECURITY DEFINER functions
CREATE POLICY "select_rfps_from_email_invitations" ON rfps
  FOR SELECT
  USING (can_view_rfp_via_email(id));

CREATE POLICY "select_rfps_with_supplier_bids" ON rfps
  FOR SELECT
  USING (can_view_rfp_via_supplier_bid(id));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_view_rfp_via_email(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_view_rfp_via_supplier_bid(INTEGER) TO authenticated, anon;
