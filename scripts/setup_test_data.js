#!/usr/bin/env node
// scripts/setup_test_data.js
// Non-interactive seeding script for policy tests.

const fs = require('fs');
const { spawnSync } = require('child_process');

function parseEnv(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

function runSync(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 30 * 1024 * 1024, ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr || `exit ${r.status}`);
  return r.stdout.trim();
}

function sqlEscape(s) {
  if (s == null) return '';
  return String(s).replace(/'/g, "''");
}

function extractUUID(s) {
  if (!s) return s;
  const m = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return m ? m[0] : s.trim();
}

(async function main() {
  try {
    const env = parseEnv('./.env.local');
    const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL;
    const ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !ANON_KEY) {
      console.error('Missing SUPABASE_URL or ANON_KEY in .env.local');
      process.exit(1);
    }

    const ts = Date.now();
    const users = {
      admin: `policy-admin-${ts}@example.com`,
      member: `policy-member-${ts}@example.com`,
      outsider: `policy-outsider-${ts}@example.com`,
    };
    const password = 'Password123!';

    console.log('Signing up test users via anon key (curl)...');
    for (const key of Object.keys(users)) {
      try {
        runSync('curl', ['-s', '-X', 'POST', '-H', 'Content-Type: application/json', '-H', `apikey: ${ANON_KEY}`, '-d', JSON.stringify({ email: users[key], password }), `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/signup`]);
      } catch (e) {
        console.warn(`signup ${key} may have failed:`, e.message);
      }
    }

    // detect DB container
    let db = '';
    try { db = runSync('bash', ['-lc', "docker ps --format '{{.Names}}' | grep supabase_db || true"] ); } catch (e) { db = ''; }
    if (!db) db = 'supabase_db_rfpez-app-local';
    console.log('Using DB container:', db);

    // query auth.users
    const q = `SELECT id, email FROM auth.users WHERE email IN ('${sqlEscape(users.admin)}','${sqlEscape(users.member)}','${sqlEscape(users.outsider)}');`;
    const usersRaw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-F', '|', '-c', q]);
    if (!usersRaw) {
      console.error('No rows returned from auth.users query. Ensure Supabase is running and signups succeeded.');
      process.exit(2);
    }

    const map = {};
    for (const line of usersRaw.split(/\r?\n/).filter(Boolean)) {
      const [id, email] = line.split('|');
      map[email] = id;
    }

  let adminId = map[users.admin];
  let memberId = map[users.member];
  let outsiderId = map[users.outsider];
  // sanitize auth user ids
  adminId = extractUUID(adminId);
  memberId = extractUUID(memberId);
  outsiderId = extractUUID(outsiderId);
    if (!adminId || !memberId || !outsiderId) {
      console.error('Missing one or more auth.user ids:', { adminId, memberId, outsiderId });
      process.exit(3);
    }

    // insert profiles
    console.log('Inserting user_profiles...');
    const inserts = [
      `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('${sqlEscape(adminId)}','${sqlEscape(users.admin)}','policy-admin','administrator');`,
      `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('${sqlEscape(memberId)}','${sqlEscape(users.member)}','policy-member','user');`,
      `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('${sqlEscape(outsiderId)}','${sqlEscape(users.outsider)}','policy-outsider','user');`,
    ];
    for (const s of inserts) {
      try { runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', s]); } catch (e) { console.warn('insert profile may have failed (ok if exists):', e.message); }
    }

    // create account + agent
    console.log('Creating account and agent...');
    const accountId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `INSERT INTO public.accounts (name) VALUES ('policy-test-account-${ts}') RETURNING id;`]);
    // detect which columns exist on public.agents
    const colsRaw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='agents';"]);
    const cols = new Set((colsRaw || '').split(/\r?\n/).filter(Boolean));
    const agentCols = ['name', 'description'];
    const agentVals = [`'policy-test-agent-${ts}'`, `'policy test'`];
    if (cols.has('account_id')) {
      agentCols.push('account_id');
      agentVals.push(`'${sqlEscape(accountId)}'`);
    }
    if (cols.has('instructions')) {
      agentCols.push('instructions');
      agentVals.push(`'${sqlEscape('Seed data: minimal agent instructions')}'`);
    }
    if (cols.has('initial_prompt')) {
      agentCols.push('initial_prompt');
      agentVals.push(`'${sqlEscape('Seed data: initial prompt')}'`);
    }
    if (cols.has('created_by')) {
      agentCols.push('created_by');
      agentVals.push('NULL');
    }
    const insertAgentSql = `INSERT INTO public.agents (${agentCols.join(',')}) VALUES (${agentVals.join(',')}) RETURNING id;`;
  let agentId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', insertAgentSql]);
  // sanitize possible extra psql output (e.g., INSERT 0 1) and extract first UUID-like token
  const accountIdSanitized = extractUUID(accountId);
  const agentIdSanitized = extractUUID(agentId);
  // overwrite with sanitized values for further use
  const accountIdClean = accountIdSanitized;
  const agentIdClean = agentIdSanitized;
    console.log('accountId', accountIdClean, 'agentId', agentIdClean);

    // persist seed ids so test harness can pick them deterministically
    try {
      const outDir = './temp';
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(`${outDir}/policy_seed.json`, JSON.stringify({ accountId: accountIdClean, agentId: agentIdClean }, null, 2), 'utf8');
      console.log('Wrote seed ids to', `${outDir}/policy_seed.json`);
    } catch (e) {
      console.warn('Could not write seed file:', e && e.message ? e.message : e);
    }

  let profAdminId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `SELECT id FROM public.user_profiles WHERE email='${sqlEscape(users.admin)}';`]);
  let profMemberId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `SELECT id FROM public.user_profiles WHERE email='${sqlEscape(users.member)}';`]);
  profAdminId = extractUUID(profAdminId);
  profMemberId = extractUUID(profMemberId);

    // link account_users (use auth user ids, since account_users.user_id FK points to users)
    try { runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.account_users (account_id, user_id, role) VALUES ('${sqlEscape(accountIdClean)}','${sqlEscape(adminId)}','admin');`]); } catch (e) { console.warn('account_users admin insert (ok if exists):', e.message); }
    try { runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.account_users (account_id, user_id, role) VALUES ('${sqlEscape(accountIdClean)}','${sqlEscape(memberId)}','member');`]); } catch (e) { console.warn('account_users member insert (ok if exists):', e.message); }

    // run test harness
    console.log('Running test harness...');
    try {
      const out = runSync('node', ['./scripts/test_agents_policies.js']);
      console.log(out);
    } catch (e) {
      console.error('Test harness failed:', e.message);
      process.exit(1);
    }

    console.log('Setup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error in setup_test_data:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();