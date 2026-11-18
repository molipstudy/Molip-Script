-- Run after member-management-upgrade.sql. Adds optional detail only for the Other category.
begin;
alter table molip_profiles.service_registrations add column if not exists signup_source_detail text;
alter table molip_profiles.service_registrations drop constraint if exists service_registrations_signup_source_check;
alter table molip_profiles.service_registrations add constraint service_registrations_signup_source_check check(signup_source in ('지인 홍보','커뮤니티','Instagram','기타'));
create or replace function molip_profiles.prepare_signup_source()
returns trigger language plpgsql set search_path='' as $$ begin
 new.signup_source_detail:=case when new.signup_source='기타' then nullif(btrim(new.signup_source_detail),'') else null end;
 if new.signup_source='기타' and (new.signup_source_detail is null or length(new.signup_source_detail)>120 or new.signup_source_detail ~ '[[:cntrl:]]') then
  raise exception 'Other signup source detail required' using errcode='22023';
 end if;
 return new;
end; $$;
drop trigger if exists molip_prepare_signup_source on molip_profiles.service_registrations;
create trigger molip_prepare_signup_source before insert or update on molip_profiles.service_registrations for each row execute function molip_profiles.prepare_signup_source();


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
   or coalesce(new.raw_user_meta_data->>'signup_source','') not in ('지인 홍보','커뮤니티','Instagram','기타') then
   raise exception 'Signup information required' using errcode='22023';
  end if;
  if new.raw_user_meta_data->>'signup_source'='기타' and (nullif(btrim(new.raw_user_meta_data->>'signup_source_detail'),'') is null or length(btrim(new.raw_user_meta_data->>'signup_source_detail'))>120 or new.raw_user_meta_data->>'signup_source_detail' ~ '[[:cntrl:]]') then
   raise exception 'Other signup source detail required' using errcode='22023';
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

create or replace function molip_profiles.register_service(p_service text)
returns void language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); metadata jsonb; source text;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_service is null or p_service not in ('molip-script','molip-voca') then
  raise exception 'Invalid service' using errcode='22023';
 end if;
 select raw_user_meta_data into metadata from auth.users where id=uid;
 source:=case when (metadata->>'signup_service'=p_service or
  (metadata->>'signup_service' is null and p_service='molip-script'))
  and metadata->>'signup_source' in ('지인 홍보','커뮤니티','Instagram','기타')
  then metadata->>'signup_source' else null end;
 insert into molip_profiles.service_registrations(user_id,service_key,signup_source,signup_source_detail)
 values(uid,p_service,source,case when source='기타' then metadata->>'signup_source_detail' end) on conflict do nothing;
end;
$$;

create or replace function molip_script.admin_members(
  p_search text default '', p_page integer default 0, p_source text default ''
) returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not molip_profiles.has_access('molip-script') then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_page is null or p_page < 0 or p_page > 100000 or length(coalesce(p_search,'')) > 200
     or coalesce(p_source,'') not in ('', '지인 홍보', '커뮤니티', 'Instagram', '기타', '미선택') then
    raise exception 'Invalid member filters' using errcode = '22023';
  end if;
  with members as (
    select u.id, cp.username as login_id, cp.username, u.email as email,
      u.created_at, u.last_sign_in_at, (p.user_id is not null) as has_profile,
      coalesce(p.signup_source,'미선택') as signup_source,p.signup_source_detail
    from auth.users u left join molip_profiles.profiles cp on cp.id=u.id
    left join molip_profiles.service_registrations p on p.user_id=u.id and p.service_key='molip-script'
    where p.user_id is not null or molip_profiles.has_access('global')
  ), filtered as (
    select * from members m where
      (coalesce(p_search,'') = '' or position(lower(p_search) in lower(coalesce(m.login_id,'') || ' ' || coalesce(m.email,'') || ' ' || m.id::text)) > 0)
      and (coalesce(p_source,'') = '' or m.signup_source = p_source)
  ), page as (
    select * from filtered order by created_at desc, id limit 25 offset p_page * 25
  ) select jsonb_build_object(
    'total', (select count(*) from filtered),
    'total_members', (select count(*) from members),
    'script_members', (select count(*) from members where has_profile),
    'items', coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc, id) from page), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function molip_script.admin_member_detail(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not molip_profiles.has_access('molip-script') then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'id', u.id, 'username', cp.username, 'full_name', case when molip_profiles.has_access('global') then cp.full_name end, 'phone_number', case when molip_profiles.has_access('global') then cp.phone_number end, 'contact_access', molip_profiles.has_access('global'), 'login_id', cp.username, 'email', u.email,
    'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at, 'profile_created_at', p.joined_at,
    'signup_source', coalesce(p.signup_source,'미선택'),'signup_source_detail',p.signup_source_detail,
    'script_count', (select count(*) from molip_script.scripts where owner_id = u.id),
    'shared_count', (select count(*) from molip_script.community_scripts where owner_id = u.id),
    'active_count', (select count(*) from molip_script.active_quizzes where owner_id = u.id),
    'completed_count', (select count(*) from molip_script.dictation_sessions where owner_id = u.id)
      + (select count(*) from molip_script.flashcard_sessions where owner_id = u.id)
  ) into result from auth.users u left join molip_profiles.profiles cp on cp.id=u.id
    left join molip_profiles.service_registrations p on p.user_id=u.id and p.service_key='molip-script'
  where u.id = p_user_id and (p.user_id is not null or molip_profiles.has_access('global'));
  return result;
end;
$$;

drop function if exists molip_script.admin_update_member_profile(uuid,text,text,text,text);

create or replace function molip_script.admin_update_member_profile(
 p_user_id uuid,p_username text,p_full_name text,p_phone_number text,p_signup_source text default null,p_signup_source_detail text default null
) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if not molip_profiles.has_access('global') then raise exception 'Administrator access required' using errcode='42501'; end if;
 if not coalesce(molip_profiles.valid_username(molip_profiles.normalize_username(p_username)),false)
  or nullif(btrim(p_full_name),'') is null or molip_profiles.normalize_phone(p_phone_number) is null
  or (p_signup_source is not null and p_signup_source not in ('지인 홍보','커뮤니티','Instagram','기타')) then
  raise exception 'Invalid member fields' using errcode='22023';
 end if;
 perform 1 from molip_profiles.profiles where id=p_user_id for update;
 if not found then raise exception 'Member unavailable' using errcode='P0002'; end if;
 if p_signup_source is not null and not exists(select 1 from molip_profiles.service_registrations where user_id=p_user_id and service_key='molip-script') then
  raise exception 'Service registration unavailable' using errcode='22023';
 end if;
 update molip_profiles.profiles set username=p_username,full_name=p_full_name,phone_number=p_phone_number where id=p_user_id;
 update molip_profiles.service_registrations set signup_source=p_signup_source,signup_source_detail=p_signup_source_detail where user_id=p_user_id and service_key='molip-script';
 return molip_script.admin_member_detail(p_user_id);
end; $$;
revoke all on function molip_script.admin_update_member_profile(uuid,text,text,text,text,text) from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_update_member_profile(uuid,text,text,text,text,text) to authenticated;
create or replace function molip_notifications.on_service_registered()
returns trigger language plpgsql security definer set search_path=''
as $$ declare member_login text; member_email text; begin
 if new.service_key<>'molip-script' then return new; end if;
 select p.username,u.email into member_login,member_email
 from molip_profiles.profiles p join auth.users u on u.id=p.id where p.id=new.user_id;
 member_login:=regexp_replace(replace(left(coalesce(member_login,'미등록'),200),'`',''),'[[:cntrl:]]',' ','g');
 member_email:=regexp_replace(replace(left(coalesce(member_email,'미등록'),320),'`',''),'[[:cntrl:]]',' ','g');
 perform molip_notifications.send_event('signup',new.user_id::text,'새 회원이 가입했어요',
 format(E'유저네임: `%s`\n이메일: `%s`\n가입 경로: `%s`',member_login,member_email,regexp_replace(replace(left(concat_ws(' · ',coalesce(new.signup_source,'미선택'),new.signup_source_detail),200),'`',''),'[[:cntrl:]]',' ','g')));
 return new;
exception when others then
 raise warning 'Molip signup notification could not be queued';
 return new;
end; $$;

notify pgrst,'reload schema';
commit;
