const {send,requireUser,supabaseConfigured,supabase}=require('../_lib');
module.exports=async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  if(!requireUser(req,res))return;
  if(!supabaseConfigured())return send(res,503,{error:'Supabase is not configured'});
  try{
    const runs=await supabase('sync_runs?source=eq.apple-shortcut&order=completed_at.desc&limit=1&select=*');
    const pending=await supabase('sync_outbox?status=eq.pending&select=id');
    return send(res,200,{lastRun:runs?.[0]||null,pendingOutbox:pending?.length||0});
  }catch(error){return send(res,error.status||500,{error:error.message});}
};
