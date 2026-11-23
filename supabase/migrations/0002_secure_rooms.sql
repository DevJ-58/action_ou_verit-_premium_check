-- Action ou Vérité — secure rooms.
-- Paste this whole file into Supabase → SQL Editor → New query → Run (after 0001_init.sql).
--
-- * Only members can read a room; only its host writes it.
-- * Players act by inserting intents: the server stamps who sent them (from_id = auth.uid()).
-- * Joining goes through join_room(), which checks the room is open, not full and not expired.
-- * A member may take over hosting only through claim_host(), once the host has been silent.

create table if not exists public.room_members (
  code text not null references public.rooms (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (code, user_id)
);
alter table public.room_members enable row level security;

drop policy if exists "room_members: see own" on public.room_members;
create policy "room_members: see own" on public.room_members
  for select to authenticated using (user_id = auth.uid());

-- Is the caller a member of this room? (security definer: avoids recursive RLS checks)
create or replace function public.is_room_member(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from room_members where code = p_code and user_id = auth.uid());
$$;

-- Rooms: readable by members only (replaces the "any signed-in player" rule).
drop policy if exists "rooms: signed-in players read" on public.rooms;
drop policy if exists "rooms: members read" on public.rooms;
create policy "rooms: members read" on public.rooms
  for select to authenticated using (host_id = auth.uid() or public.is_room_member(code));

-- The host who creates a room is its first member.
create or replace function public.add_host_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into room_members (code, user_id) values (new.code, new.host_id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists rooms_add_host on public.rooms;
create trigger rooms_add_host after insert on public.rooms
  for each row execute function public.add_host_as_member();

-- Intents: what players ask the host to do. The sender is stamped by the server.
create table if not exists public.room_intents (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.rooms (code) on delete cascade,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  intent jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.room_intents enable row level security;

drop policy if exists "intents: members send as themselves" on public.room_intents;
create policy "intents: members send as themselves" on public.room_intents
  for insert to authenticated with check (from_id = auth.uid() and public.is_room_member(code));

drop policy if exists "intents: host reads" on public.room_intents;
create policy "intents: host reads" on public.room_intents
  for select to authenticated using (
    exists (select 1 from rooms r where r.code = room_intents.code and r.host_id = auth.uid())
  );

create index if not exists room_intents_code on public.room_intents (code, created_at);

-- Join a room by code: returns its state. Adds the caller as a member only if the room
-- is still in its lobby and not full; rooms idle for 12 hours are treated as gone.
create or replace function public.join_room(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r rooms;
  members_count int;
begin
  select * into r from rooms where code = p_code;
  if not found or r.updated_at < now() - interval '12 hours' then
    return null;
  end if;
  if not exists (select 1 from room_members where code = p_code and user_id = auth.uid())
     and r.state ->> 'status' = 'lobby' then
    select count(*) into members_count from room_members where code = p_code;
    if members_count < 12 then
      insert into room_members (code, user_id) values (p_code, auth.uid());
    end if;
  end if;
  return r.state;
end $$;

-- A member takes over hosting, allowed only when the host has been silent for 15 seconds.
create or replace function public.claim_host(p_code text, p_state jsonb, p_version int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_member(p_code) then
    return false;
  end if;
  update rooms
     set host_id = auth.uid(), state = p_state, version = p_version, updated_at = now()
   where code = p_code
     and updated_at < now() - interval '15 seconds'
     and version < p_version;
  return found;
end $$;

grant execute on function public.join_room(text) to authenticated;
grant execute on function public.claim_host(text, jsonb, int) to authenticated;
grant execute on function public.is_room_member(text) to authenticated;

-- Live updates: rooms (state) and room_intents (player actions) over Realtime.
do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.room_intents;
exception when duplicate_object then null;
end $$;
