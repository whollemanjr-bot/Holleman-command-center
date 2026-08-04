'use strict';

const APP_VERSION = '1.0.0';
const STORAGE_KEY = 'holleman-command-center-v1';
const TOKEN_KEY = 'holleman-command-token';
const NAV = [
  ['dashboard','▦','Dashboard'],['health','♡','Health Command'],['training','◫','Training'],['nutrition','♨','Nutrition'],
  ['recovery','♧','Recovery'],['calendar','□','Calendar'],['tasks','✓','Tasks & Projects'],['career','▣','Jobs & Career'],
  ['school','◇','School'],['finance','♙','Finance'],['vehicles','⌂','Vehicles & Home'],['notes','▤','Notes'],['reports','▥','Reports'],['data','⚙','Data & Connections']
];

const nowIso = () => new Date().toISOString();
const uid = (prefix='id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const number = (value,fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const formatDate = (date, opts={}) => new Intl.DateTimeFormat('en-US', opts).format(new Date(date));
const formatClock = value => value ? new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(value)) : 'Not set';
const formatDuration = seconds => {
  seconds = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(seconds/3600), m = Math.floor((seconds%3600)/60), s = seconds%60;
  return h ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};
const todayKey = () => new Date().toISOString().slice(0,10);

function defaultState(){
  return {
    meta:{version:APP_VERSION,createdAt:nowIso(),updatedAt:nowIso(),mode:'local',lastCloudSync:null,lastAppleSync:null},
    profile:{name:'Walter',location:'Baltimore, MD',mission:'Execute the day. Get better every day.',weightGoal:235},
    health:{
      metrics:[
        {id:'weight',label:'Weight',value:250.6,unit:'lb',source:'Manual snapshot',updatedAt:'2026-08-03T08:00:00-04:00',goal:235,direction:'down'},
        {id:'restingHr',label:'Resting HR',value:63,unit:'bpm',source:'Manual snapshot',updatedAt:'2026-08-03T08:00:00-04:00',goal:60,direction:'down'},
        {id:'hrv',label:'HRV',value:60.5,unit:'ms',source:'Manual snapshot',updatedAt:'2026-08-03T08:00:00-04:00',goal:60,direction:'up'},
        {id:'vo2',label:'VO₂ Max',value:39.3,unit:'',source:'Manual snapshot',updatedAt:'2026-08-03T08:00:00-04:00',goal:42,direction:'up'},
        {id:'sleep',label:'Sleep',value:6.8,unit:'h',source:'Manual snapshot',updatedAt:'2026-08-03T08:00:00-04:00',goal:7.5,direction:'up'},
        {id:'steps',label:'Steps',value:4846,unit:'',source:'Manual snapshot',updatedAt:'2026-08-03T23:59:00-04:00',goal:8000,direction:'up'}
      ],
      trends:{readiness:[72,75,70,78,76,82,78],sleep:[6.1,6.8,6.6,7.1,6.4,6.8,6.8],hrv:[45,50,48,52,49,61,60.5],soreness:[4.2,3.8,3.6,3.3,3.4,3.0,3.2]},
      sourceNotice:'Seeded from a manual snapshot dated August 3, 2026. It is not a live Apple Health connection.'
    },
    nutrition:{date:todayKey(),calories:1924,calorieGoal:2800,protein:198,proteinGoal:220,carbs:165,carbGoal:250,fat:62,fatGoal:80,fiber:24,fiberGoal:30,source:'Manual entry',updatedAt:'2026-08-03T21:00:00-04:00'},
    hydration:{date:todayKey(),ounces:86,goal:120,source:'Manual entry',updatedAt:'2026-08-03T21:00:00-04:00',logs:[{id:uid('water'),amount:20,at:'2026-08-03T09:12:00-04:00'}]},
    tasks:[
      {id:uid('task'),title:'Finish leadership paper',project:'School',priority:'high',due:null,done:false},
      {id:uid('task'),title:'Review and follow up on job applications',project:'Career',priority:'high',due:null,done:false},
      {id:uid('task'),title:'Complete pull workout',project:'Training',priority:'medium',due:null,done:false},
      {id:uid('task'),title:'Study criminal justice leadership material',project:'School',priority:'medium',due:null,done:false},
      {id:uid('task'),title:'Grocery shopping',project:'Home',priority:'low',due:null,done:false}
    ],
    schedule:[
      {id:uid('event'),title:'Work',start:`${todayKey()}T08:30:00-04:00`,end:`${todayKey()}T15:00:00-04:00`,source:'Manual',location:''},
      {id:uid('event'),title:'Assignment work time',start:`${todayKey()}T14:00:00-04:00`,end:`${todayKey()}T15:00:00-04:00`,source:'Manual',location:''},
      {id:uid('event'),title:'Pull Day',start:`${todayKey()}T17:30:00-04:00`,end:`${todayKey()}T18:30:00-04:00`,source:'Manual',location:'Arsenal Fitness'},
      {id:uid('event'),title:'Study / Reading',start:`${todayKey()}T20:00:00-04:00`,end:`${todayKey()}T21:00:00-04:00`,source:'Manual',location:''},
      {id:uid('event'),title:'Wind down',start:`${todayKey()}T21:30:00-04:00`,end:`${todayKey()}T22:00:00-04:00`,source:'Manual',location:''}
    ],
    reminders:[
      {id:uid('rem'),title:'TRT injection',due:null,list:'Health',priority:'medium',done:false,source:'Manual'},
      {id:uid('rem'),title:'Schedule endocrinology checkup',due:null,list:'Health',priority:'medium',done:false,source:'Manual'},
      {id:uid('rem'),title:'Vehicle service',due:null,list:'Vehicles',priority:'low',done:false,source:'Manual'},
      {id:uid('rem'),title:'Renew CCW',due:null,list:'Personal',priority:'high',done:false,source:'Manual'}
    ],
    recovery:{protocols:[
      {id:'sauna',name:'Sauna',icon:'♨',target:'20 min · 185°F',last:null,sessionsThisWeek:0,accent:'hot'},
      {id:'plunge',name:'Cold Plunge',icon:'❄',target:'3:00 · 45°F',last:null,sessionsThisWeek:0,accent:'cold'}
    ],sessions:[]},
    training:{
      activeWorkout:null,
      templates:[{
        id:'pull-day',name:'Pull Day',location:'Arsenal Fitness',exercises:[
          {id:uid('ex'),name:'Arsenal High Row',setup:'Seat 4 · Chest Pad 3 · Rotating D-handles',target:'3 × 8–10',previous:'180 × 10, 10, 8',rest:120},
          {id:uid('ex'),name:'Chest Supported Row',setup:'Chest supported · neutral grip',target:'3 × 8–12',previous:'',rest:105},
          {id:uid('ex'),name:'Lat Pulldown',setup:'Shoulders down · drive elbows',target:'3 × 8–12',previous:'',rest:105},
          {id:uid('ex'),name:'Seated Cable Row',setup:'Controlled stretch · no torso swing',target:'3 × 10–12',previous:'',rest:90},
          {id:uid('ex'),name:'Straight Arm Pulldown',setup:'Soft elbows · lats initiate',target:'3 × 12–15',previous:'',rest:75},
          {id:uid('ex'),name:'EZ Bar Curl',setup:'Upper arm fixed',target:'3 × 8–12',previous:'',rest:75},
          {id:uid('ex'),name:'Hammer Curl',setup:'Neutral wrist',target:'3 × 10–12',previous:'',rest:75}
        ]
      },{
        id:'push-day',name:'Push Day',location:'Commercial Gym',exercises:[
          {id:uid('ex'),name:'Vertical Chest Press',setup:'Handles at mid-chest',target:'3 × 6–10',previous:'',rest:120},
          {id:uid('ex'),name:'Incline Press',setup:'Upper chest aligned to handles',target:'3 × 8–10',previous:'',rest:120},
          {id:uid('ex'),name:'Shoulder Press',setup:'Elbows slightly forward',target:'3 × 8–12',previous:'',rest:105},
          {id:uid('ex'),name:'Standing Lateral Raise',setup:'Pivot aligned with shoulder',target:'3 × 12–15',previous:'',rest:75},
          {id:uid('ex'),name:'Seated Triceps Extension',setup:'Shoulders pinned',target:'3 × 10–15',previous:'',rest:75}
        ]
      }],
      history:[]
    },
    career:{
      target:{timeline:'3–6 months',compensation:'$175K–$200K+',workModel:'Remote preferred; flexible hybrid acceptable',roles:['Enterprise Risk','Corporate Security','Investigations Leadership','Crisis Management','Financial Crimes','Program Leadership']},
      brand:'Operations and investigations leader combining nearly a decade in law enforcement with banking, risk, and multi-state team leadership. Experienced in complex narcotics investigations, federal and local partnerships, evidence development, performance management, and scalable field operations.',
      jobs:[],
      networking:0,
      assets:[{id:uid('asset'),name:'Executive resume',status:'In Progress'},{id:uid('asset'),name:'LinkedIn positioning',status:'Pending'},{id:uid('asset'),name:'Master career story',status:'In Progress'},{id:uid('asset'),name:'Interview stories',status:'Pending'}]
    },
    school:{program:'Master of Criminal Justice',concentration:'Leadership',school:'Franklin University',assignments:[{id:uid('assignment'),title:'Leadership paper',course:'Leadership',due:null,status:'In Progress',notes:'Add exact due date and rubric.'}]},
    finance:{accounts:[],bills:[],monthlyTarget:null},
    vehicles:{items:[{id:uid('vehicle'),name:'2026 Ram 2500 Diesel',type:'Vehicle',nextService:null,notes:'4-inch lift · 37-inch tires'},{id:uid('vehicle'),name:'2025 Chevrolet Suburban',type:'Vehicle',nextService:null,notes:''},{id:uid('home'),name:'Home systems',type:'Home',nextService:null,notes:'HVAC, filters, humidifier, alarms'}]},
    notes:[{id:uid('note'),title:'Command Center Build Notes',body:'Use this space for ideas, issues, integrations, and improvements.',updatedAt:nowIso()}],
    integrations:[
      {id:'apple-health',name:'Apple Health',status:'not-connected',lastSync:null,method:'iPhone Shortcut / future native companion'},
      {id:'apple-watch',name:'Apple Watch',status:'not-connected',lastSync:null,method:'Through Apple Health'},
      {id:'apple-calendar',name:'Apple Calendar',status:'not-connected',lastSync:null,method:'iPhone Shortcut bridge'},
      {id:'apple-reminders',name:'Apple Reminders',status:'not-connected',lastSync:null,method:'iPhone Shortcut bridge'},
      {id:'macro-factor',name:'MacroFactor',status:'manual',lastSync:null,method:'Manual/Apple Health import'},
      {id:'waterminder',name:'WaterMinder',status:'manual',lastSync:null,method:'Manual/Apple Health import'},
      {id:'supabase',name:'Supabase',status:'not-configured',lastSync:null,method:'Optional cloud persistence'}
    ],
    syncOutbox:[]
  };
}

function deepMerge(base, incoming){
  if(Array.isArray(base)) return Array.isArray(incoming) ? incoming : base;
  if(base && typeof base==='object'){
    const out={...base};
    if(incoming && typeof incoming==='object') Object.keys(incoming).forEach(key => out[key]=key in base ? deepMerge(base[key],incoming[key]) : incoming[key]);
    return out;
  }
  return incoming === undefined ? base : incoming;
}

let state = deepMerge(defaultState(), JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
let currentView = localStorage.getItem(`${STORAGE_KEY}:view`) || 'dashboard';
let modalSave = null;
let cloudTimer = null;
let restInterval = null;
let workoutInterval = null;
let apiConfigured = false;
let cloudToken = localStorage.getItem(TOKEN_KEY) || '';

function metric(id){return state.health.metrics.find(item=>item.id===id) || {value:null,unit:'',source:'Not synced',updatedAt:null};}
function metricText(id){const item=metric(id);return item.value===null || item.value==='' ? 'Not synced' : `${item.value}${item.unit ? ` ${item.unit}` : ''}`;}
function isStale(updatedAt,hours=24){return !updatedAt || (Date.now()-new Date(updatedAt).getTime()) > hours*3600000;}
function sourceText(item){return `${item.source || 'Not synced'} · ${item.updatedAt ? formatDate(item.updatedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : 'No update'}`;}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),2600);}
function save({cloud=true}={}){
  state.meta.updatedAt=nowIso();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(cloud && cloudToken && apiConfigured){clearTimeout(cloudTimer);cloudTimer=setTimeout(syncToCloud,700);}
}

async function api(path,options={}){
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  if(cloudToken) headers.Authorization=`Bearer ${cloudToken}`;
  const response=await fetch(path,{...options,headers});
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw Object.assign(new Error(body.error || `Request failed (${response.status})`),{status:response.status,body});
  return body;
}
async function detectAuth(){
  try{
    const status=await api('/api/auth',{method:'GET'});
    apiConfigured=Boolean(status.configured);
    if(!apiConfigured){state.meta.mode='local';save({cloud:false});return;}
    if(!cloudToken){showAuth();return;}
    await loadCloud();
  }catch(error){
    apiConfigured=false;state.meta.mode='local';save({cloud:false});
  }
}
function showAuth(message='Enter your command-center passcode.'){$('#authGate').classList.remove('hidden');$('#authMessage').textContent=message;$('#useLocalMode').classList.toggle('hidden',apiConfigured);}
function hideAuth(){$('#authGate').classList.add('hidden');}
async function loadCloud(){
  try{
    const result=await api('/api/data',{method:'GET'});
    if(result.payload) state=deepMerge(defaultState(),result.payload);
    if(Array.isArray(result.appleEvents)){
      state.schedule=state.schedule.filter(item=>item.source!=='Apple Calendar').concat(result.appleEvents.map(item=>({id:`apple:${item.external_id}`,title:item.title,start:item.start_at,end:item.end_at,location:item.location||'',source:'Apple Calendar',externalId:item.external_id})));
    }
    if(Array.isArray(result.appleReminders)){
      state.reminders=state.reminders.filter(item=>item.source!=='Apple Reminders').concat(result.appleReminders.map(item=>({id:`apple-rem:${item.external_id}`,title:item.title,due:item.due_at,list:item.list_name||'Reminders',priority:item.priority>=9?'high':item.priority>=5?'medium':'low',done:Boolean(item.completed),source:'Apple Reminders',externalId:item.external_id})));
    }
    if(result.lastAppleSync){state.meta.lastAppleSync=result.lastAppleSync;const ids=['apple-calendar','apple-reminders'];state.integrations.forEach(i=>{if(ids.includes(i.id)){i.status='synced';i.lastSync=result.lastAppleSync;}});}
    state.meta.mode='cloud';state.meta.lastCloudSync=nowIso();save({cloud:false});hideAuth();render();
  }catch(error){
    if(error.status===401){cloudToken='';localStorage.removeItem(TOKEN_KEY);showAuth('Your session expired. Enter the passcode again.');}
    else{state.meta.mode='local';save({cloud:false});toast('Cloud sync unavailable. Working locally.');}
  }
}
async function syncToCloud(){
  try{await api('/api/data',{method:'PUT',body:JSON.stringify({payload:state})});state.meta.lastCloudSync=nowIso();state.meta.mode='cloud';save({cloud:false});updateSyncDisplays();}
  catch(error){state.meta.mode='local';save({cloud:false});toast('Saved locally; cloud sync did not complete.');}
}

function renderNav(){
  $('#sidebarNav').innerHTML=NAV.map(([id,icon,label])=>`<button class="nav-button ${currentView===id?'active':''}" data-view="${id}"><span class="nav-icon">${icon}</span><span class="nav-label">${esc(label)}</span></button>`).join('');
}
function greeting(){const hour=new Date().getHours();return hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';}
function renderHeader(){
  $('#greeting').textContent=`${greeting()}, ${state.profile.name}.`;
  $('#subtitle').textContent=state.profile.mission;
  $('#dateLabel').textContent=formatDate(new Date(),{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  $('#versionLabel').textContent=`v${APP_VERSION}`;
  $('#notificationBadge').textContent=String(state.reminders.filter(r=>!r.done).length);
}
function integrationStatusClass(status){return ['connected','synced'].includes(status)?'ok':['manual','partial'].includes(status)?'warn':'off';}
function updateSyncDisplays(){
  const visible=state.integrations.slice(0,7);
  $('#sideSyncs').innerHTML=visible.map(i=>`<div class="sync-row"><span class="status-dot ${integrationStatusClass(i.status)}"></span><span>${esc(i.name)}</span></div>`).join('');
}
function readiness(){
  const sleep=number(metric('sleep').value),hrv=number(metric('hrv').value),rhr=number(metric('restingHr').value),hydration=number(state.hydration.ounces),protein=number(state.nutrition.protein);
  let score=20;
  score+=sleep>=7.5?25:sleep>=7?21:sleep>=6?13:6;
  score+=hrv>=60?20:hrv>=50?15:hrv>=40?10:5;
  score+=rhr<=60?15:rhr<=65?12:rhr<=70?8:4;
  score+=clamp(hydration/state.hydration.goal*10,0,10);
  score+=clamp(protein/state.nutrition.proteinGoal*10,0,10);
  return Math.round(clamp(score,0,100));
}
function quickStats(){
  const events=state.schedule.filter(e=>String(e.start).slice(0,10)===todayKey()).length;
  const due=state.tasks.filter(t=>!t.done).length;
  const workout=state.training.activeWorkout?.name || state.training.templates[0]?.name || 'Not planned';
  const high=state.tasks.filter(t=>!t.done&&t.priority==='high').length;
  const stats=[
    ['calendar','▣','Today',events,'events','View schedule'],['tasks','✓','Tasks',due,'due',`${high} high priority`,high?'bad':''],
    ['training','◫','Training',workout,'',state.training.activeWorkout?'Workout live':'Start workout'],['recovery','♡','Recovery',readiness(),'% readiness',readiness()>=80?'Good':'Moderate',readiness()<75?'warn':''],
    ['nutrition','♨','Nutrition',state.nutrition.calories.toLocaleString(),`/ ${state.nutrition.calorieGoal}`,'Manual snapshot'],
    ['nutrition','◉','Hydration',state.hydration.ounces,`/ ${state.hydration.goal} oz`,state.hydration.source],
    ['calendar','♧','Reminders',state.reminders.filter(r=>!r.done).length,'upcoming','View all']
  ];
  $('#quickStats').innerHTML=stats.map(([view,icon,label,value,unit,note,tone=''])=>`<button class="stat-tile" data-view="${view}"><div class="stat-top"><span>${icon}</span><span>${label}</span></div><div class="stat-value">${esc(value)} <small>${esc(unit)}</small></div><div class="stat-note ${tone}">${esc(note)}</div></button>`).join('');
}
function card(title,body,{className='',actions='',subtitle=''}={}){return `<article class="card ${className}"><header class="card-header"><div><h2>${esc(title)}</h2>${subtitle?`<small class="muted">${esc(subtitle)}</small>`:''}</div><div class="card-header-actions">${actions}</div></header><div class="card-body">${body}</div></article>`;}
function pageTitle(title,subtitle,actions=''){return `<div class="page-title"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><div>${actions}</div></div>`;}
function spark(values,color='#31d17c'){
  if(!values?.length)return '';
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1;
  const points=values.map((v,i)=>`${(i/(values.length-1||1))*100},${40-((v-min)/range)*34}`).join(' ');
  return `<svg class="sparkline" viewBox="0 0 100 44" preserveAspectRatio="none"><line x1="0" y1="42" x2="100" y2="42" stroke="#17384e"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}
function donut(value,max,color,label,sub){const pct=clamp(max?value/max*100:0,0,100);return `<div class="donut" style="--value:${pct};--color:${color}"><div class="donut-inner"><div><strong>${esc(label)}</strong><small>${esc(sub)}</small></div></div></div>`;}
function progress(value,max,color='var(--blue)'){return `<div class="progress-bar"><i style="width:${clamp(max?value/max*100:0,0,100)}%;background:${color}"></i></div>`;}
function dashboard(){
  const schedule=state.schedule.filter(e=>String(e.start).slice(0,10)===todayKey()).sort((a,b)=>new Date(a.start)-new Date(b.start));
  const scheduleBody=schedule.length?`<div class="schedule-list">${schedule.map((e,i)=>`<div class="schedule-row"><span class="schedule-time">${formatClock(e.start)}</span><span class="schedule-dot ${i<2?'green':''}"></span><span class="schedule-title">${esc(e.title)}${e.location?`<small>${esc(e.location)}</small>`:''}</span></div>`).join('')}</div><button class="text-button" data-action="add-event">＋ Add event</button>`:`<div class="empty-state"><strong>No events synced</strong>Add your schedule or connect Apple Calendar.</div>`;
  const n=state.nutrition;
  const macros=[['Protein',n.protein,n.proteinGoal,'#31d17c'],['Carbs',n.carbs,n.carbGoal,'#2f8cff'],['Fat',n.fat,n.fatGoal,'#a86cff'],['Fiber',n.fiber,n.fiberGoal,'#f6a523']];
  const nutritionBody=`<div class="nutrition-wrap">${donut(n.calories,n.calorieGoal,'#31d17c',n.calories.toLocaleString(),`/ ${n.calorieGoal} calories`)}<div class="macro-list">${macros.map(([label,val,goal,color])=>`<div class="macro-row"><span>${label}</span><span class="bar"><i style="width:${clamp(val/goal*100,0,100)}%;background:${color}"></i></span><strong>${val} / ${goal}g</strong></div>`).join('')}</div></div><div class="insight-bar">${esc(n.source)} · last updated ${n.updatedAt?formatDate(n.updatedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'not synced'}</div>`;
  const hydrationBody=`<div class="hydration-panel">${donut(state.hydration.ounces,state.hydration.goal,'#2f9fff',state.hydration.ounces,`/ ${state.hydration.goal} oz`)}<div><p class="muted">Last entry: ${state.hydration.logs.length?formatClock(state.hydration.logs.at(-1).at):'none'}</p><div class="quick-buttons">${[8,12,20].map(x=>`<button data-action="add-water" data-amount="${x}">+ ${x} oz</button>`).join('')}<button data-action="custom-water">Custom</button></div></div></div>`;
  const performance=['weight','restingHr','hrv','vo2'].map(id=>{const m=metric(id);const stale=isStale(m.updatedAt);return `<div class="metric-row"><span>${esc(m.label)}</span><span class="metric-value">${esc(metricText(id))}</span><span class="delta ${stale?'warn':'good'}">${stale?'STALE':'CURRENT'}</span></div>`;}).join('');
  const recoveryBody=`<div class="recovery-cards">${state.recovery.protocols.map(p=>`<div class="recovery-card"><h4 class="${p.accent}">${p.icon} ${esc(p.name)}</h4><p>${esc(p.target)}</p><p>${p.sessionsThisWeek}× this week</p><button class="${p.id==='sauna'?'secondary':'ghost'} wide" data-action="start-recovery" data-protocol="${p.id}">Log session</button></div>`).join('')}</div>`;
  const priorities=state.tasks.filter(t=>!t.done).slice(0,6).map(t=>`<div class="priority-row"><button class="check-square" data-action="toggle-task" data-id="${t.id}"></button><span>${esc(t.title)}</span><span class="priority-level ${t.priority}">${t.priority.toUpperCase()}</span></div>`).join('') || `<div class="empty-state">No open priorities.</div>`;
  const reminders=state.reminders.filter(r=>!r.done).slice(0,5).map(r=>`<div class="reminder-row"><span>♧</span><span>${esc(r.title)}</span><small class="muted">${r.due?formatDate(r.due,{month:'short',day:'numeric'}):'No date'}</small></div>`).join('') || `<div class="empty-state">No reminders.</div>`;
  const trends=[['Readiness',state.health.trends.readiness,'#31d17c','%'],['Sleep',state.health.trends.sleep,'#2f8cff','h'],['HRV',state.health.trends.hrv,'#31d17c','ms'],['Soreness',state.health.trends.soreness,'#a86cff','/10']];
  const trendsBody=`<div class="trend-grid">${trends.map(([label,vals,color,unit])=>`<div class="trend-card"><small>${label}</small><strong style="color:${color}">${vals.at(-1)} ${unit}</strong>${spark(vals,color)}</div>`).join('')}</div><div class="insight-bar">Trust note: ${esc(state.health.sourceNotice)}</div>`;
  const syncBody=`<div class="sync-grid">${state.integrations.map(i=>`<div class="sync-card"><strong>${esc(i.name)}</strong><span style="color:${integrationStatusClass(i.status)==='ok'?'var(--green)':integrationStatusClass(i.status)==='warn'?'var(--orange)':'#728da0'}">${esc(i.status.replaceAll('-',' '))}</span><small>${i.lastSync?formatDate(i.lastSync,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):esc(i.method)}</small></div>`).join('')}</div>`;
  return `<div class="dashboard-grid">
    ${card("Today's Schedule",scheduleBody,{className:'area-schedule',actions:'<button class="text-button" data-view="calendar">View calendar →</button>'})}
    ${card('Nutrition & Hydration',`${nutritionBody}<div style="height:1px;background:rgba(36,81,111,.36);margin:10px -10px"></div>${hydrationBody}`,{className:'area-nutrition',actions:'<button class="text-button" data-view="nutrition">View details →</button>'})}
    ${card('Performance Metrics',performance,{className:'area-metrics',actions:'<button class="text-button" data-view="health">All metrics →</button>'})}
    ${card('Recovery Protocols',recoveryBody,{className:'area-recovery'})}
    ${card('Priorities',`<div class="priority-list">${priorities}</div><button class="text-button" data-action="add-task">＋ Add task</button>`,{className:'area-priorities',actions:'<button class="text-button" data-view="tasks">View all →</button>'})}
    ${card('Recovery Trends · 7 Days',trendsBody,{className:'area-trends'})}
    ${card('Upcoming Reminders',`<div class="reminder-list">${reminders}</div><button class="text-button" data-action="add-reminder">＋ Add reminder</button>`,{className:'area-reminders',actions:'<button class="text-button" data-view="calendar">View all →</button>'})}
    ${card('Syncs & Services',syncBody,{className:'area-syncs',actions:'<button class="text-button" data-view="data">Manage connections</button>'})}
  </div>`;
}

function healthView(){
  const cards=state.health.metrics.map(m=>`<article class="card metric-card span-4"><div class="metric-label">${esc(m.label)}</div><div class="metric-number">${m.value===null?'Not synced':`${esc(m.value)} <small>${esc(m.unit)}</small>`}</div>${m.goal!==undefined?progress(m.direction==='down'?Math.max(0,m.goal/(m.value||m.goal))*100:m.value,m.direction==='down'?100:m.goal,m.direction==='down'?'var(--green)':'var(--blue)'):''}<div class="source-line"><strong>${esc(m.source)}</strong> · ${m.updatedAt?formatDate(m.updatedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'No update'}</div></article>`).join('');
  const rows=state.health.metrics.map(m=>`<tr><td>${esc(m.label)}</td><td>${m.value===null?'—':esc(m.value)}</td><td>${esc(m.unit)}</td><td>${esc(m.source)}</td><td>${m.updatedAt?formatDate(m.updatedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not synced'}</td><td><span class="badge ${isStale(m.updatedAt)?'warn':'good'}">${isStale(m.updatedAt)?'Stale':'Current'}</span></td></tr>`).join('');
  return `${pageTitle('Health Command','Source-aware health and recovery data.','<button class="primary" data-action="edit-health">Update metrics</button>')}<div class="page-grid">${cards}${card('Data Integrity',`<p>${esc(state.health.sourceNotice)}</p><p class="muted">Live Apple Health data requires an iPhone Shortcut or a native iOS companion. This web app does not claim direct HealthKit access.</p>`,{className:'span-12'})}${card('Metric History',`<div class="table-wrap"><table class="data-table"><thead><tr><th>Metric</th><th>Value</th><th>Unit</th><th>Source</th><th>Updated</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`,{className:'span-12'})}</div>`;
}
function trainingView(){
  const templates=state.training.templates.map(t=>`<article class="card span-6"><header class="card-header"><div><h2>${esc(t.name)}</h2><small class="muted">${esc(t.location)}</small></div><button class="primary" data-action="start-workout" data-template="${t.id}">Start</button></header><div class="card-body">${t.exercises.map((e,i)=>`<div class="list-item"><div><strong>${i+1}. ${esc(e.name)}</strong><small>${esc(e.setup)} · ${esc(e.target)}</small></div><span class="badge">${e.rest}s rest</span></div>`).join('')}</div></article>`).join('');
  const history=state.training.history.length?state.training.history.slice().reverse().map(w=>`<tr><td>${formatDate(w.finishedAt,{month:'short',day:'numeric'})}</td><td>${esc(w.name)}</td><td>${w.totalSets}</td><td>${Math.round(w.volume).toLocaleString()} lb</td><td>${formatDuration(w.duration)}</td></tr>`).join(''):`<tr><td colspan="5">No completed sessions yet.</td></tr>`;
  return `${pageTitle('Training','Templates, live workout logging, history, and progression.','<button class="secondary" data-action="toggle-workout">Open live logger</button>')}<div class="page-grid">${templates}${card('Workout History',`<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Workout</th><th>Sets</th><th>Volume</th><th>Duration</th></tr></thead><tbody>${history}</tbody></table></div>`,{className:'span-12'})}</div>`;
}
function nutritionView(){
  const n=state.nutrition;
  const items=[['Calories',n.calories,n.calorieGoal,''],['Protein',n.protein,n.proteinGoal,'g'],['Carbs',n.carbs,n.carbGoal,'g'],['Fat',n.fat,n.fatGoal,'g'],['Fiber',n.fiber,n.fiberGoal,'g'],['Hydration',state.hydration.ounces,state.hydration.goal,'oz']];
  return `${pageTitle('Nutrition & Hydration','Manual tracking now; integration-ready for Apple Health exports.','<button class="primary" data-action="edit-nutrition">Update today</button>')}<div class="page-grid">${items.map(([label,val,goal,unit])=>`<article class="card metric-card span-4"><div class="metric-label">${label}</div><div class="metric-number">${val.toLocaleString()} <small>${unit}</small></div>${progress(val,goal,label==='Hydration'?'#2f9fff':label==='Protein'?'#31d17c':'#a86cff')}<div class="source-line">Goal: ${goal.toLocaleString()} ${unit}</div></article>`).join('')}${card('Hydration Log',`<div class="list-card">${state.hydration.logs.slice().reverse().map(log=>`<div class="list-item"><div><strong>${log.amount} oz</strong><small>${formatDate(log.at,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small></div></div>`).join('')||'<div class="empty-state">No water entries.</div>'}</div>`,{className:'span-6',actions:'<button class="text-button" data-action="custom-water">Add water</button>'})}${card('Nutrition Source',`<p><strong>${esc(n.source)}</strong></p><p class="muted">Last updated ${n.updatedAt?formatDate(n.updatedAt,{month:'long',day:'numeric',hour:'numeric',minute:'2-digit'}):'not synced'}.</p><p class="muted">MacroFactor does not provide a general public web API for direct personal syncing. The recommended bridge is a Shortcut, export, or Apple Health-compatible flow when available.</p>`,{className:'span-6'})}</div>`;
}
function recoveryView(){
  const sessions=state.recovery.sessions.slice().reverse();
  return `${pageTitle('Recovery','Sauna, cold plunge, mobility, and readiness protocols.','<button class="primary" data-action="start-recovery">Log recovery</button>')}<div class="page-grid">${state.recovery.protocols.map(p=>`<article class="card metric-card span-6"><div class="metric-label">${p.icon} ${esc(p.name)}</div><div class="metric-number">${p.sessionsThisWeek}<small> sessions this week</small></div><p>${esc(p.target)}</p><button class="secondary" data-action="start-recovery" data-protocol="${p.id}">Log ${esc(p.name)}</button></article>`).join('')}${card('Recovery History',sessions.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Protocol</th><th>Duration</th><th>Temperature</th><th>Notes</th></tr></thead><tbody>${sessions.map(s=>`<tr><td>${formatDate(s.at,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</td><td>${esc(s.name)}</td><td>${esc(s.duration)} min</td><td>${s.temperature?`${esc(s.temperature)}°F`:'—'}</td><td>${esc(s.notes||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state">No recovery sessions logged.</div>',{className:'span-12'})}</div>`;
}
function calendarView(){
  const schedule=state.schedule.slice().sort((a,b)=>new Date(a.start)-new Date(b.start));
  const timeline=schedule.map(e=>`<div class="timeline-item"><div class="timeline-time">${formatDate(e.start,{month:'short',day:'numeric'})}<br>${formatClock(e.start)}</div><div class="rail"></div><div class="timeline-content"><strong>${esc(e.title)}</strong><p>${esc(e.location||e.source||'Manual')}</p></div></div>`).join('');
  const reminders=state.reminders.map(r=>`<div class="list-item"><div><strong>${esc(r.title)}</strong><small>${esc(r.list)} · ${r.due?formatDate(r.due,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'No due date'} · ${esc(r.source)}</small></div><button class="check-square ${r.done?'done':''}" data-action="toggle-reminder" data-id="${r.id}"></button></div>`).join('');
  return `${pageTitle('Calendar & Reminders','Unified manual view with Apple Shortcut sync bridge.','<button class="primary" data-action="add-event">Add event</button> <button class="secondary" data-action="add-reminder">Add reminder</button>')}<div class="page-grid">${card('Schedule',`<div class="timeline">${timeline||'<div class="empty-state">No events.</div>'}</div>`,{className:'span-7'})}${card('Reminders',`<div class="list-card">${reminders||'<div class="empty-state">No reminders.</div>'}</div>`,{className:'span-5'})}${card('Apple Sync Bridge',`<p>The included API endpoints support an iPhone Shortcut that imports Apple Calendar and Reminders records, retrieves command-center outbox items, and acknowledges completed writes.</p><p class="muted">Configure <code>APPLE_SYNC_TOKEN</code>, Supabase, and the Shortcut using the included setup guide. This is a scheduled bridge, not native real-time EventKit access.</p><button class="secondary" data-view="data">Open connection setup</button>`,{className:'span-12'})}</div>`;
}
function tasksView(){
  const groups=['high','medium','low'].map(priority=>[priority,state.tasks.filter(t=>t.priority===priority)]);
  return `${pageTitle('Tasks & Projects','One action inbox across training, school, career, and home.','<button class="primary" data-action="add-task">Add task</button>')}<div class="page-grid">${groups.map(([priority,tasks])=>card(`${priority} priority`,tasks.length?`<div class="list-card">${tasks.map(t=>`<div class="list-item"><div><strong style="${t.done?'text-decoration:line-through;color:#6f899b':''}">${esc(t.title)}</strong><small>${esc(t.project)} · ${t.due?formatDate(t.due,{month:'short',day:'numeric'}):'No due date'}</small></div><button class="check-square ${t.done?'done':''}" data-action="toggle-task" data-id="${t.id}"></button></div>`).join('')}</div>`:'<div class="empty-state">No tasks.</div>',{className:'span-4'})).join('')}</div>`;
}
function careerView(){
  const jobs=state.career.jobs.length?state.career.jobs.map(j=>`<tr><td><strong>${esc(j.company)}</strong><br><small>${esc(j.role)}</small></td><td><span class="badge ${j.status==='Offer'?'good':j.status==='Rejected'?'bad':'warn'}">${esc(j.status)}</span></td><td>${esc(j.compensation||'Not listed')}</td><td>${esc(j.location||'Not listed')}</td><td>${esc(j.nextStep||'')}</td><td><button class="text-button" data-action="edit-job" data-id="${j.id}">Edit</button></td></tr>`).join(''):`<tr><td colspan="6">No live job listings imported. Add a role manually or connect the recurring job search workflow.</td></tr>`;
  const assets=state.career.assets.map(a=>`<div class="list-item"><div><strong>${esc(a.name)}</strong><small>${esc(a.status)}</small></div><span class="badge ${a.status==='Complete'?'good':'warn'}">${esc(a.status)}</span></div>`).join('');
  return `${pageTitle('Jobs & Career','Your 3–6 month transition command center.','<button class="primary" data-action="add-job">Add opportunity</button>')}<div class="page-grid">${card('Executive Positioning',`<p>${esc(state.career.brand)}</p><div class="quick-buttons">${state.career.target.roles.map(r=>`<span class="badge">${esc(r)}</span>`).join('')}</div>`,{className:'span-8'})}${card('Target',`<p><strong>${esc(state.career.target.compensation)}</strong></p><p class="muted">${esc(state.career.target.workModel)}</p><p class="muted">Timeline: ${esc(state.career.target.timeline)}</p>`,{className:'span-4'})}${card('Opportunity Pipeline',`<div class="table-wrap"><table class="data-table"><thead><tr><th>Company / Role</th><th>Status</th><th>Compensation</th><th>Location</th><th>Next Step</th><th></th></tr></thead><tbody>${jobs}</tbody></table></div>`,{className:'span-8'})}${card('Career Assets',`<div class="list-card">${assets}</div>`,{className:'span-4'})}</div>`;
}
function schoolView(){
  const rows=state.school.assignments.map(a=>`<tr><td>${esc(a.title)}</td><td>${esc(a.course)}</td><td>${a.due?formatDate(a.due,{month:'short',day:'numeric'}):'Add date'}</td><td><span class="badge ${a.status==='Complete'?'good':'warn'}">${esc(a.status)}</span></td><td>${esc(a.notes||'')}</td></tr>`).join('');
  return `${pageTitle('School','Graduate program, assignments, and focused work blocks.','<button class="primary" data-action="add-assignment">Add assignment</button>')}<div class="page-grid">${card('Program',`<p><strong>${esc(state.school.program)}</strong></p><p>${esc(state.school.concentration)} concentration</p><p class="muted">${esc(state.school.school)}</p>`,{className:'span-4'})}${card('Assignments',`<div class="table-wrap"><table class="data-table"><thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>`,{className:'span-8'})}</div>`;
}
function financeView(){
  return `${pageTitle('Finance','Personal financial command view.','<button class="primary" data-action="add-bill">Add bill</button>')}<div class="page-grid">${card('Accounts',state.finance.accounts.length?'<div class="list-card">'+state.finance.accounts.map(a=>`<div class="list-item"><div><strong>${esc(a.name)}</strong><small>${esc(a.type)}</small></div><span>${number(a.balance).toLocaleString('en-US',{style:'currency',currency:'USD'})}</span></div>`).join('')+'</div>':'<div class="empty-state"><strong>No accounts connected</strong>Add only the summary data you want displayed.</div>',{className:'span-6'})}${card('Bills & Obligations',state.finance.bills.length?'<div class="list-card">'+state.finance.bills.map(b=>`<div class="list-item"><div><strong>${esc(b.name)}</strong><small>${b.due?formatDate(b.due,{month:'short',day:'numeric'}):'No due date'}</small></div><span>${number(b.amount).toLocaleString('en-US',{style:'currency',currency:'USD'})}</span></div>`).join('')+'</div>':'<div class="empty-state"><strong>No bills entered</strong>Add recurring obligations without sharing account credentials.</div>',{className:'span-6'})}</div>`;
}
function vehiclesView(){
  return `${pageTitle('Vehicles & Home','Maintenance, service dates, projects, and reminders.','<button class="primary" data-action="add-asset">Add item</button>')}<div class="page-grid">${state.vehicles.items.map(item=>`<article class="card metric-card span-4"><div class="metric-label">${esc(item.type)}</div><div class="metric-number" style="font-size:16px">${esc(item.name)}</div><p>${esc(item.notes||'')}</p><div class="source-line">Next service: ${item.nextService?formatDate(item.nextService,{month:'long',day:'numeric',year:'numeric'}):'Not scheduled'}</div></article>`).join('')}</div>`;
}
function notesView(){
  const selected=state.notes[0];
  return `${pageTitle('Notes','Private notes saved locally or to your optional Supabase store.','<button class="primary" data-action="add-note">New note</button>')}<div class="page-grid">${card('Notes',`<div class="list-card">${state.notes.map(n=>`<button class="list-item" style="width:100%;background:transparent;color:inherit;border-left:0;border-right:0;border-top:0;text-align:left" data-action="select-note" data-id="${n.id}"><div><strong>${esc(n.title)}</strong><small>Updated ${formatDate(n.updatedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small></div></button>`).join('')}</div>`,{className:'span-4'})}${card(selected?.title||'Note',`<div class="note-editor"><textarea id="noteBody" class="field" style="width:100%;background:#061928;color:#fff;border:1px solid #294f67;border-radius:7px;padding:12px">${esc(selected?.body||'')}</textarea><button class="primary" data-action="save-note" data-id="${selected?.id||''}">Save note</button></div>`,{className:'span-8'})}</div>`;
}
function reportsView(){
  const completed=state.tasks.filter(t=>t.done).length,total=state.tasks.length,workouts=state.training.history.length,waterPct=Math.round(state.hydration.ounces/state.hydration.goal*100);
  return `${pageTitle('Reports','Weekly operational review and exportable summaries.','<button class="primary" data-action="export-data">Export JSON</button>')}<div class="page-grid"><article class="card metric-card span-3"><div class="metric-label">Task Completion</div><div class="metric-number">${total?Math.round(completed/total*100):0}%</div>${progress(completed,total,'var(--green)')}</article><article class="card metric-card span-3"><div class="metric-label">Workouts Logged</div><div class="metric-number">${workouts}</div></article><article class="card metric-card span-3"><div class="metric-label">Hydration</div><div class="metric-number">${waterPct}%</div>${progress(state.hydration.ounces,state.hydration.goal,'#2f9fff')}</article><article class="card metric-card span-3"><div class="metric-label">Career Pipeline</div><div class="metric-number">${state.career.jobs.length}</div></article>${card('Sunday Operations Review',`<ol><li>Review data freshness and sync failures.</li><li>Confirm the next week’s school deadlines and work schedule.</li><li>Choose the highest-leverage career applications and networking actions.</li><li>Schedule training around sleep, recovery, and overtime risk.</li><li>Export a backup after major updates.</li></ol>`,{className:'span-12'})}</div>`;
}
function dataView(){
  const connections=state.integrations.map(i=>`<div class="connection-row"><div class="connection-icon">${integrationStatusClass(i.status)==='ok'?'✓':integrationStatusClass(i.status)==='warn'?'~':'○'}</div><div><strong>${esc(i.name)}</strong><small>${esc(i.method)}${i.lastSync?` · ${formatDate(i.lastSync,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`:''}</small></div><span class="badge ${integrationStatusClass(i.status)==='ok'?'good':integrationStatusClass(i.status)==='warn'?'warn':''}">${esc(i.status.replaceAll('-',' '))}</span></div>`).join('');
  return `${pageTitle('Data & Connections','Authentication, backup, integrations, and Apple Shortcut bridge.','<button class="primary" data-action="sync-now">Sync now</button>')}<div class="page-grid">${card('Connections',`<div class="connection-list">${connections}</div>`,{className:'span-7'})}${card('Storage Status',`<p><strong>Mode:</strong> ${esc(state.meta.mode)}</p><p><strong>Local save:</strong> ${formatDate(state.meta.updatedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</p><p><strong>Cloud sync:</strong> ${state.meta.lastCloudSync?formatDate(state.meta.lastCloudSync,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not synced'}</p><div class="quick-buttons"><button data-action="export-data">Export backup</button><button data-action="import-data">Import backup</button><button data-action="reset-data">Reset</button></div>`,{className:'span-5'})}${card('Apple Shortcut Setup',`<ol><li>Set <code>APPLE_SYNC_TOKEN</code> in Vercel.</li><li>Run the included Supabase schema.</li><li>Create an iPhone Shortcut that sends Calendar Events and Reminders to <code>/api/apple-sync/import</code>.</li><li>Use the same token in the <code>x-sync-token</code> header.</li><li>Schedule the Shortcut at morning, app open, or another practical trigger.</li></ol><p class="muted">Full native, near-real-time access requires a future iOS companion using EventKit. The PWA cannot directly call EventKit or HealthKit.</p>`,{className:'span-12'})}</div>`;
}
function renderView(){
  const renders={dashboard,health:healthView,training:trainingView,nutrition:nutritionView,recovery:recoveryView,calendar:calendarView,tasks:tasksView,career:careerView,school:schoolView,finance:financeView,vehicles:vehiclesView,notes:notesView,reports:reportsView,data:dataView};
  $('#viewRoot').innerHTML=(renders[currentView]||dashboard)();
}
function setView(view){if(!NAV.some(n=>n[0]===view))return;currentView=view;localStorage.setItem(`${STORAGE_KEY}:view`,view);renderNav();renderView();if(innerWidth<720)scrollTo({top:0,behavior:'smooth'});}

function activeElapsed(){
  const w=state.training.activeWorkout;if(!w)return 0;
  const end=w.paused ? new Date(w.pausedAt).getTime() : Date.now();
  return Math.max(0,Math.floor((end-new Date(w.startedAt).getTime()-(w.pausedMs||0))/1000));
}
function workoutStats(){
  const w=state.training.activeWorkout;if(!w)return {sets:0,volume:0,completedExercises:0};
  let sets=0,volume=0,completedExercises=0;
  w.exercises.forEach(ex=>{const complete=ex.sets.filter(s=>s.complete);sets+=complete.length;volume+=complete.reduce((sum,s)=>sum+number(s.weight)*number(s.reps),0);if(complete.length>=3)completedExercises++;});
  return {sets,volume,completedExercises};
}
function renderWorkoutDock(){
  const dock=$('#workoutDock'),w=state.training.activeWorkout;
  if(!w){
    dock.innerHTML=`<div class="workout-head"><div><p class="eyebrow">LIVE WORKOUT</p><strong>Workout Logger</strong></div><span class="live-dot">OFFLINE READY</span></div><div class="empty-state"><strong>No workout active</strong>Start a template to open the full set logger.</div>${state.training.templates.map(t=>`<button class="primary wide" style="margin-bottom:7px" data-action="start-workout" data-template="${t.id}">Start ${esc(t.name)}</button>`).join('')}`;
    return;
  }
  const ex=w.exercises[w.currentExercise]||w.exercises[0],stats=workoutStats();
  const rows=[0,1,2,3].map((i)=>{const s=ex.sets[i]||{weight:i===0?185:'',reps:i===0?10:'',rir:i===0?2:'',complete:false};return `<tr><td>${i+1}</td><td>${esc(ex.previous||'—')}</td><td><input data-set-field="weight" data-set="${i}" inputmode="decimal" value="${esc(s.weight)}"></td><td><input data-set-field="reps" data-set="${i}" inputmode="numeric" value="${esc(s.reps)}"></td><td><input data-set-field="rir" data-set="${i}" inputmode="numeric" value="${esc(s.rir)}"></td><td class="${s.complete?'set-complete':i===ex.sets.filter(x=>x.complete).length?'set-current':''}">${s.complete?'✓':'○'}</td></tr>`;}).join('');
  const rest=w.restUntil?Math.max(0,Math.ceil((new Date(w.restUntil)-Date.now())/1000)):0;
  dock.innerHTML=`<div class="workout-head"><div><p class="eyebrow">LIVE WORKOUT</p><strong>${esc(w.name)}</strong></div><span class="live-dot">● LIVE</span></div>
    <div class="timer-row"><div><div id="workoutTimer" class="workout-timer">${formatDuration(activeElapsed())}</div><div class="timer-label">WORKOUT TIMER</div></div><button class="pause-button" data-action="pause-workout">${w.paused?'▶':'Ⅱ'}</button></div>
    <div class="workout-summary-line">${esc(w.name)} · ${esc(w.location)}</div>
    <section class="exercise-card"><header><div><p class="eyebrow">CURRENT EXERCISE</p><h3>${esc(ex.name)}</h3></div><button class="ghost" data-action="next-exercise">Next</button></header>
      <div class="exercise-meta"><div><strong>SETUP NOTES</strong><small>${esc(ex.setup)}</small></div><div><strong>PREVIOUS / TARGET</strong><small>${esc(ex.previous||'No history')}<br>Target: ${esc(ex.target)}</small></div></div>
      <table class="sets-table"><thead><tr><th>Set</th><th>Previous</th><th>Weight</th><th>Reps</th><th>RIR</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      ${rest?`<div class="rest-banner"><span>Rest timer</span><strong id="restTimer">${formatDuration(rest)}</strong><button class="text-button" data-action="cancel-rest">Skip</button></div>`:''}
      <div class="dock-actions"><button class="primary" data-action="complete-set">✓ Complete Set</button><button class="secondary" data-action="start-rest" data-seconds="${ex.rest}">Start Rest Timer</button></div>
    </section>
    <section class="queue-card"><header><h3>Exercise Queue</h3><small>${stats.completedExercises} of ${w.exercises.length} completed</small></header><div class="queue-list">${w.exercises.map((item,i)=>{const done=item.sets.filter(s=>s.complete).length>=3;return `<button class="queue-row ${i===w.currentExercise?'current':''} ${done?'done':''}" style="width:100%;border-left:${i===w.currentExercise?'2px solid var(--blue)':'0'};border-right:0;border-top:0;background:${i===w.currentExercise?'rgba(47,140,255,.06)':'transparent'};color:inherit;text-align:left" data-action="select-exercise" data-index="${i}"><span>${i+1}</span><span>${esc(item.name)}</span><span>${done?'✓':''}</span></button>`;}).join('')}</div></section>
    <section class="workout-summary-card"><header><h3>Workout Summary</h3></header><div class="summary-grid"><div><strong>${stats.sets}</strong><small>Total Sets</small></div><div><strong>${Math.round(stats.volume).toLocaleString()}</strong><small>Volume lb</small></div><div><strong id="summaryDuration">${formatDuration(activeElapsed())}</strong><small>Duration</small></div><div><strong>${Math.round(activeElapsed()/60*8)}</strong><small>Est. Calories</small></div></div></section>
    <div class="finish-row"><button class="danger" data-action="finish-workout">⚑ Finish Workout</button><button class="ghost" data-action="discard-workout">•••</button></div>`;
}
function startTimers(){
  clearInterval(workoutInterval);clearInterval(restInterval);
  workoutInterval=setInterval(()=>{if(state.training.activeWorkout){const timer=$('#workoutTimer'),summary=$('#summaryDuration');if(timer)timer.textContent=formatDuration(activeElapsed());if(summary)summary.textContent=formatDuration(activeElapsed());}},1000);
  restInterval=setInterval(()=>{const w=state.training.activeWorkout;if(!w?.restUntil)return;const remaining=Math.max(0,Math.ceil((new Date(w.restUntil)-Date.now())/1000));const el=$('#restTimer');if(el)el.textContent=formatDuration(remaining);if(remaining<=0){w.restUntil=null;save();renderWorkoutDock();toast('Rest complete.');}},1000);
}
function renderQuickActions(){
  const actions=[['add-water','◉ Log 20 ounces of water'],['toggle-workout','◫ Start today’s workout'],['start-recovery','♨ Add sauna session'],['add-task','✓ Add task'],['add-event','□ Add event'],['reports','▥ Weekly review']];
  $('#quickActions').innerHTML=actions.map(([action,label])=>`<button class="quick-action" ${action==='reports'?'data-view="reports"':`data-action="${action}" ${action==='add-water'?'data-amount="20"':action==='start-recovery'?'data-protocol="sauna"':''}`}>${label}</button>`).join('');
}
function render(){renderHeader();renderNav();updateSyncDisplays();quickStats();renderView();renderWorkoutDock();renderQuickActions();startTimers();}

function openModal(title,html,onSave,{eyebrow='COMMAND CENTER',submit='Save'}={}){
  $('#modalTitle').textContent=title;$('#modalEyebrow').textContent=eyebrow;$('#modalBody').innerHTML=html;$('#modalSubmit').textContent=submit;modalSave=onSave;$('#modal').showModal();
}
function formField(label,name,value='',type='text',extra=''){
  if(type==='textarea')return `<label class="field full">${esc(label)}<textarea name="${esc(name)}" ${extra}>${esc(value)}</textarea></label>`;
  if(type==='select')return `<label class="field">${esc(label)}<select name="${esc(name)}">${extra}</select></label>`;
  return `<label class="field">${esc(label)}<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}></label>`;
}
function addTaskModal(){openModal('Add Task',`<div class="form-grid">${formField('Task','title','','text','required')}${formField('Project','project','Personal')}${formField('Priority','priority','','select',['high','medium','low'].map(p=>`<option value="${p}">${p}</option>`).join(''))}${formField('Due date','due','','datetime-local')}</div>`,f=>{state.tasks.unshift({id:uid('task'),title:f.get('title'),project:f.get('project'),priority:f.get('priority'),due:f.get('due')||null,done:false});});}
function addEventModal(){openModal('Add Event',`<div class="form-grid">${formField('Title','title','','text','required')}${formField('Location','location','')}${formField('Start','start','','datetime-local','required')}${formField('End','end','','datetime-local')}</div>`,f=>{state.schedule.push({id:uid('event'),title:f.get('title'),location:f.get('location'),start:f.get('start'),end:f.get('end')||null,source:'Command Center'});state.syncOutbox.push({id:uid('outbox'),entityType:'calendar_event',action:'create',payload:{title:f.get('title'),location:f.get('location'),start:f.get('start'),end:f.get('end')||null},status:'pending',createdAt:nowIso()});});}
function addReminderModal(){openModal('Add Reminder',`<div class="form-grid">${formField('Reminder','title','','text','required')}${formField('List','list','Personal')}${formField('Due','due','','datetime-local')}${formField('Priority','priority','','select',['high','medium','low'].map(p=>`<option value="${p}">${p}</option>`).join(''))}</div>`,f=>{const item={id:uid('rem'),title:f.get('title'),list:f.get('list'),due:f.get('due')||null,priority:f.get('priority'),done:false,source:'Command Center'};state.reminders.unshift(item);state.syncOutbox.push({id:uid('outbox'),entityType:'reminder',action:'create',payload:item,status:'pending',createdAt:nowIso()});});}
function customWaterModal(){openModal('Log Water',`<div class="form-grid">${formField('Ounces','amount','20','number','min="1" max="200" required')}${formField('Time','at',new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),'datetime-local')}</div>`,f=>addWater(number(f.get('amount')),f.get('at')));}
function addWater(amount,at=nowIso()){if(!amount)return;state.hydration.ounces+=amount;state.hydration.updatedAt=at;state.hydration.source='Command Center';state.hydration.logs.push({id:uid('water'),amount,at});save();render();toast(`${amount} oz added.`);}
function editHealthModal(){openModal('Update Health Metrics',`<div class="form-grid">${state.health.metrics.map(m=>formField(`${m.label} (${m.unit||'value'})`,m.id,m.value??'','number','step="any"')).join('')}${formField('Source','source','Manual entry')}${formField('Updated at','updatedAt',new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),'datetime-local')}</div>`,f=>{const source=f.get('source'),updatedAt=f.get('updatedAt')||nowIso();state.health.metrics.forEach(m=>{m.value=number(f.get(m.id),m.value);m.source=source;m.updatedAt=updatedAt;});state.health.sourceNotice=`Updated manually from ${source}. This is not a live HealthKit connection.`;});}
function editNutritionModal(){const n=state.nutrition;openModal('Update Nutrition',`<div class="form-grid">${formField('Calories','calories',n.calories,'number')}${formField('Protein (g)','protein',n.protein,'number')}${formField('Carbs (g)','carbs',n.carbs,'number')}${formField('Fat (g)','fat',n.fat,'number')}${formField('Fiber (g)','fiber',n.fiber,'number')}${formField('Water (oz)','water',state.hydration.ounces,'number')}${formField('Source','source',n.source)}</div>`,f=>{['calories','protein','carbs','fat','fiber'].forEach(k=>n[k]=number(f.get(k)));state.hydration.ounces=number(f.get('water'));n.source=f.get('source')||'Manual entry';n.updatedAt=nowIso();state.hydration.source=n.source;state.hydration.updatedAt=n.updatedAt;});}
function recoveryModal(protocolId){const p=state.recovery.protocols.find(x=>x.id===protocolId)||state.recovery.protocols[0];openModal(`Log ${p.name}`,`<div class="form-grid">${formField('Duration (minutes)','duration',p.id==='sauna'?20:3,'number','required')}${formField('Temperature °F','temperature',p.id==='sauna'?185:45,'number')}${formField('Date and time','at',new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),'datetime-local')}${formField('Notes','notes','','textarea')}</div>`,f=>{state.recovery.sessions.push({id:uid('rec'),protocol:p.id,name:p.name,duration:number(f.get('duration')),temperature:number(f.get('temperature')),at:f.get('at')||nowIso(),notes:f.get('notes')});p.last=f.get('at')||nowIso();p.sessionsThisWeek+=1;});}
function addJobModal(job=null){openModal(job?'Edit Opportunity':'Add Opportunity',`<div class="form-grid">${formField('Company','company',job?.company||'','text','required')}${formField('Role','role',job?.role||'','text','required')}${formField('Status','status','','select',['Saved','Applied','Recruiter','Interview','Offer','Rejected','Withdrawn'].map(s=>`<option ${job?.status===s?'selected':''}>${s}</option>`).join(''))}${formField('Compensation','compensation',job?.compensation||'')}${formField('Location / work model','location',job?.location||'')}${formField('Direct link','url',job?.url||'','url')}${formField('Next step','nextStep',job?.nextStep||'','textarea')}</div>`,f=>{const obj={id:job?.id||uid('job'),company:f.get('company'),role:f.get('role'),status:f.get('status'),compensation:f.get('compensation'),location:f.get('location'),url:f.get('url'),nextStep:f.get('nextStep'),updatedAt:nowIso()};if(job)state.career.jobs[state.career.jobs.findIndex(j=>j.id===job.id)]=obj;else state.career.jobs.unshift(obj);});}
function addAssignmentModal(){openModal('Add Assignment',`<div class="form-grid">${formField('Assignment','title','','text','required')}${formField('Course','course','')}${formField('Due','due','','datetime-local')}${formField('Status','status','','select',['Not Started','In Progress','Submitted','Complete'].map(s=>`<option>${s}</option>`).join(''))}${formField('Notes','notes','','textarea')}</div>`,f=>state.school.assignments.unshift({id:uid('assignment'),...Object.fromEntries(f.entries())}));}
function addBillModal(){openModal('Add Bill',`<div class="form-grid">${formField('Bill','name','','text','required')}${formField('Amount','amount','','number','step="0.01"')}${formField('Due','due','','date')}</div>`,f=>state.finance.bills.push({id:uid('bill'),name:f.get('name'),amount:number(f.get('amount')),due:f.get('due')||null}));}
function addAssetModal(){openModal('Add Vehicle or Home Item',`<div class="form-grid">${formField('Name','name','','text','required')}${formField('Type','type','','select','<option>Vehicle</option><option>Home</option><option>Equipment</option>')}${formField('Next service','nextService','','date')}${formField('Notes','notes','','textarea')}</div>`,f=>state.vehicles.items.push({id:uid('asset'),...Object.fromEntries(f.entries())}));}
function addNoteModal(){openModal('New Note',`<div class="form-grid">${formField('Title','title','','text','required')}${formField('Note','body','','textarea')}</div>`,f=>state.notes.unshift({id:uid('note'),title:f.get('title'),body:f.get('body'),updatedAt:nowIso()}));}
function commandModal(){openModal('Quick Command',`<div class="connection-list"><button type="button" class="connection-row" data-action="add-task"><div class="connection-icon">✓</div><div><strong>Add a task</strong><small>Capture the next action.</small></div></button><button type="button" class="connection-row" data-action="add-event"><div class="connection-icon">□</div><div><strong>Schedule an event</strong><small>Add it to the command center and Apple outbox.</small></div></button><button type="button" class="connection-row" data-action="custom-water"><div class="connection-icon">◉</div><div><strong>Log hydration</strong><small>Update today’s water total.</small></div></button><button type="button" class="connection-row" data-action="start-workout"><div class="connection-icon">◫</div><div><strong>Start a workout</strong><small>Open the live logger.</small></div></button></div>`,()=>{}, {submit:'Close'});}
function searchModal(){const searchable=[...state.tasks.map(x=>['Task',x.title,'tasks']),...state.reminders.map(x=>['Reminder',x.title,'calendar']),...state.career.jobs.map(x=>['Job',`${x.company} ${x.role}`,'career']),...state.notes.map(x=>['Note',x.title,'notes'])];openModal('Search Command Center',`${formField('Search','query','','search','id="globalSearch" autofocus')}<div id="searchResults" class="list-card"></div>`,()=>{}, {submit:'Close'});setTimeout(()=>{$('#globalSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$('#searchResults').innerHTML=q?searchable.filter(x=>x[1].toLowerCase().includes(q)).slice(0,20).map(x=>`<button type="button" class="list-item" style="width:100%;background:transparent;color:inherit;border-left:0;border-right:0;border-top:0;text-align:left" data-view="${x[2]}"><div><strong>${esc(x[1])}</strong><small>${esc(x[0])}</small></div></button>`).join(''):'<div class="empty-state">Type to search.</div>';});},50);}
function startWorkout(templateId){
  if(state.training.activeWorkout){$('#workoutDock').classList.add('open');toast('A workout is already active.');return;}
  const template=state.training.templates.find(t=>t.id===templateId)||state.training.templates[0];
  state.training.activeWorkout={id:uid('workout'),templateId:template.id,name:template.name,location:template.location,startedAt:nowIso(),paused:false,pausedAt:null,pausedMs:0,currentExercise:0,restUntil:null,exercises:template.exercises.map(e=>({...clone(e),sets:[]}))};
  save();render();$('#workoutDock').classList.add('open');toast(`${template.name} started.`);
}
function completeSet(){
  const w=state.training.activeWorkout;if(!w)return;const ex=w.exercises[w.currentExercise];
  const completed=ex.sets.filter(s=>s.complete).length;const row=Math.min(completed,3);
  const get=field=>number(document.querySelector(`[data-set-field="${field}"][data-set="${row}"]`)?.value);
  ex.sets[row]={weight:get('weight'),reps:get('reps'),rir:get('rir'),complete:true,completedAt:nowIso()};
  w.restUntil=new Date(Date.now()+number(ex.rest,90)*1000).toISOString();save();renderWorkoutDock();toast(`Set ${row+1} completed.`);
}
function pauseWorkout(){const w=state.training.activeWorkout;if(!w)return;if(w.paused){w.pausedMs=(w.pausedMs||0)+(Date.now()-new Date(w.pausedAt).getTime());w.paused=false;w.pausedAt=null;}else{w.paused=true;w.pausedAt=nowIso();}save();renderWorkoutDock();}
function finishWorkout(){const w=state.training.activeWorkout;if(!w)return;const stats=workoutStats();state.training.history.push({id:w.id,name:w.name,location:w.location,startedAt:w.startedAt,finishedAt:nowIso(),duration:activeElapsed(),totalSets:stats.sets,volume:stats.volume,exercises:w.exercises});state.training.activeWorkout=null;save();render();$('#workoutDock').classList.remove('open');toast('Workout saved to history.');}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`holleman-command-center-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Backup exported.');}
function resetData(){if(!confirm('Reset all command-center data to the original seed? Export a backup first.'))return;state=defaultState();save();render();toast('Command Center reset.');}

async function handleAction(action,target){
  switch(action){
    case 'add-task': $('#modal').open&&$('#modal').close();addTaskModal();break;
    case 'add-event': $('#modal').open&&$('#modal').close();addEventModal();break;
    case 'add-reminder': $('#modal').open&&$('#modal').close();addReminderModal();break;
    case 'add-water': addWater(number(target.dataset.amount,20));break;
    case 'custom-water': $('#modal').open&&$('#modal').close();customWaterModal();break;
    case 'edit-health': editHealthModal();break;
    case 'edit-nutrition': editNutritionModal();break;
    case 'start-recovery': $('#modal').open&&$('#modal').close();recoveryModal(target.dataset.protocol||'sauna');break;
    case 'toggle-task': {const t=state.tasks.find(x=>x.id===target.dataset.id);if(t){t.done=!t.done;save();render();}}break;
    case 'toggle-reminder': {const r=state.reminders.find(x=>x.id===target.dataset.id);if(r){r.done=!r.done;save();render();}}break;
    case 'start-workout': $('#modal').open&&$('#modal').close();startWorkout(target.dataset.template||state.training.templates[0]?.id);break;
    case 'toggle-workout': if(state.training.activeWorkout)$('#workoutDock').classList.toggle('open');else startWorkout(state.training.templates[0]?.id);break;
    case 'pause-workout': pauseWorkout();break;
    case 'complete-set': completeSet();break;
    case 'start-rest': {const w=state.training.activeWorkout;if(w){w.restUntil=new Date(Date.now()+number(target.dataset.seconds,90)*1000).toISOString();save();renderWorkoutDock();}}break;
    case 'cancel-rest': if(state.training.activeWorkout){state.training.activeWorkout.restUntil=null;save();renderWorkoutDock();}break;
    case 'next-exercise': if(state.training.activeWorkout){state.training.activeWorkout.currentExercise=(state.training.activeWorkout.currentExercise+1)%state.training.activeWorkout.exercises.length;save();renderWorkoutDock();}break;
    case 'select-exercise': if(state.training.activeWorkout){state.training.activeWorkout.currentExercise=number(target.dataset.index);save();renderWorkoutDock();}break;
    case 'finish-workout': finishWorkout();break;
    case 'discard-workout': if(confirm('Discard the active workout?')){state.training.activeWorkout=null;save();render();}break;
    case 'add-job': addJobModal();break;
    case 'edit-job': addJobModal(state.career.jobs.find(j=>j.id===target.dataset.id));break;
    case 'add-assignment': addAssignmentModal();break;
    case 'add-bill': addBillModal();break;
    case 'add-asset': addAssetModal();break;
    case 'add-note': addNoteModal();break;
    case 'save-note': {const n=state.notes.find(x=>x.id===target.dataset.id);if(n){n.body=$('#noteBody')?.value||'';n.updatedAt=nowIso();save();toast('Note saved.');}}break;
    case 'select-note': {const index=state.notes.findIndex(x=>x.id===target.dataset.id);if(index>0){state.notes.unshift(state.notes.splice(index,1)[0]);save();renderView();}}break;
    case 'export-data': exportData();break;
    case 'import-data': $('#importFile').click();break;
    case 'reset-data': resetData();break;
    case 'sync-now': if(apiConfigured&&cloudToken)await syncToCloud();else toast('Cloud sync is not configured; local save is active.');break;
  }
}

document.addEventListener('click',event=>{
  const viewTarget=event.target.closest('[data-view]');if(viewTarget){event.preventDefault();setView(viewTarget.dataset.view);if($('#modal').open)$('#modal').close();return;}
  const actionTarget=event.target.closest('[data-action]');if(actionTarget){event.preventDefault();handleAction(actionTarget.dataset.action,actionTarget);}
});
$('#modalForm').addEventListener('submit',event=>{
  if(event.submitter?.value==='cancel')return;
  event.preventDefault();if(modalSave){modalSave(new FormData(event.currentTarget));save();render();}$('#modal').close();
});
$('#authForm').addEventListener('submit',async event=>{
  event.preventDefault();const passcode=$('#passcodeInput').value;try{const result=await api('/api/auth',{method:'POST',body:JSON.stringify({passcode})});cloudToken=result.token;localStorage.setItem(TOKEN_KEY,cloudToken);$('#passcodeInput').value='';await loadCloud();toast('Command Center unlocked.');}catch(error){showAuth(error.message||'Access denied.');}
});
$('#useLocalMode').addEventListener('click',()=>{state.meta.mode='local';hideAuth();save({cloud:false});render();});
$('#profileButton').addEventListener('click',()=>setView('data'));
$('#searchButton').addEventListener('click',searchModal);
$('#notificationButton').addEventListener('click',()=>setView('calendar'));
$('#commandPrompt').addEventListener('click',commandModal);
$('#importFile').addEventListener('change',event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{state=deepMerge(defaultState(),JSON.parse(reader.result));save();render();toast('Backup imported.');}catch{toast('That JSON file is not a valid backup.');}};reader.readAsText(file);event.target.value='';});
window.addEventListener('online',()=>{if(apiConfigured&&cloudToken)syncToCloud();});
window.addEventListener('beforeunload',()=>save({cloud:false}));
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));

render();
detectAuth();
