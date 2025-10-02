# Supabase Configuration Management

## Overview
This document explains how to control whether your RFPEZ.AI application connects to Supabase **local** (development) or **remote** (production) instances.

## Current Configuration Status

### Active Configuration: **REMOTE** ✅
- **Supabase URL**: `https://jxlutaztoukwbbgtoulc.supabase.co`
- **Project ID**: `jxlutaztoukwbbgtoulc`
- **Environment**: Production/Remote
- **Studio URL**: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc

## Configuration Files

### 1. Environment Variables
The primary configuration is controlled through environment variables in these files:

#### `.env.local` (Primary Configuration)
- **Priority**: Highest (overrides other .env files)
- **Usage**: Active configuration for React app
- **Location**: `c:\Dev\RFPEZ.AI\rfpez-app\.env.local`

#### `.env` (Fallback Configuration)
- **Priority**: Lower (used if .env.local doesn't exist)
- **Usage**: Default configuration
- **Location**: `c:\Dev\RFPEZ.AI\rfpez-app\.env`

#### `supabase/config.toml` (Local Development Settings)
- **Usage**: Defines local Supabase stack ports and configuration
- **Location**: `c:\Dev\RFPEZ.AI\rfpez-app\supabase\config.toml`

## Configuration Variables

### React App Variables (Required)
```bash
# Primary Supabase connection
REACT_APP_SUPABASE_URL=<supabase-url>
REACT_APP_SUPABASE_ANON_KEY=<anon-key>

# Additional Supabase reference
SUPABASE_URL=<supabase-url>
```

### Remote Configuration
```bash
# Remote/Production Supabase
REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM
SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
```

### Local Configuration
```bash
# Local Development Supabase
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_URL=http://127.0.0.1:54321
```

### Local Supabase Stack Ports
```toml
# From supabase/config.toml
[api]
port = 54321          # API Gateway

[db]
port = 54322          # PostgreSQL Database

[studio]
port = 54323          # Supabase Studio UI
```

## Switching Methods

### Method 1: Automated Scripts ⭐ (Recommended)

#### Windows Scripts
```batch
# Switch to LOCAL development
scripts\supabase-local.bat

# Switch to REMOTE production
scripts\supabase-remote.bat
```

#### Linux/Mac Scripts
```bash
# Switch to LOCAL development
./scripts/supabase-local.sh

# Switch to REMOTE production
./scripts/supabase-remote.sh
```

**Features:**
- Automatic backup of current configuration
- Complete environment variable switching
- Supabase stack management (start/stop)
- Visual confirmation of active configuration

### Method 2: Manual Environment Variable Editing

#### Switch to LOCAL
1. Open `.env.local`
2. Comment out remote configuration:
   ```bash
   # REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
   # REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...remote-key...
   ```
3. Uncomment local configuration:
   ```bash
   REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...demo-key...
   ```
4. Start local Supabase: `supabase start`
5. Restart React app: `npm start`

#### Switch to REMOTE
1. Open `.env.local`
2. Comment out local configuration:
   ```bash
   # REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
   # REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...demo-key...
   ```
3. Uncomment remote configuration:
   ```bash
   REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...remote-key...
   ```
4. Restart React app: `npm start`

### Method 3: Supabase CLI Commands

#### Local Development
```bash
# Start local Supabase stack
supabase start

# View local status
supabase status

# Stop local stack
supabase stop
```

#### Remote Management
```bash
# Link to remote project
supabase link --project-ref jxlutaztoukwbbgtoulc

# Deploy functions to remote
supabase functions deploy

# Push database changes to remote
supabase db push

# Pull remote database schema
supabase db pull
```

## Required Steps After Switching

### 1. Restart React Development Server
```bash
# Kill existing server
Ctrl+C (in running terminal)

# Start fresh server
npm start
```

### 2. Clear Browser Cache (if needed)
- **Chrome/Edge**: `Ctrl+Shift+Delete` → Clear cached images and files
- **Firefox**: `Ctrl+Shift+Delete` → Cached Web Content
- **Alternative**: Use incognito/private mode for testing

### 3. Verify Connection
Check the browser console for connection confirmations:
- **Local**: Look for `127.0.0.1:54321` in network requests
- **Remote**: Look for `jxlutaztoukwbbgtoulc.supabase.co` in network requests

## Troubleshooting

### Common Issues

#### 1. **"Failed to connect to Supabase"**
- **Cause**: Wrong URL/key combination
- **Solution**: Verify environment variables match your target (local/remote)

#### 2. **Local Supabase not starting**
```bash
# Check Docker is running
docker ps

# Restart Supabase
supabase stop
supabase start
```

#### 3. **Environment variables not updating**
- **Cause**: React app caches environment variables
- **Solution**: Completely restart React development server

#### 4. **Mixed local/remote requests**
- **Cause**: Browser cache or service worker
- **Solution**: Clear browser cache and restart app

### Verification Commands

#### Check Active Configuration
```bash
# View current environment variables
cat .env.local

# Check Supabase status
supabase status  # For local
# Remote status via dashboard
```

#### Test Database Connection
```javascript
// In browser console
console.log(process.env.REACT_APP_SUPABASE_URL);
```

## Development Workflows

### Recommended Development Pattern

#### For Feature Development
1. **Use LOCAL** for development and testing
2. **Switch to REMOTE** for integration testing
3. **Deploy to REMOTE** when ready

#### For Bug Fixing
1. **Reproduce on REMOTE** to confirm issue
2. **Switch to LOCAL** for debugging
3. **Test fix on LOCAL**
4. **Deploy and verify on REMOTE**

### Data Synchronization

#### Local → Remote
```bash
# Deploy schema changes
supabase db push

# Deploy function changes
supabase functions deploy
```

#### Remote → Local
```bash
# Pull schema changes
supabase db pull

# Reset local database (if needed)
supabase db reset
```

## Security Considerations

### Environment Variable Safety
- **Never commit** `.env.local` with production keys
- **Use different keys** for local vs remote
- **Rotate keys** periodically

### Local Development Security
- **Local keys** are safe to share (demo keys)
- **Remote keys** should be kept secret
- **Service role keys** should never be in frontend code

## Script Locations

```
rfpez-app/
├── scripts/
│   ├── supabase-local.bat     # Windows local switch
│   ├── supabase-local.sh      # Linux/Mac local switch
│   ├── supabase-remote.bat    # Windows remote switch
│   └── supabase-remote.sh     # Linux/Mac remote switch
├── .env                       # Default environment variables
├── .env.local                 # Active environment variables
└── supabase/
    └── config.toml           # Local Supabase configuration
```

## Quick Reference

| Configuration | URL | Port | Environment |
|--------------|-----|------|-------------|
| **Remote** | `https://jxlutaztoukwbbgtoulc.supabase.co` | 443 | Production |
| **Local API** | `http://127.0.0.1:54321` | 54321 | Development |
| **Local DB** | `http://127.0.0.1:54322` | 54322 | Development |
| **Local Studio** | `http://127.0.0.1:54323` | 54323 | Development |

## Key Indicators

### You're on LOCAL when:
- URLs contain `127.0.0.1` or `localhost`
- Port numbers like `:54321`, `:54322`, `:54323`
- Supabase Studio shows "Local development"

### You're on REMOTE when:
- URLs contain `jxlutaztoukwbbgtoulc.supabase.co`
- HTTPS protocol
- Supabase Studio shows project name and production data

---

**Last Updated**: October 1, 2025  
**Configuration Status**: REMOTE (Production)  
**Project**: RFPEZ.AI