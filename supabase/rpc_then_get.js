const fs=require('fs'); const fetch=require('node-fetch');
const token = fs.readFileSync('supabase/.token.txt','utf8').trim();
const ANON = (fs.readFileSync('.env.local','utf8').split('\n').find(l=>l.startsWith('REACT_APP_SUPABASE_ANON_KEY')).split('=')[1]).trim();
(async ()=>{
  const rpc = await fetch('http://127.0.0.1:54321/rest/v1/rpc/debug_session_info',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,'apikey':ANON}});
  console.log('RPC status',rpc.status); console.log(await rpc.text());
  const get = await fetch('http://127.0.0.1:54321/rest/v1/rfps?id=eq.1',{headers:{'Authorization':`Bearer ${token}`,'apikey':ANON}});
  console.log('GET status', get.status); console.log(await get.text());
})();
