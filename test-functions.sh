#!/bin/bash

# Test script for local Edge Functions
echo "Testing local Edge Functions..."

# Test claude-api-v3 function with a simple health check
echo "Testing claude-api-v3 function..."
curl -X POST "http://127.0.0.1:54321/functions/v1/claude-api-v3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -d '{
    "messages": [{"role": "user", "content": "Hello, this is a test message"}],
    "max_tokens": 100
  }'

echo -e "\n\nTesting supabase-mcp-server function..."
curl -X POST "http://127.0.0.1:54321/functions/v1/supabase-mcp-server" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'

echo -e "\n\nFunction tests completed!"