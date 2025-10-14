#!/bin/bash
# Test deployed edge functions
# Usage: ./test-edge-functions.sh

set -e

SUPABASE_URL="https://jxlutaztoukwbbgtoulc.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM"

echo "🧪 Testing Edge Functions Deployment"
echo "====================================="
echo ""

# Test 1: Claude API v3
echo "1️⃣  Testing claude-api-v3..."
echo "   Endpoint: ${SUPABASE_URL}/functions/v1/claude-api-v3"

CLAUDE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/functions/v1/claude-api-v3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "messages": [{"role": "user", "content": "respond with just the word OK"}],
    "max_tokens": 10
  }' \
  --max-time 30)

HTTP_CODE=$(echo "$CLAUDE_RESPONSE" | tail -n1)
BODY=$(echo "$CLAUDE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Status: $HTTP_CODE"
    echo "   ✅ Response received (truncated):"
    echo "$BODY" | jq -r '.content // .error // .' | head -c 200
    echo ""
else
    echo "   ❌ Status: $HTTP_CODE"
    echo "   ❌ Error:"
    echo "$BODY" | jq '.' || echo "$BODY"
    exit 1
fi

echo ""

# Test 2: Supabase MCP Server
echo "2️⃣  Testing supabase-mcp-server..."
echo "   Endpoint: ${SUPABASE_URL}/functions/v1/supabase-mcp-server"

MCP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/functions/v1/supabase-mcp-server" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }' \
  --max-time 30)

HTTP_CODE=$(echo "$MCP_RESPONSE" | tail -n1)
BODY=$(echo "$MCP_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Status: $HTTP_CODE"
    echo "   ✅ Response received:"
    echo "$BODY" | jq -r '.result.serverInfo.name // .error // .' || echo "$BODY" | head -c 200
    echo ""
else
    echo "   ❌ Status: $HTTP_CODE"
    echo "   ❌ Error:"
    echo "$BODY" | jq '.' || echo "$BODY"
    exit 1
fi

echo ""
echo "✅ All edge functions are working correctly!"
echo ""

# Show function versions
echo "📦 Deployed Function Versions:"
supabase functions list | grep -E "claude-api-v3|supabase-mcp-server"

echo ""
echo "🎉 Edge function validation complete!"
