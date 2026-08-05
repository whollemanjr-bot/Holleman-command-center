'use strict';

const APP_KEY = 'holleman-command-v7';
const LEGACY_APP_KEY = 'holleman-command-v6';
const PIN_HASH_KEY = 'holleman-command-pin-hash';
const PIN_SALT_KEY = 'holleman-command-pin-salt';
const UNLOCKED_KEY = 'holleman-command-unlocked';
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const defaultState = {
  profile: { name: 'Walter', goalWeight: 235, targetProtein: 220, targetWater: 120 },
  metrics: { weight: 249.8, restingHr: 58, hrv: 63, vo2: 40.1, sleep: 7.7, calories: 2742, protein: 221, water: 105, steps: 8640 },
  trends: { hrv: [46, 49, 53, 50, 57, 60, 63], sleep: [6.2, 6.8, 7.1, 6.4, 7.5, 7.3, 7.7] },
  mission: [
    { id: uid(), title: 'Pull workout', category: 'Training', done: false, date: todayISO(), time: '17:30', duration: 60 },
    { id: uid(), title: 'Zone 2 conditioning', category: 'Training', done: false, date: todayISO(), time: '18:45', duration: 45 },
    { id: uid(), title: 'Protein 220g+', category: 'Nutrition', done: false, date: todayISO(), time: '20:00', duration: 15 },
    { id: uid(), title: 'Review career pipeline', category: 'Career', done: false, date: todayISO(), time: '20:30', duration: 30 },
    { id: uid(), title: 'Mobility and foot care', category: 'Recovery', done: false, date: todayISO(), time: '21:15', duration: 20 }
  ],
  events: [],
  googleEvents: [],
  jobs: [
    { id: uid(), company: 'Target employer', role: 'Senior Risk / Investigations Leader', status: 'Research', next: 'Identify hiring manager' },
    { id: uid(), company: 'Target employer', role: 'Corporate Security Director', status: 'Target', next: 'Tailor executive résumé' },
    { id: uid(), company: 'Target employer', role: 'Enterprise Risk Leader', status: 'Target', next: 'Build referral path' }
  ],
  notes: { briefing: 'Use this space for the morning brief, Maryland updates, school deadlines, and the day’s most important decisions.' },
  sync: { lastCloudSync: '', lastCalendarSync: '' }
};

let state = loadState();
let activePage = 'command';
let inactivityTimer;
let cloudStatus = { configured: false, signedIn: false, email: '', googleConfigured: false, googleConnected: false, message: 'Local mode' };

const tabs = [
  ['command', 'Command', '⌂'],
  ['calendar', 'Calendar', '◫'],
  ['health', 'Health', '♥'],
  ['training', 'Training', '↗'],
  ['nutrition', 'Nutrition', '◉'],
  ['career', 'Career', '◇'],
  ['briefing', 'Briefing', '≡'],
  ['settings', 'Settings', '⚙']
];

function loadState() {
  try {
    const raw = localStorage.getItem(APP_KEY) || localStorage.getItem(LEGACY_APP_KEY);
    const parsed = JSON.parse(raw);
    if (parsed && !localStorage.getItem(APP_KEY)) localStorage.setItem(APP_KEY, JSON.stringify(parsed));
    return parsed ? deepMerge(structuredClone(defaultState), parsed) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function persist(render = true) {
  localStorage.setItem(APP_KEY, JSON.stringify(state));
  window.HCCCloud?.schedulePush(state);
  if (render) renderPages();
}

function readinessScore() {
  const m = state.metrics;
  const sleep = m.sleep >= 7.5 ? 30 : m.sleep >= 7 ? 25 : m.sleep >= 6 ? 15 : 5;
  const hrv = m.hrv >= 60 ? 20 : m.hrv >= 50 ? 15 : m.hrv >= 40 ? 10 : 5;
  const hr = m.restingHr <= 60 ? 20 : m.restingHr <= 64 ? 15 : m.restingHr <= 69 ? 10 : 5;
  const habits = m.protein >= state.profile.targetProtein && m.water >= 100 ? 10 : m.protein >= state.profile.targetProtein || m.water >= 100 ? 8 : 5;
  return Math.min(100, sleep + hrv + hr + habits + 20);
}

function statusForScore(score) {
  if (score >= 90) return ['FULL GO', 'Training intensity is supported today.'];
  if (score >= 80) return ['ON PLAN', 'Execute the plan and monitor fatigue.'];
  if (score >= 70) return ['CONTROLLED', 'Reduce volume and preserve quality.'];
  return ['RECOVERY', 'Prioritize sleep, mobility, and low intensity work.'];
}

function metricCard(label, value, note, accent = 'var(--gold)') {
  return `<article class="card metric-card" style="--accent:${accent}"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong><em>${escapeHTML(note)}</em><i class="metric-accent"></i></article>`;
}

function sectionHead(title, subtitle = '') {
  return `<div class="section-head"><h2>${escapeHTML(title)}</h2><span>${escapeHTML(subtitle)}</span></div>`;
}

function sparkline(values, color = '#b58a4a') {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => `${i * 100 / Math.max(1, values.length - 1)},${88 - ((v - min) / (max - min || 1)) * 66}`).join(' ');
  return `<svg class="chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Trend chart"><line x1="0" y1="88" x2="100" y2="88" stroke="rgba(255,255,255,.08)"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.3" vector-effect="non-scaling-stroke"/></svg>`;
}

function commandPage() {
  const score = readinessScore();
  const [status, description] = statusForScore(score);
  const completed = state.mission.filter(item => item.done).length;
  const nextEvents = allEvents().filter(event => new Date(`${event.date}T${event.time || '00:00'}`) >= new Date()).slice(0, 4);
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

    ${sectionHead('LIVE METRICS', 'Local device data')}
    <section class="grid metric-grid">
      ${metricCard('RESTING HR', `${state.metrics.restingHr} bpm`, '↓ 2 vs baseline', 'var(--green)')}
      ${metricCard('HRV', `${state.metrics.hrv} ms`, 'Above baseline', 'var(--blue)')}
      ${metricCard('SLEEP', `${state.metrics.sleep.toFixed(1)} h`, 'Primary recovery lever', 'var(--cyan)')}
      ${metricCard('WEIGHT', `${state.metrics.weight.toFixed(1)} lb`, `${Math.max(0, state.metrics.weight - state.profile.goalWeight).toFixed(1)} lb to goal`, 'var(--violet)')}
    </section>

    ${sectionHead("TODAY'S MISSION", `${completed}/${state.mission.length} complete`)}
    <section class="grid two-col">
      <article class="card">
        <div class="mission-list">${state.mission.map(missionItem).join('')}</div>
      </article>
      <article class="card">
        <div class="card-header"><div><h3>Daily intelligence</h3><p>What the numbers suggest</p></div><span class="tag">${status}</span></div>
        <p class="insight">Your recovery profile supports productive work. Maintain the 200–220g protein range, move toward 120 oz of water, and protect tonight’s sleep window. The highest-value non-fitness action is a focused career-pipeline review.</p>
        <div class="stat-row">
          <div class="stat-pill"><small>PROTEIN</small><strong>${state.metrics.protein}g</strong></div>
          <div class="stat-pill"><small>WATER</small><strong>${state.metrics.water} oz</strong></div>
          <div class="stat-pill"><small>STEPS</small><strong>${state.metrics.steps.toLocaleString()}</strong></div>
        </div>
      </article>
    </section>`;
}

function missionItem(item) {
  return `<div class="mission-item ${item.done ? 'done' : ''}">
    <input class="mission-check" type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleMission('${item.id}')" aria-label="Mark ${escapeAttr(item.title)} complete" />
    <div class="mission-main"><span class="mission-title">${escapeHTML(item.title)}</span><div class="meta-row"><span>${formatTime(item.time)}</span><span>${escapeHTML(item.category)}</span></div></div>
    <div class="item-actions"><button class="link-button" onclick="exportMissionEvent('${item.id}')">Calendar</button></div>
  </div>`;
}

function agendaItem(event) {
  return `<div class="agenda-item"><span class="tag">${formatShortDate(event.date)}</span><div class="event-main"><span class="event-title">${escapeHTML(event.title)}</span><div class="meta-row"><span>${formatTime(event.time)}</span><span>${escapeHTML(event.category || 'Personal')}</span></div></div></div>`;
}
