-- Action ou Vérité — room games are counted by the server, once, for every player in them.
-- Run AFTER 0011_signed_in_only.sql. Paste this whole file into Supabase → SQL Editor → Run.
-- (Phones that were asleep at the end of the game no longer miss it in their stats.)

create table if not exists public.room_game_records (
  game_id text primary key,
  code text not null,
  recorded_at timestamptz not null default now()
);
alter table public.room_game_records enable row level security; -- no direct access

create or replace function public.record_room_game(p_code text, p_game_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  st jsonb;
  g jsonb;
  best int;
  player record;
  s jsonb;
  ids jsonb;
begin
  if not public.is_room_member(p_code) then return false; end if;
  select state into st from rooms where code = p_code;
  if st is null then return false; end if;
  if st->'game'->>'id' = p_game_id and st->'game'->>'phase' = 'finished' then
    g := st->'game';
  elsif st->'lastGame'->>'id' = p_game_id and st->'lastGame'->>'phase' = 'finished' then
    g := st->'lastGame';
  else
    return false;
  end if;

  -- Once per game: a second call (another phone) changes nothing.
  insert into room_game_records (game_id, code) values (p_game_id, p_code) on conflict do nothing;
  if not found then return true; end if;

  select max((value->>'points')::int) into best from jsonb_each(g->'scores');
  for player in select key, value from jsonb_each(g->'scores') loop
    continue when player.key !~ '^[0-9a-f-]{36}$';
    select coalesce(stats, '{}'::jsonb) into s from profiles where id = player.key::uuid;
    if not found then continue; end if;
    ids := coalesce(s->'gameIds', '[]'::jsonb) || to_jsonb(p_game_id);
    if jsonb_array_length(ids) > 50 then
      ids := (select jsonb_agg(x) from (
        select x from jsonb_array_elements(ids) with ordinality as t(x, n)
        order by n offset jsonb_array_length(ids) - 50) kept);
    end if;
    update profiles set stats = jsonb_build_object(
      'games', coalesce((s->>'games')::int, 0) + 1,
      'wins', coalesce((s->>'wins')::int, 0)
        + case when (player.value->>'points')::int = best and best > 0 then 1 else 0 end,
      'truths', coalesce((s->>'truths')::int, 0) + coalesce((player.value->>'truths')::int, 0),
      'dares', coalesce((s->>'dares')::int, 0) + coalesce((player.value->>'dares')::int, 0),
      'skipped', coalesce((s->>'skipped')::int, 0) + coalesce((player.value->>'skipped')::int, 0),
      'points', coalesce((s->>'points')::int, 0) + coalesce((player.value->>'points')::int, 0),
      'gameIds', ids
    ), updated_at = now()
    where id = player.key::uuid;
  end loop;
  return true;
end $$;

revoke execute on function public.record_room_game(text, text) from public, anon;
grant execute on function public.record_room_game(text, text) to authenticated;
