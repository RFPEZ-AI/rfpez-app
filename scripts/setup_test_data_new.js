#!/usr/bin/env node
// setup_test_data_new.js - minimal synchronous script (safe copy)

const fs = require('fs');
const { spawnSync } = require('child_process');

function parseEnv(path) {
  const txt = fs.readFileSync(path, 'utf8');
  return txt.split(/\r?\n/).reduce((acc, line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!m) return acc;
    let v = m[2].trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    acc[m[1]] = v;
    return acc;
  }, {});
}

function runSync(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 30 * 1024 * 1024 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr || `exit ${r.status}`);
  return r.stdout.trim();
}

function curlSignup(url, email, password, anonKey) {
  const data = JSON.stringify({ email, password });
  const args = ['-s', '-X', 'POST', '-H', 'Content-Type: application/json', '-H', `apikey: ${anonKey}`, '-d', data, url];
  return runSync('curl', args);
}

(function main() {
  try {
    const env = parseEnv('.env.local');
    const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL;
    const ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !ANON_KEY) throw new Error('Missing SUPABASE_URL or ANON_KEY in .env.local');

    const ts = Date.now();
    const emails = {
      admin: `policy-admin-${ts}@example.com`,
      member: `policy-member-${ts}@example.com`,
      outsider: `policy-outsider-${ts}@example.com`,
    };
    const password = 'Password123!';

    console.log('Signing up test users via anon key');
    for (const k of Object.keys(emails)) {
      const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/signup`;
      const res = curlSignup(url, emails[k], password, ANON_KEY);
      console.log(`signup ${k}:`, res ? 'ok' : 'failed');
    }

    // detect DB container name
    let db = '';
    try { db = runSync('bash', ['-lc', "docker ps --format '{{.Names}}' | grep supabase_db || true"] ); } catch (e) { db = ''; }
    if (!db) db = 'supabase_db_rfpez-app-local';
    console.log('Using DB container:', db);

    const sql = `SELECT id, email FROM auth.users WHERE email IN ('${emails.admin.replace(/'/g, "''")}', '${emails.member.replace(/'/g, "''")}', '${emails.outsider.replace(/'/g, "''")}');`;
    const usersRaw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-F', '|', '-c', sql]);
    if (!usersRaw) throw new Error('auth.users query returned nothing');

    const map = {};
    for (const line of usersRaw.split(/\r?\n/).filter(Boolean)) {
      const [id, email] = line.split('|');
      map[email] = id;
    }

    const adminId = map[emails.admin];
    const memberId = map[emails.member];
    const outId = map[emails.outsider];
    if (!adminId || !memberId || !outId) throw new Error('Could not find created auth.users: ' + JSON.stringify(map));

    console.log('Inserting user_profiles...');
    runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('${adminId}', '${emails.admin}', 'admin', 'administrator');`]);
    runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('${memberId}', '${emails.member}', 'member', 'user');`]);
    runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES ('${outId}', '${emails.outsider}', 'outsider', 'user');`]);

    console.log('Creating account and agent...');
    const accountId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `INSERT INTO public.accounts (name) VALUES ('policy-test-account-${ts}') RETURNING id;`]);
    const agentId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `INSERT INTO public.agents (name, description, account_id, created_by) VALUES ('policy-test-agent-${ts}', 'policy agent', '${accountId}', NULL) RETURNING id;`]);

    const profAdminId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `SELECT id FROM public.user_profiles WHERE email='${emails.admin}';`]);
    const profMemberId = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `SELECT id FROM public.user_profiles WHERE email='${emails.member}';`]);

    console.log('Linking users to account...');
    runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.account_users (account_id, user_id, role) VALUES ('${accountId}', '${profAdminId}', 'admin');`]);
    runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', `INSERT INTO public.account_users (account_id, user_id, role) VALUES ('${accountId}', '${profMemberId}', 'member');`]);

    console.log('Running test harness');
    const out = runSync('node', ['./scripts/test_agents_policies.js']);
    console.log(out);
    console.log('Finished');
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
