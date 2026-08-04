const {send,parseBody,safeEqual,signToken}=require('./_lib');
module.exports=async function handler(req,res){
  const configured=Boolean(process.env.USER_PASSCODE && process.env.APP_SECRET);
  if(req.method==='GET')return send(res,200,{configured});
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!configured)return send(res,503,{error:'Authentication is not configured'});
  const {passcode}=parseBody(req);
  if(!safeEqual(passcode,process.env.USER_PASSCODE))return send(res,401,{error:'Incorrect passcode'});
  const token=signToken({sub:'primary',iat:Date.now(),exp:Date.now()+30*24*60*60*1000});
  return send(res,200,{token,expiresInDays:30});
};
