const {send,parseBody,requireSync,supabaseConfigured,supabase}=require('../_lib');
module.exports=async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!requireSync(req,res))return;
  if(!supabaseConfigured())return send(res,503,{error:'Supabase is not configured'});
  const ids=(parseBody(req).ids||[]).map(String).filter(Boolean);
  if(!ids.length)return send(res,400,{error:'ids must contain at least one outbox id'});
  try{
    const encoded=ids.map(id=>`"${id.replaceAll('"','')}"`).join(',');
    await supabase(`sync_outbox?id=in.(${encodeURIComponent(encoded)})`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{status:'completed',completed_at:new Date().toISOString()}});
    return send(res,200,{ok:true,acknowledged:ids.length});
  }catch(error){return send(res,error.status||500,{error:error.message,detail:error.detail||undefined});}
};
