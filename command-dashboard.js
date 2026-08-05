'use strict';

function commandPage() {
  const score = readinessScore();
  const [status, description] = statusForScore(score);
  const completed = state.mission.filter(item => item.done).length;
  const remaining = Math.max(0, state.mission.length - completed);
  const upcoming = allEvents()
    .filter(event => new Date(`${event.date}T${event.time || '00:00'}`) >= new Date())
    .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`));
  const nextEvents = upcoming.slice(0, 5);
  const sevenDayCount = allEvents().filter(inNextSevenDays).length;
  const proteinPct = Math.min(100, Math.round(state.metrics.protein / state.profile.targetProtein * 100));
  const waterPct = Math.min(100, Math.round(state.metrics.water / state.profile.targetWater * 100));
  const weightRemaining = Math.max(0, state.metrics.weight - state.profile.goalWeight).toFixed(1);
  const briefing = (state.notes.briefing || '').trim() || 'No briefing notes have been added yet.';
  const briefingPreview = briefing.length > 260 ? `${briefing.slice(0, 257)}…` : briefing;
  const cloudLabel = cloudStatus.signedIn ? 'Connected' : 'Local';
  const calendarLabel = cloudStatus.googleConnected ? 'Connected' : 'Local';
  const cloudAction = cloudStatus.signedIn ? 'pushCloudNow()' : "showPage('settings')";
  const calendarAction = cloudStatus.googleConnected ? 'syncGoogleCalendar()' : "showPage('calendar')";

  return `
    <section class="grid hero-grid">
      <article class="card hero-card">
        <p class="kicker">OPERATIONAL READINESS</p>
        <h2>${status}</h2>
        <p>${description} Recovery is being driven by ${state.metrics.sleep.toFixed(1)} hours of sleep, ${state.metrics.hrv} ms HRV, and a resting heart rate of ${state.metrics.restingHr} bpm.</p>
        <div class="hero-bottom">
          <div class="readiness-number">${score}<span>/100</span></div>
          <div class="hero-progress"><small><span>Daily readiness</span><span>${score}%</span></small><div class="progress-track"><i style="width:${score}%"></i></div></div>
        </div>
      </article>
      <article class="card agenda-card">
        <div class="card-header"><div><h3>Next on deck</h3><p>Calendar and mission schedule</p></div><button class="button small ghost" onclick="openEventDialog()">Add</button></div>
        <div class="agenda-list">${nextEvents.length ? nextEvents.map(event => agendaItem(event)).join('') : '<div class="empty-state">No upcoming events yet.</div>'}</div>
      </article>
    </section>

    ${sectionHead('QUICK COMMANDS', 'High-frequency actions')}
    <section class="card">
      <div class="settings-actions">
        <button class="button primary" onclick="openEventDialog()">＋ Add event</button>
        <button class="button ghost" onclick="showPage('briefing')">Open briefing</button>
        <button class="button ghost" onclick="showPage('nutrition')">Update nutrition</button>
        <button class="button ghost" onclick="showPage('career')">Career pipeline</button>
        <button class="button ghost" onclick="${calendarAction}">${cloudStatus.googleConnected ? '↻ Sync calendar' : 'Connect calendar'}</button>
        <button class="button ghost" onclick="${cloudAction}">${cloudStatus.signedIn ? '↑ Push cloud' : 'Set up cloud'}</button>
      </div>
      <div class="stat-row" style="margin-top:14px">
        <div class="stat-pill"><small>MISSION</small><strong>${remaining} left</strong></div>
        <div class="stat-pill"><small>NEXT 7 DAYS</small><strong>${sevenDayCount}</strong></div>
        <div class="stat-pill"><small>SYNC</small><strong>${cloudLabel} / ${calendarLabel}</strong></div>
      </div>
    </section>

    ${sectionHead('LIVE METRICS', 'Local device data')}
    <section class="grid metric-grid">
      ${metricCard('RESTING HR', `${state.metrics.restingHr} bpm`, 'Current baseline', 'var(--green)')}
      ${metricCard('HRV', `${state.metrics.hrv} ms`, 'Recovery signal', 'var(--blue)')}
      ${metricCard('SLEEP', `${state.metrics.sleep.toFixed(1)} h`, 'Primary recovery lever', 'var(--cyan)')}
      ${metricCard('WEIGHT', `${state.metrics.weight.toFixed(1)} lb`, `${weightRemaining} lb to goal`, 'var(--violet)')}
    </section>

    ${sectionHead("TODAY'S MISSION", `${completed}/${state.mission.length} complete`)}
    <section class="grid two-col">
      <article class="card">
        <div class="mission-list">${state.mission.map(missionItem).join('')}</div>
      </article>
      <article class="card">
        <div class="card-header"><div><h3>Daily intelligence</h3><p>What the numbers suggest</p></div><span class="tag">${status}</span></div>
        <p class="insight">${score >= 80 ? 'Your recovery profile supports productive work and normal training intensity.' : 'Keep the day controlled and prioritize recovery quality.'} Maintain the ${state.profile.targetProtein}g protein target, move toward ${state.profile.targetWater} oz of water, and protect tonight’s sleep window. The highest-value non-fitness action remains a focused career-pipeline review.</p>
        <div class="stat-row">
          <div class="stat-pill"><small>PROTEIN</small><strong>${state.metrics.protein}g</strong></div>
          <div class="stat-pill"><small>WATER</small><strong>${state.metrics.water} oz</strong></div>
          <div class="stat-pill"><small>STEPS</small><strong>${state.metrics.steps.toLocaleString()}</strong></div>
        </div>
      </article>
    </section>

    ${sectionHead('DAILY EXECUTION', 'Nutrition and career movement')}
    <section class="grid two-col">
      <article class="card">
        <div class="card-header"><div><h3>Nutrition targets</h3><p>Daily compliance at a glance</p></div><button class="button small ghost" onclick="showPage('nutrition')">Update</button></div>
        <div class="progress-row"><div class="card-header"><div><strong>Protein</strong><p>${state.metrics.protein} of ${state.profile.targetProtein} grams</p></div><strong>${proteinPct}%</strong></div><div class="progress-track"><i style="width:${proteinPct}%"></i></div></div>
        <div class="progress-row" style="margin-top:18px"><div class="card-header"><div><strong>Hydration</strong><p>${state.metrics.water} of ${state.profile.targetWater} ounces</p></div><strong>${waterPct}%</strong></div><div class="progress-track"><i style="width:${waterPct}%"></i></div></div>
        <div class="stat-row" style="margin-top:16px"><div class="stat-pill"><small>CALORIES</small><strong>${state.metrics.calories.toLocaleString()}</strong></div><div class="stat-pill"><small>PROTEIN LEFT</small><strong>${Math.max(0, state.profile.targetProtein - state.metrics.protein)}g</strong></div><div class="stat-pill"><small>WATER LEFT</small><strong>${Math.max(0, state.profile.targetWater - state.metrics.water)} oz</strong></div></div>
      </article>
      <article class="card">
        <div class="card-header"><div><h3>Career pipeline</h3><p>Private-sector transition actions</p></div><button class="button small ghost" onclick="showPage('career')">Open</button></div>
        <div class="job-list">${state.jobs.slice(0, 3).map(job => `<div class="job-item"><span class="tag">${escapeHTML(job.status)}</span><div class="job-main"><span class="job-title">${escapeHTML(job.role)}</span><div class="meta-row"><span>${escapeHTML(job.company)}</span><span>Next: ${escapeHTML(job.next)}</span></div></div></div>`).join('') || '<div class="empty-state">No career targets saved yet.</div>'}</div>
      </article>
    </section>

    ${sectionHead('BRIEFING & SYSTEM STATUS', 'Context, deadlines, and connections')}
    <section class="grid two-col">
      <article class="card">
        <div class="card-header"><div><h3>Morning brief</h3><p>Decision-ready notes</p></div><button class="button small ghost" onclick="showPage('briefing')">Edit</button></div>
        <p class="insight">${escapeHTML(briefingPreview)}</p>
        <div class="settings-actions"><button class="button ghost" onclick="showPage('calendar')">Review schedule</button><button class="button ghost" onclick="exportTodayMission()">Export today</button></div>
      </article>
      <article class="card">
        <div class="card-header"><div><h3>System status</h3><p>Cloud, calendar, and upcoming load</p></div><span class="tag">V7</span></div>
        <div class="stat-row">
          <div class="stat-pill"><small>CLOUD</small><strong>${cloudLabel}</strong></div>
          <div class="stat-pill"><small>CALENDAR</small><strong>${calendarLabel}</strong></div>
          <div class="stat-pill"><small>UPCOMING</small><strong>${upcoming.length}</strong></div>
        </div>
        <p class="sync-note" style="margin-top:14px">${state.sync.lastCloudSync ? `Cloud: ${escapeHTML(state.sync.lastCloudSync)}.` : 'Cloud has not synced yet.'} ${state.sync.lastCalendarSync ? `Calendar: ${escapeHTML(state.sync.lastCalendarSync)}.` : 'Calendar has not synced yet.'}</p>
        <div class="settings-actions"><button class="button ghost" onclick="showPage('settings')">Connection settings</button><button class="button ghost" onclick="showPage('calendar')">Calendar command</button></div>
      </article>
    </section>`;
}
