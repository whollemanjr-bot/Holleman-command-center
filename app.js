const renders={home:homePage,command:commandPage,calendar:calendarPage,heart:heartPage,running:runningPage,strength:strengthPage,nutrition:nutritionPage,body:bodyPage,career:careerPage,briefing:briefingPage,plans:plansPage,settings:settingsPage};
function render(active='home'){document.getElementById('nav').innerHTML=tabs.map((t,i)=>`<button data-id="${t[0]}" class="${i===0?'active':''}" onclick="showPage('${t[0]}')"><i>${t[2]}</i><span>${t[1]}</span></button>`).join('');document.getElementById('pages').innerHTML=tabs.map((t,i)=>`<section id="page-${t[0]}" class="page ${i===0?'active':''}">${renders[t[0]]()}</section>`).join('');showPage(active,false);updateHeader()}
function showPage(id,scroll=true){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+id));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.id===id));const t=tabs.find(x=>x[0]===id);document.getElementById('pageTitle').textContent=t?.[3]||'Dashboard';if(scroll)window.scrollTo({top:0,behavior:'smooth'})}
function currentPage(){return document.querySelector('.nav button.active')?.dataset.id||'home'}
function refresh(){const p=currentPage();render(p)}
function updateHeader(){const now=new Date(),hour=now.getHours();document.getElementById('greeting').textContent=`GOOD ${hour<12?'MORNING':hour<18?'AFTERNOON':'EVENING'}, WALTER`;document.getElementById('date').textContent=now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});document.getElementById('clock').textContent=now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});document.getElementById('focusLabel').textContent=data.briefing.focusMode;document.getElementById('topFocus').textContent=data.briefing.focusMode}
function toDisplayTime(t){if(!t)return'All day';const [h,m]=t.split(':').map(Number),d=new Date();d.setHours(h,m);return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}
function togglePriority(i,done){data.priorities[i].done=done;saveData(false);refresh()}
function saveMetrics(){document.querySelectorAll('[data-metric]').forEach(el=>data.metrics[el.dataset.metric]=Number(el.value));saveData(false);refresh();showPage('settings');toast('Performance metrics updated.')}
function saveBriefing(){
  const byId=id=>document.getElementById(id);
  data.briefing.headline=byId('briefHeadline')?.value.trim()||data.briefing.headline;
  data.briefing.summary=byId('briefSummary')?.value.trim()||data.briefing.summary;
  data.briefing.mission=byId('briefMission')?.value.trim()||data.briefing.mission;
  data.briefing.focus=byId('briefFocus')?.value.trim()||data.briefing.focus;
  data.briefing.mindset=byId('briefMindset')?.value.trim()||data.briefing.mindset;
  data.briefing.focusMode=byId('briefMode')?.value||data.briefing.focusMode;
  data.morningTopics.forEach((topic,i)=>{
    topic.headline=byId(`topicHeadline${i}`)?.value.trim()||topic.headline;
    topic.summary=byId(`topicSummary${i}`)?.value.trim()||topic.summary;
    topic.impact=byId(`topicImpact${i}`)?.value.trim()||topic.impact;
  });
  saveData(false);refresh();showPage('briefing');toast('Morning briefing updated.');
}
function icsEscape(s=''){return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function icsLocal(date,time){return `${date.replace(/-/g,'')}T${(time||'09:00').replace(':','')}00`}
function downloadICS(e){const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Holleman Dashboard//Morning Briefing//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${Date.now()}-${Math.random().toString(36).slice(2)}@holleman-dashboard`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${icsLocal(e.date,e.start)}`,`DTEND:${icsLocal(e.date,e.end||e.start)}`,`SUMMARY:${icsEscape(e.title)}`,`LOCATION:${icsEscape(e.location||'')}`,`DESCRIPTION:${icsEscape(e.notes||'')}`,'BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY',`DESCRIPTION:${icsEscape(e.title)}`,'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');download(body,(e.title||'dashboard-event').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'.ics','text/calendar;charset=utf-8');toast('Apple Calendar file downloaded.')}
function createEvent(exportNow){const e={title:document.getElementById('eventTitle').value.trim(),date:document.getElementById('eventDate').value,start:document.getElementById('eventStart').value,end:document.getElementById('eventEnd').value,category:document.getElementById('eventCategory').value,location:document.getElementById('eventLocation').value.trim(),notes:document.getElementById('eventNotes').value.trim()};if(!e.title||!e.date)return toast('Add an event title and date.');data.events.unshift(e);saveData(false);if(exportNow)downloadICS(e);refresh();showPage('calendar');if(!exportNow)toast('Event saved locally.')}
function downloadEvent(i){downloadICS(data.events[i])}
function removeEvent(i){data.events.splice(i,1);saveData(false);refresh();showPage('calendar');toast('Event removed.')}
function workoutCalendar(i){const w=data.workouts[i];downloadICS({title:w.name,date:today(),start:'17:30',end:'18:30',location:w.place,notes:w.exercises.join('\n')})}
function download(content,name,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportData(){download(JSON.stringify(data,null,2),'holleman-dashboard-backup.json','application/json');toast('Backup downloaded.')}
function importData(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{data=migrate(deepMerge(clone(defaults),JSON.parse(reader.result)));saveData(false);refresh();showPage('settings');toast('Backup restored.')}catch{toast('That backup file is not valid.')}};reader.readAsText(file)}
function resetData(){if(!confirm('Reset all locally saved dashboard data?'))return;data=clone(defaults);saveData(false);render('home');toast('Local dashboard reset.')}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
render();setInterval(updateHeader,30000);
