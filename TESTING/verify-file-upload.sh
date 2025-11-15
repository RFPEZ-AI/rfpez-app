#!/bin/bash

# Database verification script for file uploads
# Checks database state after file upload testing

echo "================================================"
echo "File Upload Database Verification"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Check all file metadata is populated
echo -e "${YELLOW}1. Checking file metadata completeness...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  COUNT(*) as total_files,
  COUNT(file_name) as has_filename,
  COUNT(file_type) as has_filetype,
  COUNT(file_size_bytes) as has_size,
  COUNT(mime_type) as has_mimetype,
  COUNT(embedding) as has_embedding,
  ROUND(AVG(file_size_bytes)::numeric, 0) as avg_file_size_bytes
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL;
"

# 2. Check embedding dimensions
echo ""
echo -e "${YELLOW}2. Verifying embedding dimensions (should be 1024)...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_name,
  file_type,
  array_length(embedding::real[], 1) as embedding_dimensions,
  CASE 
    WHEN array_length(embedding::real[], 1) = 1024 THEN '✓ Valid'
    ELSE '✗ Invalid'
  END as status
FROM account_memories
WHERE memory_type = 'knowledge' 
  AND file_name IS NOT NULL 
  AND embedding IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
"

# 3. Check file type distribution
echo ""
echo -e "${YELLOW}3. File type distribution...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_type,
  COUNT(*) as count,
  ROUND(SUM(file_size_bytes)::numeric / 1024, 2) as total_kb,
  ROUND(AVG(file_size_bytes)::numeric / 1024, 2) as avg_kb
FROM account_memories
WHERE memory_type = 'knowledge' AND file_type IS NOT NULL
GROUP BY file_type
ORDER BY count DESC;
"

# 4. Show sample content
echo ""
echo -e "${YELLOW}4. Sample file content (first 100 chars)...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_name,
  LEFT(content, 100) as content_preview,
  LENGTH(content) as content_length
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;
"

# 5. Check indexes are present
echo ""
echo -e "${YELLOW}5. Verifying indexes...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'account_memories'
  AND indexname LIKE '%file%' OR indexname LIKE '%embedding%'
ORDER BY indexname;
"

# 6. Test vector search function
echo ""
echo -e "${YELLOW}6. Testing vector search function...${NC}"
SAMPLE_EMBEDDING=$(docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -t -c "
SELECT embedding::text 
FROM account_memories 
WHERE embedding IS NOT NULL 
LIMIT 1;
")

if [ ! -z "$SAMPLE_EMBEDDING" ]; then
    echo "Running semantic search with sample embedding..."
    docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
    SELECT 
      file_name,
      file_type,
      ROUND(similarity::numeric, 4) as similarity_score,
      LEFT(content, 50) as preview
    FROM match_account_memories(
      query_embedding := (SELECT embedding FROM account_memories WHERE embedding IS NOT NULL LIMIT 1),
      match_threshold := 0.5,
      match_count := 5
    )
    ORDER BY similarity DESC;
    "
else
    echo -e "${RED}No embeddings found. Cannot test vector search.${NC}"
fi

# 7. Check for orphaned records (files without embeddings after 1 minute)
echo ""
echo -e "${YELLOW}7. Checking for files missing embeddings (older than 1 minute)...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_name,
  file_type,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_since_upload
FROM account_memories
WHERE memory_type = 'knowledge' 
  AND file_name IS NOT NULL 
  AND embedding IS NULL
  AND created_at < NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;
"

# 8. Show embedding generation statistics
echo ""
echo -e "${YELLOW}8. Embedding generation statistics...${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  COUNT(*) as total_knowledge_files,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as embedded,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as pending,
  ROUND(
    (COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END)::numeric / 
     NULLIF(COUNT(*)::numeric, 0) * 100), 
    2
  ) as embedded_percentage
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database verification complete!${NC}"
echo -e "${GREEN}========================================${NC}"
