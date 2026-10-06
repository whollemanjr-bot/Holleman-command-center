'use strict';
(function(){
  data.v8=data.v8||{jobs:[],jobsUpdatedAt:'',services:{briefing:'ready',calendar:'optional',career:'loading'}};
  const originalCareer=window.careerPage;
  const originalHome=window.homePage;
  const safe=url=>/^https:\/\//i.test(url||'')?url:'#';
  window.refreshCareerJobs=async function(silent=false){
    if(!silent)toast('Refreshing career opportunities…');
    try{
      const r=await fetch('/api/jobs',{headers:{accept:'application/json'}}),payload=await r.json();
      if(!r.ok)throw new Error(payload.error||'Unable to refresh jobs');
      data.v8.jobs=payload.jobs||[];
      data.v8.jobsUpdatedAt=payload.updatedAt||new Date().toISOString();
      data.v8.services.career='connected';
      if(payload.linkedin){data.careerV7=data.careerV7||{};data.careerV7.linkedinUrl=payload.linkedin}
      saveData(false);refresh();
      if(!silent)toast('Career opportunities updated.');
    }catch(e){data.v8.services.career='error';if(!silent)toast(e.message||'Career refresh failed.')}
  };
  window.addLiveJobToPipeline=function(i){
    const j=data.v8.jobs[i];if(!j)return;
    data.careerCommand.pipeline.unshift({company:j.company,role:j.title,status:'Saved',salary:j.salary||'',next:'Review and tailor resume',link:j.applyUrl});
    saveData(false);refresh();showPage('career',false);toast('Job added to pipeline.');
  };
  function liveJobsBlock(){const jobs=data.v8.jobs||[];return `${section('Live Opportunities','Refreshes every other day')}<div class="v8-jobs-toolbar"><div><b>${jobs.length} current matches</b><span>${data.v8.jobsUpdatedAt?`Updated ${new Date(data.v8.jobsUpdatedAt).toLocaleString()}`:'Waiting for first refresh'}</span></div><button class="btn gold" onclick="refreshCareerJobs()">↻ Refresh Jobs</button></div><div class="v8-job-grid">${jobs.map((j,i)=>`<section class="card v8-job"><div class="v8-job-top"><span class="tag">${esc(j.category||'Career')}</span><b>${j.fit||0}% fit</b></div><h3>${esc(j.title)}</h3><p class="v8-company">${esc(j.company)} • ${esc(j.location||'')}</p><p>${esc(j.summary||'')}</p><div class="v8-job-meta"><span>${esc(j.salary||'Compensation not listed')}</span><span>${esc(j.workModel||'')}</span></div><div class="v8-job-actions"><a class="btn gold" href="${safe(j.applyUrl)}" target="_blank" rel="noopener">View Job</a><button class="btn" onclick="addLiveJobToPipeline(${i})">Add to Pipeline</button></div></section>`).join('')||'<div class="empty">No current jobs loaded.</div>'}</div>`}
  window.careerPage=function(){let html=originalCareer();const marker=section('Target Role Map','Best-fit leadership lanes');const linkedin=data.careerV7?.linkedinUrl||'https://www.linkedin.com/in/walter-holleman-19306027';const profile=`<div class="v8-career-strip"><div><small>LINKEDIN</small><b>Walter Holleman</b><span>Executive profile and networking hub</span></div><a class="btn" href="${safe(linkedin)}" target="_blank" rel="noopener">Open LinkedIn</a></div>`;html=profile+html;const pos=html.indexOf(marker);return pos>=0?html.slice(0,pos)+liveJobsBlock()+html.slice(pos):html+liveJobsBlock()};
  function serviceTile(label,state,sub,action){return `<button class="v8-service ${state}" onclick="${action}"><i></i><span><b>${label}</b><small>${sub}</small></span></button>`}
  window.homePage=function(){const html=originalHome();const services=`<div class="v8-service-row">${serviceTile('Morning Brief',data.liveBriefing?.topics?.length?'connected':'ready',data.liveBriefing?.topics?.length?'Live headlines':'Tap to refresh','refreshMorningBrief()')}${serviceTile('Apple Calendar',data.connections?.calendarUrl?'connected':'optional',data.connections?.calendarUrl?'Feed connected':'Optional connection',"showPage('calendar')")}${serviceTile('Career Jobs',data.v8.jobs.length?'connected':'ready',data.v8.jobs.length?`${data.v8.jobs.length} live matches`:'Tap to load','refreshCareerJobs()')}${serviceTile('LinkedIn','connected','Profile linked',"window.open('https://www.linkedin.com/in/walter-holleman-19306027','_blank')")}</div>`;return services+html};
  const priorRender=window.render;
  window.render=function(active='home'){renders.home=homePage;renders.career=careerPage;priorRender(active);document.title='Holleman Command Center — V8'};
  render(currentPage());
  const age=Date.now()-Date.parse(data.v8.jobsUpdatedAt||0);if(!data.v8.jobs.length||age>21600000)refreshCareerJobs(true);
})();
