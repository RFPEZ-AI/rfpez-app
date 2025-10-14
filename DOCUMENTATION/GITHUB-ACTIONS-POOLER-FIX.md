# FINAL FIX: GitHub Actions IPv6 Issue - Use Pooler Connection

## 🎯 The Real Problem

**GitHub Actions runners do NOT support IPv6 connections.** Supabase's direct database connections (`db.PROJECT_REF.supabase.co`) use **IPv6-only addresses**.

From Supabase's official documentation:
> "There are a few prominent services that only accept IPv4 connections:
> - GitHub Actions
> - Vercel  
> - Render
> - Retool"

## ✅ The Solution: Use Supavisor Pooler (Session Mode)

For GitHub Actions, you **MUST use the pooler connection string** which supports IPv4.

### Connection String Format for GitHub Actions:

```
postgresql://postgres.jxlutaztoukwbbgtoulc:URL_ENCODED_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Key Components:**
- **Username**: `postgres.PROJECT_REF` (note the dot notation!)
- **Password**: URL-encoded (use `encode-db-password.js`)
- **Host**: `aws-0-us-east-1.pooler.supabase.com` (pooler, NOT direct db)
- **Port**: `5432` (session mode - supports DDL/migrations)
- **Database**: `postgres`

## 📋 Step-by-Step Fix

### Step 1: Get Your Pooler Connection String

1. Go to your Supabase project: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
2. Click the **"Connect"** button at the top
3. **CHECK the box** "Use connection pooling"
4. Select **"Session" mode** (port 5432, NOT transaction mode 6543)
5. Copy the connection string

### Step 2: URL-Encode Your Password

If your password has special characters like `@`, `#`, `$`, etc.:

```bash
node encode-db-password.js "YOUR_PASSWORD_HERE"
```

The script will output the encoded password. For example:
- Original: `XLZ3cmU4@WBQ7`
- Encoded: `XLZ3cmU4%40WBQ7`

### Step 3: Build Your Connection String

Format:
```
postgresql://postgres.jxlutaztoukwbbgtoulc:ENCODED_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Example with encoded password:**
```
postgresql://postgres.jxlutaztoukwbbgtoulc:XLZ3cmU4%40WBQ7@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Step 4: Update GitHub Secret

1. Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions/SUPABASE_DB_URL
2. Click "Update"
3. Paste the **complete pooler connection string**
4. Click "Update secret"

## 🔍 Why This Works

| Aspect | Direct Connection | Pooler Connection (SESSION) |
|--------|-------------------|----------------------------|
| IP Version | IPv6 only | IPv4 + IPv6 (dual-stack) |
| GitHub Actions | ❌ **Fails** | ✅ **Works** |
| Port | 5432 | 5432 (session mode) |
| DDL Support | ✅ Yes | ✅ Yes (session mode only!) |
| Migrations | ✅ Yes | ✅ Yes (session mode only!) |
| Username Format | `postgres` | `postgres.PROJECT_REF` |

## ⚠️ Important Notes

### Session Mode vs Transaction Mode

**For migrations, you MUST use SESSION mode (port 5432):**
- ✅ **Session mode (5432)**: Supports DDL operations (CREATE, ALTER, DROP)
- ❌ **Transaction mode (6543)**: Does NOT support DDL - will fail for migrations

### Password Encoding is Still Required

Even with the pooler connection, you still need to URL-encode special characters:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

See `PASSWORD-URL-ENCODING.md` for full details.

## 🧪 Test Your Connection String

You can test locally before updating GitHub:

```bash
# Test with your local Supabase CLI
supabase db push --db-url "postgresql://postgres.jxlutaztoukwbbgtoulc:ENCODED_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres" --dry-run
```

If you see "Connecting to remote database..." and it succeeds, you're good to go!

## ✅ Complete Connection String Checklist

Before updating your GitHub secret, verify:

- [ ] Uses pooler host: `aws-0-us-east-1.pooler.supabase.com`
- [ ] Username format: `postgres.jxlutaztoukwbbgtoulc` (with dot!)
- [ ] Port: `5432` (session mode, NOT 6543)
- [ ] Password is URL-encoded if it contains special characters
- [ ] Database: `postgres`

## 📊 Evolution of Our Solution

1. ~~Direct database connection~~ → ❌ "Tenant or user not found"
2. ~~Direct connection with fixed username~~ → ❌ IPv6 unreachable on GitHub Actions
3. ✅ **Pooler connection (session mode)** → Works! IPv4 compatible + DDL support

## 🚀 Expected Workflow Result

After updating the secret, your GitHub Actions workflow should:

1. ✅ Connect successfully (no IPv6 error)
2. ✅ Authenticate (no "Tenant or user not found")
3. ✅ Deploy migrations (`supabase db push` succeeds)
4. ✅ Complete successfully

## 📚 References

- [Supabase IPv4/IPv6 Documentation](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)
- [Medium: Solving Supabase IPv6 Connection Issues](https://medium.com/@lhc1990/solving-supabase-ipv6-connection-issues-the-complete-developers-guide-96f8481f42c1)
- GitHub Issue: GitHub Actions explicitly listed as IPv6-incompatible service

## 🆘 Troubleshooting

### Still getting "Tenant or user not found"?
- Check username format: Must be `postgres.PROJECT_REF` (not just `postgres`)
- Verify password is correct and properly URL-encoded

### Still getting "Network is unreachable"?
- Make sure you're using pooler host, NOT `db.PROJECT_REF.supabase.co`
- Verify connection string uses `pooler.supabase.com`

### Migrations failing with "DDL not supported"?
- You're using transaction mode (port 6543)
- Switch to session mode (port 5432)
