-- Action ou Vérité — initial schema.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

-- Player profiles: one per account, readable and writable only by its owner.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null check (char_length(pseudo) between 1 and 24),
  avatar_id text not null default '',
  bio text not null default '' check (char_length(bio) <= 160),
  limits jsonb not null default '{"excludedCategories": [], "maxIntensity": 4}'::jsonb,
  custom_dares jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles: create own" on public.profiles;
create policy "profiles: create own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Rooms: the last state published by the host, so players can join and resume.
-- Live moves travel over Realtime broadcast on the channel "room:<code>".
create table if not exists public.rooms (
  code text primary key check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  state jsonb not null,
  version integer not null check (version > 0),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

drop policy if exists "rooms: signed-in players read" on public.rooms;
create policy "rooms: signed-in players read" on public.rooms
  for select to authenticated using (true);

drop policy if exists "rooms: host creates" on public.rooms;
create policy "rooms: host creates" on public.rooms
  for insert to authenticated with check (host_id = auth.uid());

-- The current host updates the room, and may hand hosting over to another player.
drop policy if exists "rooms: host updates" on public.rooms;
create policy "rooms: host updates" on public.rooms
  for update to authenticated using (host_id = auth.uid()) with check (true);

drop policy if exists "rooms: host deletes" on public.rooms;
create policy "rooms: host deletes" on public.rooms
  for delete to authenticated using (host_id = auth.uid());

create index if not exists rooms_updated_at on public.rooms (updated_at);
