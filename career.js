'use strict';

const careerDefaults={
  readiness:42,
  applications:0,
  networking:0,
  interviews:0,
  activeLeads:0,
  weeklyGoal:10,
  targetMin:175000,
  targetIdeal:200000,
  transitionWindow:'3–6 months',
  workModel:'Remote / Hybrid',
  profile:'Senior operations, risk, and investigations leader with nearly 20 years of combined banking and law-enforcement experience. Led a 50-person multi-state team across 120+ locations and now directs complex investigations with local and federal partners.',
  priorities:[
    {title:'Finalize executive resume',done:false},
    {title:'Rewrite LinkedIn headline and About section',done:false},
    {title:'Apply to 10 targeted roles',done:false},
    {title:'Contact 5 recruiters or hiring leaders',done:false}
  ],
  documents:{resume:'In Progress',linkedin:'Not Started',coverLetter:'Not Started',interviewStories:'In Progress'},
  pipeline:[]
};

if(!data.careerCommand)data.careerCommand=clone(careerDefaults);
else data.careerCommand=deepMerge(clone(careerDefaults),data.careerCommand);

function careerScore(){
  const c=data.careerCommand;
  const docs=Object.values(c.documents).reduce((n,v)=>n+(v==='Ready'?15:v==='In Progress'?8:0),0);
  const activity=Math.min(40,(c.applications/c.weeklyGoal*20)+(c.networking/5*10)+(c.interviews*5));
  return Math.min(100,Math.round(docs+activity));
}

function saveCareerMetrics(){
  const ids=['careerApplications','careerNetworking','careerInterviews','careerActiveLeads','careerWeeklyGoal'];
  const keys=['applications','networking','interviews','activeLeads','weeklyGoal'];
  ids.forEach((id,i)=>{const el=document.getElementById(id);if(el)data.careerCommand[keys[i]]=Number(el.value)});
  data.careerCommand.readiness=careerScore();
  saveData(false);refresh();showPage('career');toast('Career metrics updated.');
}

function toggleCareerPriority(i,done){data.careerCommand.priorities[i].done=done;saveData(false);refresh();showPage('career')}
function updateCareerDocument(key,value){data.careerCommand.documents[key]=value;data.careerCommand.readiness=careerScore();saveData(false);refresh();showPage('career')}
function addCareerOpportunity(){data.careerCommand.pipeline.unshift({company:'',role:'',status:'Interested',salary:'',next:'',link:''});saveData(false);refresh();showPage('career');toast('Opportunity added.')}
function updateCareerOpportunity(i,key,value){data.careerCommand.pipeline[i][key]=value;saveData(false)}
function removeCareerOpportunity(i){data.careerCommand.pipeline.splice(i,1);saveData(false);refresh();showPage('career');toast('Opportunity removed.')}

function careerPage(){
  const c=data.careerCommand;
  c.readiness=careerScore();
  const completed=c.priorities.filter(x=>x.done).length;
  const docs=Object.entries(c.documents).map(([key,value])=>`<section class="card"><div class="card-title"><h3>${esc(key.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase()))}</h3><span>${esc(value)}</span></div><select onchange="updateCareerDocument('${key}',this.value)"><option ${value==='Not Started'?'selected':''}>Not Started</option><option ${value==='In Progress'?'selected':''}>In Progress</option><option ${value==='Ready'?'selected':''}>Ready</option></select></section>`).join('');
  const rows=c.pipeline.length?c.pipeline.map((j,i)=>`<div class="list-row"><div style="flex:1;min-width:0"><input placeholder="Company" value="${esc(j.company)}" onchange="updateCareerOpportunity(${i},'company',this.value)"><input placeholder="Role" value="${esc(j.role)}" onchange="updateCareerOpportunity(${i},'role',this.value)" style="margin-top:7px"><div class="form" style="margin-top:7px"><label>Status<select onchange="updateCareerOpportunity(${i},'status',this.value)">${['Interested','Applied','Recruiter Screen','Interview','Final Round','Offer','Closed'].map(x=>`<option ${j.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Compensation<input placeholder="$175k+" value="${esc(j.salary||'')}" onchange="updateCareerOpportunity(${i},'salary',this.value)"></label><label class="span2">Next action<input placeholder="Follow up Friday" value="${esc(j.next||'')}" onchange="updateCareerOpportunity(${i},'next',this.value)"></label><label class="span2">Job link<input placeholder="https://" value="${esc(j.link||'')}" onchange="updateCareerOpportunity(${i},'link',this.value)"></label></div></div><button class="btn danger" onclick="removeCareerOpportunity(${i})">×</button></div>`).join(''):'<div class="empty">No opportunities added yet.</div>';
  return `<div class="grid two"><section class="card brief-card"><div class="eyebrow">Career Transition</div><h2>Move into senior private-sector leadership without losing the value of your experience.</h2><p class="copy">${esc(c.profile)}</p><div class="brief-meta"><div><small>COMPENSATION</small><b>$${Math.round(c.targetMin/1000)}k–$${Math.round(c.targetIdeal/1000)}k+</b><span>Target range</span></div><div><small>TIMELINE</small><b>${esc(c.transitionWindow)}</b><span>Transition window</span></div><div><small>WORK MODEL</small><b>${esc(c.workModel)}</b><span>Preferred</span></div></div></section><section class="card"><div class="card-title"><h3>Transition Readiness</h3><span>${c.readiness}%</span></div><div class="ring" style="--score:${c.readiness}"><div><span><small>CAREER</small><b>${c.readiness}</b><em>${c.readiness>=80?'READY':c.readiness>=60?'BUILDING':'FOUNDATION'}</em></span></div></div><div class="notice">Readiness reflects document completion, applications, networking, and interview activity.</div></section></div>
  ${section('Career Scorecard','Editable and stored with V6 data')}
  <div class="grid six">${metric('Readiness',c.readiness+'%','Overall',c.readiness,true)}${metric('Applications',c.applications,'This week',Math.min(100,c.applications/c.weeklyGoal*100))}${metric('Networking',c.networking,'Touches',Math.min(100,c.networking/5*100))}${metric('Interviews',c.interviews,'Active',Math.min(100,c.interviews/3*100),true)}${metric('Active Leads',c.activeLeads,'Pipeline',Math.min(100,c.activeLeads/8*100))}${metric('Weekly Goal',c.weeklyGoal,'Applications',100,true)}</div>
  <div class="grid two" style="margin-top:12px"><section class="card"><div class="card-title"><h3>Update Scorecard</h3><span>Quick entry</span></div><div class="form"><label>Applications<input id="careerApplications" type="number" value="${c.applications}"></label><label>Networking touches<input id="careerNetworking" type="number" value="${c.networking}"></label><label>Interviews<input id="careerInterviews" type="number" value="${c.interviews}"></label><label>Active leads<input id="careerActiveLeads" type="number" value="${c.activeLeads}"></label><label>Weekly application goal<input id="careerWeeklyGoal" type="number" value="${c.weeklyGoal}"></label></div><button class="btn gold" style="margin-top:12px" onclick="saveCareerMetrics()">Save Career Update</button></section><section class="card"><div class="card-title"><h3>This Week</h3><span>${completed}/${c.priorities.length} complete</span></div>${c.priorities.map((p,i)=>`<div class="mission ${p.done?'done':''}"><input type="checkbox" ${p.done?'checked':''} onchange="toggleCareerPriority(${i},this.checked)"><label>${esc(p.title)}</label></div>`).join('')}</section></div>
  ${section('Opportunity Pipeline','Roles, status, compensation, and next actions')}
  <section class="card"><div class="card-title"><h3>Active Opportunities</h3><button class="btn gold" onclick="addCareerOpportunity()">＋ Add Opportunity</button></div><div class="list">${rows}</div></section>
  ${section('Career Materials','Keep every asset ready')}
  <div class="grid four">${docs}</div>
  ${section('Best-Fit Areas','Where your background is strongest')}
  <div class="grid three"><section class="card"><span class="tag">RISK & INVESTIGATIONS</span><h3>Corporate Investigations</h3><p class="copy">Complex investigations, evidence development, partner coordination, intelligence analysis, and executive reporting.</p></section><section class="card"><span class="tag">OPERATIONS</span><h3>Crisis & Operations Leadership</h3><p class="copy">Rapid decisions, escalation management, cross-functional execution, and high-accountability operations.</p></section><section class="card"><span class="tag">ENTERPRISE LEADERSHIP</span><h3>Risk & Program Management</h3><p class="copy">Led a 50-person multi-state team across more than 120 banking locations while managing performance, expenses, and risk.</p></section></div>
  ${section('90-Day Transition','Execution roadmap')}
  <div class="grid three"><section class="card"><span class="tag">DAYS 1–30</span><h3>Positioning</h3><div class="workout"><b>Executive resume</b><span>Translate policing and banking outcomes into business value.</span></div><div class="workout"><b>LinkedIn</b><span>Build a senior risk, investigations, and operations brand.</span></div></section><section class="card"><span class="tag">DAYS 31–60</span><h3>Market Activity</h3><div class="workout"><b>Targeted applications</b><span>Prioritize quality over volume.</span></div><div class="workout"><b>Networking</b><span>Recruiters, hiring leaders, and warm introductions.</span></div></section><section class="card"><span class="tag">DAYS 61–90</span><h3>Conversion</h3><div class="workout"><b>Interview preparation</b><span>Executive stories, leadership examples, and case studies.</span></div><div class="workout"><b>Offer evaluation</b><span>Compensation, flexibility, benefits, and growth.</span></div></section></div>`;
}
