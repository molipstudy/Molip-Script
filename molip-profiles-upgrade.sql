-- Shared Molip identity layer. Prepared against the live schema on 2026-11-14.
-- Run as postgres, after backup. One transaction; no auth schema/table changes.
-- Existing service tables remain as compatibility adapters for deployed apps.
begin;
set local lock_timeout = '10s';

-- Prevent concurrent legacy profile writes during copy and trigger installation.
lock table public.profiles, molip_script.profiles, public.molip_script_profiles,
  molip_admin.memberships in share row exclusive mode;

do $$
begin
  if exists(select 1 from molip_admin.memberships where service_key='global') then
    raise exception 'Reserved administrator scope conflicts with a legacy service';
  end if;
  if exists (
    select lower(login_id) from (
      select id,login_id from molip_script.profiles
      union select id,login_id from public.molip_script_profiles
    ) p group by lower(login_id) having count(distinct id)>1
  ) or exists (
    select 1 from molip_script.profiles s join public.molip_script_profiles l using(id)
    where s.login_id<>l.login_id
  ) then raise exception 'Conflicting legacy login IDs; migration stopped without changes'; end if;
end;
$$;

create schema molip_profiles;
revoke all on schema molip_profiles from public, anon, authenticated;
create table molip_profiles.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text unique,
  username text not null,
  profile_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_id_format check (login_id is null or login_id ~ '^[a-z0-9][a-z0-9._-]{2,31}$')
);
create table molip_profiles.admin_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope='global' or scope ~ '^[a-z][a-z0-9-]{1,63}$'),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  primary key(user_id,scope)
);
alter table molip_profiles.profiles enable row level security;
alter table molip_profiles.admin_grants enable row level security;
revoke all on all tables in schema molip_profiles from public, anon, authenticated;
-- No direct client writes, including profile roles; access goes through checked RPCs.

-- Username is the existing display name, not a guessed login ID or real name.
-- Unconfigured login IDs stay NULL; new users of other services can choose one later.
insert into molip_profiles.profiles(id,login_id,username,profile_image,created_at,updated_at)
select u.id, coalesce(s.login_id,l.login_id),
 coalesce(p.username,coalesce(s.login_id,l.login_id),'사용자'), p.profile_image,
 coalesce(u.created_at,p.created_at,s.created_at,now()),
 greatest(coalesce(s.updated_at,u.created_at,now()),coalesce(l.updated_at,u.created_at,now()))
from auth.users u left join public.profiles p on p.id=u.id
left join molip_script.profiles s on s.id=u.id
left join public.molip_script_profiles l on l.id=u.id;
insert into molip_profiles.admin_grants(user_id,scope,granted_at)
select user_id,case service_key when '*' then 'global' else service_key end,created_at
from molip_admin.memberships;

create function molip_profiles.has_access(p_scope text)
returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and exists (
 select 1 from molip_profiles.admin_grants g
 where g.user_id=auth.uid() and g.scope in ('global',p_scope)
); $$;
revoke all on function molip_profiles.has_access(text) from public, anon, authenticated;

-- Synchronize confirmed profile values to the old physical tables. Conditional
-- updates avoid recursive trigger cycles. Existing rows and all Voca FKs survive.
create function molip_profiles.sync_compatibility_profiles()
returns trigger language plpgsql security definer set search_path=''
as $$
declare current_email text;
begin
 select email into current_email from auth.users where id=new.id;
 if current_email is not null then
  insert into public.profiles(id,email,username,profile_image,created_at)
  values(new.id,current_email,new.username,new.profile_image,new.created_at)
  on conflict(id) do update set email=excluded.email,username=excluded.username,profile_image=excluded.profile_image
  where (public.profiles.email,public.profiles.username,public.profiles.profile_image)
   is distinct from (excluded.email,excluded.username,excluded.profile_image);
  if new.login_id is not null then
   update molip_script.profiles set login_id=new.login_id,email=current_email,updated_at=new.updated_at
   where id=new.id and (login_id,email) is distinct from (new.login_id,current_email);
   update public.molip_script_profiles set login_id=new.login_id,email=current_email,updated_at=new.updated_at
   where id=new.id and (login_id,email) is distinct from (new.login_id,current_email);
  end if;
 end if;
 return new;
end;
$$;
revoke all on function molip_profiles.sync_compatibility_profiles() from public, anon, authenticated;
create trigger molip_profile_compatibility after insert or update on molip_profiles.profiles
 for each row execute function molip_profiles.sync_compatibility_profiles();

create function molip_profiles.accept_legacy_profile()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_table_schema='public' and tg_table_name='profiles' then
  insert into molip_profiles.profiles(id,username,profile_image,created_at)
  values(new.id,new.username,new.profile_image,coalesce(new.created_at,now()))
  on conflict(id) do update set username=excluded.username,profile_image=excluded.profile_image,updated_at=now()
  where (molip_profiles.profiles.username,molip_profiles.profiles.profile_image)
   is distinct from (excluded.username,excluded.profile_image);
 else
  -- Established global login IDs cannot be silently renamed through old apps.
  if exists(select 1 from molip_profiles.profiles p where p.id=new.id and p.login_id is not null and p.login_id<>new.login_id) then
   raise exception 'Login ID already registered' using errcode='23505';
  end if;
  insert into molip_profiles.profiles(id,login_id,username,created_at)
  values(new.id,new.login_id,new.login_id,new.created_at)
  on conflict(id) do update set login_id=excluded.login_id,updated_at=now()
  where molip_profiles.profiles.login_id is distinct from excluded.login_id;
 end if;
 return new;
end;
$$;
revoke all on function molip_profiles.accept_legacy_profile() from public, anon, authenticated;
create trigger molip_common_profile_sync after insert or update on public.profiles
 for each row execute function molip_profiles.accept_legacy_profile();
create trigger molip_common_profile_sync after insert or update on molip_script.profiles
 for each row execute function molip_profiles.accept_legacy_profile();
create trigger molip_common_profile_sync after insert or update on public.molip_script_profiles
 for each row execute function molip_profiles.accept_legacy_profile();

-- Keep the existing auth trigger unchanged; replace its application-owned target.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 insert into molip_profiles.profiles(id,login_id,username)
 values(new.id,case when lower(btrim(new.raw_user_meta_data->>'login_id')) ~ '^[a-z0-9][a-z0-9._-]{2,31}$' then lower(btrim(new.raw_user_meta_data->>'login_id')) else null end,coalesce(nullif(new.raw_user_meta_data->>'username',''),split_part(new.email,'@',1),'사용자'))
 on conflict(id) do nothing;
 return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- The exposed service adapter claims/retains the global login ID and creates
-- only this service's compatibility profile. Email comes from Auth, not input.
create or replace function molip_script.register_profile(p_login_id text)
returns void language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); candidate text:=lower(btrim(p_login_id)); actual_email text;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if candidate is null or candidate !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then
  raise exception 'Invalid login ID' using errcode='22023';
 end if;
 select email into actual_email from auth.users where id=uid;
 if actual_email is null then raise exception 'Email required' using errcode='22023'; end if;
 insert into molip_profiles.profiles(id,login_id,username)
 values(uid,candidate,candidate) on conflict(id) do nothing;
 perform 1 from molip_profiles.profiles where id=uid for update;
 if exists(select 1 from molip_profiles.profiles where id=uid and login_id is not null and login_id<>candidate) then
  raise exception 'Login ID already registered' using errcode='23505';
 end if;
 update molip_profiles.profiles set login_id=candidate,updated_at=now() where id=uid and login_id is distinct from candidate;
 insert into molip_script.profiles(id,login_id,email) values(uid,candidate,actual_email)
 on conflict(id) do update set email=excluded.email,updated_at=now();
end;
$$;
revoke all on function molip_script.register_profile(text) from public, anon;
grant execute on function molip_script.register_profile(text) to authenticated;

create or replace function molip_script.email_for_login_id(input_login_id text)
returns text language sql stable security definer set search_path=''
as $$ select lower(u.email) from molip_profiles.profiles p join auth.users u on u.id=p.id
 where p.login_id=lower(btrim(input_login_id)) limit 1; $$;
revoke all on function molip_script.email_for_login_id(text) from public;
grant execute on function molip_script.email_for_login_id(text) to anon,authenticated;

-- Read only the authenticated caller's canonical display identity.
create or replace function molip_script.account_profile()
returns table(login_id text, username text, profile_image text)
language sql stable security definer set search_path=''
as $$ select p.login_id,p.username,p.profile_image from molip_profiles.profiles p where p.id=auth.uid(); $$;
revoke all on function molip_script.account_profile() from public,anon;
grant execute on function molip_script.account_profile() to authenticated;

-- Preserve existing RPC signatures and client schema configuration.
create or replace function molip_script.admin_access()
returns boolean language sql stable security definer set search_path=''
as $$ select molip_profiles.has_access('molip-script'); $$;
revoke all on function molip_script.admin_access() from public,anon;
grant execute on function molip_script.admin_access() to authenticated;

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
      u.created_at, u.last_sign_in_at, (p.id is not null) as has_profile,
      case u.raw_user_meta_data ->> 'signup_source'
        when '지인 홍보' then '지인 홍보' when '커뮤니티' then '커뮤니티'
        when 'Instagram' then 'Instagram' else '미선택' end as signup_source
    from auth.users u left join molip_profiles.profiles cp on cp.id=u.id
    left join molip_script.profiles p on p.id=u.id
    where p.id is not null or molip_profiles.has_access('global')
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
    'email_confirmed_at', u.email_confirmed_at, 'profile_created_at', p.created_at,
    'signup_source', case u.raw_user_meta_data ->> 'signup_source'
      when '지인 홍보' then '지인 홍보' when '커뮤니티' then '커뮤니티'
      when 'Instagram' then 'Instagram' else '미선택' end,
    'script_count', (select count(*) from molip_script.scripts where owner_id = u.id),
    'shared_count', (select count(*) from molip_script.community_scripts where owner_id = u.id),
    'active_count', (select count(*) from molip_script.active_quizzes where owner_id = u.id),
    'completed_count', (select count(*) from molip_script.dictation_sessions where owner_id = u.id)
      + (select count(*) from molip_script.flashcard_sessions where owner_id = u.id)
  ) into result from auth.users u left join molip_profiles.profiles cp on cp.id=u.id
    left join molip_script.profiles p on p.id=u.id
  where u.id = p_user_id and (p.id is not null or molip_profiles.has_access('global'));
  return result;
end;
$$;
alter function molip_script.admin_member_detail(uuid) owner to postgres;
revoke all on function molip_script.admin_member_detail(uuid) from public, anon;
grant execute on function molip_script.admin_member_detail(uuid) to authenticated;

-- Check copied identities/grants before removing the unused administrator schema.
do $$
begin
 if (select count(*) from molip_profiles.profiles) <> (select count(*) from auth.users) then
  raise exception 'Common profile count mismatch';
 end if;
 if exists(select 1 from molip_script.profiles s join molip_profiles.profiles p on p.id=s.id where p.login_id is distinct from s.login_id) then
  raise exception 'Script login ID mismatch';
 end if;
 if exists(select 1 from molip_admin.memberships m where not exists(
  select 1 from molip_profiles.admin_grants g where g.user_id=m.user_id
   and g.scope=case m.service_key when '*' then 'global' else m.service_key end)) then
  raise exception 'Administrator grant copy mismatch';
 end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where p.prokind='f' and n.nspname<>'molip_admin' and p.prosrc like '%molip_admin.%') then
  raise exception 'Old administrator function reference remains';
 end if;
end;
$$;
-- RESTRICT is deliberate. Unexpected dependencies abort the whole transaction.
drop function molip_admin.has_access(text);
drop table molip_admin.memberships;
drop schema molip_admin;
notify pgrst, 'reload schema';
commit;
