'use strict';

(() => {
  if (document.querySelector('link[data-command-dashboard-theme]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/command-dashboard.css';
  link.dataset.commandDashboardTheme = 'true';
  document.head.appendChild(link);
})();

function commandPage() {
  const score = readinessScore();
  const [status, description] = statusForScore(score);
  const completed = state.mission.filter(item => item.done).length;
  const remaining = Math.max(0, state.mission.length - completed);
  const upcoming = allEvents()
    .filter(event => new Date(`${event.date}T${event.time || '00:00'}`) >= new Date())
    .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`));
  const nextEvents = upcoming.slice(0, 4);
  const sevenDayCount = allEvents().filter(inNextSevenDays).length;
  const proteinPct = Math.min(100, Math.round(state.metrics.protein / state.profile.targetProtein * 100));
  const waterPct = Math.min(100, Math.round(state.metrics.water / state.profile.targetWater * 100));
  const proteinLeft = Math.max(0, state.profile.targetProtein - state.metrics.protein);
  const waterLeft = Math.max(0, state.profile.targetWater - state.metrics.water);
  const weightRemaining = Math.max(0, state.metrics.weight - state.profile.goalWeight).toFixed(1);
  const briefing = (state.notes.briefing || '').trim() || 'No briefing notes have been added yet.';
  const briefingPreview = briefing.length > 190 ? `${briefing.slice(0, 187)}…` : briefing;
  const cloudLabel = cloudStatus.signedIn ? 'Cloud on' : 'Local only';
  const calendarLabel = cloudStatus.googleConnected ? 'Calendar on' : 'Calendar local';

  return `
    <div class="command-dashboard">
      <section class="grid hero-grid">
        <article class="card hero-card">
          <div class="hero-copy">
            <p class="kicker">OPERATIONAL READINESS</p>
            <h2>${status}</h2>
            <p>${description} Recovery is being driven by ${state.metrics.sleep.toFixed(1)} hours of sleep, ${state.metrics.hrv} ms HRV, and a resting heart rate of ${state.metrics.restingHr} bpm.</p>
          </div>
          <div class="hero-bottom">
            <div class="readiness-number">${score}<span>/100</span></div>
            <div class="hero-progress">
              <small><span>Daily readiness</span><span>${score}%</span></small>
              <div class="progress-track"><i style="width:${score}%"></i></div>
            </div>
          </div>
        </article>

        <article class="card agenda-card">
          <div class="card-header">
            <div><p class="kicker">SCHEDULE</p><h3>Next on deck</h3></div>
            <button class="button small ghost" onclick="openEventDialog()">＋ Add</button>
          </div>
          <div class="agenda-list">${nextEvents.length ? nextEvents.map(event => agendaItem(event)).join('') : '<div class="empty-state">No upcoming events yet.</div>'}</div>
          <button class="text-action" onclick="showPage('calendar')">Open full calendar →</button>
        </article>
      </section>

      <section class="command-ribbon" aria-label="Daily command summary">
        <button class="ribbon-item" onclick="showPage('command')"><small>MISSION</small><strong>${remaining} remaining</strong><span>${completed}/${state.mission.length} complete</span></button>
        <button class="ribbon-item" onclick="showPage('calendar')"><small>NEXT 7 DAYS</small><strong>${sevenDayCount} scheduled</strong><span>${upcoming.length} upcoming total</span></button>
        <button class="ribbon-item" onclick="showPage('nutrition')"><small>NUTRITION</small><strong>${proteinLeft}g protein left</strong><span>${waterLeft} oz water left</span></button>
        <button class="ribbon-item" onclick="showPage('career')"><small>CAREER</small><strong>${state.jobs.length} active targets</strong><span>${escapeHTML(state.jobs[0]?.next || 'Add next action')}</span></button>
        <button class="ribbon-item" onclick="showPage('settings')"><small>CONNECTIONS</small><strong>${cloudLabel}</strong><span>${calendarLabel}</span></button>
      </section>

      ${sectionHead('LIVE METRICS', 'The numbers that change today’s plan')}
      <section class="grid metric-grid command-metrics">
        ${metricCard('RESTING HR', `${state.metrics.restingHr} bpm`, 'Current baseline', 'var(--green)')}
        ${metricCard('HRV', `${state.metrics.hrv} ms`, 'Recovery signal', 'var(--blue)')}
        ${metricCard('SLEEP', `${state.metrics.sleep.toFixed(1)} h`, 'Primary recovery lever', 'var(--cyan)')}
        ${metricCard('WEIGHT', `${state.metrics.weight.toFixed(1)} lb`, `${weightRemaining} lb to goal`, 'var(--violet)')}
      </section>

      ${sectionHead("TODAY'S MISSION", `${completed}/${state.mission.length} complete`)}
      <section class="grid mission-grid">
        <article class="card mission-card">
          <div class="mission-list">${state.mission.map(missionItem).join('')}</div>
        </article>
        <article class="card focus-card">
          <div class="card-header"><div><p class="kicker">DAILY INTELLIGENCE</p><h3>Today’s focus</h3></div><span class="tag">${status}</span></div>
          <p class="insight">${score >= 80 ? 'Your recovery profile supports productive work and normal training intensity.' : 'Keep the day controlled and protect recovery quality.'}</p>
          <div class="focus-list">
            <div><span>01</span><p><strong>Training</strong> Match volume to the readiness score and finish the highest-value work first.</p></div>
            <div><span>02</span><p><strong>Career</strong> Complete one pipeline action before lower-priority administrative work.</p></div>
            <div><span>03</span><p><strong>Recovery</strong> Close the remaining nutrition gaps and protect tonight’s sleep window.</p></div>
          </div>
          <div class="stat-row">
            <div class="stat-pill"><small>PROTEIN</small><strong>${state.metrics.protein}g</strong></div>
            <div class="stat-pill"><small>WATER</small><strong>${state.metrics.water} oz</strong></div>
            <div class="stat-pill"><small>STEPS</small><strong>${state.metrics.steps.toLocaleString()}</strong></div>
          </div>
        </article>
      </section>

      ${sectionHead('OPERATING LANES', 'The rest of the command picture')}
      <section class="lane-grid">
        <article class="card lane-card">
          <div class="lane-head"><div><p class="kicker">NUTRITION</p><h3>Daily targets</h3></div><button class="text-action" onclick="showPage('nutrition')">Update →</button></div>
          <div class="compact-progress">
            <div><span>Protein</span><strong>${state.metrics.protein}/${state.profile.targetProtein}g</strong></div>
            <div class="progress-track"><i style="width:${proteinPct}%"></i></div>
          </div>
          <div class="compact-progress">
            <div><span>Hydration</span><strong>${state.metrics.water}/${state.profile.targetWater} oz</strong></div>
            <div class="progress-track"><i style="width:${waterPct}%"></i></div>
          </div>
          <div class="lane-footer"><span>${state.metrics.calories.toLocaleString()} calories</span><span>${proteinLeft}g protein left</span></div>
        </article>

        <article class="card lane-card">
          <div class="lane-head"><div><p class="kicker">CAREER</p><h3>Transition pipeline</h3></div><button class="text-action" onclick="showPage('career')">Open →</button></div>
          <div class="compact-jobs">${state.jobs.slice(0, 2).map(job => `<div class="compact-job"><span class="tag">${escapeHTML(job.status)}</span><div><strong>${escapeHTML(job.role)}</strong><small>${escapeHTML(job.next)}</small></div></div>`).join('') || '<div class="empty-state">No career targets saved yet.</div>'}</div>
          <div class="lane-footer"><span>$175–200K+ target</span><span>3–6 month window</span></div>
        </article>

        <article class="card lane-card">
          <div class="lane-head"><div><p class="kicker">BRIEFING</p><h3>Decision queue</h3></div><button class="text-action" onclick="showPage('briefing')">Edit →</button></div>
          <p class="lane-copy">${escapeHTML(briefingPreview)}</p>
          <div class="lane-footer"><span>Maryland · Public safety</span><span>Markets · AI · Policy</span></div>
        </article>

        <article class="card lane-card">
          <div class="lane-head"><div><p class="kicker">SYSTEM</p><h3>Connection status</h3></div><button class="text-action" onclick="showPage('settings')">Settings →</button></div>
          <div class="status-pair">
            <div class="${cloudStatus.signedIn ? 'connected' : ''}"><small>CLOUD</small><strong>${cloudLabel}</strong></div>
            <div class="${cloudStatus.googleConnected ? 'connected' : ''}"><small>CALENDAR</small><strong>${calendarLabel}</strong></div>
          </div>
          <p class="sync-note">${state.sync.lastCloudSync ? `Cloud: ${escapeHTML(state.sync.lastCloudSync)}.` : 'Cloud has not synced yet.'} ${state.sync.lastCalendarSync ? `Calendar: ${escapeHTML(state.sync.lastCalendarSync)}.` : 'Calendar has not synced yet.'}</p>
        </article>
      </section>
    </div>`;
}
