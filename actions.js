const renderers = { command: commandPage, calendar: calendarPage, health: healthPage, training: trainingPage, nutrition: nutritionPage, career: careerPage, briefing: briefingPage, settings: settingsPage };

function renderNavigation() {
  document.getElementById('nav').innerHTML = tabs.map(([id, label, icon]) => `<button class="nav-button ${id === activePage ? 'active' : ''}" data-page="${id}" onclick="showPage('${id}')"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></button>`).join('');
}

function renderPages() {
  const pages = document.getElementById('pages');
  pages.innerHTML = tabs.map(([id]) => `<section class="page ${id === activePage ? 'active' : ''}" id="page-${id}">${renderers[id]()}</section>`).join('');
  renderNavigation();
}

function showPage(id) {
  activePage = id;
  const tab = tabs.find(item => item[0] === id);
  document.getElementById('pageTitle').textContent = tab ? tab[1] : 'Command';
  renderPages();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMission(id) {
  const item = state.mission.find(entry => entry.id === id);
  if (item) item.done = !item.done;
  persist();
}

function allEvents() {
  return [...state.events, ...(state.googleEvents || []), ...state.mission.map(item => ({ ...item, notes: `Holleman Command mission item: ${item.title}` }))];
}

function inNextSevenDays(event) {
  const date = new Date(`${event.date}T${event.time || '00:00'}`);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 7 * 86400000);
  return date >= now && date <= cutoff;
}

function openEventDialog() {
  const dialog = document.getElementById('eventDialog');
  const form = document.getElementById('eventForm');
  form.reset();
  form.elements.date.value = todayISO();
  form.elements.time.value = '18:00';
  dialog.showModal();
}

async function saveEventFromForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const calendarEvent = {
    id: uid(), title: formData.get('title').trim(), date: formData.get('date'), time: formData.get('time'),
    duration: Number(formData.get('duration')), category: formData.get('category'), notes: formData.get('notes').trim()
  };
  state.events.push(calendarEvent);
  persist();
  document.getElementById('eventDialog').close();
  if (formData.get('google')) {
    try { await window.HCCCloud.createGoogleEvent(calendarEvent); state.events = state.events.filter(item => item.id !== calendarEvent.id); localStorage.setItem(APP_KEY, JSON.stringify(state)); await syncGoogleCalendar(); }
    catch (error) { alert(`Saved locally, but Google Calendar was not updated: ${error.message}`); }
  }
}

async function deleteEvent(id) {
  const googleEvent = (state.googleEvents || []).find(event => event.id === id);
  if (googleEvent?.googleId) {
    try { await window.HCCCloud.deleteGoogleEvent(googleEvent.googleId); state.googleEvents = state.googleEvents.filter(event => event.id !== id); persist(); }
    catch (error) { alert(error.message); }
    return;
  }
  state.events = state.events.filter(event => event.id !== id);
  persist();
}

function exportMissionEvent(id) {
  const item = state.mission.find(entry => entry.id === id);
  if (item) downloadICS([item], slugify(item.title) + '.ics');
}

function exportEvent(id) {
  const event = state.events.find(entry => entry.id === id);
  if (event) downloadICS([event], slugify(event.title) + '.ics');
}

function exportAllEvents() {
  const events = state.events.length ? state.events : allEvents();
  downloadICS(events, 'holleman-command-calendar.ics');
}

function exportTodayMission() {
  downloadICS(state.mission.filter(item => item.date === todayISO()), `holleman-mission-${todayISO()}.ics`);
}

function downloadICS(events, filename) {
  if (!events.length) return alert('There are no events to export.');
  const body = events.map(toICSEvent).join('\r\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Holleman Command Center//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', body, 'END:VCALENDAR'].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toICSEvent(event) {
  const start = new Date(`${event.date}T${event.time || '09:00'}:00`);
  const end = new Date(start.getTime() + Number(event.duration || 60) * 60000);
  return [
    'BEGIN:VEVENT', `UID:${event.id || uid()}@holleman-command`, `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`, `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.notes || `Holleman Command · ${event.category || 'Personal'}`)}`, `CATEGORIES:${icsEscape(event.category || 'Personal')}`, 'END:VEVENT'
  ].join('\r\n');
}

function icsDate(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsEscape(value) { return String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }

function setNumeric(path, value) {
  const [root, key] = path.split('.');
  state[root][key] = Number(value);
  persist(false);
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `holleman-command-backup-${todayISO()}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { state = deepMerge(structuredClone(defaultState), JSON.parse(reader.result)); persist(); alert('Backup imported.'); }
    catch { alert('That file is not a valid Holleman Command backup.'); }
  };
  reader.readAsText(file);
}

function resetLocalData() {
  if (!confirm('Reset all locally saved command-center data on this device?')) return;
  localStorage.removeItem(APP_KEY);
  state = structuredClone(defaultState);
  persist();
}
