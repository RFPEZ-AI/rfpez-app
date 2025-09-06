-- Quick test query to verify our test RFP with bid_form_questionaire was inserted
SELECT 
  id,
  name,
  description,
  due_date,
  created_at,
  bid_form_questionaire IS NOT NULL as has_bid_form_questionaire,
  jsonb_pretty(bid_form_questionaire) as bid_form_questionaire_formatted
FROM public.rfps 
WHERE name LIKE '%Sample Hotel%' OR bid_form_questionaire IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
