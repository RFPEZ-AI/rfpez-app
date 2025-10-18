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

const env = readEnvFile('.env.local');
const SUPABASE_URL = (env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL || env.SUPABASE_HOST || 'http://127.0.0.1:54321').trim();
const ANON_KEY = (env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_ANON || env.ANON_KEY || '').trim();

if(!ANON_KEY) { console.error('Missing anon key in .env.local'); process.exit(1); }

const email = 'info@esphere.com';
const password = 'TestPassword';

(async ()=>{
  try{
    // Get token via password grant
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Accept': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const tokenJson = await tokenRes.json();
    if(!tokenJson || !tokenJson.access_token){
      console.error('No access_token returned:', tokenJson);
      process.exit(1);
    }
    const token = String(tokenJson.access_token).trim();
    console.log('Got token. Will fetch rfp id=1');

    const r = await fetch(`${SUPABASE_URL}/rest/v1/rfps?id=eq.1`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': ANON_KEY }
    });
    console.log('Status:', r.status);
    const txt = await r.text();
    try{
      console.log('Body (json):', JSON.parse(txt));
    }catch(e){
      console.log('Body (raw):', txt);
    }
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
