const {send,parseBody,requireSync,supabaseConfigured,supabase}=require('../_lib');
function cleanEvent(item={}){return {source:'apple',external_id:String(item.external_id||item.id||''),calendar_name:item.calendar_name||item.calendar||null,title:item.title||'Untitled event',start_at:item.start_at||item.start||null,end_at:item.end_at||item.end||null,all_day:Boolean(item.all_day),location:item.location||null,notes:item.notes||null,recurrence:item.recurrence||null,last_modified_at:item.last_modified_at||null,last_synced_at:new Date().toISOString()};}
function cleanReminder(item={}){return {source:'apple',external_id:String(item.external_id||item.id||''),list_name:item.list_name||item.list||null,title:item.title||'Untitled reminder',notes:item.notes||null,due_at:item.due_at||item.due||null,priority:Number(item.priority||0),completed:Boolean(item.completed),tags:Array.isArray(item.tags)?item.tags:[],last_modified_at:item.last_modified_at||null,last_synced_at:new Date().toISOString()};}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!requireSync(req,res))return;
  if(!supabaseConfigured())return send(res,503,{error:'Supabase is not configured'});
  const body=parseBody(req),events=(Array.isArray(body.events)?body.events:[]).map(cleanEvent).filter(x=>x.external_id),reminders=(Array.isArray(body.reminders)?body.reminders:[]).map(cleanReminder).filter(x=>x.external_id);
  try{
    if(events.length)await supabase('calendar_events?on_conflict=source,external_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:events});
    if(reminders.length)await supabase('reminders?on_conflict=source,external_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:reminders});
    await supabase('sync_runs',{method:'POST',headers:{Prefer:'return=minimal'},body:[{source:'apple-shortcut',device_name:body.device_name||null,events_count:events.length,reminders_count:reminders.length,completed_at:new Date().toISOString()}]});
    return send(res,200,{ok:true,events:events.length,reminders:reminders.length});
  }catch(error){return send(res,error.status||500,{error:error.message,detail:error.detail||undefined});}
};
