-- Quick test query to verify our test RFP with form_spec was inserted
SELECT 
  id,
  name,
  description,
  due_date,
  created_at,
  form_spec IS NOT NULL as has_form_spec,
  jsonb_pretty(form_spec) as form_spec_formatted
FROM public.rfp 
WHERE name LIKE '%Sample Hotel%' OR form_spec IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
