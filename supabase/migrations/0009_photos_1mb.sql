-- Action ou Vérité — chat photos limited to 1 MB.
-- Run AFTER 0008_chat_photos.sql. Paste this whole file into Supabase → SQL Editor → Run.
update storage.buckets set file_size_limit = 1048576 where id = 'photos';
