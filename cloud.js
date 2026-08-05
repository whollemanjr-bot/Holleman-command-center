'use strict';

(() => {
  const SESSION_KEY = 'hcc-v7-cloud-session';
  const CONFIG_KEY = 'hcc-v7-public-config';
  const GOOGLE_TOKEN_KEY = 'hcc-v7-google-token';
  const GOOGLE_EXPIRY_KEY = 'hcc-v7-google-expiry';
  let config = null;
  let session = loadJSON(localStorage.getItem(SESSION_KEY));
  let googleToken = sessionStorage.getItem(GOOGLE_TOKEN_KEY) || '';
  let googleExpiry = Number(sessionStorage.getItem(GOOGLE_EXPIRY_KEY) || 0);
  let pushTimer;
  let statusListener = () => {};

  function loadJSON(value) { try { return JSON.parse(value || 'null'); } catch { return null; } }
  function headers(extra = {}) {
    return {
      apikey: config?.supabaseAnonKey || '',
      Authorization: `Bearer ${session?.access_token || config?.supabaseAnonKey || ''}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }
  function user() { return session?.user || null; }
  function configured() { return Boolean(config?.supabaseUrl && config?.supabaseAnonKey); }
  function googleConfigured() { return Boolean(config?.googleClientId); }
  function googleConnected() { return Boolean(googleToken && Date.now() < googleExpiry); }
  function emit(message = '') {
    statusListener({ configured: configured(), signedIn: Boolean(user()), email: user()?.email || '', googleConfigured: googleConfigured(), googleConnected: googleConnected(), message });
  }

  async function init(listener) {
    statusListener = typeof listener === 'function' ? listener : statusListener;
    try {
      const response = await fetch('/api/config', { cache: 'no-store' });
      config = response.ok ? await response.json() : {};
    } catch {
      config = {};
    }
    const localConfig = loadJSON(localStorage.getItem(CONFIG_KEY)) || {};
    config = { ...localConfig, ...(config || {}) };
    if (!config.supabaseUrl) config.supabaseUrl = localConfig.supabaseUrl || '';
    if (!config.supabaseAnonKey) config.supabaseAnonKey = localConfig.supabaseAnonKey || '';
    if (!config.googleClientId) config.googleClientId = localConfig.googleClientId || '';
    if (session?.access_token && configured()) await refreshUser();
    emit(configured() ? 'Cloud services ready.' : 'Cloud setup required.');
    return { configured: configured(), signedIn: Boolean(user()) };
  }

  function configValues() { return { supabaseUrl: config?.supabaseUrl || '', supabaseAnonKey: config?.supabaseAnonKey || '', googleClientId: config?.googleClientId || '' }; }
  function saveConfig(values) {
    config = { ...config, ...values };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configValues()));
    emit(configured() ? 'Cloud configuration saved.' : 'Supabase URL and anon key are still required.');
    return configValues();
  }

  async function request(path, options = {}) {
    if (!configured()) throw new Error('Supabase is not configured yet.');
    const response = await fetch(`${config.supabaseUrl}${path}`, { ...options, headers: headers(options.headers) });
    const text = await response.text();
    const body = text ? loadJSON(text) || text : null;
    if (!response.ok) throw new Error(body?.msg || body?.message || body?.error_description || body?.error || `Request failed (${response.status})`);
    return body;
  }

  async function signUp(email, password) {
    const body = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (body?.access_token) saveSession(body);
    emit(body?.access_token ? 'Account created and signed in.' : 'Account created. Check your email if confirmation is enabled.');
    return body;
  }

  async function signIn(email, password) {
    const body = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    saveSession(body);
    emit('Signed in.');
    return body;
  }

  function signOut() {
    session = null;
    localStorage.removeItem(SESSION_KEY);
    emit('Signed out. Local mode remains available.');
  }

  function saveSession(value) {
    session = value;
    localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  }

  async function refreshUser() {
    try {
      const currentUser = await request('/auth/v1/user');
      session.user = currentUser;
      saveSession(session);
    } catch {
      signOut();
    }
  }

  async function pullState() {
    if (!user()) throw new Error('Sign in before pulling cloud data.');
    const rows = await request(`/rest/v1/dashboard_state?select=payload,updated_at,version&user_id=eq.${encodeURIComponent(user().id)}&limit=1`);
    emit(rows?.length ? 'Cloud data downloaded.' : 'No cloud data exists yet.');
    return rows?.[0]?.payload || null;
  }

  async function pushState(payload) {
    if (!user()) throw new Error('Sign in before syncing data.');
    await request('/rest/v1/dashboard_state?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: user().id, payload, version: 1, updated_at: new Date().toISOString() })
    });
    emit('Cloud sync complete.');
  }

  function schedulePush(payload) {
    if (!user()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushState(payload).catch(error => emit(error.message)), 900);
  }

  function connectGoogle(onConnected) {
    if (!googleConfigured()) throw new Error('Google Calendar is not configured yet.');
    if (!window.google?.accounts?.oauth2) throw new Error('Google authorization is still loading.');
    const client = google.accounts.oauth2.initTokenClient({
      client_id: config.googleClientId,
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
      callback: tokenResponse => {
        if (tokenResponse.error) return emit(`Google authorization failed: ${tokenResponse.error}`);
        googleToken = tokenResponse.access_token;
        googleExpiry = Date.now() + ((Number(tokenResponse.expires_in) || 3600) - 60) * 1000;
        sessionStorage.setItem(GOOGLE_TOKEN_KEY, googleToken);
        sessionStorage.setItem(GOOGLE_EXPIRY_KEY, String(googleExpiry));
        emit('Google Calendar connected for this browser session.');
        onConnected?.();
      }
    });
    client.requestAccessToken({ prompt: googleConnected() ? '' : 'consent' });
  }

  async function googleRequest(path, options = {}) {
    if (!googleConnected()) throw new Error('Connect Google Calendar first.');
    const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error?.message || `Google Calendar request failed (${response.status})`);
    return body;
  }

  async function fetchGoogleEvents(days = 45) {
    const timeMin = new Date(Date.now() - 24 * 3600000).toISOString();
    const timeMax = new Date(Date.now() + days * 86400000).toISOString();
    const query = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '100' });
    const body = await googleRequest(`/calendars/primary/events?${query}`);
    const events = (body.items || []).filter(item => item.status !== 'cancelled').map(item => {
      const startValue = item.start?.dateTime || item.start?.date;
      const endValue = item.end?.dateTime || item.end?.date;
      const start = new Date(startValue);
      const end = new Date(endValue);
      return {
        id: `google-${item.id}`,
        googleId: item.id,
        title: item.summary || 'Untitled event',
        date: item.start?.date || (Number.isNaN(start.getTime()) ? String(startValue).slice(0, 10) : localDate(start)),
        time: item.start?.date ? '' : localTime(start),
        duration: item.start?.date ? 1440 : Math.max(15, Math.round((end - start) / 60000)),
        category: 'Google',
        notes: item.description || '',
        source: 'google'
      };
    });
    emit(`${events.length} Google Calendar events loaded.`);
    return events;
  }

  async function createGoogleEvent(event) {
    const start = new Date(`${event.date}T${event.time || '09:00'}:00`);
    const end = new Date(start.getTime() + Number(event.duration || 60) * 60000);
    return googleRequest('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify({
        summary: event.title,
        description: event.notes || `Holleman Command · ${event.category || 'Personal'}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() }
      })
    });
  }

  async function deleteGoogleEvent(id) {
    if (!googleConnected()) throw new Error('Connect Google Calendar first.');
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${googleToken}` }
    });
    if (!response.ok && response.status !== 410) throw new Error(`Google Calendar delete failed (${response.status})`);
    emit('Google Calendar event deleted.');
  }

  function localDate(date) {
    const z = date.getTimezoneOffset() * 60000;
    return new Date(date - z).toISOString().slice(0, 10);
  }
  function localTime(date) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }

  window.HCCCloud = {
    init, configured, configValues, saveConfig, user, signUp, signIn, signOut, pullState, pushState, schedulePush,
    googleConfigured, googleConnected, connectGoogle, fetchGoogleEvents, createGoogleEvent, deleteGoogleEvent
  };
})();
