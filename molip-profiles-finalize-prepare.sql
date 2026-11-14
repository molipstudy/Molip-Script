-- Phase 2: exactly one physical profile table, no compatibility copies/views.
-- Requires molip-profiles-upgrade.sql already applied.
-- Deploy the prepared Script and Voca API code in the same maintenance window.
begin;
set local lock_timeout='10s';
lock table public.profiles, public.molip_script_profiles, molip_script.profiles,
 molip_profiles.profiles in share row exclusive mode;

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

-- Association data only: no repeated login ID, email, name or picture.
create table molip_profiles.service_registrations (
 user_id uuid not null references molip_profiles.profiles(id) on delete cascade,
 service_key text not null check(service_key in ('molip-script','molip-voca')),
 joined_at timestamptz not null default now(),
 signup_source text check(signup_source in ('지인 홍보','커뮤니티','Instagram')),
 primary key(user_id,service_key)
);
alter table molip_profiles.service_registrations enable row level security;
revoke all on molip_profiles.service_registrations from public,anon,authenticated,service_role;
insert into molip_profiles.service_registrations(user_id,service_key,joined_at,signup_source)
select p.id,'molip-script',p.created_at,
 case when u.raw_user_meta_data->>'signup_source' in ('지인 홍보','커뮤니티','Instagram')
 then u.raw_user_meta_data->>'signup_source' else null end
from molip_script.profiles p join auth.users u on u.id=p.id;
-- A public profile is NOT proof of Voca use. Backfill only actual Voca activity.
insert into molip_profiles.service_registrations(user_id,service_key)
select distinct user_id,'molip-voca' from (
 select user_id from molip_voca.folders union select owner_id from molip_voca.voca_sets
 union select user_id from molip_voca.voca_collaborators union select user_id from molip_voca.word_progress
 union select user_id from molip_voca.study_sessions
) users on conflict do nothing;

create function molip_profiles.register_service(p_service text)
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
  and metadata->>'signup_source' in ('지인 홍보','커뮤니티','Instagram')
  then metadata->>'signup_source' else null end;
 insert into molip_profiles.service_registrations(user_id,service_key,signup_source)
 values(uid,p_service,source) on conflict do nothing;
end;
$$;
revoke all on function molip_profiles.register_service(text) from public,anon,authenticated,service_role;

-- Keep existing Auth trigger identity; it now creates ONLY the common profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 insert into molip_profiles.profiles(id,login_id,username)
 values(new.id,case when lower(btrim(new.raw_user_meta_data->>'login_id')) ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
 then lower(btrim(new.raw_user_meta_data->>'login_id')) else null end,
 coalesce(nullif(new.raw_user_meta_data->>'username',''),split_part(new.email,'@',1),'사용자'))
 on conflict(id) do nothing;
 return new;
end;
$$;
revoke all on function public.handle_new_user() from public,anon,authenticated,service_role;

create or replace function molip_script.register_profile(p_login_id text)
returns void language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); candidate text:=lower(btrim(p_login_id));
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if candidate is null or candidate !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then
  raise exception 'Invalid login ID' using errcode='22023';
 end if;
 perform 1 from molip_profiles.profiles where id=uid for update;
 if not found then raise exception 'Account profile missing'; end if;
 if exists(select 1 from molip_profiles.profiles where id=uid and login_id is not null and login_id<>candidate) then
  raise exception 'Login ID already registered' using errcode='23505';
 end if;
 update molip_profiles.profiles set login_id=candidate,updated_at=now()
 where id=uid and login_id is distinct from candidate;
 perform molip_profiles.register_service('molip-script');
end;
$$;
revoke all on function molip_script.register_profile(text) from public,anon;
grant execute on function molip_script.register_profile(text) to authenticated;

create function molip_profiles.self_profile()
returns jsonb language sql stable security definer set search_path=''
as $$ select jsonb_build_object('id',p.id,'login_id',p.login_id,'email',u.email,
 'username',p.username,'profile_image',p.profile_image,'created_at',p.created_at)
 from molip_profiles.profiles p join auth.users u on u.id=p.id where p.id=auth.uid(); $$;
revoke all on function molip_profiles.self_profile() from public,anon,authenticated,service_role;

create or replace function molip_voca.account_profile()
returns jsonb language plpgsql security definer set search_path=''
as $$ begin
 perform molip_profiles.register_service('molip-voca');
 return molip_profiles.self_profile();
end; $$;
revoke all on function molip_voca.account_profile() from public,anon;
grant execute on function molip_voca.account_profile() to authenticated;

create function molip_voca.update_account_profile(p_username text,p_profile_image text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_username is null or length(btrim(p_username)) not between 1 and 80
 or length(coalesce(p_profile_image,''))>2048 then raise exception 'Invalid profile' using errcode='22023'; end if;
 update molip_profiles.profiles set username=btrim(p_username),profile_image=nullif(btrim(p_profile_image),''),updated_at=now()
 where id=auth.uid();
 return molip_profiles.self_profile();
end; $$;
revoke all on function molip_voca.update_account_profile(text,text) from public,anon;
grant execute on function molip_voca.update_account_profile(text,text) to authenticated;

-- Public author display projection: never exposes email or auth metadata.
create function molip_voca.public_profiles(p_ids uuid[])
returns table(id uuid,username text) language sql stable security definer set search_path=''
as $$ select p.id,p.username from molip_profiles.profiles p where p.id=any(p_ids[1:200]); $$;
revoke all on function molip_voca.public_profiles(uuid[]) from public;
grant execute on function molip_voca.public_profiles(uuid[]) to anon,authenticated,service_role;

-- Preserve the previous collaborator visibility: owner sees all, others only self.
create function molip_voca.collaborator_profiles(p_voca_id uuid)
returns table(id uuid,user_id uuid,voca_id uuid,role text,created_at timestamptz,"user" jsonb)
language sql stable security definer set search_path=''
as $$ select c.id,c.user_id,c.voca_id,c.role,c.created_at,
 jsonb_build_object('username',p.username,'email',u.email)
 from molip_voca.voca_collaborators c join molip_profiles.profiles p on p.id=c.user_id
 join auth.users u on u.id=c.user_id
 where auth.uid() is not null and c.voca_id=p_voca_id
 and (c.user_id=auth.uid() or exists(select 1 from molip_voca.voca_sets v where v.id=c.voca_id and v.owner_id=auth.uid()))
 order by c.created_at,c.id; $$;
revoke all on function molip_voca.collaborator_profiles(uuid) from public,anon;
grant execute on function molip_voca.collaborator_profiles(uuid) to authenticated;

create function molip_voca.find_collaborator(p_voca_id uuid,p_email text)
returns uuid language plpgsql stable security definer set search_path=''
as $$ declare result uuid; begin
 if auth.uid() is null or not exists(select 1 from molip_voca.voca_sets where id=p_voca_id and owner_id=auth.uid()) then
  raise exception 'Access denied' using errcode='42501';
 end if;
 select p.id into result from molip_profiles.profiles p join auth.users u on u.id=p.id
 where lower(u.email)=lower(btrim(p_email)) limit 1;
 return result;
end; $$;
revoke all on function molip_voca.find_collaborator(uuid,text) from public,anon;
grant execute on function molip_voca.find_collaborator(uuid,text) to authenticated;

-- Retarget all five Voca foreign keys, preserving their delete/deferral actions.
do $$ declare fk record; definition text; begin
 for fk in select c.oid,c.conname,c.conrelid from pg_constraint c
  where c.contype='f' and c.confrelid='public.profiles'::regclass
 loop
  definition:=regexp_replace(pg_get_constraintdef(fk.oid),'REFERENCES (public[.])?profiles\(id\)',
   'REFERENCES molip_profiles.profiles(id)');
  if definition=pg_get_constraintdef(fk.oid) then raise exception 'Unrecognized profile FK: %',fk.conname; end if;
  execute format('alter table %s drop constraint %I',fk.conrelid::regclass,fk.conname);
  execute format('alter table %s add constraint %I %s',fk.conrelid::regclass,fk.conname,definition);
 end loop;
end; $$;

create or replace function molip_script.community_author(p_user_id uuid)
returns table(id uuid,login_id text,script_count bigint,follower_count bigint,following_count bigint,following boolean)
language sql stable security definer set search_path=''
as $$ select p.id,p.login_id,
 (select count(*) from molip_script.community_scripts c where c.owner_id=p.id),
 (select count(*) from molip_script.publisher_follows f where f.publisher_id=p.id),
 (select count(*) from molip_script.publisher_follows f where f.user_id=p.id),
 exists(select 1 from molip_script.publisher_follows f where f.publisher_id=p.id and f.user_id=auth.uid())
 from molip_profiles.profiles p where p.id=p_user_id and exists(
 select 1 from molip_profiles.service_registrations r where r.user_id=p.id and r.service_key='molip-script'); $$;
revoke all on function molip_script.community_author(uuid) from public;
grant execute on function molip_script.community_author(uuid) to anon,authenticated;
create or replace function molip_script.community_comment_page(p_script_id text,p_before timestamptz default null,p_before_id uuid default null)
returns table(id uuid,user_id uuid,login_id text,body text,created_at timestamptz)
language sql stable security definer set search_path=''
as $$ select m.id,m.user_id,coalesce(p.login_id,'사용자'),m.body,m.created_at
 from molip_script.community_comments m left join molip_profiles.profiles p on p.id=m.user_id
 where m.script_id=p_script_id and exists(select 1 from molip_script.community_scripts c where c.id=m.script_id)
 and (p_before is null or (m.created_at,m.id)<(p_before,p_before_id))
 order by m.created_at desc,m.id desc limit 50; $$;
revoke all on function molip_script.community_comment_page(text,timestamptz,uuid) from public;
grant execute on function molip_script.community_comment_page(text,timestamptz,uuid) to anon,authenticated;

-- A checked helper avoids granting clients direct access to the common table.
create function molip_script.owns_login_id(p_login_id text)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from molip_profiles.profiles where id=auth.uid() and login_id=p_login_id); $$;
revoke all on function molip_script.owns_login_id(text) from public,anon;
grant execute on function molip_script.owns_login_id(text) to authenticated;
drop policy molip_script_community_insert on molip_script.community_scripts;
create policy molip_script_community_insert on molip_script.community_scripts for insert to authenticated
with check(owner_id=auth.uid() and molip_script.owns_login_id(owner_login_id)
 and exists(select 1 from molip_script.scripts where scripts.id=source_script_id and scripts.owner_id=auth.uid()));

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
     or coalesce(p_source,'') not in ('', '지인 홍보', '커뮤니티', 'Instagram', '미선택') then
    raise exception 'Invalid member filters' using errcode = '22023';
  end if;
  with members as (
    select u.id, cp.login_id, cp.username, u.email as email,
      u.created_at, u.last_sign_in_at, (p.user_id is not null) as has_profile,
      coalesce(p.signup_source,'미선택') as signup_source
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
alter function molip_script.admin_members(text, integer, text) owner to postgres;
revoke all on function molip_script.admin_members(text, integer, text) from public, anon;
grant execute on function molip_script.admin_members(text, integer, text) to authenticated;

create or replace function molip_script.admin_member_detail(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not molip_profiles.has_access('molip-script') then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'id', u.id, 'username', cp.username, 'login_id', cp.login_id, 'email', u.email,
    'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at, 'profile_created_at', p.joined_at,
    'signup_source', coalesce(p.signup_source,'미선택'),
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
alter function molip_script.admin_member_detail(uuid) owner to postgres;
revoke all on function molip_script.admin_member_detail(uuid) from public, anon;
grant execute on function molip_script.admin_member_detail(uuid) to authenticated;


-- Notify once on first completed service registration, never from a profile copy.
create function molip_notifications.on_service_registered()
returns trigger language plpgsql security definer set search_path=''
as $$ declare member_login text; member_email text; begin
 if new.service_key<>'molip-script' then return new; end if;
 select p.login_id,u.email into member_login,member_email
 from molip_profiles.profiles p join auth.users u on u.id=p.id where p.id=new.user_id;
 member_login:=regexp_replace(replace(left(coalesce(member_login,'미등록'),200),'`',''),'[[:cntrl:]]',' ','g');
 member_email:=regexp_replace(replace(left(coalesce(member_email,'미등록'),320),'`',''),'[[:cntrl:]]',' ','g');
 perform molip_notifications.send_event('signup',new.user_id::text,'새 회원이 가입했어요',
 format(E'아이디: `%s`\n이메일: `%s`\n가입 경로: `%s`',member_login,member_email,coalesce(new.signup_source,'미선택')));
 return new;
exception when others then
 raise warning 'Molip signup notification could not be queued';
 return new;
end; $$;
revoke all on function molip_notifications.on_service_registered() from public,anon,authenticated,service_role;
create trigger molip_service_signup after insert on molip_profiles.service_registrations
 for each row execute function molip_notifications.on_service_registered();

notify pgrst,'reload schema';
commit;
