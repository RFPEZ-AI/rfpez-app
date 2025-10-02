# Terminal Management Guidelines

## 🚨 CRITICAL RULES FOR AI ASSISTANTS

### Protected Terminals
- **Dev Server Terminal**: ID `6eeaccb5-1a75-4847-912d-0fb7215aa4f4` - **NEVER USE FOR OTHER COMMANDS**
- **Purpose**: Running `npm start` on http://localhost:3100
- **Status**: PROTECTED - Do not interrupt or use for other commands

### Terminal Assignment Strategy
1. **Dedicated Background Processes**: Use `isBackground=true` for long-running processes
2. **Command Terminals**: Always open new terminals for one-off commands
3. **Never Mix**: Don't run commands in terminals that have active background processes

### Before Running Any Command
1. Check if the command is for a background process (dev server, watch mode, etc.)
2. If yes: Use existing background terminal or create new background terminal
3. If no: Always create a new terminal session

### Development Server Management
```bash
# ✅ CORRECT: Start dev server in background
npm start  # with isBackground=true

# ✅ CORRECT: Check dev server status (new terminal)
curl -s http://localhost:3100

# ❌ WRONG: Running other commands in dev server terminal
# This kills the dev server!
```

### Terminal State Tracking
- Dev Server: Terminal ID `6eeaccb5-1a75-4847-912d-0fb7215aa4f4`
- Status: Running npm start on port 3100
- Last Started: $(date)
- Protected: YES

## Recovery Procedures
If dev server is accidentally killed:
1. Note the lost terminal ID
2. Start new background terminal: `npm start` (isBackground=true)
3. Update this file with new terminal ID
4. Test server: `curl http://localhost:3100`

## Quick Commands (Always in NEW terminals)
```bash
# Check server status
curl -s http://localhost:3100 && echo "Server OK" || echo "Server DOWN"

# Test endpoints
curl -X POST http://localhost:3100/api/test

# Run tests (new terminal)
npm test

# Database operations (new terminal)
supabase status
```