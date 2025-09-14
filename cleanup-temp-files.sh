#!/bin/bash

echo "🧹 Cleaning up temporary files from working tree..."
echo

# Test and debugging files - HTML
echo "Removing HTML test files..."
files_removed=0

if [ -f "test-mcp-server.html" ]; then
    rm "test-mcp-server.html"
    echo "✅ Removed test-mcp-server.html"
    ((files_removed++))
fi

if [ -f "test-agents-update.html" ]; then
    rm "test-agents-update.html"
    echo "✅ Removed test-agents-update.html"
    ((files_removed++))
fi

if [ -f "test-rfp-workflow-automation.html" ]; then
    rm "test-rfp-workflow-automation.html"
    echo "✅ Removed test-rfp-workflow-automation.html"
    ((files_removed++))
fi

# Test and debugging files - JavaScript
echo
echo "Removing JavaScript test files..."

if [ -f "test-mcp-server.js" ]; then
    rm "test-mcp-server.js"
    echo "✅ Removed test-mcp-server.js"
    ((files_removed++))
fi

if [ -f "test-rfp-status-tracking.js" ]; then
    rm "test-rfp-status-tracking.js"
    echo "✅ Removed test-rfp-status-tracking.js"
    ((files_removed++))
fi

if [ -f "check-rfp-creation.js" ]; then
    rm "check-rfp-creation.js"
    echo "✅ Removed check-rfp-creation.js"
    ((files_removed++))
fi

# Setup and utility scripts
echo
echo "Removing setup utility scripts..."

if [ -f "setup-mcp-env.js" ]; then
    rm "setup-mcp-env.js"
    echo "✅ Removed setup-mcp-env.js"
    ((files_removed++))
fi

if [ -f "refresh-auth-token.js" ]; then
    rm "refresh-auth-token.js"
    echo "✅ Removed refresh-auth-token.js"
    ((files_removed++))
fi

if [ -f "update-agent-instructions.js" ]; then
    rm "update-agent-instructions.js"
    echo "✅ Removed update-agent-instructions.js"
    ((files_removed++))
fi

# Database migration and SQL files
echo
echo "Removing temporary database files..."

if [ -f "database/migration-add-rfp-status.sql" ]; then
    rm "database/migration-add-rfp-status.sql"
    echo "✅ Removed database/migration-add-rfp-status.sql"
    ((files_removed++))
fi

if [ -f "database/MANUAL-UPDATE-rfp-status.sql" ]; then
    rm "database/MANUAL-UPDATE-rfp-status.sql"
    echo "✅ Removed database/MANUAL-UPDATE-rfp-status.sql"
    ((files_removed++))
fi

if [ -f "database/FIX-CHECK-CONSTRAINTS.sql" ]; then
    rm "database/FIX-CHECK-CONSTRAINTS.sql"
    echo "✅ Removed database/FIX-CHECK-CONSTRAINTS.sql"
    ((files_removed++))
fi

if [ -f "database/migration-add-user-id-to-rfps.sql" ]; then
    rm "database/migration-add-user-id-to-rfps.sql"
    echo "✅ Removed database/migration-add-user-id-to-rfps.sql"
    ((files_removed++))
fi

if [ -f "update-rfp-design-agent.sql" ]; then
    rm "update-rfp-design-agent.sql"
    echo "✅ Removed update-rfp-design-agent.sql"
    ((files_removed++))
fi

if [ -f "update-rfp-design-agent-with-workflow.sql" ]; then
    rm "update-rfp-design-agent-with-workflow.sql"
    echo "✅ Removed update-rfp-design-agent-with-workflow.sql"
    ((files_removed++))
fi

# Implementation documentation
echo
echo "Removing temporary documentation..."

if [ -f "RFP-STATUS-IMPLEMENTATION.md" ]; then
    rm "RFP-STATUS-IMPLEMENTATION.md"
    echo "✅ Removed RFP-STATUS-IMPLEMENTATION.md"
    ((files_removed++))
fi

# Binary downloads
echo
echo "Removing binary downloads..."

if [ -f "supabase_windows_amd64.zip" ]; then
    rm "supabase_windows_amd64.zip"
    echo "✅ Removed supabase_windows_amd64.zip"
    ((files_removed++))
fi

# Temporary CLI files
echo
echo "Removing temporary CLI files..."

if [ -f "supabase/.temp/cli-latest" ]; then
    rm "supabase/.temp/cli-latest"
    echo "✅ Removed supabase/.temp/cli-latest"
    ((files_removed++))
fi

echo
echo "🎉 Cleanup complete! Removed $files_removed temporary files."
echo
echo "📋 Files that remain and should be committed:"
echo "  ✅ supabase/functions/mcp-server/index.ts (core enhancement)"
echo
echo "⚠️  IMPORTANT: Before committing, manually apply these SQL migrations in Supabase:"
echo "  • database/MANUAL-UPDATE-rfp-status.sql (if not already applied)"
echo "  • database/FIX-CHECK-CONSTRAINTS.sql (if not already applied)"
echo
echo "🔧 After cleanup, your commit should only include the enhanced MCP server function."