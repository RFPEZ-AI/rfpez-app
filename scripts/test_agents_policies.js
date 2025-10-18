const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const fetch = global.fetch || require('node-fetch');

function runSync(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 30 * 1024 * 1024, ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

function detectDbContainer() {
  try {
    const out = runSync('bash', ['-lc', "docker ps --format '{{.Names}}' | grep supabase_db || true"]);
    if (out) return out.split(/\r?\n/)[0];
  } catch (e) {}
  return 'supabase_db_rfpez-app-local';
}

function extractUUID(s) {
  if (!s) return s;
  const m = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return m ? m[0] : s.trim();
}

function sqlEscape(s) { if (s == null) return ''; return String(s).replace(/'/g, "''"); }

function parseEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
      env[m[1]] = val;
    }
  }
  return env;
}

async function callRest(url, method = 'GET', body = null, key) {
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text().catch(()=>null);
  return { status: res.status, body: text };
}

function safeParse(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

async function signUpUser(supabaseUrl, anonKey, email, password) {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password })
  });
  return res.json().catch(()=>null);
}

async function signInUser(supabaseUrl, anonKey, email, password) {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
    body: JSON.stringify({ email, password })
  });
  return res.json().catch(()=>null);
}

(async function main(){
  try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    const env = parseEnv(envPath);
    const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL || 'http://127.0.0.1:54321';
    const ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

    if (!ANON_KEY) {
      console.error('Missing anon key in .env.local. Aborting');
      process.exit(2);
    }
    if (!SERVICE_ROLE_KEY) {
      console.warn('No service role key found in .env.local. The script will still attempt read-only tests but cannot create accounts/profiles.');
    }

    console.log('Using SUPABASE_URL:', SUPABASE_URL);
  console.log('SERVICE_ROLE_KEY present:', !!SERVICE_ROLE_KEY);

    // Initialize test ids (may be populated by seed file below)
    let testAccountId = null;
    let agentId = null;

    // If seed file exists, prefer those ids
    try {
      const seedPath = path.resolve(__dirname, '..', 'temp', 'policy_seed.json');
      if (fs.existsSync(seedPath)) {
        const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (seed && seed.accountId) testAccountId = seed.accountId;
        if (seed && seed.agentId) agentId = seed.agentId;
        console.log('Loaded seed ids from', seedPath, 'accountId', testAccountId, 'agentId', agentId);
      }
    } catch (e) { /* ignore */ }
    if (SERVICE_ROLE_KEY && !testAccountId) {
      console.log('Creating a test account...');
      const acct = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/accounts`, 'POST', { name: 'policy-test-account' }, SERVICE_ROLE_KEY);
      if (acct.status === 201) {
          const parsed = safeParse(acct.body);
          testAccountId = parsed ? parsed.id : null;
          console.log('Created account id', testAccountId);
        } else {
          // Attempt to find an existing account via REST
          const list = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/accounts?select=*&limit=1`, 'GET', null, SERVICE_ROLE_KEY);
          if (list.status === 200) {
            const parsed = safeParse(list.body);
            if (parsed && parsed.length) testAccountId = parsed[0].id;
          }
          // If still not found (permission issues), try psql fallback
          if (!testAccountId) {
            console.warn('Service role REST failed to list/create accounts; attempting psql fallback');
            const db = detectDbContainer();
            try {
              const a = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', "SELECT id FROM public.accounts ORDER BY created_at DESC LIMIT 1;"]); 
              testAccountId = extractUUID(a);
              console.log('Found account id via psql fallback', testAccountId);
            } catch (e) { console.warn('psql fallback failed to find account:', e && e.message ? e.message : e); }
          }
          console.log('Using existing account id', testAccountId);
        }
    }

  // Create an agent associated with the account (if we have service role)
    if (SERVICE_ROLE_KEY && testAccountId && !agentId) {
      const agentBody = { name: 'Test Agent Policy', description: 'Agent for policy test', created_by: null, account_id: testAccountId };
      const agentRes = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/agents`, 'POST', agentBody, SERVICE_ROLE_KEY);
      console.log('Create agent status', agentRes.status);
      if (agentRes.status === 201) {
        const parsed = safeParse(agentRes.body);
        agentId = parsed ? parsed.id : null;
        console.log('Created agent', agentId);
      } else {
        console.log('Agent create response', agentRes.body);
        // try psql fallback to find any agent
        if (!agentId) {
          console.warn('Service role REST failed to create/find agent; attempting psql fallback');
          const db = detectDbContainer();
          try {
            const a = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', "SELECT id FROM public.agents ORDER BY created_at DESC LIMIT 1;"]); 
            agentId = extractUUID(a);
            console.log('Found agent id via psql fallback', agentId);
          } catch (e) { console.warn('psql fallback failed to find agent:', e && e.message ? e.message : e); }
        }
      }
  console.log('agentId after create/find step:', agentId);
    // If still no agentId, try psql to pick the most recent agent row and set agentId
    if (!agentId) {
      try {
        const db = detectDbContainer();
        const raw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', "SELECT id,name,description FROM public.agents ORDER BY created_at DESC LIMIT 1;"]); 
        if (raw) {
          const parts = raw.split('|');
          agentId = extractUUID(parts[0]);
          console.log('psql fallback selected agentId', agentId, 'name', parts[1]);
        }
      } catch (e) { console.warn('psql fallback to select agent failed:', e && e.message ? e.message : e); }
    }
    }

    // Create three users: admin, member, outsider (if service role available)
    const users = [
      { email: `policy-admin+${Date.now()}@example.com`, password: 'Password123!', role: 'administrator' },
      { email: `policy-member+${Date.now()}@example.com`, password: 'Password123!', role: 'user' },
      { email: `policy-outsider+${Date.now()}@example.com`, password: 'Password123!', role: 'user' }
    ];

    const created = [];
    for (const u of users) {
      console.log('Signing up', u.email);
      const signup = await signUpUser(SUPABASE_URL, ANON_KEY, u.email, u.password);
      console.log('signup result', (signup && signup?.user) ? 'ok' : JSON.stringify(signup).slice(0,200));
      // Sign in to get access token and auth user id
      const token = await signInUser(SUPABASE_URL, ANON_KEY, u.email, u.password);
      const access = token && (token.access_token || token.access_token);
      // token.user.id contains the auth.users id (supabase user id)
      const authUserId = token && token.user && (token.user.id || token.user.sub) ? (token.user.id || token.user.sub) : null;
      created.push({ ...u, access_token: access, auth_user_id: authUserId });
    }

    if (!SERVICE_ROLE_KEY) {
      console.log('\nNo service role key, skipping creation of user_profiles and account_users. Running read-only checks for agents SELECT.');
      // Test agents read access for the first created user
      const bearer = created[0].access_token ? `Bearer ${created[0].access_token}` : `Bearer ${ANON_KEY}`;
      const agentsRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/agents?select=*&limit=5`, { headers: { 'apikey': ANON_KEY, 'Authorization': bearer } });
      console.log('agents status as test user', agentsRes.status);
      const body = await agentsRes.text();
      console.log('agents body', body.slice(0,1000));
      process.exit(0);
    }

    // With service role key: create user_profiles and account membership
    const profileResults = [];
    for (let i = 0; i < created.length; i++) {
      const u = created[i];
      // prefer the auth_user_id captured immediately after sign-in
      const authUserId = created[i] && created[i].auth_user_id ? created[i].auth_user_id : null;

      // create user_profiles entry via REST (may be denied) - include supabase_user_id when known
      const profile = { supabase_user_id: authUserId, email: u.email, full_name: u.email.split('@')[0], role: u.role };
      const profRes = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/user_profiles`, 'POST', profile, SERVICE_ROLE_KEY);
      console.log('create user_profile status', profRes.status, 'body', profRes.body && profRes.body.slice(0,200));
      profileResults.push({ email: u.email, status: profRes.status });
    }

    // If REST creation failed (permissions), fallback to psql to insert user_profiles and account_users
    const needPsqlFallback = profileResults.some(r => r.status && r.status >= 400);
    if (needPsqlFallback) {
      console.warn('REST inserts for user_profiles failed; attempting psql fallback to create profiles and account_users');
      const db = detectDbContainer();
      // map auth.users by email
  const q = `SELECT id,email FROM auth.users WHERE email IN (${created.map(u=>`'${sqlEscape(u.email)}'`).join(',')});`;
      let usersRaw = null;
      try { usersRaw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', q]); } catch (e) { console.warn('psql query auth.users failed:', e && e.message ? e.message : e); }
      const authMap = {};
      if (usersRaw) {
        for (const line of usersRaw.split(/\r?\n/).filter(Boolean)) {
          const [id,email] = line.split('|');
          authMap[email] = extractUUID(id);
        }
      }
      // insert user_profiles via psql
      for (const u of created) {
        const aid = authMap[u.email] || null;
        const supabaseUserId = aid ? aid : 'NULL';
  const sql = `INSERT INTO public.user_profiles (supabase_user_id, email, full_name, role) VALUES (${supabaseUserId==='NULL' ? 'NULL' : `'${sqlEscape(aid)}'`}, '${sqlEscape(u.email)}', '${sqlEscape(u.email.split('@')[0])}', '${sqlEscape(u.role)}') ON CONFLICT (email) DO UPDATE SET supabase_user_id = COALESCE(public.user_profiles.supabase_user_id, EXCLUDED.supabase_user_id);`;
        try { runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', sql]); } catch (e) { console.warn('psql insert user_profiles failed:', e && e.message ? e.message : e); }
      }

      // Ensure we have an account id
      if (!testAccountId) {
        try {
          const a = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', "SELECT id FROM public.accounts ORDER BY created_at DESC LIMIT 1;"]); 
          testAccountId = extractUUID(a);
          console.log('psql-found account id', testAccountId);
        } catch (e) { console.warn('psql could not find account id:', e && e.message ? e.message : e); }
      }

      // Insert account_users linking auth user ids to account (account_users.user_id FK points to users.id or user_profiles.id depending on schema; try both)
      for (const u of created) {
        const aid = authMap[u.email] || null;
        if (!testAccountId || !aid) continue;
        const sql2 = `INSERT INTO public.account_users (account_id, user_id, role) VALUES ('${testAccountId}','${aid}','${u.role==='administrator' ? 'admin' : 'member'}') ON CONFLICT DO NOTHING;`;
        try { runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', sql2]); } catch (e) { console.warn('psql insert account_users failed:', e && e.message ? e.message : e); }
      }
    }

  // CLI flags
  const args = process.argv.slice(2 || 0);
  const skipAccountUsers = args.includes('--skip-account-users');

  // Make member a member of the account (skip if requested for deterministic runs)
  if (testAccountId && !skipAccountUsers) {
      // Cleanup any bad account_user rows that use placeholder/zero UUIDs which would incorrectly grant membership
      try {
        const db = detectDbContainer();
        runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', "DELETE FROM public.account_users WHERE user_id IS NULL OR user_id::text LIKE '00000000-%' OR user_id = '00000000-0000-0000-0000-000000000001';"]);
        console.log('Cleaned suspicious account_users with zero-like user_ids (if any)');
      } catch (e) { /* ignore cleanup errors */ }
      // Find a user_profile id to use for account_users join (simple heuristic: pick any user_profiles row)
      let profiles = [];
      const profilesList = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/user_profiles?select=*&limit=10`, 'GET', null, SERVICE_ROLE_KEY);
      if (profilesList.status === 200) {
        profiles = safeParse(profilesList.body) || [];
      }
      console.log('user_profiles count (service role)', profiles.length);
      // If REST returned nothing (permission issues), try psql fallback to read public.user_profiles
      if ((!profiles || profiles.length === 0)) {
        console.warn('REST could not read user_profiles; attempting psql fallback to read inserted profiles');
        try {
          const db = detectDbContainer();
          const raw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', "SELECT id,email,role FROM public.user_profiles ORDER BY created_at DESC LIMIT 50;"]);
          if (raw) {
            profiles = raw.split(/\r?\n/).filter(Boolean).map(line => {
              const [id,email,role] = line.split('|');
              return { id: extractUUID(id), email, role };
            });
          }
          console.log('psql user_profiles count', profiles.length);
        } catch (e) { console.warn('psql fallback read user_profiles failed:', e && e.message ? e.message : e); }
      }
      const memberProfile = profiles.find(p => p.role === 'user');
      const adminProfile = profiles.find(p => p.role === 'administrator');
      // Create account_users deterministically for the admin and member users created in this run
      try {
        // find created entries by role
        const adminCreated = created.find(c => c.role === 'administrator');
        const memberCreated = created.find(c => c.role === 'user');
        if (memberCreated && memberCreated.auth_user_id) {
          const accountUser = { account_id: testAccountId, user_id: memberCreated.auth_user_id, role: 'member' };
          const auRes = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/account_users`, 'POST', accountUser, SERVICE_ROLE_KEY);
          console.log('create account_user status', auRes.status);
        }
        if (adminCreated && adminCreated.auth_user_id) {
          const accountUser = { account_id: testAccountId, user_id: adminCreated.auth_user_id, role: 'admin' };
          const auRes = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/account_users`, 'POST', accountUser, SERVICE_ROLE_KEY);
          console.log('create account_user for admin status', auRes.status);
        }
      } catch (e) { console.warn('deterministic account_user creation failed:', e && e.message ? e.message : e); }
    } else if (skipAccountUsers) {
      console.log('Skipping creation of account_users due to --skip-account-users flag');
    }

    // Now test write permissions against the created agent (or create a new agent to test against)
    let testAgent = null;
    if (agentId) {
      console.log('Attempting REST GET for agent id', agentId);
      const agentRes = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/agents?id=eq.${agentId}&select=*`, 'GET', null, SERVICE_ROLE_KEY);
      console.log('agent GET status', agentRes.status, 'body_len', agentRes.body ? agentRes.body.length : 0);
      try { console.log('agent GET body snippet', (agentRes.body || '').slice(0,400)); } catch(e){}
      if (agentRes.status === 200) {
        let parsed = null;
        try { parsed = JSON.parse(agentRes.body); } catch(e) { parsed = null; }
        if (parsed && parsed.length) {
          testAgent = parsed[0];
          console.log('Found testAgent via REST GET', testAgent.id);
        } else {
          console.log('REST GET returned 200 but no agent rows');
        }
      } else {
        console.log('REST GET for agent returned status', agentRes.status);
      }
    }
    if (!testAgent && SERVICE_ROLE_KEY) {
      const agentBody = { name: 'policy-test-agent-2', description: 'policy test agent', account_id: testAccountId };
      const acreate = await callRest(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/agents`, 'POST', agentBody, SERVICE_ROLE_KEY);
      if (acreate.status === 201) testAgent = JSON.parse(acreate.body);
    }

    // As a last resort, if we still don't have a testAgent, try reading it directly from Postgres via psql
    if (!testAgent && agentId) {
      try {
        const db = detectDbContainer();
        const raw = runSync('docker', ['exec', '-i', db, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', `SELECT id,name,description FROM public.agents WHERE id='${agentId}' LIMIT 1;`]);
        if (raw) {
          const [id,name,description] = raw.split('|');
          testAgent = { id: extractUUID(id), name, description };
          console.log('Loaded testAgent via psql fallback', testAgent.id);
        }
      } catch (e) { console.warn('psql fallback read agent failed:', e && e.message ? e.message : e); }
    }

    if (!testAgent) {
      console.error('No agent found or created to test against; aborting.');
      process.exit(4);
    }

    console.log('Testing write operations against agent id', testAgent.id);

    // For each created user, attempt to update agent name via REST as that user
    const perUserResults = [];
    for (const u of created) {
      const bearer = u.access_token ? `Bearer ${u.access_token}` : `Bearer ${ANON_KEY}`;
      // Request the updated representation so we can tell if the row was actually modified.
      const updateRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/agents?id=eq.${testAgent.id}`, {
        method: 'PATCH',
        headers: { 'apikey': ANON_KEY, 'Authorization': bearer, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ name: `updated-by-${u.email.split('@')[0]}` })
      });
      const updateBodyText = await updateRes.text().catch(()=>null);
      let updateBody = null;
      try { updateBody = updateBodyText ? JSON.parse(updateBodyText) : null; } catch(e) { updateBody = updateBodyText; }
      console.log(`user ${u.email} PATCH status`, updateRes.status);
      console.log('returned', Array.isArray(updateBody) ? (updateBody[0] && updateBody[0].id ? `updated id=${updateBody[0].id}` : JSON.stringify(updateBody).slice(0,200)) : (String(updateBody).slice(0,200)));
      // Consider the write allowed if the server returned the updated representation (status 200 and body contains the row)
      const allowed = updateRes.status === 200 && Array.isArray(updateBody) && updateBody.length > 0;
      perUserResults.push({ email: u.email, role: u.role, status: updateRes.status, allowed, body: updateBody });
    }

    const out = {
      timestamp: new Date().toISOString(),
      accountId: testAccountId,
      agentId: agentId,
      testAgent: testAgent ? testAgent.id : null,
      results: perUserResults
    };
    try {
      const outPath = path.resolve(__dirname, '..', 'temp', 'policy_test_results.json');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
      console.log('Wrote policy test results to', outPath);
    } catch (e) { console.warn('Failed to write results file', e && e.message ? e.message : e); }

    console.log('\nDone policy tests. Interpret results: 2xx on PATCH means write allowed; 4xx/403 means blocked per RLS.');

  } catch (err) {
    console.error('Test runner error', err);
    process.exit(3);
  }
})();
