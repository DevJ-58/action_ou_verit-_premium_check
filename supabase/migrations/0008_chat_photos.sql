-- Action ou Vérité — photos in the room chat (Premium: the room's host must be Premium).
-- Run AFTER 0007_free_trial.sql. Paste this whole file into Supabase → SQL Editor → Run.

-- 1. A chat message may now be a photo.
alter table public.room_messages drop constraint if exists room_messages_body_check;
alter table public.room_messages add constraint room_messages_body_check check (
  (body ? 'text' and char_length(body->>'text') between 1 and 500)
  or (body ? 'voice' and (body->'voice'->>'ms')::int between 1 and 31000)
  or (body ? 'photo' and char_length(body->'photo'->>'path') between 1 and 200)
);

-- 2. Photos: private bucket, files under "<room code>/…", 3 MB max, members only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos: members upload" on storage.objects;
create policy "photos: members upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and public.is_room_member((storage.foldername(name))[1])
    and public.room_is_premium((storage.foldername(name))[1])
  );

drop policy if exists "photos: members view" on storage.objects;
create policy "photos: members view" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.is_room_member((storage.foldername(name))[1]));
