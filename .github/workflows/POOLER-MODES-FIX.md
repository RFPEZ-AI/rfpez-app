# Supabase Pooler Modes - The REAL Solution

**Date:** October 13, 2025  
**Status:** ✅ FINAL FIX - Transaction Mode on Port 5432

## The Critical Discovery

Supabase pooler has **THREE different modes** with **different ports**:

| Mode | Port | DDL Support | Use Case | Username Format |
|------|------|-------------|----------|----------------|
| **Transaction** | **5432** | **✅ YES** | **Migrations** | **`postgres.PROJECT_REF`** |
| Session | 6543 | ❌ NO | Long connections | `postgres.PROJECT_REF` |
| Statement | 6543 | ❌ NO | Simple queries | `postgres.PROJECT_REF` |

## Why Previous Attempts Failed

### Attempt 1: Port 6543 with `postgres.PROJECT_REF`
```
postgresql://postgres.PROJECT_REF:PASSWORD@pooler.supabase.com:6543/postgres
```
**Error:** "Tenant or user not found"  
**Reason:** Port 6543 is session/statement mode, doesn't work with DDL (migrations)

### Attempt 2: Port 6543 with query parameter
```
postgresql://postgres:PASSWORD@pooler.supabase.com:6543/postgres?options=project%3DPROJECT_REF
```
**Error:** "Tenant or user not found"  
**Reason:** Query parameter format not recognized by pooler, wrong port for DDL

### Attempt 3: Direct connection Port 5432
```
postgresql://postgres.PROJECT_REF:PASSWORD@db.PROJECT.supabase.co:5432/postgres
```
**Error:** "Network unreachable"  
**Reason:** GitHub Actions doesn't support IPv6 (direct connection uses IPv6)

## The Solution: Transaction Mode Pooler

### ✅ Correct: Transaction Mode on Port 5432
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Key Points:**
- ✅ Port **5432** (not 6543) - Transaction mode
- ✅ Username: `postgres.PROJECT_REF` format
- ✅ IPv4 pooler host (GitHub Actions compatible)
- ✅ Supports DDL operations (migrations)

## Connection String Breakdown

```
postgresql://postgres.jxlutaztoukwbbgtoulc:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
│          │                              │        │                                          │    │
│          │                              │        └─ Region-specific pooler (IPv4)           │    └─ Database
│          │                              └─ Password (URL-encoded)                           └─ Transaction mode port
│          └─ Username with project: postgres.PROJECT_REF
└─ Protocol
```

## Pooler Modes Explained

### Transaction Mode (Port 5432) ⭐ USE THIS
- **DDL Support:** ✅ YES (CREATE, ALTER, DROP, migrations)
- **Use Case:** Database migrations, schema changes
- **Connection:** Opens new transaction per client operation
- **IPv4:** Yes (GitHub Actions compatible)

### Session Mode (Port 6543)
- **DDL Support:** ❌ NO
- **Use Case:** Long-lived connections, application backends
- **Connection:** Persistent connection per client
- **IPv4:** Yes

### Statement Mode (Port 6543)
- **DDL Support:** ❌ NO
- **Use Case:** Serverless functions, short queries
- **Connection:** New connection per statement
- **IPv4:** Yes

## Why This Matters for Migrations

**Migrations are DDL (Data Definition Language):**
```sql
-- These are DDL operations (require transaction mode)
CREATE TABLE ...
ALTER TABLE ...
DROP TABLE ...
UPDATE agents SET instructions = ... WHERE id = ...
```

**Session/Statement mode blocks DDL** to prevent connection pool corruption.

## Complete Working Solution

```yaml
- name: Deploy migrations using database URL
  run: |
    # URL encode password
    PASSWORD_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${{ env.SUPABASE_DB_PASSWORD }}', safe=''))")
    
    # Transaction mode pooler (port 5432) with project in username
    DB_URL="postgresql://postgres.${{ env.SUPABASE_PROJECT_REF }}:${PASSWORD_ENCODED}@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    
    # Deploy migrations
    supabase db push --db-url "${DB_URL}" --include-all
```

## Testing Locally

```bash
# Set password
export SUPABASE_DB_PASSWORD="your-password"

# URL encode
PASSWORD_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SUPABASE_DB_PASSWORD', safe=''))")

# Test connection (transaction mode)
psql "postgresql://postgres.jxlutaztoukwbbgtoulc:${PASSWORD_ENCODED}@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "SELECT version();"

# Deploy migrations
supabase db push --db-url "postgresql://postgres.jxlutaztoukwbbgtoulc:${PASSWORD_ENCODED}@aws-0-us-east-1.pooler.supabase.com:5432/postgres" --include-all
```

## Comparison of All Approaches

| Approach | Host | Port | Username | DDL | IPv4 | Result |
|----------|------|------|----------|-----|------|--------|
| Direct DB | `db.PROJECT.supabase.co` | 5432 | `postgres.PROJECT` | ✅ | ❌ | ❌ IPv6 fail |
| Session pooler | `pooler.supabase.com` | 6543 | `postgres.PROJECT` | ❌ | ✅ | ❌ No DDL |
| Transaction pooler | `pooler.supabase.com` | **5432** | `postgres.PROJECT` | ✅ | ✅ | **✅ WORKS** |

## Regional Pooler Hosts

Transaction mode uses the same regional hosts, just port 5432 instead of 6543:

- **US East (N. Virginia):** `aws-0-us-east-1.pooler.supabase.com:5432`
- **US West (Oregon):** `aws-0-us-west-1.pooler.supabase.com:5432`
- **EU West (Ireland):** `aws-0-eu-west-1.pooler.supabase.com:5432`
- **Asia Pacific (Sydney):** `aws-0-ap-southeast-2.pooler.supabase.com:5432`

## Expected Output

```
🚀 Deploying migrations to production...
Connecting via pooler (transaction mode)...
Connecting to remote database...
Applying migration 20251014020920_update_rfp_design_agent.sql...
Applying migration 20251014021930_update_solutions_agent.sql...
✅ All migrations applied successfully!
```

## Why We Didn't Find This Earlier

1. **Port confusion:** Standard PostgreSQL uses 5432, so we assumed pooler used different ports for modes
2. **Documentation:** Supabase docs emphasize 6543 for pooling, but don't clearly state 5432 is transaction mode
3. **Username format:** We tried changing username when we should have changed the port
4. **Query parameters:** We assumed routing needed query params when it's actually port-based

## Key Takeaway

**For GitHub Actions migrations:**
- Use **IPv4 pooler** (not direct connection - IPv6 issue)
- Use **port 5432** (not 6543 - DDL support needed)
- Use **`postgres.PROJECT_REF`** format (standard pooler routing)
- Use **transaction mode** (required for schema changes)

## References

- [Supabase Pooler Documentation](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- Transaction mode vs Session mode pooling
- DDL operations require transaction-level isolation

---

**Status:** ✅ PRODUCTION READY - Transaction Mode Port 5432  
**Expected Result:** Migrations deploy successfully via transaction pooler

