Backfill account_id values across protected tables
===============================================

Purpose
-------
This script helps administrators locate rows with NULL `account_id` in key tables and either suggest inferred account assignments or apply updates in bulk.

Files
-----
- `scripts/backfill-account-ids.js` - Node script (ESM) with dry-run and --apply modes

Usage
-----
1. Install dependencies (if not already):

```bash
# from project root
npm install pg yargs
```

2. Dry-run (recommended):

```bash
node scripts/backfill-account-ids.js
```

3. Apply changes:

```bash
node scripts/backfill-account-ids.js --apply
```

Options
-------
- `--apply` : Actually update rows. Without this flag the script runs in dry-run mode.
- `--fallback-account=<UUID>` : Use an existing account UUID for orphan rows. If omitted the script will create a new account named `orphan-backfill-<timestamp>`.

Environment
-----------
- `DATABASE_URL` or `SUPABASE_DB_URL` should point to the Postgres database. If not provided, the script falls back to `postgres://postgres:postgres@127.0.0.1:54322/postgres`.

Safety notes
------------
- The script limits each table query to 1000 rows per run to avoid memory spikes. For very large tables run the script repeatedly or extend it to handle batching.
- Review the dry-run output carefully before running with `--apply`.
- Prefer running this in a development or staging environment first.

Next steps (recommended)
------------------------
- After applying backfill, create a migration that sets `account_id` to NOT NULL for the targeted tables if appropriate.
- Add application-level enforcement (or DB triggers) to set `account_id` on INSERT to prevent future orphans.
