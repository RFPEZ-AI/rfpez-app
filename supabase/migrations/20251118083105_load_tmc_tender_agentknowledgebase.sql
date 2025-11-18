-- Knowledge Base: TMC Tender Agent-knowledge-base
-- Generated on 2025-11-18T08:31:05.544Z
-- Source: TMC Tender Agent-knowledge-base.md
-- Entries: 267

-- Insert knowledge base entries
-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** • This master list of RFI / RFP questions is intended for your reference only.  It is not a final, submission-ready product.  Please do not forward as written.  It is a compilation of queries from a variety of sources meant to serve as a set of options from which the buyer should choose those that fit their planned sourcing course.         

• The format is Excel. Words in blue indicate where information specific to buyer must be entered.

• There are references to appendices, such as Travel Policy, which can be included in your supplier submission.  Samples have not been attached.

• The  pricing template and other pertinent information, such as a suggested bid process calendar, can be found separately or attached to the sample RFI / RFP documents in this resource library.                                                                                                                                                                      
                                                                                                                                                                   

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-instructions-2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Instructions",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "instructions",
    "instructions"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-instructions-2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-instructions-2'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** GENERAL RFI   / RFP CATEGORIES

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-1'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 0.0 Overview / Executive Summary

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-3'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.0   Background / Experience

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-5'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.1   Legal name / address

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-6",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-6",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-6'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.2   Ownership

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-7",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-7",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-7'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.3   Company history

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-8",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-8",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-8'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.4    Financial strength

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-9",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-9",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-9'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.5   Size & growth

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-10",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-10",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-10'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.6   Org chart

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-11",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-11",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-11'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.7   Certifications

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-12",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-12",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-12'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.8   Differentiators

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-13",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-13",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-13'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1.9   TMC references

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-14",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-14",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-14'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2.0   Operations

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-16",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-16",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-16'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2.1   Service configuration

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-17",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-17",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-17'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2.2   Faring / quality control

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-18",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-18",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-18'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2.3   Services

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-19",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-19",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-19'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2.4   Issue resolution

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-20",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-20",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-20'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2.5   Emergency response management

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-21",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-21",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-21'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 3.0   Program Management

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-23",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-23",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-23'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 3.1   Account management

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-24",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-24",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-24'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 3.2   Air / car / hotel relationships

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-25",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-25",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-25'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 3.3   Cost savings measures

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-26",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-26",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-26'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 3.4   Quality & service metrics

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-27",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-27",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-27'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 4.0   Implementation

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-29",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-29",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-29'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 5.0   Technology

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-31",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-31",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-31'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 5.1   Technology supplier relationships

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-32",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-32",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-32'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 5.2   Operations technology

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-33",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-33",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-33'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 5.3   Innovation

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-34",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-34",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-34'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 6.0   Data / Security / Disaster Recovery

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-36",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-36",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-36'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 6.1   Data consolidation

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-37",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-37",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-37'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 6.2   Reporting

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-38",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-38",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-38'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 6.3   Data privacy & security

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-39",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-39",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-39'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 6.4   Business continuity

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-40",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-40",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-40'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 7.0   Additional Services

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-42",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-42",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-42'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 7.1   Procurement & consulting

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-43",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-43",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-43'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 7.2   Meeting & incentive

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-44",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-44",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-44'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 7.3   CSR initiatives

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-45",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-45",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-45'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 8.0   Administrative

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-47",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-47",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-47'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 8.1   Contact

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-48",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-48",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-48'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 8.2   Offer / pricing validity

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-49",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-49",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-49'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Appendices*

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-51",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-51",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-51'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** A.      Travel Policy (informational)

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-52",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-52",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-52'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** B.      IT and Data Security Requirements (bidder capabilities confirmation required)

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-53",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-53",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-53'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** C.      Reporting Requirements (bidder capabilities confirmation required)

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-54",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-54",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-54'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** D.      Product Requirements – i.e., online booking tool  (specify requirements by product; bidder capabilities confirmation required)

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-55",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-55",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-55'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** E.       Pricing

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-56",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-56",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-56'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** F.       Guidelines & Instructions

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-57",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-57",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-57'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Note:* Suggested; not included in Master Question list.

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-category-list-60",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Category List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "category-list",
    "category-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-category-list-60",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-category-list-60'
);

-- TMC Question: General - Executive Summary
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Summarize your proposal into a brief, compelling argument for [Company Name] choosing your company as a its global, regional, or country-specific TMC.

**Category:** Executive Summary

**Section:** General

**Additional Information:**

- **Count:** 1.0
- **Region:** ---
- **Subcategory:** ---

**Metadata:**
```json
{
  "knowledge_id": "0.0",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "executive-summary",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "0.0",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '0.0'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Provide legal name

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 2.0
- **Region:** ---
- **Subcategory:** TMC Legal Name / Addresses

**Metadata:**
```json
{
  "knowledge_id": "1.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.1'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Provide HQ address

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** TMC Legal Name / Addresses

**Metadata:**
```json
{
  "knowledge_id": "1.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.1'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Street number /name

**Section:** General

**Additional Information:**

- **Count:** 3.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-4'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** State / province

**Section:** General

**Additional Information:**

- **Count:** 4.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-5'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Postal Code

**Section:** General

**Additional Information:**

- **Count:** 5.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-6",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-6",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-6'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Country

**Section:** General

**Additional Information:**

- **Count:** 6.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-7",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-7",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-7'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Provide all applicable URLs

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** TMC Legal Name / Addresses

**Metadata:**
```json
{
  "knowledge_id": "1.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.1'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC Web Address

**Section:** General

**Additional Information:**

- **Count:** 7.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-9",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-9",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-9'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC LinkedIn site

**Section:** General

**Additional Information:**

- **Count:** 8.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-10",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-10",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-10'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** reconciliation

**Section:** General

**Additional Information:**

- **Count:** 9.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-11",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-11",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-11'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC Facebook site

**Section:** General

**Additional Information:**

- **Count:** 10.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-12",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-12",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-12'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC other internet / social media sites

**Section:** General

**Additional Information:**

- **Count:** 11.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-13",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-13",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-13'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Describe a brief history of your TMC, highlighting growth over the last five years (i.e. growth via mergers and acquisitions) and key industry innovations.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 12.0
- **Region:** ---
- **Subcategory:** Company history

**Metadata:**
```json
{
  "knowledge_id": "1.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.2'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Provide complete statement(s) of ownership.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 13.0
- **Region:** ---
- **Subcategory:** Ownership

**Metadata:**
```json
{
  "knowledge_id": "1.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.3'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Please provide current financial statements. (Annual report if available, URL link is acceptable).

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 14.0
- **Region:** ---
- **Subcategory:** Financial Strength

**Metadata:**
```json
{
  "knowledge_id": "1.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.4'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC Volume Statistics - Air / Rail (value & transactions)                                                                            Please provide estimated ticketed volumes and transactions for the last 12 months

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** Size & Growth

**Metadata:**
```json
{
  "knowledge_id": "1.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.5'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Air US$ Sales

**Section:** General

**Additional Information:**

- **Count:** 15.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-18",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-18",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-18'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Air #  Transactions

**Section:** General

**Additional Information:**

- **Count:** 16.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-19",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-19",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-19'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Rail US$ Sales

**Section:** General

**Additional Information:**

- **Count:** 17.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-20",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-20",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-20'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Rail #  Transactions

**Section:** General

**Additional Information:**

- **Count:** 18.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-21",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-21",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-21'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC Account Statistics -- Please group your clients serviced by volume 

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** Size & Growth

**Metadata:**
```json
{
  "knowledge_id": "1.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.5'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** <$5 million

**Section:** General

**Additional Information:**

- **Count:** 19.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-23",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-23",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-23'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** $5 - 20 million

**Section:** General

**Additional Information:**

- **Count:** 20.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-24",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-24",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-24'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** $20 - 50 million

**Section:** General

**Additional Information:**

- **Count:** 21.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-25",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-25",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-25'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** $50 - 75 million

**Section:** General

**Additional Information:**

- **Count:** 22.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-26",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-26",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-26'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** >$75+ million

**Section:** General

**Additional Information:**

- **Count:** 23.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-27",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-27",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-27'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Industry experience

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** Size & Growth

**Metadata:**
```json
{
  "knowledge_id": "1.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.5'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Number of clients in industry sector

**Section:** General

**Additional Information:**

- **Count:** 24.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-29",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-29",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-29'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Air $ Volume of such clients

**Section:** General

**Additional Information:**

- **Count:** 25.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-30",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-30",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-30'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Org chart: Please provide relevant organization charts.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 26.0
- **Region:** ---
- **Subcategory:** Org chart

**Metadata:**
```json
{
  "knowledge_id": "1.6",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.6",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.6'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Diversified Supplier: Are you certified as a diverse supplier?  If so, please identify your status (e.g. minority owned, veteran owned, woman owned, disabled owned, HUB zone, small business or non-profit).

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 27.0
- **Region:** US ONLY
- **Subcategory:** Certifications

**Metadata:**
```json
{
  "knowledge_id": "1.7",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.7",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.7'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** ISO: Please provide information on any ISO certifications your organization holds.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 28.0
- **Region:** ---
- **Subcategory:** Certifications

**Metadata:**
```json
{
  "knowledge_id": "1.7",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.7",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.7'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Industry-specific certifications: Please list any industry-specific certifications your organization holds.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 29.0
- **Region:** ---
- **Subcategory:** Certifications

**Metadata:**
```json
{
  "knowledge_id": "1.7",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.7",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.7'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Differentiators: Explain how you differentiate yourself from your competition.  What are your TMC's core competencies?

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 30.0
- **Region:** ---
- **Subcategory:** Differentiators

**Metadata:**
```json
{
  "knowledge_id": "1.8",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.8",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.8'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** References: Provide five references of what at least three are multinational references that have similar spend, country distribution, and travel policies as [Company Name].  Include the contact names, addresses, email addresses and telephone numbers.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** References

**Metadata:**
```json
{
  "knowledge_id": "1.9",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.9",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.9'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 1)

**Section:** General

**Additional Information:**

- **Count:** 31.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-37",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-37",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-37'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 2)

**Section:** General

**Additional Information:**

- **Count:** 32.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-38",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-38",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-38'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 3)

**Section:** General

**Additional Information:**

- **Count:** 33.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-39",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-39",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-39'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 4)

**Section:** General

**Additional Information:**

- **Count:** 34.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-40",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-40",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-40'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 5)

**Section:** General

**Additional Information:**

- **Count:** 35.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-41",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-41",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-41'
);

-- TMC Question: General - Background / Experience
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Account Loss: What is the largest multinational account you have lost in the last eighteen months due to a reason other than consolidation or change of ownership?  Why did this company change travel management companies?  Provide the contact name, address and telephone number of the primary contact for this account.

**Category:** Background / Experience

**Section:** General

**Additional Information:**

- **Count:** 36.0
- **Subcategory:** References

**Metadata:**
```json
{
  "knowledge_id": "1.9",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "background-experience",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "1.9",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '1.9'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Multinational - Does TMC have branches and / or affiliates able to support [Company Name]'s international teams? Briefly describe model

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 37.0
- **Region:** GLOBAL
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  [Company Name]'s estimated total annual air / rail spend is US$ / € ##.# million. Staffing Level: Confirm number of agents and if they are dedicated or designated

**Category:** Operations

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Designated / Dedicated

**Section:** General

**Additional Information:**

- **Count:** 38.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-45",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-45",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-45'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** # of assigned agents

**Section:** General

**Additional Information:**

- **Count:** 39.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-46",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-46",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-46'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Staffing Level:  Proposed number of agents to service account (by location, if applicable)

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 40.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Agent Experience: What is the average experience and tenure of your travel agents( by region[(N.AMER, LA, EMEA, ASPAC] or country, if applicable)?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 41.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Adjusting Staffing Levels: Describe the forecasting system you employ to staff your operations in response to volume changes, weather-related call volume, etc.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 42.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  CTD: Is your TMC able to support [Company Name] as a CTD?  Yes /No

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 43.0
- **Region:** US ONLY
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Customer Support Availability. Hours of operation, availability of after-hour resources (by location, if applicable)

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 44.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Quality control (QC) processes - Has your TMC implemented a documented multi-level quality control environment to ensure [Company Name] receives consistent service and data quality?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 45.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Global consistency: It is desirable that  [Company Name] operates a truly global travel program.  However, because we have operations in so many countries, current local processes, suppliers and expectations vary widely.  What would you focus on to bring  [Company Name]  closer to a global system?  

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 46.0
- **Region:** GLOBAL
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Reservations Requests: Method of receiving inbound reservation requests (phone call, internet or e-mail, voice mail, etc.).

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 47.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Car & Hotel: Describe how hotel and rental car reservations are handled.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 48.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Document Distribution: Method of ticket and documentation distribution

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 49.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Telephony: What specific telephonic solutions can you deploy and what are the benefits that you feel make it a superior system?  Does it require specific hardware at client locations?  If so, what type and at whose cost?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 50.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Call Center: If you are proposing a centralized call center environment, how many countries will you service from each call center?  How will you accommodate multiple languages?  How do you handle the delivery of paper tickets?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 51.0
- **Region:** ---
- **Subcategory:** Service Configuration

**Metadata:**
```json
{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.1'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Quality Control Tools:  Detail your TMC’s quality control initiatives and tools.  Are the tools owned by the company or outsourced to a third-party? 

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 52.0
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Quality Control:  Describe all quality control functions you perform including lowest logical fare, preferred hotel offering, primary rental car supplier offering, date continuity, reason code integrity, preferred seating acquisition, special meal requests, hotel non-smoking/smoking requests, etc.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 53.0
- **Region:** ---
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Negotiated Rates / Fares: How do you ensure that [Company Name] specific rates are secured?  How do you store and access information regarding such negotiated agreements?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 54.0
- **Region:** ---
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Fare Savings: Describe any automated tools used to assist with maintenance and processing of negotiated fares.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 55.0
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Special Fares: Do you have any special pricing relationships you can pass to [Company Name] with respect to consolidator fares?  Can you integrate consolidator fares into your offering for[Company Name]?  Where do you have consolidator fares and where might it be an advantage for [Company Name]?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 56.0
- **Region:** ---
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** International Rate Desk: Do you provide an International Rate Desk to assure the best fares are constructed for your customers?  If so, please provide more information on this service, including the number of personnel dedicated and average savings per reservation.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 57.0
- **Region:** ---
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** QC for Data Elements: Describe what quality control procedures you have in place to assure MIS integrity (name reference information, reason codes, exception management, etc.).

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 58.0
- **Region:** ---
- **Subcategory:** Faring / Quality Control

**Metadata:**
```json
{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.2'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Passport and visa processing is an extremely important service for [Company Name] travelers.  Describe any specific capabilities you have to process or coordinate requests for passports and visas.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 59.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Non-Refundalbles: How can you help [Company Name]manage its inventory of unused non-refundable airline tickets? Is there a best practice you recommend?  Does the practice you recommend include both online and offline tickets?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 60.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Additional Airline Services: Indicate your ability to secure special airline services for travelers including preferred seating, upgrades, waitlist clearance, etc.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 61.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Taxes:. Confirm that your TMC will charge and collect any and all appropriate national,  state or local sales or use taxes on services/items purchased. 

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 62.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Ticket delivery (both electronic and paper): Please describe the process

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 63.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Itin / Confirmation-- Provide an example of a detailed complex itinerary confirmation that includes air, car, hotel, passport requirements, confirmation numbers and more.  Do you have a service that will search for the lowest fares for complex international itineraries?  Is there an additional cost?  Please describe.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 64.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Form of Payment: [Company Name] indicates what acceptable FOPs are

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 65.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Invoicing: [Company Name] indicates acceptable terms and requires confirmation by TMC

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 66.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Credit Card Reconciliation: Please describe credit card reconciliation process, timing and deliverable.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 67.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** VIP Traveler Services -- What service configuration do you propose for [Company Name] 's top executives both prior to and during travel?  ([Company Name]  currently has approximately ## senior level VIPs globally with located in the xxx Headquarters.)  Which of the following does your VIP service configuration include: a) Dedicated telephone number; b) Dedicated service team of high quality agent: c) Assisting the VIPs with their own personal mileage for  upgrades; d)Frequency flyer inquiries and bookings: e) Booking limos or ground transportation; f) Personal travel arrangements for themselves and immediate family members (this is occasionally allowed and would be made through this desk)

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 68.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Leisure: In general [Company Name]  Corporate Travel does not manage leisure/vacation but within some airline and hotel agreements suppliers do extend rates for leisure.  [Company Name]  would like to steer travelers for an agency for an 'option' for booking their leisure travel.  What capabilities does your company have for providing leisure and vacation services for[Company Name] 's employees?  How are these services priced?  Is there a discount you can extend to them for this service?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 69.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Additional Services: Are there other services that you recommend [Company Name]  include to better manage the overall global travel program?  If so, what are these services and what is your cost? 

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 70.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Value Added Services: Please provide information on any value-added services 

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 71.0
- **Region:** ---
- **Subcategory:** Services

**Metadata:**
```json
{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.3'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Mitigation: What is your mitigation and issue resolution process?  Please provide a detailed response

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 72.0
- **Region:** ---
- **Subcategory:** Issue Resolution

**Metadata:**
```json
{
  "knowledge_id": "2.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.4'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Issue Resolution: Indicate performance standards with respect to resolving service issues.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 73.0
- **Region:** ---
- **Subcategory:** Issue Resolution

**Metadata:**
```json
{
  "knowledge_id": "2.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.4'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  After-Hours: How do you provide after-hours emergency service?  Where are the services located?  How are differing language needs accommodated?  Describe service standards for 24-hour emergency services.  Who staffs this operation?  What is the average answer speed?  What is the average hold time?  What levels of emergency service do you offer (e.g. VIP)?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 74.0
- **Region:** ---
- **Subcategory:** After-Hours / Emergency Response Management

**Metadata:**
```json
{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.5'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** After-hours Support Services: Provide service standards (ASAs, hold times, etc.)., location, ownership and tenure of agents.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 75.0
- **Region:** ---
- **Subcategory:** After-Hours / Emergency Response Management

**Metadata:**
```json
{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.5'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** 24-Hour Service - How is TMC's 24-hour /  emergency travel service managed? Choose: Centralized, regionalized, in-country (owned), outsourced

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 76.0
- **Region:** ---
- **Subcategory:** After-Hours / Emergency Response Management

**Metadata:**
```json
{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.5'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Emergency Response Management strategy: [Company Name]  requires the TMC to have an Emergency Response Management strategy (i.e. large electrical black outs, airport closures, natural and man-made disasters, employee data maintenance, etc.).  The responsibilities include, but are not limited to, identification of travelers globally who may be affected, contacting them and confirming alternate means of transportation or accommodations, Global access for all [Company Name]  travelers to a 24 Hour, 7 days a week emergency travel service either via toll-free phone line or at no cost to the traveler/[Company Name] This should include a system outside the GDS to locate and identify travelers potentially involved in a travel disaster, accident, etc., at any time including off-hours and weekends and at the request of authorized [Company Name]  security or travel management personnel. It should also include a proactive alert process and notify [Company Name] of any high-risk airlines, hotels, destinations or other high-risk travel conditions as required by [Company Name] security.  Please describe your emergency response management at it pertains to the requirements listed above.

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 77.0
- **Region:** ---
- **Subcategory:** After-Hours / Emergency Response Management

**Metadata:**
```json
{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.5'
);

-- TMC Question: General - Operations
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Crisis management - During a crisis, [Company Name] expects your TMC to assign a single point of contact and to be accessible 24/7 to assist with activities such as confirming traveler lists, calling travelers to confirm safety or accommodate flight changes, when required, and/ or oversee the operation team to ensure the situation is handled appropriately.  Do you agree to comply?

**Category:** Operations

**Section:** General

**Additional Information:**

- **Count:** 78.0
- **Region:** ---
- **Subcategory:** After-Hours / Emergency Response Management

**Metadata:**
```json
{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "operations",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "2.5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '2.5'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Breadth: What levels and resources of account management will you offer?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 79.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Global Management: Describe how you currently manage global programs for comparable clients, specifically how you implement, maintain and monitor consistent global process and procedure standards.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 80.0
- **Region:** GLOBAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Client M&A activity: How does your TMC manage client acquisitions and divestures?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 81.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Breadth - Global: Are you submitting a proposal for a Global program?  If so, please answer xxx and xxx

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 82.0
- **Region:** GLOBAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Account Management Resources:  Can you provide a dedicated Global Account Manager and regional staff sufficient to support [Company Name] 's account activity?  [Company Name]  requires an experienced senior travel expert who has successfully supported a company with global operations.  This resource must be solely dedicated to [Company Name]  and no other client.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 83.0
- **Region:** GLOBAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Account Management Responsibility: Provided you can provide a dedicated Global Account Manager, will he/she be the global single point of contact for [Company Name] Headquarters management while managing and delegating to his/her resources?  He/she will be responsible for creating a global business plan with [Company Name], on-time delivery of commitments and the quality of the overall agency program at [Company Name].

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 84.0
- **Region:** GLOBAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Breadth -- Regional: Are you submitting a proposal for a Regional program?  If so, please answer xxx-xxx

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 85.0
- **Region:** REGIONAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Regional Account Manager: Can you provide a Regional Account Manager for each of the four regional areas: N.AMER, Latin America, Asia Pacific, EMEA? The Regional Account Manager must have access to corporate resources/experts to enable solutions and enhancements to the program.  He/she will be the single point of contact for [Company Name]locations in each region.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 86.0
- **Region:** REGIONAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Expectations: Will the Account Director and Regional Account Manager be proactive and vigilant in identifying opportunities for program improvements as well as program gaps?  Solutions to these opportunities and challenges will be his/her responsibility to present to [Company Name] management.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 87.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Regional AM  Duties: Please outline the duties and time allocation of each such Regional Account Manager.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 88.0
- **Region:** REGIONAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Resource Identification: List the primary individual(s) you would identify to manage [Company Name]'s global program.  Please detail out roles, responsibilities (including support for other accounts if applicable), decision making authority, credentials and location.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 89.0
- **Region:** GLOBAL
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Success Criteria: What key success criteria do you use to determine the overall effectiveness of an agency program that would be included in quarterly reviews / annual reviews?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 90.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Quarterly Business Reviews: Attach a sample of your standard quarterly business reviews, including reports, KPIs, SLAs, savings and program maximization tables.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 91.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Benchmarking: What benchmarking statistics do you collect within your client base that you share with your customers to establish best practices?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 92.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Client Advisory Council: Do you have an advisory council among your customers?  If so, how often do you meet?  Describe one or two process improvements that have been the result of these council meetings.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 93.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Change Management: [Company Name]  is a fluid company and acquisitions and divestitures are commonplace.  Describe the resources available to [Company Name] and the process we would go through when bringing in new employees from a different travel management company.  Describe the process if [Company Name] were to bring new employees in who may be using your TMCs services already.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 94.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Customer Service:. Confirm that you will provide a single point of contact responsible for [Company Name]’s overall customer satisfaction.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 95.0
- **Region:** ---
- **Subcategory:** Account Management

**Metadata:**
```json
{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.1'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Preferred Supplier Relationships: Describe your preferred supplier relationships with respect to airlines, rental cars, hotels, charge card suppliers, and rail/limo suppliers.  Include any additional industry related partners that are not listed.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 96.0
- **Region:** ---
- **Subcategory:** Air / Car / Hotel Relationships

**Metadata:**
```json
{
  "knowledge_id": "3.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.2'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Current Programs: Describe how you currently manage global programs for comparable clients, specifically how you ensure each country is fully utilizing all [Company Name]  contracted air, car and hotel programs (or leveraging any of TMC programs) for best Return-On-Investment to [Company Name] ?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 97.0
- **Region:** GLOBAL
- **Subcategory:** Air / Car / Hotel Relationships

**Metadata:**
```json
{
  "knowledge_id": "3.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.2'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Volume Incentive: Indicate your approach to supplier negotiated discounts.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 98.0
- **Region:** ---
- **Subcategory:** Air / Car / Hotel Relationships

**Metadata:**
```json
{
  "knowledge_id": "3.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.3'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Savings Plan: Describe your detailed strategic cost savings plan on the short term, mid-range, and long term for [Company Name] .  What items do you target for maximum cost savings results?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 99.0
- **Region:** ---
- **Subcategory:** Cost Savings Measures

**Metadata:**
```json
{
  "knowledge_id": "3.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.3'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Savings opportunities: Please describe how you can impact our savings strategies

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 100.0
- **Region:** ---
- **Subcategory:** Cost Savings Measures

**Metadata:**
```json
{
  "knowledge_id": "3.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.3'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** KPIs: As part of [Company Name]’s contractual agreement with any TMC, it is our intent to include performance metrics with financial impact based on the TMC’s performance measured against those Key Performance Indicators (KPI).  Please provide your model for including KPIs as measurements and how the attainment or lack thereof will impact financial cost.  Be specific to include the respective KPI, along with the standard for your particular organization.  Use the following as suggestions: customer satisfaction surveys, billing accuracy, accuracy and timeliness of air reservations, timely reporting, handling of customer service issues, and overall account management. Additional KPIs may be recommended.  Please detail the services you propose and financial incentive or penalty.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 101.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Response Time:  Describe your performance standards and response time with respect to resolving service issues.  How would you suggest integrating Survey Scores into a KPI?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 102.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Program Effectiveness: How do you measure your overall effectiveness in providing travel management services to your customers?  What do you try to achieve?  How do you rank the elements of success, and how do you measure them?

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 103.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Guarantees: Do you offer any quality assurance processes and guarantees?  If so, please explain them.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 104.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Service Quality: Describe metrics and retraining approach with agents

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 105.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Satisfaction Metric:  Indicate performance standard, means of collecting and availability frequency.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 106.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Program Management
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Phone Response: Indicate performance standards -- Include standard for on hold time and callbacks.

**Category:** Program Management

**Section:** General

**Additional Information:**

- **Count:** 107.0
- **Region:** ---
- **Subcategory:** Quality & Service Metrics

**Metadata:**
```json
{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "program-management",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "3.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '3.4'
);

-- TMC Question: General - Implementation
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Implementation Bond: TMC agrees to pay a penalty of USD $##,### if a mutually agreed upon implementation of services fails once the implementation process begins.

**Category:** Implementation

**Section:** General

**Additional Information:**

- **Count:** 108.0
- **Region:** ---
- **Subcategory:** Implementation

**Metadata:**
```json
{
  "knowledge_id": "4.0",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "implementation",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "4.0",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '4.0'
);

-- TMC Question: General - Implementation
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Implementation Plan: Please Include in your RFP response a detailed plan for implementing your services with  [Company Name] .  Be sure to include the following items -- a) Individuals responsible for implementation; b) Project Plan for implementation. Include timeline, roles and responsibilities to ensure a xxxxxx ##, 201# start date; c) Technology implementation schedule; d) Dependencies

**Category:** Implementation

**Section:** General

**Additional Information:**

- **Count:** 109.0
- **Region:** ---
- **Subcategory:** Implementation

**Metadata:**
```json
{
  "knowledge_id": "4.0",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "implementation",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "4.0",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '4.0'
);

-- TMC Question: General - Implementation
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Implementation Process: Provide a brief description of your new account implementation process.  How do you ensure a seamless transition?  What are some “lessons learned” from other global roll-outs?  How does your implementation process compare to your competitors?

**Category:** Implementation

**Section:** General

**Additional Information:**

- **Count:** 110.0
- **Region:** ---
- **Subcategory:** Implementation

**Metadata:**
```json
{
  "knowledge_id": "4.0",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "implementation",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "4.0",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '4.0'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Preferred Technology Suppliers: Describe your preferred supplier relationships with respect to GDS automation, OBT, office automation, desktop reporting systems, ERPs, expense management providers,  Include any additional industry related partners that are not listed.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 111.0
- **Region:** ---
- **Subcategory:** Technology Supplier Relationships

**Metadata:**
```json
{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.1'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** GDS - Which GDS will be used on our account?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 112.0
- **Region:** ---
- **Subcategory:** Technology Supplier Relationships

**Metadata:**
```json
{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.1'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** OBT -- Which OBT(s) will be used on our account?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 113.0
- **Region:** ---
- **Subcategory:** Technology Supplier Relationships

**Metadata:**
```json
{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.1'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** OBT -- With which OBT(s) does TMC have a reseller agreement?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 114.0
- **Region:** ---
- **Subcategory:** Technology Supplier Relationships

**Metadata:**
```json
{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.1'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** OBT - [Company Name] wishes to deploy XXX tool and [Company Name] does / does not have its own direct contract with XXX.  Will TMC support travelers / travel arranger with this tool?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 115.0
- **Region:** ---
- **Subcategory:** Technology Supplier Relationships

**Metadata:**
```json
{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.1'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Auto-Ticketing: Are you able to provide fully automated reservations and ticketing system capabilities for Air, Hotel, Car, Ground Transportation and Rail via phone, email, and an online booking tool for [Company Name]  employees, applicants and authorized consultants and guests?  Please explain.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 116.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Traditional Reservations: Describe the technology and process flow for telephonic reservations which you deploy to support customer transactions, including but not limited to: a) The agent desktop, including examples: such as mapping tools to find hotels in relation to an address, access to the web, email, customer satisfaction surveys, etc.; b) Profile creation and management and how it synchronizes with a self-booking tool-- please address why this process is efficient as well as safe from data theft, as well as how profiles are managed by the user; c) Scripting-- Provide examples of selling air, car and hotel scripts that would be best suited to support  [Company Name]'s program; d) Low fare searches, securing the best rate at a hotel or for a car rentals:  e) Web Fares: How do the agents access and book web airfares, non-GDS inventories (low cost carriers, consolidators), and hotel web rates?   How are reservations that are made on the web integrated into the PNR to be available for reporting and integration into Emergency response tracking: f) Seat checking/clearing lower fare waitlists; g) Scanning the GDS for lower fares and automatically re-issuing the tickets when savings are greater than change fee; h) Itinerary confirmations --What software do you use for Itineraries and to what extent can these itineraries be customized?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 117.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Online Booking Tools (OBTs): What is your experience with online booking tools?   How will your experience and tools help [Company Name]  to expand and advance the current self-booking program (considering our travel policy and requirement for all applications to reside outside the [Company Name]  intranet)?  Cite evidence of your ability to successfully support an online booking tool for large clients, and to rapidly achieve significant adoption rates.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 118.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** OBT:  Which OBTs are used in your TMC's client base?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** AeTM

**Section:** General

**Additional Information:**

- **Count:** 119.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-127",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-127",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-127'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Concur Travel

**Section:** General

**Additional Information:**

- **Count:** 120.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-128",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-128",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-128'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Cytric

**Section:** General

**Additional Information:**

- **Count:** 121.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-129",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-129",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-129'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** GetThere

**Section:** General

**Additional Information:**

- **Count:** 122.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-130",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-130",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-130'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** KDS

**Section:** General

**Additional Information:**

- **Count:** 123.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-131",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-131",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-131'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Nu Travel / TRX

**Section:** General

**Additional Information:**

- **Count:** 124.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-132",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-132",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-132'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Rearden Commerce

**Section:** General

**Additional Information:**

- **Count:** 125.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-133",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-133",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-133'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Proprietary

**Section:** General

**Additional Information:**

- **Count:** 126.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-134",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-134",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-134'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Other

**Section:** General

**Additional Information:**

- **Count:** 127.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-135",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-135",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-135'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** OBT Transactions: Online transaction percentage (vs. total TMC transactions)

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 128.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** OBT Adoption Rate: What is your average adoption rate for online booking for your customers broken down by global region (N.AMER, Latin America, Asia Pacific and EMEA)?  Please give the adoption rate as a percentage of total transactions.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 129.0
- **Region:** GLOBAL
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Online Booking Tool Reservations: Describe the technology and process flow for your online booking tool(s) which you deploy to support customer transactions, including but not limited to: a) The various functions available within the site-- examples: i. Booking of air, rail, car, hotel and shuttle services, ii. mapping tools to find hotels in relation to an address, iii. loading of [Company Name] locations for hotel searches, iv. feedback on the program and tool, v. access to [Company Name] 's policy, vi. ability to display not only reservations booked online, but also those booked offline, etc.; b) Profile creation and management -- Address why this process is efficient as well as compliant with[Company Name] 's IT requirements; c)  Subsites: Would[Company Name]  travelers have their own subsite?  Can [Company Name]  develop more than one subsite if specialized programs were needed such as candidate travel or third party travel?  Is there a cost associated with development of multiple subsites?  If so, please give an estimate for the associated costs; d) Languages -- How many different languages can be displayed on your booking tool?  What are those languages; e) Policy enforcement -examples:  Suppressing competing carriers at the market level; marking preferred carriers with an icon; messaging capabilities; reason codes; etc; f) Low fare searches, securing the best rate at a hotel or for a car rental; g) Web Fares -- How does the tool access and book web airfares, non-GDS inventories such as low cost carriers (LCC), consolidators and hotel web rates? Can you book Southwest (in the US) on your tool.  If so, how?  Explain other LCC solutions on your online booking tools; h) Itinerary confirmations / management

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 130.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Profile Synchronization - Via online tool(s) or other solution?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 131.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Itinerary Management - Is online itinerary management / trip display available? If so, please describe.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 132.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** E-Fulfillment Centers:  Identify your e-fulfillment centers by country, staffing and approximate annual transaction volume.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 133.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** E-Fulfillment Process: Would the counselors at your e-fulfillment centers use an administrative id to service online reservations made by [Company Name]  travelers?  If so, describe your process for managing logon ids when a travel counselor leaves your company.  Would the counselors at your e-fulfillment centers share an administrative id to service online reservations made by[Company Name]  travelers?  If so, describe your process for protecting [Company Name]  data when a travel counselor leaves your company or the [Company Name]  account.  Describe how your company would be able to determine which travel counselor had access to a particular reservation or profile at any given time.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 134.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Distribution Channels: How will your TMC mitigate risk around changing distribution channels and ensure long term relevance?  [Company Name]  has a preferred GDS supplier, who has a large presence in the US and Europe.  Where it makes sense to do so, would you be willing to book [Company Name] ’s travel through our preferred GDS supplier - xxxxx?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 135.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Web Fares: Define your global webfare strategy solution which integrates the Low Cost Carriers into your overall reservation process.  Low Cost Carriers continue to be a competitive cost option in many countries.  Identify the Low Cost Carriers in each global region that you have access to and what method you use to book and ticket these LCC's.  Identify the Low Cost Carriers in each global region that you do not have access to and why.  For example, how do you integrate Easy Jet, Ryan Air, etc. into your overall reservations process in EMEA?  What about Southwest and Jet Blue in the U.S.?  What about Kingfisher in India?  From the traveler’s perspective, how do these reservations differ from those made with legacy carriers?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 136.0
- **Region:** ---
- **Subcategory:** Operations Technology

**Metadata:**
```json
{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.2'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Portal:  Do you provide and maintain a customized client Corporate Travel portal?   How is it maintained?  How quickly can changes be made?  How many clients are currently using this portal?  Attach a screen shot of the home page to understand what features and capabilities the site would offer [Company Name] .

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 137.0
- **Region:** ---
- **Subcategory:** Innovation

**Metadata:**
```json
{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.3'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Mobile applications: Please describe the set of mobile travel applications you recommend for our travelers.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 138.0
- **Region:** ---
- **Subcategory:** Innovation

**Metadata:**
```json
{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.3'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Technology Strategy: Describe the technology strategy of your TMC. Include whether it is an internal process or outsourced to a third-party, the number of Full Time Equivalents (FTEs) dedicated to technical support, and the percentage of your overall workforce dedicated to technology research.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 139.0
- **Region:** ---
- **Subcategory:** Innovation

**Metadata:**
```json
{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.3'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** "Webtop" UI: Have you integrated browser based “Webtop” user interfaces into your technology solutions?  If so, please describe this process and how it would be integrated into [Company Name]'s program.

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 140.0
- **Region:** ---
- **Subcategory:** Innovation

**Metadata:**
```json
{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.3'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Tech Trends: How would you utilize the latest in technological trends to meet [Company Name]  requirements?   What recommendations would you make to benefit from new or future technologies in travel management?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 141.0
- **Region:** ---
- **Subcategory:** Innovation

**Metadata:**
```json
{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.3'
);

-- TMC Question: General - Technology
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Expense: Which expense management tools are supported?

**Category:** Technology

**Section:** General

**Additional Information:**

- **Count:** 142.0
- **Region:** ---
- **Subcategory:** Innovation

**Metadata:**
```json
{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "technology",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "5.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '5.3'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Data Consolidation: Describe how you currently manage global programs for comparable clients, specifically how you consolidate global data.  What is the timeframe for global data to be integrated?  What currency standards do you use to make sure true trending is not lost due to currency market fluctuations?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 143.0
- **Region:** GLOBAL
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Data Exports to Third-Parties (i.e. Traveler Tracking) [Company Name] licenses the web-based Traveler Locator Service (TLS) from xxxxxx for purposes of tracking travelers in times of emergency or crisis.  [Company Name] ’s U.S. travel management company feeds transaction data to xxxxxx throughout the day and COMPANY can then access TLS and search for [Company Name]  travelers 24 hours a day, 7 days a week.  Please indicate whether your company has worked with xxxxxx in this capacity and if so, from which countries your company has passed transaction data and from which GDS systems.  If your company has not worked with xxxxxx, would you be willing to undertake whatever is necessary to queue data to  xxxxxx?  ([Company Name]  realizes there may be some restrictions on data transfer in certain countries.  The desire to provide transaction data to xxxxxxxxx is to do so in as many locations possible.)

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 144.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Hierarchy:  Describe your ability to provide accurate data based on [Company Name] 's organizational hierarchy as referenced in the Reporting Requirements section of Appendix C.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 145.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Hierarchy data: How do you manage the storage of employee cost center (hierarchy) data?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 146.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Post-Trip Availability: Describe how you would provide consolidated data to [Company Name] .  How soon is fully-reconciled data available (i.e. 15 days after end of the month, etc.?)  Can the consolidated data be broken out by Region?  Country?  Business unit?  Traveler?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 147.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Post-trip / Fully Reconciled Data Availability -  How soon after month's end will the fully reconciled travel data be available to be viewed / analyzed? 

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 148.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Pre-trip Data Availability -  How soon after an online or traditional transaction is ended will pre-trip data be available to be viewed / analyzed? 

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 149.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.1'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Reporting Requirements: Describe all available reporting and applications available for pre-trip, traveler tracking, security, post-trip, compliance, etc., including timing, availability, means of accessing information, etc.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 150.0
- **Region:** ---
- **Subcategory:** Data Consolidation

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Samples:  Attach samples of reports listed in Appendix C.  Provide any other samples that you feel are beneficial to your clients.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 151.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Extracts: Are all your reports (standard and ad hoc) able to be read and/or manipulated in Microsoft Excel  (preferred for some reports such as market share reports) or provided in .pdf format (preferred for other report formats such as Executive Summaries?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 152.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** AdHoc Reporting: Describe your ability to provide ad hoc reporting to [Company Name] .

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 153.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Reporting Access: Describe your capabilities for providing [Company Name]  direct access to the data and/or data feeds.  Do you provide your customers with reporting tools that allow for standard, custom, and ad hoc reporting to be done by the customer?  If so, please explain in detail.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 154.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Exception Reporting: Indicate your ability to identify [Company Name]  policy exceptions, including travelers refusing low fares in violation of travel policy; travelers booking air without car and hotel, travelers not booking preferred hotel suppliers; travelers not booking preferred rental car supplier.  Describe your ability to identify above exceptions on a PRE TRIP and POST TRIP basis.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 155.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Supplier Reporting: Describe your capabilities to support airline and/or hotel negotiations and compliance.  Specifically, reports should include actual expense and market share, service potential, utilization, overlap and exclusive city pairs.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 156.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Savings Reporting: When reporting savings on airfare, please describe your company’s ability to do the following -- a)  Report savings as the difference between lowest logical fare and contracted fare; b) Report savings as the difference between the fare purchased and the next lowest logical fare; c) Report savings lost. If so, how?; d) Can you calculate savings lost based on the lowest logical fare that was available?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 157.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Other Reports / Analyses: Describe any other reports and/or analyses you recommend to support COMPANY traveler programs including air, hotel and car rental.

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 158.0
- **Region:** ---
- **Subcategory:** Reporting

**Metadata:**
```json
{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.2'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** PCI Compliance - Is your TMC PCI compliant? If not compliant today, when will TMC be compliant

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 159.0
- **Region:** ---
- **Subcategory:** Data Privacy & Security

**Metadata:**
```json
{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.3'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Data Privacy - Is your TMC prepared to safeguard [Company Name]'s data privacy interests (i.e., protect confidential company and traveler data)?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 160.0
- **Region:** ---
- **Subcategory:** Data Privacy & Security

**Metadata:**
```json
{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.3'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Data Protection: Data protection is of critical importance at [Company Name] .  When complying with [Company Name] ’s Standard Terms & Conditions, how is your TMC prepared to safeguard [Company Name] 's data privacy interests (i.e. protect confidential company and traveler data)?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 161.0
- **Region:** ---
- **Subcategory:** Data Privacy & Security

**Metadata:**
```json
{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.3'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Data Privacy: Describe your data privacy and security processes.  How long do you store personal information?  How long do you store transaction data?  What is your process for deleting profiles for travelers who are no longer employees of your corporate clients?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 162.0
- **Region:** ---
- **Subcategory:** Data Privacy & Security

**Metadata:**
```json
{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.3'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Data Privacy - Is your TMC prepared to safeguard [Company Name]'s data privacy interests (i.e., protect confidential company and traveler data)?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 163.0
- **Region:** ---
- **Subcategory:** Data Privacy & Security

**Metadata:**
```json
{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.3'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Disaster Recovery - Does your TMC have disaster recovery plans in place for web-hosting environment?

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 164.0
- **Region:** ---
- **Subcategory:** Business Continuity

**Metadata:**
```json
{
  "knowledge_id": "6.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.4'
);

-- TMC Question: General - Data / Security / Disaster Recovery
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Disaster Recovery / Business Continuity: Describe your disaster recovery / business continuity strategies to ensure uninterrupted service in the event of an emergency.  (For example, describe your strategies if you have a central reservation center in a city and an earthquake, tornado or other natural disaster strikes.)

**Category:** Data / Security / Disaster Recovery

**Section:** General

**Additional Information:**

- **Count:** 165.0
- **Region:** ---
- **Subcategory:** Business Continuity

**Metadata:**
```json
{
  "knowledge_id": "6.4",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "data-security-disaster-recovery",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "6.4",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '6.4'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Outsourced Air Program Management: TMC agrees to provide services that include the ability to negotiate best fares on behalf of  [Company Name] , ensure program is being managed and implemented by the agency correctly,  provide ongoing market analysis to ensure [Company Name]  receives the most competitive pricing as market conditions change and provide supplier implementation management.  This includes being the key contact for all supplier interactions.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 166.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Air Program: Define your program offering for outsourcing of [Company Name]'s Contracted Airline Program on both a domestic and global level.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 167.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Airline Program Outsourcing Technology: Indicate technologies used, support staff and available resources, and other pertinent information.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 168.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Airline Program Cost Effectiveness: Provide information regarding the cost effectiveness of your program and how you propose to assist [Company Name] to reduce its overall airline travel costs.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 169.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Airline Program Expertise: Include an overview of your expertise in this area and provide references for your services.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 170.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Airline Program Pricing: Include an overview of pricing for this program.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 171.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Outsourced Hotel Program Management: Provide an overview of TMC's capabilities and recommendations for [Company Name] -- Services should include the ability to negotiate best rates on behalf of [Company Name] , ensure rate loading is done accurately and timely by hotels, meet a January 1 yearly / biannual completion date, assure [Company Name]  is receiving the best rates, provide a real-time web-based directory, etc.  This includes being the key contact for all hotel supplier interactions and general inquiries.  As part of your outsourced hotel program management, you will provide [Company Name]  with regional specialists.  These regional specialists would provide on-going market and industry expertise, and would be responsible for full RFP management, program implementation, and maintenance. At a minimum, the specialists would be required to provide on-going program analysis, benchmarking and recommendations to improve the program's effectiveness.   The specialists would be contacts who manage hotelier and traveler interaction on behalf of [Company Name]  and provide agency training.  [Company Name]  reserves the right to request that the program be renegotiated (globally or regionally) mid-year or as market conditions change.[Company Name]  may require a reverse auction be performed for the entire RFP or opportunity markets. Conversely, [Company Name]  may choose to extend agreements where possible and eliminate a large portion of the annual RFP workload. The web-based directory must reside on the TMC's server and be updated within a minimum of 1 Business day notice.  This directory must be accessible to travelers (even when using the online booking tool) as well as to the travel agents/ counselors. TMCs are required to provide quarterly cost saving reports as well as other reports to monitor and benchmark the program against other TMC clients.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 172.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Hotel Program Definition: Currently, [Company Name]sends out roughly ###  hotel RFPs annually, and accepts about ### properties into its program.  Define the program offered for the outsourcing of  [Company Name]'s Contracted Hotel Program on both a domestic and a global level.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 173.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Hotel Program Technology: Indicate technologies used, support staff and available resources, and other pertinent information to support global travel program outsourcing.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 174.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Hotel Program Effectiveness: Provide information regarding the cost effectiveness of your program and how you propose to help [Company Name] to reduce its overall hotel rates.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 175.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Hotel Program Compliance: [Company Name]’s compliance rate for the use of contracted hotels is increasing, but could be a lot better.  Describe your company’s process for increasing compliance with the hotel program.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 176.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Hotel Program Compliance Reporting: What type of policy compliance and other reporting capabilities can you provide to [Company Name](detail and summary)?   For example, can you report on compliance of hotel booking made by agency (overnight air without a hotel booking)?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 177.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC Hotel Program:  Describe your negotiated hotel rate program and how it could compliment [Company Name]'s contracted program.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 178.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Web-Based Hotel Directory: What is your TMC's best solution to provide a web-based global hotel directory?  List directory features and define advantages to your directory.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 179.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Hotel Program Savings: What is your recommended process to gather and report on global cost savings and loss savings?  Include an overview of your expertise in this area and provide references for your services.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 180.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Hotel Program Pricing: Include an overview of pricing for this program.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 181.0
- **Region:** ---
- **Subcategory:** Procurement & Consulting

**Metadata:**
```json
{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.1'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Management: Describe your capabilities for handling group air only (for a meeting or event).

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 182.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Offerings: What specific service offerings can you bring to [Company Name] in this area and how would you deploy them?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 183.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Technology: What related technology solutions can you provide?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 184.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Fares: What actions do you take to find the best airfare for groups?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 185.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Opportunity Identification: How do you identify group air opportunities when travelers are going through your central desk (corporate travel)?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 186.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Group Air Management for Multiple TMCs: If more than one TMC is selected for different regions, how do you propose managing group air for travelers from multiple regions?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 187.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Management Solution: What do you propose as a best-in-class solution for group air?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 188.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Savings: What is a best practice for determining “Cost Savings” for Group Air, and what are your savings estimates ( in %) for [Company Name] from your proposed solutions?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 189.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Group Air Additional Services: What additional services (for corporate individual travel) do you offer for group air?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 190.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Arrival & Departure Manifests:  Do you provide arrival and departure manifests?  Please provide a sample.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 191.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Group Air Pricing: How do you price your services for group air?

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 192.0
- **Region:** ---
- **Subcategory:** Meeting & Incentive

**Metadata:**
```json
{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.2'
);

-- TMC Question: General - Additional Services
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** CSR Initiatives:  Please describe all CSR initiatives in place with your company.  Include descriptions of programs, length and successes.

**Category:** Additional Services

**Section:** General

**Additional Information:**

- **Count:** 193.0
- **Region:** ---
- **Subcategory:** CSR Initiatives

**Metadata:**
```json
{
  "knowledge_id": "7.3",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "additional-services",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "7.3",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '7.3'
);

-- TMC Question: General - Administrative
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Provide the contact details for the person who will be handling this proposal     ---                Name 

**Category:** Administrative

**Section:** General

**Additional Information:**

- **Count:** 194.0
- **Region:** ---
- **Subcategory:** Contact

**Metadata:**
```json
{
  "knowledge_id": "8.1",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "administrative",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "8.1",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '8.1'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Mailing address

**Section:** General

**Additional Information:**

- **Count:** 195.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-203",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-203",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-203'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Email address

**Section:** General

**Additional Information:**

- **Count:** 196.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-204",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-204",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-204'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Office phone number

**Section:** General

**Additional Information:**

- **Count:** 197.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-205",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-205",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-205'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Mobile phone number

**Section:** General

**Additional Information:**

- **Count:** 198.0

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-206",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-206",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-206'
);

-- TMC Question: General - Administrative
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Proposal Validity Obligation - Is it agreed that answers & information provided in your TMC's proposal response shall form the basis of the TMC services contract with [Company Name]?

**Category:** Administrative

**Section:** General

**Additional Information:**

- **Count:** 199.0
- **Region:** ---
- **Subcategory:** Offer / Pricing Validity

**Metadata:**
```json
{
  "knowledge_id": "8.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "administrative",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "8.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '8.2'
);

-- TMC Question: General - Administrative
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Proposal Validity Period - Number of days after submission date that information remains valid

**Category:** Administrative

**Section:** General

**Additional Information:**

- **Count:** 200.0
- **Region:** ---
- **Subcategory:** Offer / Pricing Validity

**Metadata:**
```json
{
  "knowledge_id": "8.2",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "administrative",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "8.2",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '8.2'
);

-- TMC Question: General - Appendix A: Travel Policy
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC must agree to adhere to and promote [Company Name] 's Travel Policy.  The policy can be found in  Appendix A: Travel Policy.  [Note: Buyer to attach sample]

**Category:** Appendix A: Travel Policy

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-210",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "appendix-a-travel-policy",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-210",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-210'
);

-- TMC Question: General - Appendix B: IT and  Data Security Requirements
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC must read and agree to the requirements set forth in Appendix B: IT and Data Security Requirements document attached to this question. [Note: Buyer to attach sample based on company IT and data requirements]

**Category:** Appendix B: IT and  Data Security Requirements

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-211",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "appendix-b-it-and-data-security-requirements",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-211",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-211'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC must review the Password Requirements document attached to this question, and in the response section indicate which of those requirements you are currently able to meet as it relates to any technology that would require an [Company Name]  employee to login.   [Note: Buyer to attach sample based on company IT and data requirements]

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-212",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-212",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-212'
);

-- TMC Question: General - Appendix C: Reporting Requirements
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** TMC must read and agree to the requirements set forth in the Appendix C: Reporting Requirements  [Note: Buyer to attach sample]

**Category:** Appendix C: Reporting Requirements

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-213",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "appendix-c-reporting-requirements",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-213",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-213'
);

-- TMC Question: General - Appendix D: Product Requirements
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** EXAMPLE -- On-line Reservation System Requirements:  Your TMC must read and agree to all of the requirements set forth in Appendix D: On-Line Reservation System Requirements  [Note: Buyer to attach sample]

**Category:** Appendix D: Product Requirements

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-214",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "appendix-d-product-requirements",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-214",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-214'
);

-- TMC Question: General - Appendix E: Pricing
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Your TMC must complete the [Company Name]  TMC RFP Pricing Matrix.xls worksheet attached to this question.  The first tab contains instructions for completing the worksheet.  Once you have completed the [Company Name]  TMC RFP Pricing Matrix, respond 'Complete' to this question, and attach the completed worksheet to this RFP.

**Category:** Appendix E: Pricing

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-215",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "appendix-e-pricing",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-215",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-215'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:**  Identify any and all other costs you expect [Company Name]  to pay in addition to the transaction fees. No additional fees will be accepted unless agreed to in writing by both parties once an agreement is signed.

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-216",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-216",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-216'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Based on [Company Name] 's current transaction levels as identified in the Country Matrix,  propose an earned volume discount schedule for the term of the agreement based on increased transactions. We invite win-win options and creativity in this section.  Be sure to include: What are the proposed thresholds? How is this incentive broken down by Country/Region? Provide very Specific examples of how this would work.

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-master-question-list-217",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Master Question List",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "master-question-list",
    "master-question-list"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-master-question-list-217",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-master-question-list-217'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Transaction Fees with other conditions or bases, such as different fee levels based on sector numbers, may be deemed non-compliant.

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-sheet1-5",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Sheet1",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "sheet1",
    "sheet1"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-sheet1-5",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-sheet1-5'
);

-- TMC Question: General
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmc_tender_agentknowledgebase_20251118083105$**Question:** Trans-Tasman bookings are treated as domestic bookings for the purpose of fees charged.

**Section:** General

**Metadata:**
```json
{
  "knowledge_id": "tmc-question-sheet1-6",
  "category": "tmc-rfp-questions",
  "section": "General",
  "sheet": "Sheet1",
  "importance": 0.85,
  "tags": [
    "tmc",
    "rfp-questions",
    "sheet1",
    "sheet1"
  ]
}
```$kb_tmc_tender_agentknowledgebase_20251118083105$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-question-sheet1-6",
  "category": "tmc-rfp-questions",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-question-sheet1-6'
);

-- Verify insertions
SELECT 
  memory_type,
  metadata->>'knowledge_id' as knowledge_id,
  metadata->>'category' as category,
  LEFT(content, 100) as content_preview,
  importance_score,
  created_at
FROM account_memories
WHERE memory_type = 'knowledge'
  AND metadata->>'knowledge_id' IN ('tmc-question-instructions-2', 'tmc-question-category-list-1', 'tmc-question-category-list-3', 'tmc-question-category-list-5', 'tmc-question-category-list-6', 'tmc-question-category-list-7', 'tmc-question-category-list-8', 'tmc-question-category-list-9', 'tmc-question-category-list-10', 'tmc-question-category-list-11', 'tmc-question-category-list-12', 'tmc-question-category-list-13', 'tmc-question-category-list-14', 'tmc-question-category-list-16', 'tmc-question-category-list-17', 'tmc-question-category-list-18', 'tmc-question-category-list-19', 'tmc-question-category-list-20', 'tmc-question-category-list-21', 'tmc-question-category-list-23', 'tmc-question-category-list-24', 'tmc-question-category-list-25', 'tmc-question-category-list-26', 'tmc-question-category-list-27', 'tmc-question-category-list-29', 'tmc-question-category-list-31', 'tmc-question-category-list-32', 'tmc-question-category-list-33', 'tmc-question-category-list-34', 'tmc-question-category-list-36', 'tmc-question-category-list-37', 'tmc-question-category-list-38', 'tmc-question-category-list-39', 'tmc-question-category-list-40', 'tmc-question-category-list-42', 'tmc-question-category-list-43', 'tmc-question-category-list-44', 'tmc-question-category-list-45', 'tmc-question-category-list-47', 'tmc-question-category-list-48', 'tmc-question-category-list-49', 'tmc-question-category-list-51', 'tmc-question-category-list-52', 'tmc-question-category-list-53', 'tmc-question-category-list-54', 'tmc-question-category-list-55', 'tmc-question-category-list-56', 'tmc-question-category-list-57', 'tmc-question-category-list-60', '0.0', '1.1', '1.1', 'tmc-question-master-question-list-4', 'tmc-question-master-question-list-5', 'tmc-question-master-question-list-6', 'tmc-question-master-question-list-7', '1.1', 'tmc-question-master-question-list-9', 'tmc-question-master-question-list-10', 'tmc-question-master-question-list-11', 'tmc-question-master-question-list-12', 'tmc-question-master-question-list-13', '1.2', '1.3', '1.4', '1.5', 'tmc-question-master-question-list-18', 'tmc-question-master-question-list-19', 'tmc-question-master-question-list-20', 'tmc-question-master-question-list-21', '1.5', 'tmc-question-master-question-list-23', 'tmc-question-master-question-list-24', 'tmc-question-master-question-list-25', 'tmc-question-master-question-list-26', 'tmc-question-master-question-list-27', '1.5', 'tmc-question-master-question-list-29', 'tmc-question-master-question-list-30', '1.6', '1.7', '1.7', '1.7', '1.8', '1.9', 'tmc-question-master-question-list-37', 'tmc-question-master-question-list-38', 'tmc-question-master-question-list-39', 'tmc-question-master-question-list-40', 'tmc-question-master-question-list-41', '1.9', '2.1', '2.1', 'tmc-question-master-question-list-45', 'tmc-question-master-question-list-46', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.1', '2.2', '2.2', '2.2', '2.2', '2.2', '2.2', '2.2', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.3', '2.4', '2.4', '2.5', '2.5', '2.5', '2.5', '2.5', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.1', '3.2', '3.2', '3.3', '3.3', '3.3', '3.4', '3.4', '3.4', '3.4', '3.4', '3.4', '3.4', '4.0', '4.0', '4.0', '5.1', '5.1', '5.1', '5.1', '5.1', '5.2', '5.2', '5.2', '5.2', 'tmc-question-master-question-list-127', 'tmc-question-master-question-list-128', 'tmc-question-master-question-list-129', 'tmc-question-master-question-list-130', 'tmc-question-master-question-list-131', 'tmc-question-master-question-list-132', 'tmc-question-master-question-list-133', 'tmc-question-master-question-list-134', 'tmc-question-master-question-list-135', '5.2', '5.2', '5.2', '5.2', '5.2', '5.2', '5.2', '5.2', '5.2', '5.3', '5.3', '5.3', '5.3', '5.3', '5.3', '6.1', '6.1', '6.1', '6.1', '6.1', '6.1', '6.1', '6.2', '6.2', '6.2', '6.2', '6.2', '6.2', '6.2', '6.2', '6.2', '6.3', '6.3', '6.3', '6.3', '6.3', '6.4', '6.4', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.1', '7.2', '7.2', '7.2', '7.2', '7.2', '7.2', '7.2', '7.2', '7.2', '7.2', '7.2', '7.3', '8.1', 'tmc-question-master-question-list-203', 'tmc-question-master-question-list-204', 'tmc-question-master-question-list-205', 'tmc-question-master-question-list-206', '8.2', '8.2', 'tmc-question-master-question-list-210', 'tmc-question-master-question-list-211', 'tmc-question-master-question-list-212', 'tmc-question-master-question-list-213', 'tmc-question-master-question-list-214', 'tmc-question-master-question-list-215', 'tmc-question-master-question-list-216', 'tmc-question-master-question-list-217', 'tmc-question-sheet1-5', 'tmc-question-sheet1-6')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';
