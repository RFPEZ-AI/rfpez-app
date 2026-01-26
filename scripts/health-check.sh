#!/bin/bash

# Health Check Script for RFPEZ.AI Workspace  
# Verifies all services are running correctly
# Copyright Mark Skiba, 2025 All rights reserved

echo "🔍 RFPEZ.AI Workspace Health Check"
echo "=================================="

# Function to check URL with timeout
check_url() {
    local url="$1"
    local service="$2"
    local timeout="${3:-5}"
    
    if curl -s --max-time $timeout "$url" >/dev/null 2>&1; then
        echo "✅ $service: Running"
        return 0
    else
        echo "❌ $service: Not responding"
        return 1
    fi
}

# Function to check port
check_port() {
    local port="$1" 
    local service="$2"
    
    if command -v lsof >/dev/null 2>&1; then
        if lsof -ti:$port >/dev/null 2>&1; then
            echo "✅ $service (port $port): Running"
            return 0
        fi
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -an | grep -q ":$port.*LISTEN"; then
            echo "✅ $service (port $port): Running"
            return 0
        fi
    fi
    
    echo "❌ $service (port $port): Not running"
    return 1
}

# Check core services
echo ""
echo "📊 Core Services:"
check_url "http://127.0.0.1:55321/health" "Supabase API"
check_url "http://127.0.0.1:55323" "Supabase Studio"  
check_port "55322" "PostgreSQL"

echo ""
echo "🔧 Edge Functions:"
if curl -s -X POST "http://127.0.0.1:55321/functions/v1/claude-api-v3" \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
   -d '{"userMessage": "health check", "sessionId": "health-check"}' \
   --max-time 10 >/dev/null 2>&1; then
    echo "✅ Claude API V3: Responding"
else
    echo "❌ Claude API V3: Not responding"
fi

echo ""
echo "🖥️ Development Servers:"
check_port "3100" "React Dev Server"
check_port "3001" "API Server"

echo ""
echo "🧪 Test Environment:"
if pgrep -f "jest.*--watch" >/dev/null 2>&1; then
    echo "✅ Jest Watch Mode: Running"
else
    echo "⚠️  Jest Watch Mode: Not running (this is optional)"
fi

echo ""
echo "🐳 Docker Status:"
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker: Running"
        
        # Check Supabase containers
        local running_containers=$(docker ps --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | wc -l)
        echo "📦 Supabase Containers: $running_containers running"
    else
        echo "❌ Docker: Not responding"
    fi
else
    echo "❌ Docker: Not installed"
fi

echo ""
echo "🔗 Quick Links:"
echo "   React App: http://localhost:3100"
echo "   API Server: http://localhost:3001"  
echo "   Supabase Studio: http://localhost:55323"
echo "   Supabase API: http://127.0.0.1:55321"

echo ""
echo "========================================="
echo "Health check complete! 🏥"