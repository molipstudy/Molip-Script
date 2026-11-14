-- Synthetic local database only. No production data or credentials.
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now(),last_sign_in_at timestamptz,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
grant usage on schema auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create schema molip_script;
grant usage on schema molip_script to anon,authenticated;
create table public.profiles(id uuid primary key references auth.users(id),email text unique not null,username text not null,profile_image text,created_at timestamptz default now());
create table molip_script.profiles(id uuid primary key references auth.users(id),login_id text unique not null,email text unique not null,created_at timestamptz default now(),updated_at timestamptz default now());
create table public.molip_script_profiles(like molip_script.profiles including all);
create schema molip_voca;
create table molip_voca.folders(id uuid primary key,user_id uuid references public.profiles(id),name text);
create schema molip_admin;
create table molip_admin.memberships(user_id uuid,service_key text,created_at timestamptz default now(),primary key(user_id,service_key));
create function molip_admin.has_access(text) returns boolean language sql as $$ select false; $$;
create function public.handle_new_user() returns trigger language plpgsql as $$ begin return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create table molip_script.scripts(id text primary key,owner_id uuid references auth.users(id));
create table molip_script.community_scripts(id text primary key,owner_id uuid references auth.users(id));
create table molip_script.active_quizzes(id text primary key,owner_id uuid references auth.users(id));
create table molip_script.dictation_sessions(id text primary key,owner_id uuid references auth.users(id));
create table molip_script.flashcard_sessions(id text primary key,owner_id uuid references auth.users(id));
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000001','one@example.test'),
 ('00000000-0000-4000-8000-000000000002','two@example.test'),
 ('00000000-0000-4000-8000-000000000003','three@example.test');
insert into public.profiles(id,email,username) values
 ('00000000-0000-4000-8000-000000000001','one@example.test','Display One'),
 ('00000000-0000-4000-8000-000000000002','two@example.test','Display Two');
insert into molip_script.profiles(id,email,login_id) values
 ('00000000-0000-4000-8000-000000000001','one@example.test','login_one'),
 ('00000000-0000-4000-8000-000000000002','two@example.test','login_two');
insert into molip_admin.memberships(user_id,service_key) values('00000000-0000-4000-8000-000000000001','*');
insert into molip_voca.folders values('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','Folder retained');
insert into molip_script.scripts values('script-preserved','00000000-0000-4000-8000-000000000002');
