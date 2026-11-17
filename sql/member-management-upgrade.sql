-- Apply once after email-username-upgrade.sql and admin/member-edit-upgrade.sql.
-- Signup contact requirements, administrator editing, and private/shared learning lookup.
begin;
create or replace function molip_profiles.prepare_profile_fields()
returns trigger language plpgsql set search_path='' as $$ begin
 new.username:=molip_profiles.normalize_username(new.username);
 new.full_name:=nullif(btrim(new.full_name),'');
 new.phone_number:=molip_profiles.normalize_phone(new.phone_number);
 if tg_op='UPDATE' then
  if (old.full_name is not null and new.full_name is null) or
     (old.phone_number is not null and new.phone_number is null) then
   raise exception 'Name and phone cannot be cleared' using errcode='22023';
  end if;
 end if;
 new.updated_at:=now();
 return new;
end; $$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare candidate text; full_name text; phone text;
begin
 candidate:=molip_profiles.normalize_username(coalesce(new.raw_user_meta_data->>'username',new.raw_user_meta_data->>'login_id'));
 full_name:=nullif(btrim(new.raw_user_meta_data->>'full_name'),'');
 phone:=molip_profiles.normalize_phone(new.raw_user_meta_data->>'phone_number');
 if new.raw_user_meta_data->>'signup_service'='molip-script' then
  if not coalesce(molip_profiles.valid_username(candidate),false) or full_name is null
   or length(full_name)>80 or full_name ~ '[[:cntrl:]]' or phone is null
   or phone !~ '^\+[1-9][0-9]{7,14}$'
   or coalesce(new.raw_user_meta_data->>'signup_source','') not in ('지인 홍보','커뮤니티','Instagram') then
   raise exception 'Signup information required' using errcode='22023';
  end if;
 else
  -- Other services retain their existing signup contract and supply their own details later.
  full_name:=null; phone:=null;
 end if;
 if not coalesce(molip_profiles.valid_username(candidate),false) then candidate:=left('user_'||replace(new.id::text,'-',''),32); end if;
 insert into molip_profiles.profiles(id,username,full_name,phone_number)
 values(new.id,candidate,full_name,phone) on conflict(id) do nothing;
 return new;
end; $$;
revoke all on function public.handle_new_user() from public,anon,authenticated,service_role;
create or replace function molip_script.update_my_profile(p_username text,p_full_name text default null,p_phone_number text default null)
returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if nullif(btrim(p_full_name),'') is null or molip_profiles.normalize_phone(p_phone_number) is null then
  raise exception 'Name and phone required' using errcode='22023';
 end if;
 update molip_profiles.profiles set username=p_username,full_name=p_full_name,phone_number=p_phone_number where id=auth.uid();
 return molip_script.my_profile();
end; $$;
revoke all on function molip_script.update_my_profile(text,text,text) from public,anon,authenticated,service_role;
grant execute on function molip_script.update_my_profile(text,text,text) to authenticated;
create or replace function molip_script.admin_global_access()
returns boolean language sql stable security definer set search_path=''
as $$ select molip_profiles.has_access('global'); $$;
revoke all on function molip_script.admin_global_access() from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_global_access() to authenticated;

create or replace function molip_script.admin_update_member_profile(
 p_user_id uuid,p_username text,p_full_name text,p_phone_number text,p_signup_source text default null
) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if not molip_profiles.has_access('global') then raise exception 'Administrator access required' using errcode='42501'; end if;
 if nullif(btrim(p_full_name),'') is null or molip_profiles.normalize_phone(p_phone_number) is null then
  raise exception 'Name and phone required' using errcode='22023';
 end if;
 perform molip_script.admin_update_member(p_user_id,p_username,p_signup_source);
 update molip_profiles.profiles set full_name=p_full_name,phone_number=p_phone_number where id=p_user_id;
 return molip_script.admin_member_detail(p_user_id);
end; $$;
revoke all on function molip_script.admin_update_member_profile(uuid,text,text,text,text) from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_update_member_profile(uuid,text,text,text,text) to authenticated;

-- Private learning data stays behind a fresh global-admin check, never general RLS access.
create or replace function molip_script.admin_member_learning(p_user_id uuid,p_kind text,p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not molip_profiles.has_access('global') then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_kind not in ('scripts','shared','active') or p_kind is null or p_page is null or p_page<0 or p_page>100000 then
  raise exception 'Invalid pagination' using errcode='22023';
 end if;
 if p_kind='scripts' then
  select jsonb_build_object('total',(select count(*) from molip_script.scripts where owner_id=p_user_id),
   'items',coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb)) into result from (
    select id,title,raw_text,created_at,updated_at from molip_script.scripts where owner_id=p_user_id
    order by updated_at desc,id limit 25 offset p_page*25
   ) s;
 elsif p_kind='shared' then
  select jsonb_build_object('total',(select count(*) from molip_script.community_scripts where owner_id=p_user_id),
   'items',coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb)) into result from (
    select id,title,raw_text,shared_at as updated_at from molip_script.community_scripts where owner_id=p_user_id
    order by shared_at desc,id limit 25 offset p_page*25
   ) s;
 else
  select jsonb_build_object('total',(select count(*) from molip_script.active_quizzes where owner_id=p_user_id),
   'items',coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)) into result from (
    select a.id,a.script_id,s.title,s.raw_text,a.quiz_type,a.mode,a.progress,a.updated_at,a.state
    from molip_script.active_quizzes a join molip_script.scripts s on s.id=a.script_id and s.owner_id=a.owner_id
    where a.owner_id=p_user_id order by a.updated_at desc,a.id limit 25 offset p_page*25
   ) q;
 end if;
 return result;
end; $$;
revoke all on function molip_script.admin_member_learning(uuid,text,integer) from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_member_learning(uuid,text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
