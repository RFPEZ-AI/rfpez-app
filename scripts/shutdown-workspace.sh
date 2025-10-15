#!/bin/bash

# Workspace Shutdown Script for RFPEZ.AI
# Gracefully shuts down all local development services
# Copyright Mark Skiba, 2025 All rights reserved

echo "🔄 Shutting down RFPEZ.AI workspace..."

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
}

# Function to safely kill processes
safe_kill() {
    local pattern="$1"
    local description="$2"
    
    if is_running "$pattern"; then
        echo "⏹️  Stopping $description..."
        pkill -f "$pattern" 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if is_running "$pattern"; then
            echo "🔨 Force stopping $description..."
            pkill -9 -f "$pattern" 2>/dev/null
        fi
        echo "✅ $description stopped"
    else
        echo "⏸️  $description was not running"
    fi
}

# Stop Edge Functions (standalone)
safe_kill "supabase functions serve" "Standalone Edge Functions"

# Stop npm development servers
safe_kill "npm.*start" "NPM Development Server"
safe_kill "npm.*start:api" "NPM API Server"

# Stop Jest test runners
safe_kill "jest.*--watch" "Jest Test Runners"

# Backup Supabase database before shutdown
echo "💾 Creating Supabase database backup..."
if command -v docker >/dev/null 2>&1; then
    # Create backup directory if it doesn't exist
    mkdir -p database/backups
    
    # Check if Supabase database container is running
    if docker ps --filter name=supabase_db_rfpez-app-local --format "{{.Names}}" | grep -q supabase_db_rfpez-app-local; then
        BACKUP_FILE="database/backups/local-supabase-backup-$(date +%Y%m%d-%H%M%S).sql"
        echo "📁 Backing up to: $BACKUP_FILE"
        
        docker exec supabase_db_rfpez-app-local pg_dump -U postgres postgres --clean --if-exists --create > "$BACKUP_FILE" 2>/dev/null
        
        if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            echo "✅ Backup completed successfully ($BACKUP_SIZE)"
            
            # Keep only last 5 backups
            echo "🧹 Cleaning up old backups (keeping last 5)..."
            ls -t database/backups/local-supabase-backup-*.sql 2>/dev/null | tail -n +6 | xargs -r rm
        else
            echo "⚠️  Backup failed or empty - continuing with shutdown"
            rm -f "$BACKUP_FILE" 2>/dev/null
        fi
    else
        echo "⏸️  Supabase database container not running - skipping backup"
    fi
else
    echo "⚠️  Docker not found - skipping backup"
fi

# Stop Supabase local stack
echo "🛑 Stopping Supabase local stack..."
if command -v supabase >/dev/null 2>&1; then
    supabase stop
    if [ $? -eq 0 ]; then
        echo "✅ Supabase local stack stopped successfully"
    else
        echo "⚠️  Warning: Supabase stop command failed, but this might be expected if not running"
    fi
else
    echo "⚠️  Supabase CLI not found - skipping Supabase shutdown"
fi

# Clean up any remaining Docker containers
echo "🐳 Cleaning up Docker containers..."
docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | while read -r container; do
    if [ -n "$container" ]; then
        echo "⏹️  Stopping Docker container: $container"
        docker stop "$container" >/dev/null 2>&1
    fi
done

# Show final status
echo ""
echo "✨ Workspace shutdown complete!"
echo "📊 Final process check:"
echo "   Edge Functions: $(is_running 'supabase functions serve' && echo 'Still running ⚠️' || echo 'Stopped ✅')"
echo "   Dev Servers: $(is_running 'npm.*start' && echo 'Still running ⚠️' || echo 'Stopped ✅')"
echo "   Test Runners: $(is_running 'jest.*--watch' && echo 'Still running ⚠️' || echo 'Stopped ✅')"

# Check Docker containers
RUNNING_CONTAINERS=$(docker ps --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | wc -l)
echo "   Docker containers: $RUNNING_CONTAINERS running"

echo ""
echo "🎯 Safe to close VS Code workspace now!"