#!/bin/bash

# Script to check RFP questionnaire responses in the database
# This script helps validate that form submissions were saved correctly

echo "=== RFP Questionnaire Response Checker ==="
echo ""

# Check if we have psql available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    echo "   You can also check the data using Supabase dashboard or another SQL client."
    exit 1
fi

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ DATABASE_URL or SUPABASE_DB_URL environment variable not set"
    echo "   Please set one of these variables with your database connection string"
    echo "   Example: export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    exit 1
fi

# Use the appropriate database URL
DB_URL=${DATABASE_URL:-$SUPABASE_DB_URL}

echo "🔍 Checking RFP questionnaire responses..."
echo ""

# Query to check recent RFP questionnaire responses
psql "$DB_URL" << 'EOF'
-- Check RFPs with questionnaire responses
SELECT 
    id,
    name,
    CASE 
        WHEN buyer_questionnaire_response IS NOT NULL THEN '✅ HAS RESPONSE'
        ELSE '❌ NO RESPONSE'
    END as response_status,
    CASE 
        WHEN buyer_questionnaire_response IS NOT NULL THEN 
            jsonb_pretty(buyer_questionnaire_response)
        ELSE 'No response data'
    END as response_data,
    updated_at
FROM rfps 
ORDER BY updated_at DESC 
LIMIT 10;

-- Summary of RFPs with responses
SELECT 
    COUNT(*) as total_rfps,
    COUNT(buyer_questionnaire_response) as rfps_with_responses,
    ROUND(
        (COUNT(buyer_questionnaire_response)::float / COUNT(*)::float) * 100, 
        2
    ) as response_percentage
FROM rfps;
EOF

echo ""
echo "✅ Query completed!"
echo ""
echo "📋 What to look for:"
echo "   - Recent RFPs should show '✅ HAS RESPONSE' if form was submitted"
echo "   - The response_data column shows the actual form data as JSON"
echo "   - Check the updated_at timestamp to confirm recent submissions"
echo ""
echo "🔧 Alternative methods to check:"
echo "   1. Use Supabase Dashboard (if using Supabase)"
echo "   2. Check browser console logs for submission messages"
echo "   3. Look for success/error alerts in the UI"
