function calendarPage() {
  const localEvents = [...state.events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const googleEvents = [...(state.googleEvents || [])].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const events = [...localEvents, ...googleEvents].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return `
    <section class="grid two-col">
      <article class="card">
        <div class="card-header"><div><p class="kicker">CALENDAR COMMAND</p><h3 style="margin-top:7px">Two-way schedule control</h3><p>Google Calendar becomes the bridge between this dashboard and Apple Calendar on your devices.</p></div><button class="button primary" onclick="openEventDialog()">＋ New event</button></div>
        <div class="notice">Connect Google Calendar, then use Sync to import changes made in Apple Calendar and send new dashboard events back to Google. Apple Calendar must have the same Google account enabled.</div>
        <div class="settings-actions"><button class="button ${cloudStatus.googleConnected ? 'ghost' : 'primary'}" onclick="connectGoogleCalendar()">${cloudStatus.googleConnected ? 'Reconnect Google' : 'Connect Google Calendar'}</button><button class="button ghost" onclick="syncGoogleCalendar()">↻ Sync calendar</button><button class="button ghost" onclick="exportAllEvents()">Export .ics backup</button></div>
        <p class="sync-note">${state.sync.lastCalendarSync ? `Last calendar sync: ${escapeHTML(state.sync.lastCalendarSync)}` : 'Calendar sync has not run yet.'}</p>
      </article>
      <article class="card">
        <div class="card-header"><div><h3>Calendar summary</h3><p>Local and connected schedule</p></div></div>
        <div class="stat-row"><div class="stat-pill"><small>LOCAL</small><strong>${localEvents.length}</strong></div><div class="stat-pill"><small>GOOGLE</small><strong>${googleEvents.length}</strong></div><div class="stat-pill"><small>NEXT 7 DAYS</small><strong>${events.filter(inNextSevenDays).length}</strong></div></div>
      </article>
    </section>
    ${sectionHead('UPCOMING EVENTS', events.length ? `${events.length} available` : 'No saved events')}
    <section class="card"><div class="event-list">${events.length ? events.map(eventItem).join('') : '<div class="empty-state">Create an event or connect Google Calendar to begin.</div>'}</div></section>`;
}

function eventItem(event) {
  const source = event.googleId ? 'GOOGLE' : 'LOCAL';
  return `<div class="event-item"><span class="tag">${formatShortDate(event.date)}</span><div class="event-main"><span class="event-title">${escapeHTML(event.title)}</span><div class="meta-row"><span>${formatTime(event.time)}</span><span>${event.duration} min</span><span>${escapeHTML(event.category)}</span><span>${source}</span></div></div><div class="item-actions">${event.googleId ? '' : `<button class="link-button" onclick="exportEvent('${event.id}')">Add to Apple</button>`}<button class="link-button" onclick="deleteEvent('${event.id}')">Delete</button></div></div>`;
}

function healthPage() {
  const score = readinessScore();
  return `
    <section class="grid metric-grid">
      ${metricCard('RECOVERY', `${score}%`, statusForScore(score)[0], 'var(--gold)')}
      ${metricCard('VO₂ MAX', state.metrics.vo2.toFixed(1), 'Improving', 'var(--blue)')}
      ${metricCard('RESTING HR', `${state.metrics.restingHr} bpm`, 'Strong baseline', 'var(--green)')}
      ${metricCard('HRV', `${state.metrics.hrv} ms`, 'Above baseline', 'var(--cyan)')}
    </section>
    ${sectionHead('RECOVERY SIGNALS', 'Seven-day view')}
    <section class="grid two-col"><article class="card"><div class="card-header"><div><h3>HRV trend</h3><p>Higher generally indicates better recovery</p></div></div>${sparkline(state.trends.hrv, '#6f8f75')}</article><article class="card"><div class="card-header"><div><h3>Sleep consistency</h3><p>Target 7+ hours nightly</p></div></div>${sparkline(state.trends.sleep, '#718789')}</article></section>`;
}

function trainingPage() {
  return `
    <section class="grid three-col">
      ${planCard('ARSENAL PULL', 'Commercial gym · 38 min', ['Arsenal High Row — 3 × 8–12', 'Reloaded Iso Multi Row — 3 × 8–12', 'Seated Cable Row — 3 × 10–12', 'Rear Delt Fly — 3 × 12–15', 'Reloaded Preacher Curl — 3 × 8–12'])}
      ${planCard('ARSENAL PUSH', 'Commercial gym · 42 min', ['Vertical Chest Press — 3 × 6–10', 'Incline Press — 3 × 8–12', 'Shoulder Press — 3 × 8–12', 'Standing Lateral Raise — 3 × 12–15', 'Seated Triceps Extension — 3 × 10–15'])}
      ${planCard('ARES 2.0 PULL', 'Home gym · 40 min', ['Lat Pulldown — 3 × 8–12', 'Single-Arm Cable Row — 3 × 10 each', 'Smith Bent-Over Row — 3 × 6–10', 'Face Pull — 3 × 12–15', 'Cable Curl — 3 × 10–12'])}
    </section>`;
}

function planCard(title, subtitle, exercises) {
  return `<article class="card"><div class="card-header"><div><p class="kicker">WORKOUT PLAN</p><h3 style="margin-top:7px">${escapeHTML(title)}</h3><p>${escapeHTML(subtitle)}</p></div></div><div class="mission-list">${exercises.map((exercise, i) => `<div class="mission-item"><span class="tag">${i + 1}</span><div class="mission-main"><span class="mission-title">${escapeHTML(exercise)}</span></div></div>`).join('')}</div></article>`;
}

function nutritionPage() {
  const proteinPct = Math.min(100, Math.round(state.metrics.protein / state.profile.targetProtein * 100));
  const waterPct = Math.min(100, Math.round(state.metrics.water / state.profile.targetWater * 100));
  return `
    <section class="grid metric-grid">${metricCard('CALORIES', state.metrics.calories.toLocaleString(), 'Daily intake', 'var(--gold)')}${metricCard('PROTEIN', `${state.metrics.protein}g`, `${proteinPct}% of target`, 'var(--green)')}${metricCard('WATER', `${state.metrics.water} oz`, `${waterPct}% of target`, 'var(--blue)')}${metricCard('WEIGHT', `${state.metrics.weight.toFixed(1)} lb`, `${(state.metrics.weight - state.profile.goalWeight).toFixed(1)} lb remaining`, 'var(--violet)')}</section>
    ${sectionHead('TARGET PROGRESS', 'Daily execution')}
    <section class="grid two-col"><article class="card"><div class="card-header"><div><h3>Protein</h3><p>${state.metrics.protein} of ${state.profile.targetProtein} grams</p></div><strong>${proteinPct}%</strong></div><div class="progress-track"><i style="width:${proteinPct}%"></i></div></article><article class="card"><div class="card-header"><div><h3>Hydration</h3><p>${state.metrics.water} of ${state.profile.targetWater} ounces</p></div><strong>${waterPct}%</strong></div><div class="progress-track"><i style="width:${waterPct}%"></i></div></article></section>`;
}

function careerPage() {
  return `
    <section class="grid metric-grid">${metricCard('TARGET COMP', '$175–200K+', 'Executive-level transition', 'var(--gold)')}${metricCard('TIMEFRAME', '3–6 months', 'Focused transition window', 'var(--blue)')}${metricCard('PREFERENCE', 'Remote / Hybrid', 'Flexible schedule', 'var(--green)')}${metricCard('POSITIONING', 'Risk + Investigations', 'Banking and LE leadership', 'var(--violet)')}</section>
    ${sectionHead('CAREER PIPELINE', 'Private-sector transition')}
    <section class="card"><div class="job-list">${state.jobs.map(job => `<div class="job-item"><span class="tag">${escapeHTML(job.status)}</span><div class="job-main"><span class="job-title">${escapeHTML(job.role)}</span><div class="meta-row"><span>${escapeHTML(job.company)}</span><span>Next: ${escapeHTML(job.next)}</span></div></div></div>`).join('')}</div></section>`;
}

function briefingPage() {
  return `<section class="grid two-col"><article class="card"><div class="card-header"><div><p class="kicker">MORNING BRIEF</p><h3 style="margin-top:7px">Daily intelligence workspace</h3><p>Public safety, Maryland, politics, markets, fitness, AI, EVs, and other priorities.</p></div></div><label class="field"><span>Briefing notes</span><textarea rows="14" oninput="state.notes.briefing=this.value; persist(false)">${escapeHTML(state.notes.briefing)}</textarea></label></article><article class="card"><div class="card-header"><div><h3>Decision queue</h3><p>Items that deserve action, not just attention</p></div></div><div class="mission-list"><div class="mission-item"><span class="tag">01</span><div class="mission-main"><span class="mission-title">Career transition</span><div class="meta-row"><span>Advance one high-value action today</span></div></div></div><div class="mission-item"><span class="tag">02</span><div class="mission-main"><span class="mission-title">Training readiness</span><div class="meta-row"><span>Match volume to recovery score</span></div></div></div><div class="mission-item"><span class="tag">03</span><div class="mission-main"><span class="mission-title">School deadlines</span><div class="meta-row"><span>Protect focused academic time</span></div></div></div></div></article></section>`;
}

function settingsPage() {
  const m = state.metrics;
  const p = state.profile;
  const fields = [
    ['Weight', 'metrics.weight', m.weight, '0.1'], ['Resting HR', 'metrics.restingHr', m.restingHr, '1'], ['HRV', 'metrics.hrv', m.hrv, '1'], ['VO₂ Max', 'metrics.vo2', m.vo2, '0.1'],
    ['Sleep', 'metrics.sleep', m.sleep, '0.1'], ['Calories', 'metrics.calories', m.calories, '1'], ['Protein', 'metrics.protein', m.protein, '1'], ['Water', 'metrics.water', m.water, '1'],
    ['Steps', 'metrics.steps', m.steps, '1'], ['Goal weight', 'profile.goalWeight', p.goalWeight, '0.1'], ['Protein target', 'profile.targetProtein', p.targetProtein, '1'], ['Water target', 'profile.targetWater', p.targetWater, '1']
  ];
  return `
    <section class="grid two-col">
      <article class="card"><div class="card-header"><div><p class="kicker">CLOUD SYNC</p><h3 style="margin-top:7px">Account and shared data</h3><p>Use one account to keep the command center synchronized across devices.</p></div></div>
        <div class="cloud-grid">
          <div class="cloud-panel"><span class="cloud-badge ${cloudStatus.signedIn ? 'connected' : ''}">${cloudStatus.signedIn ? 'Cloud connected' : 'Cloud offline'}</span><h4>${cloudStatus.signedIn ? escapeHTML(cloudStatus.email) : 'Supabase account'}</h4><p>${cloudStatus.configured ? 'Sign in or create an account, then push your current dashboard or pull the latest saved copy.' : 'Enter the Supabase project URL and anon/public key below to activate account login and cross-device data.'}</p></div>
          <div class="cloud-panel"><span class="cloud-badge ${cloudStatus.googleConnected ? 'connected' : ''}">${cloudStatus.googleConnected ? 'Calendar connected' : 'Calendar offline'}</span><h4>Google ↔ Apple Calendar</h4><p>${cloudStatus.googleConfigured ? 'Connect Google Calendar from the Calendar page. The connection lasts for the current browser session.' : 'Add the Google OAuth client ID below to activate calendar authorization.'}</p></div>
        </div>
        ${cloudStatus.configured ? '' : `<div class="form-grid" style="margin-top:14px"><label class="field span-2"><span>Supabase project URL</span><input id="supabaseUrl" placeholder="https://project.supabase.co" /></label><label class="field span-2"><span>Supabase anon/public key</span><input id="supabaseAnonKey" type="password" placeholder="Public anon key" /></label><label class="field span-2"><span>Google OAuth client ID</span><input id="googleClientId" placeholder="Optional until calendar setup" /></label></div><div class="settings-actions"><button class="button primary" onclick="saveCloudConfig()">Save connection setup</button></div>`}
        <div class="form-grid" style="margin-top:14px"><label class="field"><span>Email</span><input id="cloudEmail" type="email" autocomplete="email" placeholder="you@example.com" value="${escapeAttr(cloudStatus.email)}" /></label><label class="field"><span>Password</span><input id="cloudPassword" type="password" autocomplete="current-password" placeholder="8+ characters" /></label></div>
        <div class="settings-actions">${cloudStatus.signedIn ? '<button class="button primary" onclick="pushCloudNow()">Push this device</button><button class="button ghost" onclick="pullCloudNow()">Pull cloud copy</button><button class="button ghost" onclick="cloudSignOut()">Sign out</button>' : '<button class="button primary" onclick="cloudSignIn()">Sign in</button><button class="button ghost" onclick="cloudSignUp()">Create account</button>'}</div>
        <p class="sync-note">${escapeHTML(cloudStatus.message || 'Local mode remains available during setup.')}${state.sync.lastCloudSync ? ` Last cloud sync: ${escapeHTML(state.sync.lastCloudSync)}.` : ''}</p>
      </article>
      <article class="card"><div class="card-header"><div><h3>Privacy and access</h3><p>Local PIN plus authenticated cloud access</p></div></div><div class="notice">The local PIN protects casual access on this device. Supabase authentication and row-level security protect synchronized cloud records. Keep the repository private before adding sensitive information.</div><div class="settings-actions"><button class="button ghost" onclick="lockApp()">Lock now</button><button class="button ghost" onclick="changePin()">Change PIN</button><button class="button danger" onclick="resetLocalData()">Reset local data</button></div></article>
    </section>
    ${sectionHead('LOCAL DATA', 'Metrics and portability')}
    <section class="card"><div class="card-header"><div><h3>Dashboard data</h3><p>Update the values used throughout the command center</p></div></div><div class="form-grid">${fields.map(([label, path, value, step]) => `<label class="field"><span>${label}</span><input type="number" step="${step}" value="${value}" onchange="setNumeric('${path}', this.value)" /></label>`).join('')}</div><div class="settings-actions"><button class="button primary" onclick="persist()">Save updates</button><button class="button ghost" onclick="downloadBackup()">Download backup</button><label class="button ghost">Import backup<input type="file" accept="application/json" hidden onchange="importBackup(this.files[0])" /></label></div></section>`;
}
