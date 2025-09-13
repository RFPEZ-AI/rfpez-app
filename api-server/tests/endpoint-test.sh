#!/bin/bash

echo "Starting API server and testing endpoints..."

# Start the API server in background
cd /c/Dev/RFPEZ.AI/rfpez-app/api-server
node index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "Testing endpoints..."

# Test health endpoint
echo "=== Testing /health ==="
curl -s http://localhost:3001/health | jq '.' 2>/dev/null || curl -s http://localhost:3001/health

echo -e "\n=== Testing /api/agent/capabilities ==="
curl -s http://localhost:3001/api/agent/capabilities | jq '.' 2>/dev/null || curl -s http://localhost:3001/api/agent/capabilities

echo -e "\n=== Testing /api/agent/session ==="
curl -s -X POST http://localhost:3001/api/agent/session \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "metadata": {"testRun": true}}' | jq '.' 2>/dev/null || \
curl -s -X POST http://localhost:3001/api/agent/session \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "metadata": {"testRun": true}}'

echo -e "\n=== Testing /api/agent/prompt ==="
curl -s -X POST http://localhost:3001/api/agent/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello! I need help creating an RFP for LED bulbs", "context": {"rfpId": null}}' | jq '.' 2>/dev/null || \
curl -s -X POST http://localhost:3001/api/agent/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello! I need help creating an RFP for LED bulbs", "context": {"rfpId": null}}'

echo -e "\n=== Stopping server ==="
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "Done!"