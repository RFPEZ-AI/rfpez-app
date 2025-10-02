#!/bin/bash
# Switch to Supabase LOCAL development

echo "🔄 Switching to Supabase LOCAL development..."

# Backup current .env.local
cp .env.local .env.local.backup

# Create local configuration
cat > .env.local << EOF
# Supabase Local Development Configuration (ACTIVE)
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_URL=http://127.0.0.1:54321

# Supabase Remote Configuration (INACTIVE)
# REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM
# SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co

# Development server configuration
GENERATE_SOURCEMAP=false
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3100
FAST_REFRESH=true
EOF

echo "✅ Switched to LOCAL Supabase"
echo "🚀 Starting local Supabase stack..."

# Start local Supabase
supabase start

echo "🔗 Local Supabase URLs:"
echo "  - API: http://127.0.0.1:54321"
echo "  - Studio: http://127.0.0.1:54323"
echo "  - Database: http://127.0.0.1:54322"
echo ""
echo "💡 Restart your React app to connect to local Supabase"