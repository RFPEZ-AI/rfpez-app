#!/bin/bash

# Real-time monitoring script for file upload testing
# Run this in a separate terminal while testing to watch database updates live

echo "================================================"
echo "File Upload Live Monitor"
echo "================================================"
echo ""
echo "This script monitors the account_memories table for new uploads"
echo "Press Ctrl+C to stop"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check for new files
check_uploads() {
    TIMESTAMP=$(date '+%H:%M:%S')
    echo -e "${BLUE}[$TIMESTAMP] Checking for uploads...${NC}"
    
    docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -t -c "
    SELECT 
        TO_CHAR(created_at, 'HH24:MI:SS') as time,
        file_name,
        file_type,
        ROUND(file_size_bytes::numeric / 1024, 1) as kb,
        CASE 
            WHEN embedding IS NULL THEN 'Pending'
            ELSE 'Generated (' || array_length(embedding::real[], 1) || ' dims)'
        END as embedding_status
    FROM account_memories
    WHERE memory_type = 'knowledge' 
      AND file_name IS NOT NULL
      AND created_at > NOW() - INTERVAL '5 minutes'
    ORDER BY created_at DESC;
    " | grep -v "^$" || echo "  (no recent uploads)"
    
    echo ""
}

# Initial check
echo -e "${YELLOW}Starting monitor... Watching for files uploaded in last 5 minutes${NC}"
echo ""
check_uploads

# Monitor every 3 seconds
while true; do
    sleep 3
    check_uploads
done
