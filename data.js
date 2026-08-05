'use strict';
const KEY='holleman-command-center-intelligence-v6';
const defaults={
  metrics:{weight:249.8,goalWeight:235,restingHr:58,hrv:63,vo2:40.1,sleep:7.7,calories:2180,calorieGoal:2400,protein:222,proteinGoal:220,carbs:210,carbGoal:250,fat:72,fatGoal:80,water:86,waterGoal:100,weeklyMileage:24.7,longRun:7.2,avgPace:'8:42',weeklyVolume:18450,prs:7},
  briefing:{headline:'Start informed. Focus on what matters.',summary:'A clear morning view of your schedule, health, career progress, and the developments most relevant to you.',mission:'Finish the highest-value item before noon.',focus:'Work • Health • Career',mindset:'Keep the day realistic and leave room to adjust.',focusMode:'Balanced'},
  briefingPriorities:['Breaking news','Career opportunities','Policy & legal changes','Research & studies','Product releases','Maryland developments'],
  morningTopics:[
    {icon:'◫',title:'Law Enforcement & Public Safety',priority:'Policy & operations',headline:'Public safety briefing',summary:'The leading policing, crime, courts, and public-safety development for the day.',impact:'Watch for operational, legal, leadership, or career implications.'},
    {icon:'⌂',title:'Maryland News',priority:'Local developments',headline:'Maryland morning update',summary:'The most important state and Baltimore-area development affecting daily life, policy, or public safety.',impact:'Focus on what changes locally and what may require attention.'},
    {icon:'◆',title:'National Politics',priority:'Policy & government',headline:'National policy watch',summary:'A concise update on the federal political story most likely to affect policy, institutions, or the economy.',impact:'Separate meaningful policy movement from routine political noise.'},
    {icon:'↗',title:'Markets & Economy',priority:'Money & business',headline:'Markets and economy',summary:'The key market, inflation, employment, rate, or business development shaping the day.',impact:'Highlight possible effects on household costs, investments, and career opportunities.'},
    {icon:'♥',title:'Fitness & Health',priority:'Research & performance',headline:'Health and performance',summary:'A useful study, safety update, training insight, or health development relevant to your goals.',impact:'Prioritize practical takeaways and evidence quality.'},
    {icon:'◎',title:'Technology & AI',priority:'Tools & releases',headline:'Technology and AI',summary:'The most relevant AI, software, cybersecurity, or technology development and why it matters.',impact:'Emphasize useful tools, workplace impact, and meaningful product changes.'},
    {icon:'◉',title:'Tesla & EVs',priority:'Products & ownership',headline:'Tesla and EV update',summary:'The leading vehicle, charging, software, pricing, or industry development in the EV market.',impact:'Focus on ownership value, product changes, and major market shifts.'},
    {icon:'◇',title:'Firearms & 2A',priority:'Law & products',headline:'Firearms and 2A update',summary:'The most relevant legal, policy, court, safety, or product development in the firearms space.',impact:'Prioritize verified legal changes and practical implications.'}
  ],
  priorities:[
    {title:'Pull workout',time:'5:30 PM',category:'Training',done:false},
    {title:'Zone 2 conditioning',time:'6:45 PM',category:'Training',done:false},
    {title:'Protein 220g+',time:'8:00 PM',category:'Nutrition',done:false},
    {title:'Review career pipeline',time:'8:30 PM',category:'Career',done:false},
    {title:'Mobility and foot care',time:'9:15 PM',category:'Recovery',done:false}
  ],
  events:[
    {title:'Pull workout',date:today(),start:'17:30',end:'18:30',category:'Training',location:'',notes:'Priority training session.'},
    {title:'Review career pipeline',date:today(),start:'20:30',end:'21:00',category:'Career',location:'',notes:'Review roles, applications, contacts, and next actions.'}
  ],
  career:[
    {role:'Senior Risk / Investigations',status:'Applied',next:'Follow up this week',progress:70,color:'violet'},
    {role:'Corporate Security Leadership',status:'Target',next:'Refine positioning',progress:45,color:'orange'},
    {role:'Operations / Crisis Management',status:'Researching',next:'Build target list',progress:30,color:'blue'}
  ],
  deadlines:[
    {month:'AUG',day:'08',type:'SCHOOL',title:'Leadership assignment',remaining:'4 days'},
    {month:'AUG',day:'10',type:'CAREER',title:'Resume and LinkedIn review',remaining:'6 days'},
    {month:'AUG',day:'15',type:'HOME',title:'Monthly planning review',remaining:'11 days'}
  ],
  workouts:[
    {name:'Arsenal Pull',place:'Commercial Gym',duration:'38 min',exercises:['Arsenal High Row — 3 × 8–12','Reloaded Iso Multi Row — 3 × 8–12','Seated Cable Row — 3 × 10–12','Rear Delt Fly — 3 × 12–15','Reloaded Preacher Curl — 3 × 8–12']},
    {name:'Arsenal Push',place:'Commercial Gym',duration:'42 min',exercises:['Vertical Chest Press — 3 × 6–10','Incline Press — 3 × 8–12','Shoulder Press — 3 × 8–12','Standing Lateral Raise — 3 × 12–15','Seated Triceps Extension — 3 × 10–15']},
    {name:'Ares 2.0 Pull',place:'Home Gym',duration:'40 min',exercises:['Lat Pulldown — 3 × 8–12','Single-Arm Cable Row — 3 × 10 each','Smith Bent-Over Row — 3 × 6–10','Face Pull — 3 × 12–15','Cable Curl — 3 × 10–12']}
  ]
};
const tabs=[
  ['home','Home','⌂','Morning Briefing'],['command','Today','✓','Today'],['calendar','Calendar','◫','Calendar'],['heart','Health','♥','Health & Recovery'],['running','Running','↗','Running'],['strength','Strength','◎','Strength'],['nutrition','Nutrition','◉','Nutrition'],['body','Body','◇','Body Composition'],['career','Career','◆','Career'],['briefing','Morning Brief','≡','Morning Brief'],['plans','Workouts','▣','Workout Plans'],['settings','Settings','⚙','Data & Settings']
];
let data=loadData(),toastTimer;
function today(){const d=new Date(),z=d.getTimezoneOffset()*60000;return new Date(d-z).toISOString().slice(0,10)}
function clone(v){return JSON.parse(JSON.stringify(v))}
function deepMerge(base,custom){if(Array.isArray(base))return Array.isArray(custom)?custom:base;if(base&&typeof base==='object'){const out={...base};if(custom&&typeof custom==='object')Object.keys(custom).forEach(k=>out[k]=k in base?deepMerge(base[k],custom[k]):custom[k]);return out}return custom===undefined?base:custom}
function migrate(v){
  if(v.briefing?.headline==='Execute the Plan. Elevate Every Day.')v.briefing.headline=defaults.briefing.headline;
  if(v.briefing?.mission==='Stay consistent.')v.briefing.mission=defaults.briefing.mission;
  if(v.briefing?.mindset==='Discipline today. Freedom tomorrow.')v.briefing.mindset=defaults.briefing.mindset;
  if(v.briefing?.focusMode==='Operational')v.briefing.focusMode='Balanced';
  return v;
}
function loadData(){try{return migrate(deepMerge(clone(defaults),JSON.parse(localStorage.getItem(KEY)||'{}')))}catch{return clone(defaults)}}
function saveData(show=true){localStorage.setItem(KEY,JSON.stringify(data));if(show)toast('Dashboard saved on this device.')}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function score(){const m=data.metrics;let s=20;s+=m.sleep>=7.5?25:m.sleep>=7?21:m.sleep>=6?13:6;s+=m.hrv>=60?20:m.hrv>=50?15:m.hrv>=40?10:5;s+=m.restingHr<=60?20:m.restingHr<=65?15:m.restingHr<=70?10:5;s+=(m.protein>=m.proteinGoal*.9?8:4)+(m.water>=m.waterGoal*.85?7:3);return Math.min(100,s)}
function statusFor(r){return r>=90?'Excellent':r>=80?'Good':r>=70?'Moderate':'Recovery day'}
function section(title,sub=''){return `<div class="section"><h2>${title}</h2><span>${sub}</span></div>`}
function metric(label,value,sub,pct=70,gold=false){return `<section class="card metric"><small>${label}</small><strong>${value}</strong><em>${sub}</em><div class="bar ${gold?'gold':''}"><i style="width:${Math.max(3,Math.min(100,pct))}%"></i></div></section>`}
function spark(values){const min=Math.min(...values),max=Math.max(...values),points=values.map((v,i)=>`${i*100/(values.length-1)},${34-(v-min)/(max-min||1)*28}`).join(' ');return `<div class="spark"><svg viewBox="0 0 100 38" preserveAspectRatio="none"><polyline points="${points}"/></svg></div>`}
function upcoming(){return [...data.events].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,5)}
