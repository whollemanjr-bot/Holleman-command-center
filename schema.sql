-- Run in Supabase SQL Editor for the optional cloud and Apple Shortcut features.
create extension if not exists pgcrypto;

create table if not exists public.command_center_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'apple',
  external_id text not null,
  calendar_name text,
  title text not null,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean not null default false,
  location text,
  notes text,
  recurrence jsonb,
  last_modified_at timestamptz,
  last_synced_at timestamptz not null default now(),
  unique(source, external_id)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'apple',
  external_id text not null,
  list_name text,
  title text not null,
  notes text,
  due_at timestamptz,
  priority integer not null default 0,
  completed boolean not null default false,
  tags text[] not null default '{}',
  last_modified_at timestamptz,
  last_synced_at timestamptz not null default now(),
  unique(source, external_id)
);

create table if not exists public.sync_outbox (
  id text primary key,
  entity_type text not null check (entity_type in ('calendar_event','reminder')),
  action text not null check (action in ('create','update','delete','complete')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  device_name text,
  events_count integer not null default 0,
  reminders_count integer not null default 0,
  completed_at timestamptz not null default now()
);

alter table public.command_center_state enable row level security;
alter table public.calendar_events enable row level security;
alter table public.reminders enable row level security;
alter table public.sync_outbox enable row level security;
alter table public.sync_runs enable row level security;

-- No anonymous/client policies are created. The included Vercel functions use the
-- server-only service-role key. Never expose SUPABASE_SERVICE_ROLE_KEY in browser code.
