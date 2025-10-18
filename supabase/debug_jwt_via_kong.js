const fs = require('fs');
const fetch = require('node-fetch');

function readEnvFile(path){
  const out = {};
  if(!fs.existsSync(path)) return out;
  for(const line of fs.readFileSync(path,'utf8').split(/\r?\n/)){
    if(!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if(idx === -1) continue;
    const k = line.slice(0,idx).trim();
    const v = line.slice(idx+1).trim();
    out[k]=v;
  }
  return out;
}

(async ()=>{
  try{
    const env = readEnvFile('.env.local');
    const SUPABASE_URL = (env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL || env.SUPABASE_HOST || 'http://127.0.0.1:54321').trim();
    const ANON_KEY = (env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_ANON || env.ANON_KEY || '').trim();
    if(!ANON_KEY){ console.error('Missing anon key in .env.local'); process.exit(1); }

    const email = 'info@esphere.com';
    const password = 'TestPassword';

    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Accept': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const tokenJson = await tokenRes.json();
    if(!tokenJson || !tokenJson.access_token){ console.error('No access_token returned:', tokenJson); process.exit(1); }
    const token = String(tokenJson.access_token).trim();
    console.log('\n=== TOKEN (full) ===\n', token, '\n');

    // Call auth/v1/user to get user info (direct to auth service through gateway)
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': ANON_KEY }
    });
    const userTxt = await userRes.text();
    console.log('\n=== /auth/v1/user status', userRes.status, '===\n', userTxt);

    // Call RPC debug_jwt via the gateway (Kong) - PostgREST RPCs are under /rest/v1/rpc/
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/debug_jwt`,{
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': ANON_KEY }
    });
    const rpcTxt = await rpcRes.text();
    console.log('\n=== RPC /rpc/debug_jwt RESPONSE status', rpcRes.status, '===\n');
    try{ console.log(JSON.parse(rpcTxt)); }catch(e){ console.log(rpcTxt); }

    // Try a direct REST request to rfps via the gateway
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rfps?id=eq.1`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': ANON_KEY }
    });
    console.log('\n=== GET /rest/v1/rfps status', r.status, '===');
    const txt = await r.text();
    try{ console.log(JSON.parse(txt)); }catch(e){ console.log(txt); }

  }catch(err){ console.error(err); process.exit(1); }
})();
