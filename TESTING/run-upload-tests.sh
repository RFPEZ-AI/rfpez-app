#!/bin/bash

# File Upload & Knowledge Base Testing Script
# This script helps verify the file upload feature is working correctly

echo "================================================"
echo "File Upload & Knowledge Base Testing Utility"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase is running
echo -e "${YELLOW}Checking Supabase status...${NC}"
if docker ps | grep -q "supabase_db_rfpez-app-local"; then
    echo -e "${GREEN}✓ Supabase is running${NC}"
else
    echo -e "${RED}✗ Supabase is not running. Start it with: supabase start${NC}"
    exit 1
fi

# Check if dev server is accessible
echo -e "${YELLOW}Checking dev server...${NC}"
if curl -s http://localhost:3100 > /dev/null; then
    echo -e "${GREEN}✓ Dev server is running on port 3100${NC}"
else
    echo -e "${RED}✗ Dev server is not accessible. Start it with VS Code task: 'Start Development Server'${NC}"
    exit 1
fi

# Check database schema
echo ""
echo -e "${YELLOW}Verifying database schema...${NC}"
FILE_COLUMNS=$(docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -t -c "\d account_memories" | grep -E "file_name|file_type|file_size|mime_type" | wc -l)
if [ "$FILE_COLUMNS" -ge 4 ]; then
    echo -e "${GREEN}✓ File support columns exist${NC}"
else
    echo -e "${RED}✗ File columns missing. Run: supabase migration up${NC}"
    exit 1
fi

# Check vector search function
echo -e "${YELLOW}Checking vector search function...${NC}"
FUNCTION_EXISTS=$(docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -t -c "\df match_account_memories" | grep -c "match_account_memories")
if [ "$FUNCTION_EXISTS" -ge 1 ]; then
    echo -e "${GREEN}✓ match_account_memories function exists${NC}"
else
    echo -e "${RED}✗ Vector search function missing. Run: supabase migration up${NC}"
    exit 1
fi

# Count existing knowledge files
echo ""
echo -e "${YELLOW}Current knowledge base status:${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  COUNT(*) as total_files,
  COUNT(embedding) as files_with_embedding,
  COUNT(CASE WHEN file_type = 'text' THEN 1 END) as text_files,
  COUNT(CASE WHEN file_type = 'image' THEN 1 END) as image_files,
  COUNT(CASE WHEN file_type = 'document' THEN 1 END) as document_files
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL;
"

# Show recent files
echo ""
echo -e "${YELLOW}Most recent uploaded files:${NC}"
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_name,
  file_type,
  file_size_bytes,
  CASE 
    WHEN embedding IS NULL THEN 'Pending'
    ELSE 'Generated'
  END as embedding_status,
  created_at
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Pre-flight checks complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Test files available in: TESTING/test-files/"
echo "  - product-specs.txt (Product information)"
echo "  - remote-work-policy.md (Company policy)"
echo "  - meeting-notes.txt (Meeting summary)"
echo ""
echo "Testing guide: TESTING/file-upload-knowledge-base-testing-guide.md"
echo ""
echo "Manual Testing Steps:"
echo "1. Open http://localhost:3100 in browser"
echo "2. Log in with: mskiba@esphere.com / thisisatest"
echo "3. Create new session"
echo "4. Click paperclip icon"
echo "5. Upload test file"
echo "6. Open browser console (F12) to see logs"
echo "7. Wait 10 seconds for embedding generation"
echo "8. Ask question about file content"
echo "9. Verify Claude's response uses the file"
echo ""
echo "Database Verification:"
echo "  ./TESTING/verify-file-upload.sh"
echo ""
