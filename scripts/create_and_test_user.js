const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

function parseEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      // remove surrounding quotes
      if ((val.startsWith("\'") && val.endsWith("\'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      env[m[1]] = val;
    }
  }
  return env;
}

(async function main(){
  try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    const env = parseEnv(envPath);
    const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL || 'http://127.0.0.1:54321';
    const ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    if (!ANON_KEY) {
      console.error('Missing anon key in .env.local. Aborting');
      process.exit(2);
    }

    const email = 'info@esphere.com';
    const password = 'TestPassword';

    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Creating user', email, 'via /auth/v1/signup');

    const signupResp = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ email, password })
    });
    const signupJson = await signupResp.json().catch(()=>null);
    console.log('signup status', signupResp.status);
    console.log('signup response sample:', JSON.stringify(signupJson).slice(0,1000));

    let access_token = signupJson && (signupJson.access_token || (signupJson && signupJson?.user?.aud && signupJson?.access_token));

    if (!access_token) {
      console.log('No access token returned from signup — attempting to sign in (token)');
      // try token endpoint
      const tokenResp = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({ email, password })
      });
      const tokenJson = await tokenResp.json().catch(()=>null);
      console.log('token status', tokenResp.status);
      console.log('token response sample:', JSON.stringify(tokenJson).slice(0,1000));
      access_token = tokenJson && (tokenJson.access_token || tokenJson.access_token);
    }

    if (!access_token) {
      console.warn('Could not obtain an access token for the test user. If signup requires email confirmation the token might not be returned. Continuing with anonymous tests (will behave as anon).');
    } else {
      console.log('Obtained access token (length):', access_token.length);
    }

    const bearer = access_token ? `Bearer ${access_token}` : `Bearer ${ANON_KEY}`;

    console.log('\n=== Testing agents access as test user ===');
    const agentsRes = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/agents?select=*&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': bearer
      }
    });
    console.log('agents status', agentsRes.status);
    const agents = await agentsRes.text();
    console.log('agents body (truncated):', agents.slice(0,1000));

    console.log('\n=== Testing user_profiles access as test user ===');
    const profilesRes = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/user_profiles?select=*&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': bearer
      }
    });
    console.log('user_profiles status', profilesRes.status);
    const profiles = await profilesRes.text();
    console.log('user_profiles body (truncated):', profiles.slice(0,1000));

    console.log('\n=== Testing sessions (sensitive table) access as test user ===');
    const sessionsRes = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/sessions?select=*&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': bearer
      }
    });
    console.log('sessions status', sessionsRes.status);
    const sessions = await sessionsRes.text();
    console.log('sessions body (truncated):', sessions.slice(0,1000));

    console.log('\nDone. Interpretation guidance:');
    console.log('- agents status 200 and non-empty => user can read agents (expected).');
    console.log('- user_profiles / sessions should be 403 or empty result if RLS blocks access. If you see rows, RLS may be misconfigured.');

  } catch (err) {
    console.error('Error running test script:', err);
    process.exit(3);
  }
})();
