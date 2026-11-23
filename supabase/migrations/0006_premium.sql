-- Action ou Vérité — Premium: entitlements, payments and server-side checks.
-- Run AFTER 0005_live_video.sql. Paste this whole file into Supabase → SQL Editor → Run.

-- 1. Who is Premium until when. Players can read their own row; only the server
--    (Edge Functions with the service role) writes it, after a verified payment.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  premium_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
drop policy if exists "entitlements: read own" on public.entitlements;
create policy "entitlements: read own" on public.entitlements
  for select to authenticated using (user_id = auth.uid());

-- 2. Payments (CinetPay transactions). A transaction is counted once.
create table if not exists public.payments (
  transaction_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('pass', 'month')),
  amount int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refused')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.payments enable row level security;
drop policy if exists "payments: read own" on public.payments;
create policy "payments: read own" on public.payments
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_premium(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from entitlements where user_id = p_user and premium_until > now());
$$;

-- Premium is shared by the host with the whole room.
create or replace function public.room_is_premium(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public.is_premium(host_id) from rooms where code = p_code), false);
$$;

-- Called by the payment function only: extends Premium once per paid transaction.
create or replace function public.grant_premium(p_transaction text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  p payments;
  hours int;
  result timestamptz;
begin
  update payments set status = 'paid', paid_at = now()
    where transaction_id = p_transaction and status = 'pending'
    returning * into p;
  if not found then
    return null; -- unknown, or already counted
  end if;
  hours := case p.plan when 'pass' then 24 else 30 * 24 end;
  insert into entitlements (user_id, premium_until)
    values (p.user_id, now() + make_interval(hours => hours))
  on conflict (user_id) do update
    set premium_until = greatest(entitlements.premium_until, now()) + make_interval(hours => hours),
        updated_at = now()
  returning premium_until into result;
  return result;
end $$;
revoke all on function public.grant_premium(text) from public, anon, authenticated;
grant execute on function public.is_premium(uuid) to authenticated;
grant execute on function public.room_is_premium(text) to authenticated;

-- 3. Room size: 6 players, 12 when the host is Premium.
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
    if members_count < (case when public.is_premium(r.host_id) then 12 else 6 end) then
      insert into room_members (code, user_id) values (p_code, auth.uid());
    end if;
  end if;
  return r.state;
end $$;

-- 4. Voice notes only in rooms whose host is Premium.
drop policy if exists "voice: members upload" on storage.objects;
create policy "voice: members upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voice'
    and public.is_room_member((storage.foldername(name))[1])
    and public.room_is_premium((storage.foldername(name))[1])
  );

-- 5. Live video only in rooms whose host is Premium.
drop policy if exists "live: members receive" on realtime.messages;
create policy "live: members receive" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and split_part(realtime.topic(), ':', 1) = 'live'
    and public.is_room_member(split_part(realtime.topic(), ':', 2))
    and public.room_is_premium(split_part(realtime.topic(), ':', 2))
  );
drop policy if exists "live: members send" on realtime.messages;
create policy "live: members send" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and split_part(realtime.topic(), ':', 1) = 'live'
    and public.is_room_member(split_part(realtime.topic(), ':', 2))
    and public.room_is_premium(split_part(realtime.topic(), ':', 2))
  );

-- 6. Free players keep 5 own dares (they may still delete some after Premium ends).
create or replace function public.check_custom_dares()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if jsonb_array_length(new.custom_dares) > 5
     and not public.is_premium(new.id)
     and (tg_op = 'INSERT' or jsonb_array_length(new.custom_dares) > jsonb_array_length(old.custom_dares)) then
    raise exception 'custom dares limit reached' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists profiles_custom_dares_limit on public.profiles;
create trigger profiles_custom_dares_limit before insert or update on public.profiles
  for each row execute function public.check_custom_dares();
