const {send,parseBody,requireUser,supabaseConfigured,supabase}=require('./_lib');
module.exports=async function handler(req,res){
  if(!requireUser(req,res))return;
  if(!supabaseConfigured())return send(res,503,{error:'Supabase is not configured'});
  try{
    if(req.method==='GET'){
      const [stateRows,appleEvents,appleReminders,lastRun]=await Promise.all([
        supabase('command_center_state?id=eq.primary&select=payload,updated_at'),
        supabase('calendar_events?source=eq.apple&order=start_at.asc&limit=500&select=external_id,title,start_at,end_at,location,calendar_name,last_synced_at'),
        supabase('reminders?source=eq.apple&order=due_at.asc.nullslast&limit=500&select=external_id,title,due_at,list_name,priority,completed,last_synced_at'),
        supabase('sync_runs?source=eq.apple-shortcut&order=completed_at.desc&limit=1&select=completed_at')
      ]);
      return send(res,200,{payload:stateRows?.[0]?.payload||null,updated_at:stateRows?.[0]?.updated_at||null,appleEvents:appleEvents||[],appleReminders:appleReminders||[],lastAppleSync:lastRun?.[0]?.completed_at||null});
    }
    if(req.method==='PUT'){
      const {payload}=parseBody(req);
      if(!payload || typeof payload!=='object')return send(res,400,{error:'A JSON payload is required'});
      const rows=await supabase('command_center_state?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:[{id:'primary',payload,updated_at:new Date().toISOString()}]});
      const pending=Array.isArray(payload.syncOutbox)?payload.syncOutbox.filter(item=>item?.status==='pending'&&item?.id).map(item=>({id:String(item.id),entity_type:item.entityType,action:item.action,payload:item.payload,status:'pending',created_at:item.createdAt||new Date().toISOString()})):[];
      if(pending.length)await supabase('sync_outbox?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:pending});
      return send(res,200,{ok:true,updated_at:rows?.[0]?.updated_at||new Date().toISOString(),outboxQueued:pending.length});
    }
    return send(res,405,{error:'Method not allowed'});
  }catch(error){return send(res,error.status||500,{error:error.message,detail:error.detail||undefined});}
};
