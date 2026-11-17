-- Manual migration AFTER profile consolidation. Apply before deploying the matching app.
-- UUIDs, Auth credentials, scripts and learning rows are retained. No auth.users UPDATE.
begin;
set local lock_timeout='10s';
lock table molip_profiles.profiles in share row exclusive mode;
alter table molip_profiles.profiles add column if not exists full_name text;
alter table molip_profiles.profiles add column if not exists phone_number text;

-- Convert exactly the existing login IDs, not email prefixes or guessed real names.
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='molip_profiles' and table_name='profiles' and column_name='login_id') then
  execute 'update molip_profiles.profiles set username=login_id where login_id is not null';
 end if;
end; $$;

create or replace function molip_profiles.normalize_username(p_value text)
returns text language sql immutable set search_path='' as $$ select lower(btrim(normalize(p_value,NFC))); $$;
create or replace function molip_profiles.valid_username(p_value text)
returns boolean language sql immutable set search_path='' as $$ select coalesce(p_value ~ '^[a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ][a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]{1,31}$',false); $$;
create or replace function molip_profiles.normalize_phone(p_value text)
returns text language sql immutable set search_path='' as $$
 select case when number ~ '^010[0-9]{8}$' then '+82'||substr(number,2) else nullif(number,'') end
 from (select regexp_replace(coalesce(p_value,''),'[[:space:]()-]','','g') number) t;
$$;
update molip_profiles.profiles set username=molip_profiles.normalize_username(username);
do $$ begin
 if exists(select 1 from molip_profiles.profiles where not molip_profiles.valid_username(username))
 or exists(select 1 from molip_profiles.profiles group by username having count(*)>1) then
  raise exception 'Username conflicts or invalid legacy usernames; migration rolled back';
 end if;
end; $$;
create unique index if not exists molip_profiles_username_unique on molip_profiles.profiles(username);
alter table molip_profiles.profiles drop constraint if exists profiles_username_format;
alter table molip_profiles.profiles add constraint profiles_username_format check(molip_profiles.valid_username(username));
alter table molip_profiles.profiles drop constraint if exists profiles_full_name_format;
alter table molip_profiles.profiles add constraint profiles_full_name_format check(full_name is null or (char_length(full_name) between 1 and 80 and full_name !~ '[[:cntrl:]]'));
alter table molip_profiles.profiles drop constraint if exists profiles_phone_format;
alter table molip_profiles.profiles add constraint profiles_phone_format check(phone_number is null or phone_number ~ '^\+[1-9][0-9]{7,14}$');

create or replace function molip_profiles.prepare_profile_fields()
returns trigger language plpgsql set search_path='' as $$ begin
 new.username:=molip_profiles.normalize_username(new.username);
 new.full_name:=nullif(btrim(new.full_name),'');
 new.phone_number:=molip_profiles.normalize_phone(new.phone_number);
 new.updated_at:=now();
 return new;
end; $$;
drop trigger if exists molip_prepare_profile_fields on molip_profiles.profiles;
create trigger molip_prepare_profile_fields before insert or update on molip_profiles.profiles for each row execute function molip_profiles.prepare_profile_fields();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare candidate text;
begin
 candidate:=molip_profiles.normalize_username(coalesce(new.raw_user_meta_data->>'username',new.raw_user_meta_data->>'login_id'));
 if not molip_profiles.valid_username(candidate) then candidate:='user_'||replace(new.id::text,'-',''); candidate:=left(candidate,32); end if;
 insert into molip_profiles.profiles(id,username) values(new.id,candidate) on conflict(id) do nothing;
 return new;
end; $$;
revoke all on function public.handle_new_user() from public,anon,authenticated,service_role;

-- Compatibility labels remain in API results for deployed clients; there is one physical username.
create or replace function molip_script.account_profile()
returns table(login_id text,username text,profile_image text) language sql stable security definer set search_path='' as $$
 select p.username,p.username,p.profile_image from molip_profiles.profiles p where id=auth.uid(); $$;
create or replace function molip_profiles.self_profile()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'login_id',p.username,'username',p.username,'email',u.email,'profile_image',p.profile_image,'created_at',p.created_at)
 from molip_profiles.profiles p join auth.users u on u.id=p.id where p.id=auth.uid(); $$;

create or replace function molip_script.my_profile()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'username',p.username,'email',u.email,'full_name',p.full_name,'phone_number',p.phone_number)
 from molip_profiles.profiles p join auth.users u on u.id=p.id where p.id=auth.uid(); $$;
revoke all on function molip_script.my_profile() from public,anon,authenticated,service_role;
grant execute on function molip_script.my_profile() to authenticated;
create or replace function molip_script.update_my_profile(p_username text,p_full_name text default null,p_phone_number text default null)
returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update molip_profiles.profiles set username=p_username,full_name=p_full_name,phone_number=p_phone_number where id=auth.uid();
 if not found then raise exception 'Profile missing' using errcode='P0002'; end if;
 return molip_script.my_profile();
end; $$;
revoke all on function molip_script.update_my_profile(text,text,text) from public,anon,authenticated,service_role;
grant execute on function molip_script.update_my_profile(text,text,text) to authenticated;

-- Older logged-in clients may still call this, but cannot rename a user via a legacy ID.
create or replace function molip_script.register_profile(p_login_id text)
returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform molip_profiles.register_service('molip-script');
end; $$;
drop function if exists molip_script.email_for_login_id(text);
create or replace function molip_script.owns_login_id(p_login_id text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from molip_profiles.profiles where id=auth.uid() and username=p_login_id); $$;

create or replace function molip_profiles.sync_public_username()
returns trigger language plpgsql security definer set search_path='' as $$ begin
 update molip_script.community_scripts set owner_login_id=new.username where owner_id=new.id;
 return new;
end; $$;
revoke all on function molip_profiles.sync_public_username() from public,anon,authenticated,service_role;
drop trigger if exists molip_sync_public_username on molip_profiles.profiles;
create trigger molip_sync_public_username after update of username on molip_profiles.profiles for each row when(old.username is distinct from new.username) execute function molip_profiles.sync_public_username();
update molip_script.community_scripts c set owner_login_id=p.username from molip_profiles.profiles p where p.id=c.owner_id;
create or replace function molip_script.community_author(p_user_id uuid)
returns table(id uuid,login_id text,script_count bigint,follower_count bigint,following_count bigint,following boolean)
language sql stable security definer set search_path=''
as $$ select p.id,p.username,
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
as $$ select m.id,m.user_id,coalesce(p.username,'사용자'),m.body,m.created_at
 from molip_script.community_comments m left join molip_profiles.profiles p on p.id=m.user_id
 where m.script_id=p_script_id and exists(select 1 from molip_script.community_scripts c where c.id=m.script_id)
 and (p_before is null or (m.created_at,m.id)<(p_before,p_before_id))
 order by m.created_at desc,m.id desc limit 50; $$;
revoke all on function molip_script.community_comment_page(text,timestamptz,uuid) from public;
grant execute on function molip_script.community_comment_page(text,timestamptz,uuid) to anon,authenticated;


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
    select u.id, cp.username as login_id, cp.username, u.email as email,
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
    'id', u.id, 'username', cp.username, 'full_name', case when molip_profiles.has_access('global') then cp.full_name end, 'phone_number', case when molip_profiles.has_access('global') then cp.phone_number end, 'contact_access', molip_profiles.has_access('global'), 'login_id', cp.username, 'email', u.email,
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



create or replace function molip_notifications.on_service_registered()
returns trigger language plpgsql security definer set search_path=''
as $$ declare member_login text; member_email text; begin
 if new.service_key<>'molip-script' then return new; end if;
 select p.username,u.email into member_login,member_email
 from molip_profiles.profiles p join auth.users u on u.id=p.id where p.id=new.user_id;
 member_login:=regexp_replace(replace(left(coalesce(member_login,'미등록'),200),'`',''),'[[:cntrl:]]',' ','g');
 member_email:=regexp_replace(replace(left(coalesce(member_email,'미등록'),320),'`',''),'[[:cntrl:]]',' ','g');
 perform molip_notifications.send_event('signup',new.user_id::text,'새 회원이 가입했어요',
 format(E'유저네임: `%s`\n이메일: `%s`\n가입 경로: `%s`',member_login,member_email,coalesce(new.signup_source,'미선택')));
 return new;
exception when others then
 raise warning 'Molip signup notification could not be queued';
 return new;
end; $$;
revoke all on function molip_notifications.on_service_registered() from public,anon,authenticated,service_role;
-- Voca still uses its existing profile APIs; never returns real names or phone numbers publicly.
create or replace function molip_voca.update_account_profile(p_username text,p_profile_image text default null)
returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if char_length(coalesce(p_profile_image,''))>2048 then raise exception 'Invalid profile image' using errcode='22023'; end if;
 update molip_profiles.profiles set username=p_username,profile_image=nullif(btrim(p_profile_image),'') where id=auth.uid();
 return molip_profiles.self_profile();
end; $$;
revoke all on function molip_profiles.normalize_username(text),molip_profiles.valid_username(text),molip_profiles.normalize_phone(text),molip_profiles.prepare_profile_fields() from public,anon,authenticated,service_role;
-- RESTRICT: any unanticipated dependency aborts the transaction instead of cascading deletion.
alter table molip_profiles.profiles drop column if exists login_id;
revoke all on table molip_profiles.profiles from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
