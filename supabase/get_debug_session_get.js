const fetch = require('node-fetch');
const fs = require('fs');

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
const KONG_URL = process.env.KONG_URL || 'http://127.0.0.1:8000';

if(!ANON_KEY){
  console.error('Missing anon key in .env.local');
  process.exit(1);
}

const email = 'info@esphere.com';
const password = 'TestPassword';

async function getToken(){
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Accept': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const tokenJson = await tokenRes.json();
  if(!tokenJson || !tokenJson.access_token){
    throw new Error('No access_token returned: '+JSON.stringify(tokenJson));
  }
  return String(tokenJson.access_token).trim();
}

async function main(){
  const token = await getToken();
  console.log('Got token. Calling debug_session_get via Kong');
  const res = await fetch(`${KONG_URL}/rest/v1/debug_session_get`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': ANON_KEY }
  });
  console.log('Status:', res.status);
  try{
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  }catch(e){
    console.log('Non-JSON response');
    const text = await res.text();
    console.log(text);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
