-- Action ou Vérité — social functions for signed-in players only (not anonymous visitors).
-- Run AFTER 0010_friend_requests.sql. Paste this whole file into Supabase → SQL Editor → Run.
revoke execute on function public.send_friend_request(uuid) from public, anon;
revoke execute on function public.answer_friend_request(uuid, boolean) from public, anon;
revoke execute on function public.remove_friend(uuid) from public, anon;
revoke execute on function public.public_profile(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.answer_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.public_profile(uuid) to authenticated;
