-- Action ou Vérité — room chat, voice notes and account stats.
-- Run AFTER 0002_secure_rooms.sql. Paste this whole file into Supabase → SQL Editor → Run.

-- 1. Account stats, kept in the profile (games, wins, truths, dares, skips, points).
alter table public.profiles add column if not exists stats jsonb not null default '{}'::jsonb;

-- 2. Chat messages of a room: members only; the server stamps the sender.
create table if not exists public.room_messages (
  id text primary key check (char_length(id) <= 64),
  code text not null references public.rooms (code) on delete cascade,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body jsonb not null check (
    (body ? 'text' and char_length(body->>'text') between 1 and 500)
    or (body ? 'voice' and (body->'voice'->>'ms')::int between 1 and 31000)
  ),
  created_at timestamptz not null default now()
);
alter table public.room_messages enable row level security;

drop policy if exists "messages: members send as themselves" on public.room_messages;
create policy "messages: members send as themselves" on public.room_messages
  for insert to authenticated with check (from_id = auth.uid() and public.is_room_member(code));

drop policy if exists "messages: members read" on public.room_messages;
create policy "messages: members read" on public.room_messages
  for select to authenticated using (public.is_room_member(code));

create index if not exists room_messages_code on public.room_messages (code, created_at);

do $$
begin
  alter publication supabase_realtime add table public.room_messages;
exception when duplicate_object then null;
end $$;

-- 3. Voice notes: private bucket, files under "<room code>/…", members only, 2 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', false, 2097152, array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "voice: members upload" on storage.objects;
create policy "voice: members upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice' and public.is_room_member((storage.foldername(name))[1]));

drop policy if exists "voice: members listen" on storage.objects;
create policy "voice: members listen" on storage.objects
  for select to authenticated
  using (bucket_id = 'voice' and public.is_room_member((storage.foldername(name))[1]));
