'use strict';
(function(){
  const safe=u=>/^https:\/\//i.test(u||'')?u:'';
  function bestLiveJob(){
    return [...(data.v8?.jobs||[])].filter(j=>safe(j.applyUrl)).sort((a,b)=>(b.fit||0)-(a.fit||0))[0]||null;
  }
  function addCareerTaskLink(){
    const row=document.querySelector('#page-home .v11-career-task');
    if(!row)return;
    const existing=row.querySelector('a[href^="https://"]');
    if(existing){existing.textContent='Open Job ↗';return;}
    const job=bestLiveJob();
    if(!job)return;
    row.querySelector('em')?.remove();
    const a=document.createElement('a');
    a.className='btn gold v11-next-job-link';
    a.href=job.applyUrl;
    a.target='_blank';
    a.rel='noopener';
    a.textContent='Open '+job.company+' Job ↗';
    a.title=job.title;
    row.appendChild(a);
  }
  function addCareerActionLinks(){
    document.querySelectorAll('#page-home .v11-career-task').forEach(row=>{
      if(row.querySelector('.v11-next-job-link'))return;
      addCareerTaskLink();
    });
  }
  const priorRefresh=window.refresh;
  window.refresh=function(){const out=priorRefresh.apply(this,arguments);setTimeout(addCareerActionLinks,0);return out};
  const priorShowPage=window.showPage;
  window.showPage=function(){const out=priorShowPage.apply(this,arguments);setTimeout(addCareerActionLinks,0);return out};
  const observer=new MutationObserver(()=>addCareerActionLinks());
  observer.observe(document.getElementById('pages'),{childList:true,subtree:true});
  addCareerActionLinks();
})();
