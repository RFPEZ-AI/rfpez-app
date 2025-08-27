#!/bin/bash

# Test script for Supabase MCP Functions using cURL
# Update ACCESS_TOKEN with your actual token from the web UI

SUPABASE_URL="https://jxlutaztoukwbbgtoulc.supabase.co"
ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"

echo "🚀 Testing Supabase MCP Functions with cURL..."

if [ "$ACCESS_TOKEN" = "YOUR_ACCESS_TOKEN_HERE" ]; then
    echo "❌ Please update ACCESS_TOKEN in this script!"
    echo "   1. Go to http://localhost:3000/mcp-test"
    echo "   2. Sign in to your app"
    echo "   3. Copy the access token from the Authentication Info card"
    echo "   4. Replace YOUR_ACCESS_TOKEN_HERE in this script"
    exit 1
fi

echo ""
echo "🔍 Test 1: Creating a test session via MCP..."
curl -X POST "${SUPABASE_URL}/functions/v1/mcp-server" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_session",
      "arguments": {
        "title": "cURL Test Session",
        "description": "Created via cURL test"
      }
    }
  }' | jq '.'

echo ""
echo "🔍 Test 2: Getting recent sessions via MCP..."
curl -X POST "${SUPABASE_URL}/functions/v1/mcp-server" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_recent_sessions",
      "arguments": {
        "limit": 5
      }
    }
  }' | jq '.'

echo ""
echo "🔍 Test 3: Testing Claude API endpoint..."
curl -X POST "${SUPABASE_URL}/functions/v1/claude-api" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_recent_sessions",
    "limit": 5
  }' | jq '.'

echo ""
echo "✅ All cURL tests completed!"
