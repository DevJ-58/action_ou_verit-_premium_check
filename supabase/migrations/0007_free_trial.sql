-- Action ou Vérité — 7 days of free Premium for every account.
-- Run AFTER 0006_premium.sql. Paste this whole file into Supabase → SQL Editor → Run.

alter table public.entitlements add column if not exists trial boolean not null default false;

-- Every new account starts with a 7-day trial (written by the server, never by the app).
create or replace function public.start_trial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into entitlements (user_id, premium_until, trial)
  values (new.id, now() + interval '7 days', true)
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_trial on auth.users;
create trigger on_auth_user_created_trial after insert on auth.users
  for each row execute function public.start_trial();

-- Accounts created before today get their 7 days too (accounts already Premium are untouched).
insert into public.entitlements (user_id, premium_until, trial)
select id, now() + interval '7 days', true from auth.users
on conflict (user_id) do nothing;

-- A purchase ends the trial label and adds to what is left.
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
    return null;
  end if;
  hours := case p.plan when 'pass' then 24 else 30 * 24 end;
  insert into entitlements (user_id, premium_until, trial)
    values (p.user_id, now() + make_interval(hours => hours), false)
  on conflict (user_id) do update
    set premium_until = greatest(entitlements.premium_until, now()) + make_interval(hours => hours),
        trial = false,
        updated_at = now()
  returning premium_until into result;
  return result;
end $$;
revoke all on function public.grant_premium(text) from public, anon, authenticated;
