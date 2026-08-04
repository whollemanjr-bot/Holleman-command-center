const {send,requireSync,supabaseConfigured,supabase}=require('../_lib');
module.exports=async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  if(!requireSync(req,res))return;
  if(!supabaseConfigured())return send(res,503,{error:'Supabase is not configured'});
  try{
    const rows=await supabase('sync_outbox?status=eq.pending&order=created_at.asc&limit=100&select=id,entity_type,action,payload,created_at');
    return send(res,200,{items:rows||[]});
  }catch(error){return send(res,error.status||500,{error:error.message,detail:error.detail||undefined});}
};
