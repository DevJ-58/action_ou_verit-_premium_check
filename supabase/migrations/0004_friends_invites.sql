-- Action ou Vérité — friends and room invitations.
-- Run AFTER 0003_chat_stats.sql. Paste this whole file into Supabase → SQL Editor → Run.

-- 1. Friends, kept in the profile (id, pseudo, avatar of each friend).
alter table public.profiles add column if not exists friends jsonb not null default '[]'::jsonb;

-- 2. Invitations: a room member invites a friend; only that friend can read or remove it.
create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.rooms (code) on delete cascade,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  from_pseudo text not null check (char_length(from_pseudo) between 1 and 24),
  from_avatar text not null default '' check (char_length(from_avatar) <= 32),
  created_at timestamptz not null default now()
);
alter table public.room_invites enable row level security;

drop policy if exists "invites: members invite as themselves" on public.room_invites;
create policy "invites: members invite as themselves" on public.room_invites
  for insert to authenticated
  with check (from_id = auth.uid() and to_id <> auth.uid() and public.is_room_member(code));

drop policy if exists "invites: the invited reads" on public.room_invites;
create policy "invites: the invited reads" on public.room_invites
  for select to authenticated using (to_id = auth.uid());

drop policy if exists "invites: the invited removes" on public.room_invites;
create policy "invites: the invited removes" on public.room_invites
  for delete to authenticated using (to_id = auth.uid());

create index if not exists room_invites_to on public.room_invites (to_id, created_at);

do $$
begin
  alter publication supabase_realtime add table public.room_invites;
exception when duplicate_object then null;
end $$;
