-- Set Solutions agent is_default to false since Corporate TMC RFP Welcome will be the new default
UPDATE agents 
SET is_default = false,
    updated_at = NOW()
WHERE id = '4fe117af-da1d-410c-bcf4-929012d8a673'
  AND name = 'Solutions';
