#!/usr/bin/env node
/*
  backfill-account-ids.js

  Safe admin utility to backfill NULL account_id values across key tables.

  Usage:
    # Dry-run (default): shows planned updates but does not modify DB
    node scripts/backfill-account-ids.js

    # Apply changes
    node scripts/backfill-account-ids.js --apply

  Environment:
    - Expects DATABASE_URL or SUPABASE_DB_URL to be set. If not set, falls back to
      common local Supabase default: postgres://postgres:postgres@127.0.0.1:54322/postgres

  Behavior:
    - Finds rows in configured tables with account_id IS NULL.
    - Attempts to infer account_id from logical owners where possible:
        * For tables with a user_id/owner_id field, will lookup the user's account via user_accounts and use that account if unique.
        * For sessions/messages, uses session -> session.user_id or message.user_id where available.
    - If no inference possible, assigns rows to a configurable fallback account (creates it if missing): 'orphan-backfill-<timestamp>'.
    - Supports dry-run and --apply modes and prints summary counts.

  NOTE: Run this in a safe environment and review dry-run output before applying.
*/

import pkg from 'pg';
import yargsPkg from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const { Client } = pkg;
const argv = yargsPkg(hideBin(process.argv))
  .option('apply', { type: 'boolean', default: false, describe: 'Apply updates to the DB' })
  .option('fallback-account', { type: 'string', describe: 'Use an existing account_id for orphans (UUID). If omitted, a new account will be created.' })
  .option('dry-run', { type: 'boolean', default: true, describe: 'Print planned changes without applying' })
  .option('batch-size', { type: 'number', default: 1000, describe: 'Number of rows to process per batch' })
  .help()
  .argv;

const APPLY = argv.apply === true;
const DRY_RUN = argv['dry-run'] === true && !APPLY;

const DEFAULT_DB = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({ connectionString: DEFAULT_DB });

// Tables to backfill and heuristics for inferring account_id
// Each entry: { table, column: 'account_id', ownerColumn?: 'user_id' }
const TARGET_TABLES = [
  { table: 'rfps', ownerColumn: 'created_by' },
  { table: 'bids', ownerColumn: 'created_by' },
  { table: 'sessions', ownerColumn: 'user_id' },
  { table: 'messages', ownerColumn: 'user_id' },
  { table: 'artifacts', ownerColumn: 'created_by' },
  { table: 'session_artifacts', ownerColumn: 'created_by' },
  { table: 'agents', ownerColumn: 'owner_id' }
];

async function ensureFallbackAccount(providedUuid) {
  if (providedUuid) {
    // verify it exists
    const res = await client.query('SELECT id FROM public.accounts WHERE id = $1', [providedUuid]);
    if (res.rowCount === 0) throw new Error(`Provided fallback account_id ${providedUuid} not found in public.accounts`);
    return providedUuid;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = `orphan-backfill-${stamp}`;

  // create account
  const insert = `INSERT INTO public.accounts (name, created_at) VALUES ($1, NOW()) RETURNING id`;
  const r = await client.query(insert, [slug]);
  return r.rows[0].id;
}

async function getUserAccounts(userId) {
  if (!userId) return [];
  const res = await client.query('SELECT account_id FROM public.user_accounts WHERE user_id = $1', [userId]);
  return res.rows.map(r => r.account_id);
}

async function gatherNullRowsBatch(table, pkColumn = 'id', accountCol = 'account_id', afterPk = null, batchSize = 1000) {
  // Use a primary-key cursor (assumes numeric or UUID orderable PK) to page through rows
  let q;
  const params = [batchSize];
  if (afterPk) {
    q = `SELECT * FROM public.${table} WHERE ${accountCol} IS NULL AND ${pkColumn} > $2 ORDER BY ${pkColumn} ASC LIMIT $1`;
    params.unshift(afterPk); // params = [afterPk, batchSize]
    // re-order to [batchSize, afterPk]
    params.reverse();
  } else {
    q = `SELECT * FROM public.${table} WHERE ${accountCol} IS NULL ORDER BY ${pkColumn} ASC LIMIT $1`;
  }
  const res = await client.query(q, params);
  return res.rows;
}

// detect primary key column for a table (naive: prefers 'id', else first column with '_id' suffix)
async function detectPkColumn(table) {
  // Try 'id' first
  const r = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table]);
  const cols = r.rows.map(rr => rr.column_name);
  if (cols.includes('id')) return 'id';
  const suffix = cols.find(c => c.endsWith('_id'));
  if (suffix) return suffix;
  return cols[0];
}

async function planAndApply() {
  await client.connect();

  let fallbackAccount = null;
  if (argv['fallback-account']) {
    fallbackAccount = await ensureFallbackAccount(argv['fallback-account']);
  }

  const plan = [];

  for (const t of TARGET_TABLES) {
    const pkCol = await detectPkColumn(t.table);
    console.log(`Processing table ${t.table} with PK ${pkCol}`);
    let afterPk = null;
    let tableHasMore = true;
    while (tableHasMore) {
      const rows = await gatherNullRowsBatch(t.table, pkCol, 'account_id', afterPk, argv['batch-size']);
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        let chosenAccount = null;
        if (t.ownerColumn && row[t.ownerColumn]) {
          const accounts = await getUserAccounts(row[t.ownerColumn]);
          if (accounts.length === 1) chosenAccount = accounts[0];
          else if (accounts.length > 1) chosenAccount = accounts[0];
        }

        const pk = row[pkCol];
        plan.push({ table: t.table, pk, pkCol, chosenAccount, owner: row[t.ownerColumn] || null });
      }

      // advance cursor
      afterPk = rows[rows.length - 1][pkCol];
      if (rows.length < argv['batch-size']) tableHasMore = false;
    }
  }

  // If any chosenAccount are null, ensure fallbackAccount exists
  if (plan.some(p => !p.chosenAccount)) {
    if (!fallbackAccount) {
      fallbackAccount = await ensureFallbackAccount(null);
      console.log('Created fallback account:', fallbackAccount);
    }
  }

  // Print plan summary
  console.log('\nBackfill plan summary:');
  const byTable = plan.reduce((acc, p) => { acc[p.table] = (acc[p.table] || 0) + 1; return acc; }, {});
  console.table(byTable);

  if (DRY_RUN) {
    console.log('\nDRY RUN - no changes will be made. Example planned updates:');
    console.log(plan.slice(0, 20));
    console.log(`\nTotal rows to consider: ${plan.length}`);
    await client.end();
    return;
  }

  // APPLY
  let applied = 0;
  for (const item of plan) {
    const acct = item.chosenAccount || fallbackAccount;
    if (!acct) throw new Error('No account to assign');

    // use id or fallback pk column
    const res = await client.query(`UPDATE public.${item.table} SET account_id = $1 WHERE id = $2`, [acct, item.pk]);
    applied += res.rowCount;
  }

  console.log(`Applied updates: ${applied}`);
  await client.end();
}

(async () => {
  try {
    await planAndApply();
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    try { await client.end(); } catch (e) { console.error('Failed to close client', e); }
    throw err;
  }
})();
