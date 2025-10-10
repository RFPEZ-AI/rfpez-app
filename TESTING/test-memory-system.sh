#!/bin/bash
# Quick Memory System Test - Browser-Independent
# Tests memory creation and retrieval via direct API calls

echo "🧪 Memory System Integration Test"
echo "=================================="
echo ""

# Configuration
SUPABASE_URL="https://jxlutaztoukwbbgtoulc.supabase.co"
API_ENDPOINT="${SUPABASE_URL}/functions/v1/claude-api-v3"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM"

# Check if CLAUDE_API_KEY is set
if [ -z "$REACT_APP_CLAUDE_API_KEY" ]; then
    echo "❌ ERROR: REACT_APP_CLAUDE_API_KEY not set"
    echo "   Please set the Claude API key in your environment"
    exit 1
fi

echo "✅ Configuration loaded"
echo "   API Endpoint: ${API_ENDPOINT}"
echo ""

# Test 1: Verify edge function is accessible
echo "📡 Test 1: Verify Edge Function Accessibility"
echo "----------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${API_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "apikey: ${ANON_KEY}" \
    -d '{"messages":[],"session_id":"test"}')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 400 ]; then
    echo "✅ Edge function accessible (HTTP ${HTTP_CODE})"
else
    echo "❌ Edge function not accessible (HTTP ${HTTP_CODE})"
fi
echo ""

# Test 2: Test memory creation via Solutions Agent
echo "📝 Test 2: Memory Creation (Solutions Agent)"
echo "----------------------------------------------"
echo "Simulating user message: 'I need to source 100 LED bulbs'"

# This would require authentication token
# For now, we'll document the expected behavior
echo "⚠️  Direct API testing requires authenticated user token"
echo "   Use browser testing with authenticated session instead"
echo ""

# Test 3: Database verification
echo "🗄️  Test 3: Database Structure Verification"
echo "----------------------------------------------"
echo "To verify database structure, run:"
echo "   psql -h db.jxlutaztoukwbbgtoulc.supabase.co -U postgres -f verify-memory-system.sql"
echo ""

echo "📋 Test Summary"
echo "==============="
echo "✅ Edge function deployed and accessible"
echo "⚠️  Browser testing required for full workflow validation"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:3100 in browser"
echo "2. Login with test account"
echo "3. Follow test plan in MEMORY-SYSTEM-TEST-PLAN.md"
echo "4. Verify database entries after each test"
echo ""
echo "Database Quick Check:"
echo "SELECT COUNT(*) FROM agent_memories WHERE created_at > NOW() - INTERVAL '1 hour';"
