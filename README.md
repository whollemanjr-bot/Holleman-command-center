# Holleman Personal Command Center V7

V7 adds the first cloud-sync foundation and a more restrained premium graphite-and-bronze visual system while preserving local mode.

## V7 capabilities

- Premium masculine graphite, black, bronze, steel, and muted green interface
- Local-first operation while cloud services are being configured
- Supabase email/password authentication
- Cross-device dashboard-state synchronization
- Row-level security so each account can access only its own dashboard record
- Google Calendar browser-session connection
- Pull Google Calendar changes into the dashboard
- Create and delete Google Calendar events from the dashboard
- Apple Calendar interoperability through the same Google account
- Existing `.ics` export, local PIN, backup, and inactivity lock remain available

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run:

```sql
create table if not exists public.dashboard_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_state enable row level security;

create policy "Users can read their dashboard state"
on public.dashboard_state for select
using (auth.uid() = user_id);

create policy "Users can insert their dashboard state"
on public.dashboard_state for insert
with check (auth.uid() = user_id);

create policy "Users can update their dashboard state"
on public.dashboard_state for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

3. Copy the Supabase project URL and **anon/public** key. Never use the service-role key.
4. In the command center, open **Settings → Cloud Sync**, enter those public values, and save the connection setup.
5. Create an account or sign in, then use **Push this device** to create the first cloud copy.

## Google Calendar setup

1. Create or select a Google Cloud project.
2. Enable the **Google Calendar API**.
3. Configure the OAuth consent screen.
4. Create an OAuth client with application type **Web application**.
5. Add the exact Vercel production origin and the exact preview origin you plan to test under **Authorized JavaScript origins**.
6. Copy the OAuth client ID into **Settings → Cloud Sync** in the command center.
7. Open the Calendar page and select **Connect Google Calendar**.

The Google access token is kept only for the current browser session and expires. Reconnecting may be required after closing the browser or when the token expires.

## Apple Calendar bridge

On iPhone or iPad:

1. Open **Settings → Apps → Calendar → Calendar Accounts**.
2. Add the same Google account connected to the command center.
3. Enable Calendar for that account.

Events created in the command center are written to Google Calendar. Apple Calendar displays and edits that Google calendar. Press **Sync calendar** in the dashboard to pull those changes back into the command center.

## Sync behavior

- **Local mode:** all dashboard features continue without cloud configuration.
- **Supabase:** signed-in changes are pushed automatically after edits. Manual Push and Pull controls are also available.
- **Google Calendar:** use Calendar → Sync calendar to refresh changes made from Apple Calendar or Google Calendar.
- **Conflict handling:** an explicit cloud Pull currently treats the cloud copy as authoritative. Future versions can add per-record history and conflict resolution.

## Security notes

- The local PIN is a device-level convenience lock.
- The Supabase anon/public key and Google client ID are public client configuration; security depends on Supabase Row Level Security and the Google consent model.
- Never expose a Supabase service-role key or Google client secret.
- Keep the GitHub repository private before storing sensitive information.

## Deployment

The project remains zero-build. Keep the Vercel Framework Preset set to **Other**, with no build command or output directory.
