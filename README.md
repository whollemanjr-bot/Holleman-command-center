# Holleman Command Center

A private, mobile-ready personal command center for daily planning, health and recovery tracking, live workouts, nutrition and hydration, Apple Calendar/Reminders bridging, career transition, school, finance, vehicles/home, notes, and weekly reports.

This edition deliberately uses **no npm build step**. Vercel serves the static PWA and runs the optional Node serverless functions in `/api`.

## What is working now

- Premium responsive dashboard modeled after the approved dark command-center concept
- Dashboard, Health, Training, Nutrition, Recovery, Calendar, Tasks, Career, School, Finance, Vehicles/Home, Notes, Reports, and Connections views
- Live workout logger with persistent timer, exercise setup notes, previous/target fields, sets, weight, reps, RIR, rest timer, exercise queue, workout volume, and history
- Offline PWA support and local autosave
- Manual source labels and last-updated timestamps so stale/example data is not presented as live
- JSON backup/import
- Optional single-user passcode protection
- Optional Supabase cloud persistence
- Apple Calendar and Reminders Shortcut bridge endpoints
- GitHub issue templates for bug reports and feature requests

## Important data note

The starter health and nutrition values are a **manual snapshot dated August 3, 2026**. They are labeled in the interface and are not represented as live Apple Health or MacroFactor data. Replace them manually or configure a sync bridge.

## Fast Vercel deployment

1. Upload this entire folder to the root of the GitHub repository.
2. Import the repository in Vercel.
3. Select **Framework Preset: Other**.
4. Leave **Build Command** blank.
5. Leave **Output Directory** blank.
6. Deploy.

The app works immediately in local-only mode. Data is stored in that browser using `localStorage` until cloud sync is configured.

## Private login and cloud sync

Create a Supabase project, run `supabase/schema.sql`, then add these Vercel environment variables:

```text
USER_PASSCODE=<a long private passcode>
APP_SECRET=<at least 32 random characters>
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
APPLE_SYNC_TOKEN=<a different long random token>
```

Use the values in `.env.example` as a guide. Never place `SUPABASE_SERVICE_ROLE_KEY`, `APP_SECRET`, or `APPLE_SYNC_TOKEN` in browser code or commit real values to GitHub.

After redeploying, the site presents a passcode screen and stores the command-center state through `/api/data`. The passcode API returns a signed 30-day session token.

## Apple Calendar and Reminders

Read [`docs/APPLE_SHORTCUT_SETUP.md`](docs/APPLE_SHORTCUT_SETUP.md). The bridge supports:

- `POST /api/apple-sync/import` — import selected Apple Calendar events and reminders
- `GET /api/apple-sync/outbox` — retrieve events/reminders created in the Command Center
- `POST /api/apple-sync/ack` — acknowledge completed Shortcut writes
- `GET /api/apple-sync/status` — authenticated sync status for the web app

This is a practical scheduled bridge. A PWA cannot directly call Apple EventKit or HealthKit. Near-real-time native access would require an iPhone companion app.

## Install on iPhone or iPad

Open the production URL in Safari, tap **Share**, then **Add to Home Screen**. The service worker caches the interface for offline workout logging. Cloud changes sync when connectivity returns.

## Recommended first configuration

1. Set the passcode and Supabase variables.
2. Import the starter state, then replace manual health/nutrition values.
3. Build the Apple import Shortcut.
4. Verify the first sync in **Data & Connections**.
5. Add exact school deadlines and career opportunities.
6. Test a complete workout from start to finish on the iPhone.
7. Export a JSON backup.

## Project structure

```text
index.html                 Main PWA shell
styles.css                 Responsive dashboard styling
app.js                     State, views, workouts, tasks, career, and sync client
service-worker.js          Offline cache
manifest.webmanifest       Installable PWA configuration
api/auth.js                Passcode authentication
api/data.js                Supabase state persistence and Apple data pull
api/apple-sync/*           Shortcut import/outbox/ack/status routes
supabase/schema.sql        Database tables and RLS configuration
docs/APPLE_SHORTCUT_SETUP.md
.github/ISSUE_TEMPLATE/*   Bug and feature-report forms
```

## Validation before production

- Confirm no secrets are committed.
- Run `node --check app.js` and `node --check` on every API file.
- Test local-only mode, passcode mode, cloud save, import/export, offline reload, a live workout, and the Apple Shortcut with non-sensitive sample events.
- Restrict the Vercel project and Supabase project to your accounts.

## Version

`1.0.0` — first unified command-center implementation.
