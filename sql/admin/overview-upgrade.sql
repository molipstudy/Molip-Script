-- Run manually after sql/accounts/email-username-upgrade.sql.
-- Read-only aggregate RPC; no changes to Auth or profile data.
begin;
create or replace function molip_script.admin_member_overview()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not molip_profiles.has_access('molip-script') then
  raise exception 'Administrator access required' using errcode='42501';
 end if;
 select jsonb_build_object(
  'total_members',count(*),
  'new_members_7d',count(*) filter(where u.created_at >= now()-interval '7 days'),
  'new_members_24h',count(*) filter(where u.created_at >= now()-interval '24 hours')
 ) into result from auth.users u
 where molip_profiles.has_access('global') or exists(
  select 1 from molip_profiles.service_registrations r
  where r.user_id=u.id and r.service_key='molip-script'
 );
 return result;
end;
$$;
revoke all on function molip_script.admin_member_overview() from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_member_overview() to authenticated;
notify pgrst,'reload schema';
commit;
