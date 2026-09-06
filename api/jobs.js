import fs from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{
    const file=path.join(process.cwd(),'data','jobs.json');
    const payload=JSON.parse(await fs.readFile(file,'utf8'));
    const jobs=(payload.jobs||[]).filter(j=>j.company&&j.title&&j.applyUrl).sort((a,b)=>(b.fit||0)-(a.fit||0));
    res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({...payload,jobs});
  }catch(error){
    return res.status(500).json({error:'Unable to load career opportunities'});
  }
}
