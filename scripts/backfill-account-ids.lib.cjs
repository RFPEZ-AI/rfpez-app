// CommonJS wrapper of the backfill library for test compatibility with Jest CJS runner
module.exports.runBackfill = async function runBackfill(client, opts = {}) {
  const { apply = false, fallbackAccountId = null, batchSize = 1000 } = opts;

  const TARGET_TABLES = [
    { table: 'rfps', ownerColumn: 'created_by' },
    { table: 'bids', ownerColumn: 'created_by' },
    { table: 'sessions', ownerColumn: 'user_id' },
    { table: 'messages', ownerColumn: 'user_id' },
    { table: 'artifacts', ownerColumn: 'created_by' },
    { table: 'session_artifacts', ownerColumn: 'created_by' },
    { table: 'agents', ownerColumn: 'owner_id' }
  ];

  async function detectPkColumn(table) {
    const r = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1", [table]);
    const cols = r.rows.map(rr => rr.column_name);
    if (cols.includes('id')) return 'id';
    const suffix = cols.find(c => c.endsWith('_id'));
    if (suffix) return suffix;
    return cols[0];
  }

  async function getUserAccounts(userId) {
    if (!userId) return [];
    const res = await client.query('SELECT account_id FROM public.user_accounts WHERE user_id = $1', [userId]);
    return res.rows.map(r => r.account_id);
  }

  async function ensureFallbackAccount(providedUuid) {
    if (providedUuid) {
      const res = await client.query('SELECT id FROM public.accounts WHERE id = $1', [providedUuid]);
      if (res.rowCount === 0) throw new Error(`Provided fallback account_id ${providedUuid} not found`);
      return providedUuid;
    }
    const { v4: uuidv4 } = require('uuid');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const slug = `orphan-backfill-${stamp}`;
    const id = uuidv4();
    const insert = `INSERT INTO public.accounts (id, name, created_at) VALUES ($1, $2, NOW()) RETURNING id`;
    const r = await client.query(insert, [id, slug]);
    return r.rows[0].id || id;
  }

  async function gatherNullRowsBatch(table, pkColumn = 'id', accountCol = 'account_id', afterPk = null, batchSizeLocal = 1000) {
    let q;
    const params = [];
    if (afterPk) {
      q = `SELECT * FROM public.${table} WHERE ${accountCol} IS NULL AND ${pkColumn} > $1 ORDER BY ${pkColumn} ASC LIMIT $2`;
      params.push(afterPk, batchSizeLocal);
    } else {
      q = `SELECT * FROM public.${table} WHERE ${accountCol} IS NULL ORDER BY ${pkColumn} ASC LIMIT $1`;
      params.push(batchSizeLocal);
    }
    const res = await client.query(q, params);
    return res.rows;
  }

  const plan = [];
  let fallbackAccount = fallbackAccountId || null;

  for (const t of TARGET_TABLES) {
    // skip table if it doesn't exist
    const existsRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = $1",
      [t.table]
    );
    if (existsRes.rowCount === 0) continue;
    const pkCol = await detectPkColumn(t.table);
    let afterPk = null;
    let tableHasMore = true;
    while (tableHasMore) {
      const rows = await gatherNullRowsBatch(t.table, pkCol, 'account_id', afterPk, batchSize);
      if (!rows || rows.length === 0) break;
      for (const row of rows) {
        let chosenAccount = null;
        if (t.ownerColumn && row[t.ownerColumn]) {
          const accounts = await getUserAccounts(row[t.ownerColumn]);
          if (accounts.length === 1) chosenAccount = accounts[0];
          else if (accounts.length > 1) chosenAccount = accounts[0];
        }
        plan.push({ table: t.table, pk: row[pkCol], pkCol, chosenAccount, owner: row[t.ownerColumn] || null });
      }
      afterPk = rows[rows.length - 1][pkCol];
      if (rows.length < batchSize) tableHasMore = false;
    }
  }

  if (plan.some(p => !p.chosenAccount)) {
    if (!fallbackAccount) fallbackAccount = await ensureFallbackAccount(null);
  }

  const result = { planCount: plan.length, applied: 0, fallbackAccount };

  if (!apply) {
    return { ...result, plan: plan.slice(0, 100) };
  }

  for (const item of plan) {
    const acct = item.chosenAccount || fallbackAccount;
    if (!acct) throw new Error('No account to assign');
    await client.query(`UPDATE public.${item.table} SET account_id = $1 WHERE ${item.pkCol} = $2`, [acct, item.pk]);
    result.applied += 1;
  }

  return result;
};
