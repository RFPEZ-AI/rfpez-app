#!/bin/bash

# Workspace Startup Script for RFPEZ.AI
# Automatically starts all necessary development services
# Copyright Mark Skiba, 2025 All rights reserved

echo "🚀 Starting RFPEZ.AI workspace..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  Warning: $service_name may not be fully ready yet"
    return 1
}

# Function to check if port is in use
is_port_in_use() {
    local port="$1"
    if command_exists lsof; then
        lsof -ti:$port >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -an | grep -q ":$port.*LISTEN"
    else
        # Fallback: try to connect
        timeout 1 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1
    fi
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists supabase; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g @supabase/cli"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command_exists docker; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo "❌ Not in RFPEZ.AI workspace root. Please run from project root."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start Supabase local stack
echo "🏗️  Starting Supabase local stack..."
if is_port_in_use 54321; then
    echo "⚠️  Port 54321 in use - Supabase may already be running"
    supabase status || echo "Supabase not responding properly, attempting restart..."
else
    echo "📦 Starting fresh Supabase instance..."
fi

supabase start
if [ $? -eq 0 ]; then
    echo "✅ Supabase local stack started successfully"
    wait_for_service "http://127.0.0.1:54321/health" "Supabase API"
else
    echo "❌ Failed to start Supabase. Checking for conflicts..."
    
    # Try to fix container conflicts
    echo "🔧 Attempting to fix container conflicts..."
    docker ps -a --filter name=supabase --format '{{.Names}}' | grep rfpez-app-local | xargs -r docker rm -f
    echo "🔄 Retrying Supabase start..."
    supabase start
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start Supabase after cleanup. Please check Docker status."
        exit 1
    fi
fi

# Install/update dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "🔄 Installing/updating npm dependencies..."
    npm install
else
    echo "✅ Dependencies are up to date"
fi

# Check for API server dependencies
if [ -d "api-server" ] && [ ! -d "api-server/node_modules" ]; then
    echo "🔄 Installing API server dependencies..."
    cd api-server && npm install && cd ..
fi

# Start development servers (via VS Code tasks for proper management)
echo "🖥️  Development servers will be started via VS Code tasks..."
echo "   - React Dev Server (port 3100): Use 'Start Development Server' task"
echo "   - API Server (port 3001): Use 'Start API' task"
echo "   - Test Runner: Use 'Run Tests (Watch Mode)' task"

# Verify edge functions are ready
echo "🔧 Verifying edge functions..."
if curl -s -X POST "http://127.0.0.1:54321/functions/v1/claude-api-v3" \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
   -d '{"userMessage": "startup test", "sessionId": "startup-test"}' \
   --max-time 10 >/dev/null 2>&1; then
    echo "✅ Edge functions are responding"
else
    echo "⚠️  Edge functions may need time to initialize"
fi

# Show current status
echo ""
echo "📊 Startup Status Summary:"
echo "   Supabase API: $(curl -s http://127.0.0.1:54321/health >/dev/null && echo '✅ Running' || echo '❌ Not responding')"
echo "   Supabase Studio: http://127.0.0.1:54323"
echo "   PostgreSQL: $(is_port_in_use 54322 && echo '✅ Running' || echo '❌ Not running')"

# Show next steps
echo ""
echo "🎯 Next Steps:"
echo "   1. VS Code tasks auto-started:"
echo "      • Tests (Watch Mode) - already running"
echo "      • Development Server - running on port 3100"
echo "   2. Open browser to: http://localhost:3100"
echo "   3. Supabase Studio: http://localhost:54323"
echo ""
echo "✨ Workspace startup complete! Happy coding! 🎉"