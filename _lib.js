const crypto = require('crypto');

function send(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(body));
}
function parseBody(req){
  if(!req.body)return {};
  if(typeof req.body==='object')return req.body;
  try{return JSON.parse(req.body);}catch{return {};}
}
function safeEqual(a,b){
  const left=Buffer.from(String(a||''));const right=Buffer.from(String(b||''));
  return left.length===right.length && crypto.timingSafeEqual(left,right);
}
function base64url(value){return Buffer.from(value).toString('base64url');}
function signToken(payload){
  const secret=process.env.APP_SECRET;
  if(!secret)throw new Error('APP_SECRET is not configured');
  const encoded=base64url(JSON.stringify(payload));
  const signature=crypto.createHmac('sha256',secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}
function verifyToken(token){
  try{
    const [encoded,signature]=String(token||'').split('.');
    if(!encoded||!signature||!process.env.APP_SECRET)return null;
    const expected=crypto.createHmac('sha256',process.env.APP_SECRET).update(encoded).digest('base64url');
    if(!safeEqual(signature,expected))return null;
    const payload=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
    if(!payload.exp || Date.now()>payload.exp)return null;
    return payload;
  }catch{return null;}
}
function bearer(req){return String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');}
function requireUser(req,res){const payload=verifyToken(bearer(req));if(!payload){send(res,401,{error:'Unauthorized'});return null;}return payload;}
function requireSync(req,res){
  const supplied=req.headers['x-sync-token']||bearer(req);
  if(!process.env.APPLE_SYNC_TOKEN || !safeEqual(supplied,process.env.APPLE_SYNC_TOKEN)){send(res,401,{error:'Invalid sync token'});return false;}
  return true;
}
function supabaseConfigured(){return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);}
async function supabase(path,{method='GET',body,headers={}}={}){
  if(!supabaseConfigured())throw Object.assign(new Error('Supabase is not configured'),{status:503});
  const response=await fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`,{
    method,
    headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',...headers},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();
  let parsed=null;try{parsed=text?JSON.parse(text):null;}catch{parsed=text;}
  if(!response.ok)throw Object.assign(new Error(parsed?.message||parsed?.error||`Supabase request failed (${response.status})`),{status:response.status,detail:parsed});
  return parsed;
}
module.exports={send,parseBody,safeEqual,signToken,verifyToken,bearer,requireUser,requireSync,supabaseConfigured,supabase};
