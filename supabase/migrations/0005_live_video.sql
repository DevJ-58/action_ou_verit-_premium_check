-- Action ou Vérité — live video of a challenge.
-- Run AFTER 0004_friends_invites.sql. Paste this whole file into Supabase → SQL Editor → Run.
-- The video goes directly between phones (WebRTC); this only protects the channel
-- "live:<room code>" used to put them in contact: room members only.

drop policy if exists "live: members receive" on realtime.messages;
create policy "live: members receive" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and split_part(realtime.topic(), ':', 1) = 'live'
    and public.is_room_member(split_part(realtime.topic(), ':', 2))
  );

drop policy if exists "live: members send" on realtime.messages;
create policy "live: members send" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'broadcast'
    and split_part(realtime.topic(), ':', 1) = 'live'
    and public.is_room_member(split_part(realtime.topic(), ':', 2))
  );
