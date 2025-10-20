const { newDb } = require('pg-mem');

describe('backfill-account-ids', () => {
  test('fills null account_id values using user_accounts or fallback', async () => {
    const { runBackfill } = require('../scripts/backfill-account-ids.lib.cjs');

    const db = newDb({ autoCreateForeignKeyIndexes: true });
    const { Client } = db.adapters.createPg();

    // Initialize minimal schema (no pgcrypto extension)
    await db.public.none(`
      CREATE TABLE public.accounts (id uuid PRIMARY KEY, name text, created_at timestamptz);
      CREATE TABLE public.user_accounts (user_id uuid, account_id uuid);
      CREATE TABLE public.rfps (id uuid PRIMARY KEY, created_by uuid, account_id uuid);
    `);

    // Generate UUIDs in JS to avoid DB extension dependencies
    const { v4: uuidv4 } = require('uuid');
    const accountId = uuidv4();
    await db.public.none(`INSERT INTO public.accounts (id, name, created_at) VALUES ('${accountId}', 'acct1', NOW())`);
    const userId = uuidv4();
    await db.public.none(`INSERT INTO public.user_accounts (user_id, account_id) VALUES ('${userId}', '${accountId}')`);

    // Insert rfps: one with account_id NULL and created_by = userId, one with account_id NULL and no owner
    const rfp1 = uuidv4();
    const rfp2 = uuidv4();
    await db.public.none(`INSERT INTO public.rfps (id, created_by, account_id) VALUES ('${rfp1}', '${userId}', NULL)`);
    await db.public.none(`INSERT INTO public.rfps (id, created_by, account_id) VALUES ('${rfp2}', NULL, NULL)`);

    // Create a client and call runBackfill with apply=true
    const client = new Client();
    await client.connect();

    const res = await runBackfill(client, { apply: true, batchSize: 100 });
    expect(res.planCount).toBeGreaterThanOrEqual(2);
    expect(res.applied).toBeGreaterThanOrEqual(2);

    // Verify rows were updated
    const check1 = await client.query(`SELECT account_id FROM public.rfps WHERE id = $1`, [rfp1]);
    const check2 = await client.query(`SELECT account_id FROM public.rfps WHERE id = $1`, [rfp2]);
    expect(check1.rows[0].account_id).toBeDefined();
    expect(check2.rows[0].account_id).toBeDefined();

    await client.end();
  });
});
