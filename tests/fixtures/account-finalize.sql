create role service_role;
grant usage on schema molip_voca to anon,authenticated,service_role;
alter table molip_script.community_scripts add column owner_login_id text;
alter table molip_script.community_scripts add column source_script_id text;
alter table molip_script.community_scripts enable row level security;
create policy molip_script_community_insert on molip_script.community_scripts for insert to authenticated with check(owner_id=auth.uid());
create table molip_script.publisher_follows(publisher_id uuid,user_id uuid);
create table molip_script.community_comments(id uuid,user_id uuid,script_id text,body text,created_at timestamptz);
create table molip_voca.voca_sets(id uuid primary key,owner_id uuid references public.profiles(id) on delete cascade,title text);
create table molip_voca.voca_collaborators(id uuid primary key,user_id uuid references public.profiles(id) on delete cascade,voca_id uuid references molip_voca.voca_sets(id),role text,created_at timestamptz default now());
create table molip_voca.word_progress(id uuid,user_id uuid references public.profiles(id) on delete cascade);
create table molip_voca.study_sessions(id uuid,user_id uuid references public.profiles(id) on delete cascade);
create schema molip_notifications;
create table molip_notifications.events(event_key text primary key,description text);
create function molip_notifications.send_event(p_kind text,p_id text,p_title text,p_description text)
returns bigint language plpgsql as $$ begin
 insert into molip_notifications.events values(p_kind||':'||p_id,p_description) on conflict do nothing;
 return 1;
end; $$;
insert into molip_voca.voca_sets values('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001','Shared Voca');
insert into molip_voca.voca_collaborators values('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000021','viewer',now());
