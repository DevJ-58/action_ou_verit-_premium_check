-- Action ou Vérité — friend requests (accepted → friends on both sides) and public profiles.
-- Run AFTER 0009_photos_1mb.sql. Paste this whole file into Supabase → SQL Editor → Run.

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  from_pseudo text not null default '',
  from_avatar text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);
alter table public.friend_requests enable row level security;

-- Players see the requests they sent or received; all changes go through the functions below.
drop policy if exists "friend requests: read own" on public.friend_requests;
create policy "friend requests: read own" on public.friend_requests
  for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());

create index if not exists friend_requests_to on public.friend_requests (to_id, status);

do $$
begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null;
end $$;

-- Adds each player to the other's friends (with their current pseudo and avatar).
create or replace function public.befriend(p_a uuid, p_b uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a profiles;
  b profiles;
begin
  select * into a from profiles where id = p_a;
  select * into b from profiles where id = p_b;
  if a.id is null or b.id is null then return; end if;
  update profiles set friends = coalesce((
      select jsonb_agg(f) from jsonb_array_elements(friends) f where f->>'id' <> p_b::text
    ), '[]'::jsonb) || jsonb_build_array(jsonb_build_object('id', b.id, 'pseudo', b.pseudo, 'avatarId', b.avatar_id))
    where id = p_a;
  update profiles set friends = coalesce((
      select jsonb_agg(f) from jsonb_array_elements(friends) f where f->>'id' <> p_a::text
    ), '[]'::jsonb) || jsonb_build_array(jsonb_build_object('id', a.id, 'pseudo', a.pseudo, 'avatarId', a.avatar_id))
    where id = p_b;
end $$;
revoke all on function public.befriend(uuid, uuid) from public, anon, authenticated;

-- Send a request. Returns 'friends' if already friends or if they had asked first (accepted).
create or replace function public.send_friend_request(p_to uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  theirs friend_requests;
begin
  if p_to = auth.uid() then return 'failed'; end if;
  select * into me from profiles where id = auth.uid();
  if me.id is null or not exists (select 1 from profiles where id = p_to) then return 'failed'; end if;
  if exists (select 1 from jsonb_array_elements(me.friends) f where f->>'id' = p_to::text) then
    return 'friends';
  end if;
  select * into theirs from friend_requests
    where from_id = p_to and to_id = auth.uid() and status = 'pending';
  if found then
    update friend_requests set status = 'accepted' where id = theirs.id;
    perform public.befriend(auth.uid(), p_to);
    return 'friends';
  end if;
  insert into friend_requests (from_id, to_id, from_pseudo, from_avatar)
    values (auth.uid(), p_to, me.pseudo, me.avatar_id)
  on conflict (from_id, to_id) do update
    set status = 'pending', created_at = now(),
        from_pseudo = excluded.from_pseudo, from_avatar = excluded.from_avatar;
  return 'sent';
end $$;

-- Accept or decline a request addressed to you.
create or replace function public.answer_friend_request(p_id uuid, p_accept boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r friend_requests;
begin
  update friend_requests set status = case when p_accept then 'accepted' else 'declined' end
    where id = p_id and to_id = auth.uid() and status = 'pending'
    returning * into r;
  if not found then return false; end if;
  if p_accept then perform public.befriend(r.from_id, r.to_id); end if;
  return true;
end $$;

-- End a friendship on both sides.
create or replace function public.remove_friend(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set friends = coalesce((
      select jsonb_agg(f) from jsonb_array_elements(friends) f where f->>'id' <> p_id::text
    ), '[]'::jsonb) where id = auth.uid();
  update profiles set friends = coalesce((
      select jsonb_agg(f) from jsonb_array_elements(friends) f where f->>'id' <> auth.uid()::text
    ), '[]'::jsonb) where id = p_id;
end $$;

-- What anyone signed in may see of a player.
create or replace function public.public_profile(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'avatarId', avatar_id, 'bio', bio,
    'stats', coalesce(stats, '{}'::jsonb) - 'gameIds'
  ) from profiles where id = p_id;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.answer_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.public_profile(uuid) to authenticated;
