'use strict';
(function(){
  const datedSchedule={
    '2026-08-05':'Arsenal Push'
  };
  function scheduledWorkout(date=today()){
    const exact=datedSchedule[date];
    if(exact)return data.workouts.find(w=>w.name===exact)||null;
    const day=new Date(date+'T12:00:00').getDay();
    const fallback={1:'Arsenal Push',3:'Arsenal Pull',5:'Ares 2.0 Pull'}[day];
    return data.workouts.find(w=>w.name===fallback)||null;
  }
  window.getScheduledWorkout=scheduledWorkout;
  window.startScheduledWorkout=function(){
    const workout=scheduledWorkout();
    if(!workout)return toast('No workout is scheduled for today.');
    data.v11=data.v11||{};
    data.v11.workoutDraft={
      name:workout.name,
      date:today(),
      duration:String(parseInt(workout.duration,10)||''),
      notes:'Scheduled workout',
      exercises:workout.exercises.map(item=>{
        const parts=item.split('—').map(x=>x.trim());
        const prescription=parts[1]||'';
        const match=prescription.match(/(\d+)\s*[×x]\s*(.+)/);
        return {name:parts[0],sets:match?.[1]||'',reps:match?.[2]||prescription,weight:''};
      })
    };
    data.v11.healthView='log';
    saveData(false);
    refresh();
    showPage('healthhub',false);
    toast(workout.name+' loaded.');
  };
  function trainingCard(){
    const workout=scheduledWorkout();
    if(!workout)return `<section class="card"><div class="card-title"><h3>Today's Training</h3><span>No session scheduled</span></div><p class="copy">Use the workout library or log an unscheduled session.</p><button class="btn" onclick="setHealthHub('log')">Open Workout Log</button></section>`;
    return `<section class="card today-training-card"><div class="card-title"><h3>Today's Training</h3><span>${esc(today())}</span></div><span class="tag">SCHEDULED</span><h2>${esc(workout.name.replace('Arsenal ',''))} Day</h2><p class="copy">${esc(workout.place)} • ${esc(workout.duration)} • ${workout.exercises.length} exercises</p><div class="today-training-list">${workout.exercises.map(x=>`<div><span>✓</span><b>${esc(x)}</b></div>`).join('')}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn gold" onclick="startScheduledWorkout()">Start & Log Workout</button><button class="btn" onclick="setHealthHub('strength')">View Strength Plan</button></div></section>`;
  }
  const priorHome=window.homePage;
  window.homePage=function(){
    let html=priorHome();
    const marker='<section class="card v11-compact"><div class="card-title"><h3>Health & Training</h3>';
    const pos=html.indexOf(marker);
    if(pos>=0)html=html.slice(0,pos)+trainingCard()+html.slice(pos);
    else html+=trainingCard();
    return html;
  };
  renders.home=homePage;
  const priorRender=window.render;
  window.render=function(active='home'){
    renders.home=homePage;
    priorRender(active);
    document.title='Holleman Command Center — V11';
  };
  render(currentPage());
})();