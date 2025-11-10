-- Add generate_rfp_bid_url tool to RFP Design agent's access array
-- This tool allows the agent to generate proper bid submission URLs for RFP request emails

UPDATE agents 
SET access = array_append(access, 'generate_rfp_bid_url')
WHERE name = 'RFP Design' 
  AND NOT ('generate_rfp_bid_url' = ANY(access));
