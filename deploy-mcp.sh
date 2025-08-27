#!/bin/bash

# Deploy MCP Server to Supabase Edge Functions
# Make sure you have the Supabase CLI installed and configured

echo "Deploying RFPEZ MCP Server to Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "Error: Not logged in to Supabase."
    echo "Please run: supabase login"
    exit 1
fi

# Deploy the edge function
echo "Deploying mcp-server edge function..."
supabase functions deploy mcp-server

if [ $? -eq 0 ]; then
    echo "✅ MCP Server deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your environment variables in the Supabase dashboard"
    echo "2. Get your edge function URL from the Supabase dashboard"
    echo "3. Update claude_desktop_config.json with your actual values:"
    echo "   - SUPABASE_URL: Your Supabase project URL"
    echo "   - SUPABASE_ANON_KEY: Your Supabase anon key"
    echo "   - ACCESS_TOKEN: A valid Supabase auth token for testing"
    echo ""
    echo "4. Install node-fetch for the MCP client:"
    echo "   npm install node-fetch"
    echo ""
    echo "5. Test the MCP server using the test component in your React app"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
