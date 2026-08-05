function updateCloudStatus(next) {
  cloudStatus = { ...cloudStatus, ...next };
  const dot = document.getElementById('cloudStatusDot');
  const label = document.getElementById('cloudStatusLabel');
  const text = document.getElementById('cloudStatusText');
  if (dot) dot.className = `status-dot ${cloudStatus.signedIn ? 'cloud' : cloudStatus.configured ? 'warning' : ''}`;
  if (label) label.textContent = cloudStatus.signedIn ? 'CLOUD SYSTEM' : cloudStatus.configured ? 'CLOUD READY' : 'LOCAL MODE';
  if (text) text.textContent = cloudStatus.signedIn ? 'Synchronized' : cloudStatus.configured ? 'Sign in required' : 'Operational';
  if (document.getElementById('pages')) renderPages();
}

function saveCloudConfig() {
  const values = {
    supabaseUrl: document.getElementById('supabaseUrl')?.value.trim() || '',
    supabaseAnonKey: document.getElementById('supabaseAnonKey')?.value.trim() || '',
    googleClientId: document.getElementById('googleClientId')?.value.trim() || ''
  };
  if (!values.supabaseUrl || !values.supabaseAnonKey) return alert('Enter the Supabase project URL and anon/public key.');
  window.HCCCloud.saveConfig(values);
  updateCloudStatus({ configured: true, googleConfigured: Boolean(values.googleClientId), message: 'Cloud configuration saved on this device.' });
  alert('Connection setup saved. You can now create or sign in to your account.');
}

function cloudCredentials() {
  return { email: document.getElementById('cloudEmail')?.value.trim() || '', password: document.getElementById('cloudPassword')?.value || '' };
}

async function cloudSignIn() {
  const { email, password } = cloudCredentials();
  if (!email || !password) return alert('Enter your email and password.');
  try { await window.HCCCloud.signIn(email, password); updateCloudStatus({ signedIn: true, email, message: 'Signed in.' }); await pullCloudNow(true); }
  catch (error) { alert(error.message); }
}

async function cloudSignUp() {
  const { email, password } = cloudCredentials();
  if (!email || password.length < 8) return alert('Enter an email and a password with at least 8 characters.');
  try { const result = await window.HCCCloud.signUp(email, password); updateCloudStatus({ signedIn: Boolean(result?.access_token), email, message: result?.access_token ? 'Account created.' : 'Check your email to confirm the account.' }); if (result?.access_token) await pushCloudNow(); }
  catch (error) { alert(error.message); }
}

function cloudSignOut() { window.HCCCloud.signOut(); updateCloudStatus({ signedIn: false, email: '', message: 'Signed out. Local mode remains active.' }); }

async function pushCloudNow(silent = false) {
  try { await window.HCCCloud.pushState(state); state.sync.lastCloudSync = new Date().toLocaleString(); localStorage.setItem(APP_KEY, JSON.stringify(state)); updateCloudStatus({ message: 'Cloud sync complete.' }); if (!silent) alert('This device has been pushed to the cloud.'); }
  catch (error) { if (!silent) alert(error.message); updateCloudStatus({ message: error.message }); }
}

async function pullCloudNow(silent = false) {
  try { const remote = await window.HCCCloud.pullState(); if (remote) { state = deepMerge(structuredClone(defaultState), remote); state.sync.lastCloudSync = new Date().toLocaleString(); localStorage.setItem(APP_KEY, JSON.stringify(state)); updateHeader(); renderPages(); } if (!silent) alert(remote ? 'Cloud data loaded onto this device.' : 'No cloud copy exists yet.'); }
  catch (error) { if (!silent) alert(error.message); updateCloudStatus({ message: error.message }); }
}

function connectGoogleCalendar() {
  try { window.HCCCloud.connectGoogle(() => syncGoogleCalendar()); }
  catch (error) { alert(error.message); }
}

async function syncGoogleCalendar() {
  try { state.googleEvents = await window.HCCCloud.fetchGoogleEvents(); state.sync.lastCalendarSync = new Date().toLocaleString(); localStorage.setItem(APP_KEY, JSON.stringify(state)); updateCloudStatus({ googleConnected: true, message: 'Google Calendar synchronized.' }); renderPages(); }
  catch (error) { alert(error.message); updateCloudStatus({ message: error.message }); }
}

async function syncAll() {
  if (cloudStatus.signedIn) await pushCloudNow(true);
  if (window.HCCCloud.googleConnected()) await syncGoogleCalendar();
  if (!cloudStatus.signedIn && !window.HCCCloud.googleConnected()) showPage('settings');
}

async function hashPin(pin, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function configureLockScreen() {
  const hasPin = Boolean(localStorage.getItem(PIN_HASH_KEY));
  document.getElementById('lockTitle').textContent = hasPin ? 'Command center locked' : 'Secure your command center';
  document.getElementById('lockCopy').textContent = hasPin ? 'Enter your device PIN to continue.' : 'Create a simple PIN for casual privacy on this device.';
  document.getElementById('pinLabel').textContent = hasPin ? 'PIN' : 'Create PIN';
  document.getElementById('confirmPinField').hidden = hasPin;
  document.getElementById('pinSubmit').textContent = hasPin ? 'Unlock' : 'Create PIN';
  document.getElementById('pinInput').value = '';
  document.getElementById('confirmPinInput').value = '';
  document.getElementById('pinMessage').textContent = '';
}

async function handlePinSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('pinInput');
  const confirmInput = document.getElementById('confirmPinInput');
  const message = document.getElementById('pinMessage');
  const pin = input.value.trim();
  const hasPin = Boolean(localStorage.getItem(PIN_HASH_KEY));
  if (!/^\d{4,10}$/.test(pin)) { message.textContent = 'Use a 4–10 digit PIN.'; return; }

  if (!hasPin) {
    if (pin !== confirmInput.value.trim()) { message.textContent = 'PINs do not match.'; return; }
    const salt = randomSalt();
    localStorage.setItem(PIN_SALT_KEY, salt);
    localStorage.setItem(PIN_HASH_KEY, await hashPin(pin, salt));
    unlockApp();
    return;
  }

  const expected = localStorage.getItem(PIN_HASH_KEY);
  const actual = await hashPin(pin, localStorage.getItem(PIN_SALT_KEY) || '');
  if (actual !== expected) { message.textContent = 'Incorrect PIN.'; input.select(); return; }
  unlockApp();
}

function unlockApp() {
  sessionStorage.setItem(UNLOCKED_KEY, '1');
  document.getElementById('lockScreen').hidden = true;
  document.getElementById('appShell').hidden = false;
  updateHeader();
  renderPages();
  resetInactivityTimer();
}

function lockApp() {
  sessionStorage.removeItem(UNLOCKED_KEY);
  document.getElementById('appShell').hidden = true;
  document.getElementById('lockScreen').hidden = false;
  configureLockScreen();
  clearTimeout(inactivityTimer);
}

function changePin() {
  if (!confirm('Replace the current local PIN? You will create a new PIN immediately.')) return;
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_SALT_KEY);
  lockApp();
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(lockApp, LOCK_TIMEOUT_MS);
}

function updateHeader() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  document.getElementById('greeting').textContent = `${greeting}, ${state.profile.name.toUpperCase()}`;
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return 'All day';
  const [hours, minutes] = value.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function formatShortDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' }); }
function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'; }
function escapeHTML(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function escapeAttr(value) { return escapeHTML(value); }

window.showPage = showPage;
window.toggleMission = toggleMission;
window.openEventDialog = openEventDialog;
window.deleteEvent = deleteEvent;
window.exportMissionEvent = exportMissionEvent;
window.exportEvent = exportEvent;
window.exportAllEvents = exportAllEvents;
window.exportTodayMission = exportTodayMission;
window.setNumeric = setNumeric;
window.downloadBackup = downloadBackup;
window.importBackup = importBackup;
window.resetLocalData = resetLocalData;
window.lockApp = lockApp;
window.changePin = changePin;
window.persist = persist;
window.saveCloudConfig = saveCloudConfig;
window.cloudSignIn = cloudSignIn;
window.cloudSignUp = cloudSignUp;
window.cloudSignOut = cloudSignOut;
window.pushCloudNow = pushCloudNow;
window.pullCloudNow = pullCloudNow;
window.connectGoogleCalendar = connectGoogleCalendar;
window.syncGoogleCalendar = syncGoogleCalendar;

async function init() {
  configureLockScreen();
  document.getElementById('pinForm').addEventListener('submit', handlePinSubmit);
  document.getElementById('eventForm').addEventListener('submit', saveEventFromForm);
  document.getElementById('quickEventButton').addEventListener('click', openEventDialog);
  document.getElementById('lockButton').addEventListener('click', lockApp);
  document.getElementById('syncButton').addEventListener('click', syncAll);
  if (window.HCCCloud) {
    const initial = await window.HCCCloud.init(updateCloudStatus);
    updateCloudStatus({ ...initial, email: window.HCCCloud.user()?.email || '', googleConfigured: window.HCCCloud.googleConfigured(), googleConnected: window.HCCCloud.googleConnected() });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(name => document.addEventListener(name, () => {
    if (!document.getElementById('appShell').hidden) resetInactivityTimer();
  }, { passive: true }));
  if (sessionStorage.getItem(UNLOCKED_KEY) === '1' && localStorage.getItem(PIN_HASH_KEY)) unlockApp();
}

init();
