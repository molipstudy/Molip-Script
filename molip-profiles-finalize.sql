-- Phase 2 final cutover. Apply prepare SQL, deploy both apps, then run this file.
-- This file removes all three old physical profile tables without CASCADE.
begin;
set local lock_timeout='10s';
lock table public.profiles,public.molip_script_profiles,molip_script.profiles,molip_profiles.profiles
 in share row exclusive mode;
-- Capture registrations created by old clients between preparation and deployment.
insert into molip_profiles.service_registrations(user_id,service_key,joined_at)
select id,'molip-script',created_at from molip_script.profiles
on conflict(user_id,service_key) do update set joined_at=least(molip_profiles.service_registrations.joined_at,excluded.joined_at);
do $$
begin
 if exists(select 1 from public.profiles p left join molip_profiles.profiles c on c.id=p.id
  where c.id is null or (p.username,p.profile_image) is distinct from (c.username,c.profile_image))
 or exists(select 1 from molip_script.profiles p left join molip_profiles.profiles c on c.id=p.id
  where c.id is null or p.login_id is distinct from c.login_id)
 or exists(select 1 from public.molip_script_profiles p left join molip_profiles.profiles c on c.id=p.id
  where c.id is null or p.login_id is distinct from c.login_id) then
  raise exception 'Profile copies disagree; consolidation stopped without deleting anything';
 end if;
end;
$$;


-- Remove the entire replication mechanism before removing its old tables.
drop trigger molip_profile_compatibility on molip_profiles.profiles;
drop trigger molip_common_profile_sync on public.profiles;
drop trigger molip_common_profile_sync on public.molip_script_profiles;
drop trigger molip_common_profile_sync on molip_script.profiles;
drop trigger if exists molip_discord_profile_created on molip_script.profiles;
drop function molip_profiles.sync_compatibility_profiles();
drop function molip_profiles.accept_legacy_profile();
drop function if exists molip_notifications.on_profile_created();

do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where p.prokind='f' and n.nspname in ('public','molip_profiles','molip_script','molip_voca','molip_notifications')
  and (p.prosrc like '%public.profiles%' or p.prosrc like '%molip_script.profiles%' or p.prosrc like '%public.molip_script_profiles%')) then
  raise exception 'A function still references a legacy profile table';
 end if;
 if exists(select 1 from pg_constraint where contype='f' and confrelid in(
  'public.profiles'::regclass,'public.molip_script_profiles'::regclass,'molip_script.profiles'::regclass)) then
  raise exception 'A foreign key still references a legacy profile table';
 end if;
 if exists(select 1 from molip_script.profiles p where not exists(select 1 from molip_profiles.service_registrations r
  where r.user_id=p.id and r.service_key='molip-script' and r.joined_at<=p.created_at)) then
  raise exception 'Service registration copy mismatch';
 end if;
end; $$;
-- RESTRICT: unexpected dependencies cause the whole transaction to roll back.
drop table public.molip_script_profiles;
drop table molip_script.profiles;
drop table public.profiles;
revoke all on schema molip_profiles from public,anon,authenticated,service_role;
revoke all on all tables in schema molip_profiles from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
