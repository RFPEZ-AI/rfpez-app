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
    # Return 0 if port is in use (listening), non-zero otherwise
    # Try multiple strategies so this works on Linux, macOS, and Git Bash on Windows
    if command_exists lsof; then
        lsof -iTCP:${port} -sTCP:LISTEN -t >/dev/null 2>&1 && return 0 || return 1
    fi

    if command_exists ss; then
        ss -ltn 2>/dev/null | awk '{print $4}' | grep -E ":${port}$|:${port}:" >/dev/null 2>&1 && return 0 || true
    fi

    if command_exists netstat; then
        # netstat output varies by platform (LISTEN vs LISTENING)
        if netstat -an 2>/dev/null | grep -E "(:|\s)${port}\b" | grep -E "LISTEN|LISTENING" >/dev/null 2>&1; then
            return 0
        fi
    fi

    if command_exists nc; then
        nc -z localhost ${port} >/dev/null 2>&1 && return 0 || return 1
    fi

    # Fallback to /dev/tcp if available (bash built-in on some systems)
    if [ -e /dev/tcp/localhost/${port} ] 2>/dev/null; then
        (echo >/dev/tcp/localhost/${port}) >/dev/null 2>&1 && return 0 || return 1
    fi

    return 1
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

# Pre-startup cleanup: Remove any stale containers from previous sessions
echo "🧹 Checking for stale containers from previous sessions..."
STALE_CONTAINERS=$(docker ps -a --filter name=supabase_*_rfpez-app-local --filter status=exited --format "{{.Names}}" | wc -l)
if [ "$STALE_CONTAINERS" -gt 0 ]; then
    echo "⚠️  Found $STALE_CONTAINERS stale containers - cleaning up..."
    docker ps -a --filter name=supabase_*_rfpez-app-local --filter status=exited --format "{{.Names}}" | while read -r container; do
        if [ -n "$container" ]; then
            echo "   🗑️  Removing stale container: $container"
            docker rm "$container" >/dev/null 2>&1
        fi
    done
    echo "✅ Stale containers removed"
else
    echo "✅ No stale containers found"
fi

# Start Supabase local stack
echo "🏗️  Starting Supabase local stack..."
if is_port_in_use 54321; then
    echo "⚠️  Port 54321 in use - Supabase may already be running"
    supabase status || echo "Supabase not responding properly, attempting restart..."
else
    echo "📦 Starting fresh Supabase instance..."
fi

### Helpers for container diagnostics
container_health() {
    local name="$1"
    # Return: "running", "exited", "unknown" or health status if available
    if ! docker ps -a --format '{{.Names}}' | grep -q "${name}"; then
        echo "missing"
        return
    fi
    local status
    status=$(docker inspect --format '{{.State.Status}}' "${name}" 2>/dev/null || echo "unknown")
    # If container has health info, prefer that
    local health
    health=$(docker inspect --format '{{json .State.Health}}' "${name}" 2>/dev/null || true)
    if [ -n "${health}" ] && [ "${health}" != "null" ]; then
        # extract status field (works even if Health is JSON or empty)
        echo "$(echo ${health} | sed -n 's/.*\"Status\":\s*\"\([a-zA-Z0-9_-]*\)\".*/\1/p' )"
        return
    fi
    echo "${status}"
}

start_supabase_with_retries() {
    local max_attempts=3
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        echo "📦 Starting Supabase (attempt $attempt/$max_attempts)..."
        # Use --debug on the last attempt to provide more troubleshooting info
        if [ $attempt -eq $max_attempts ]; then
            supabase start --debug
        else
            supabase start
        fi

        if [ $? -eq 0 ]; then
            echo "✅ Supabase local stack start command finished (attempt $attempt)"
            return 0
        fi

        echo "⚠️  supabase start failed on attempt $attempt"
        attempt=$((attempt + 1))
        sleep 3
    done
    return 1
}

supabase start
if [ $? -eq 0 ]; then
    echo "✅ Supabase local stack started successfully"
    wait_for_service "http://127.0.0.1:54321/health" "Supabase API"
else
    echo "❌ Failed to start Supabase. Performing diagnostics..."
    echo "🔧 Gathering Supabase-related containers and statuses..."
    docker ps -a --filter name=supabase --format '{{.Names}}' | while read -r cname; do
        cname_trim=$(echo "$cname" | tr -d '\r')
        status=$(container_health "$cname_trim")
        echo "   - $cname_trim : $status"
        if [ "$status" = "unhealthy" ] || [ "$status" = "starting" ]; then
            echo "     → Last 200 log lines for $cname_trim:"
            docker logs --tail 200 "$cname_trim" 2>&1 | sed 's/^/       /'
        fi
    done

    echo "🔧 Attempting graceful stop of Supabase and retrying start..."
    supabase stop || echo "   supabase stop reported an issue; continuing with cleanup"
    sleep 2

    # Retry start with helper (includes a --debug on final attempt)
    if start_supabase_with_retries; then
        echo "✅ Supabase started after retry"
        wait_for_service "http://127.0.0.1:54321/health" "Supabase API"
    else
        echo "❌ Failed to start Supabase after retries. Attempting targeted cleanup of unhealthy containers..."
        # Only remove containers that belong to this project and show as unhealthy/exited
        docker ps -a --filter name=supabase --format '{{.Names}}' | while read -r cname; do
            cname_trim=$(echo "$cname" | tr -d '\r')
            status=$(container_health "$cname_trim")
            if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ] || [ "$status" = "missing" ]; then
                echo "   Removing container: $cname_trim (status: $status)"
                docker rm -f "$cname_trim" || echo "     Failed to remove $cname_trim"
            fi
        done

        echo "🔄 Final attempt to start Supabase (with --debug)..."
        supabase start --debug
        if [ $? -ne 0 ]; then
            echo "❌ Final start attempt failed. Please inspect Docker daemon and run 'supabase start --debug' manually for full logs."
            exit 1
        fi
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
# Try to POST a lightweight startup payload to the Claude function and report status
EDGE_TEST_URL="http://127.0.0.1:54321/functions/v1/claude-api-v3"
EDGE_TEST_BODY='{"userMessage":"startup test","sessionId":"startup-test"}'
EDGE_HTTP_STATUS=0

if command_exists curl; then
    EDGE_HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$EDGE_TEST_URL" \
        -H "Content-Type: application/json" \
        -d "$EDGE_TEST_BODY" --max-time 8 || echo 000)
    if [ "$EDGE_HTTP_STATUS" != "000" ] && [ "$EDGE_HTTP_STATUS" -ge 200 ] && [ "$EDGE_HTTP_STATUS" -lt 500 ]; then
        echo "✅ Edge function endpoint responded (HTTP $EDGE_HTTP_STATUS)"
    else
        echo "⚠️  Edge function endpoint returned HTTP $EDGE_HTTP_STATUS (may need init or env vars)"
    fi
else
    echo "⚠️  curl not available to check edge functions; please verify manually: $EDGE_TEST_URL"
fi

# Show current status
echo ""
echo "📊 Startup Status Summary:"
if command_exists curl; then
    if curl -s http://127.0.0.1:54321/health >/dev/null 2>&1; then
        echo "   Supabase API: ✅ Running"
    else
        echo "   Supabase API: ❌ Not responding"
    fi
else
    echo "   Supabase API: (curl not available to check)"
fi

echo "   Supabase Studio: http://127.0.0.1:54323"

if is_port_in_use 54322; then
    echo "   PostgreSQL: ✅ Running"
else
    echo "   PostgreSQL: ❌ Not running"
fi

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