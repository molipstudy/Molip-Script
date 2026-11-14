-- Run manually after the common-profile consolidation. No Auth writes.
begin;
create or replace function molip_script.admin_update_member(
 p_user_id uuid, p_username text, p_signup_source text default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
begin
 -- Shared display identities span services; editing requires a global administrator.
 if not molip_profiles.has_access('global') then
  raise exception 'Administrator access required' using errcode='42501';
 end if;
 if p_username is null or length(btrim(p_username)) not between 1 and 80
 or (p_signup_source is not null and p_signup_source not in ('지인 홍보','커뮤니티','Instagram')) then
  raise exception 'Invalid member fields' using errcode='22023';
 end if;
 perform 1 from molip_profiles.profiles where id=p_user_id for update;
 if not found then raise exception 'Member unavailable' using errcode='P0002'; end if;
 -- Do not invent a service registration for a user who has never joined Script.
 if not exists(select 1 from molip_profiles.service_registrations
  where user_id=p_user_id and service_key='molip-script') and p_signup_source is not null then
  raise exception 'Service registration unavailable' using errcode='22023';
 end if;
 update molip_profiles.profiles set username=btrim(p_username),updated_at=now() where id=p_user_id;
 update molip_profiles.service_registrations set signup_source=p_signup_source
 where user_id=p_user_id and service_key='molip-script';
 return molip_script.admin_member_detail(p_user_id);
end;
$$;
revoke all on function molip_script.admin_update_member(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_update_member(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
