-- Private support storage. Do not add molip_support to exposed schemas.
begin;
create schema if not exists molip_support;
revoke all on schema molip_support from public,anon,authenticated;
create table if not exists molip_support.threads (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 service_key text not null default 'molip-script',
 title text not null check(length(btrim(title)) between 1 and 100),
 status text not null default 'waiting' check(status in ('waiting','answered')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists molip_support.messages (
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references molip_support.threads(id) on delete cascade,
 sender_id uuid references auth.users(id) on delete set null,
 sender_kind text not null check(sender_kind in ('member','admin')),
 body text not null check(length(btrim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index if not exists support_threads_owner on molip_support.threads(user_id,service_key,updated_at desc);
create index if not exists support_threads_inbox on molip_support.threads(service_key,updated_at desc);
create index if not exists support_messages_thread on molip_support.messages(thread_id,created_at,id);
alter table molip_support.threads enable row level security;
alter table molip_support.messages enable row level security;
revoke all on all tables in schema molip_support from public,anon,authenticated;

create or replace function molip_script.support_list(p_admin boolean default false,p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_admin is null or (p_admin and not molip_profiles.has_access('molip-script')) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_page is null or p_page<0 or p_page>100000 then raise exception 'Invalid page' using errcode='22023'; end if;
 with visible as (
  select t.id,t.title,t.status,t.created_at,t.updated_at,
   case when p_admin then p.username end as username,
   (select left(m.body,100) from molip_support.messages m where m.thread_id=t.id order by m.created_at desc,m.id desc limit 1) as preview
  from molip_support.threads t left join molip_profiles.profiles p on p.id=t.user_id
  where t.service_key='molip-script' and (t.user_id=auth.uid() or p_admin)
 ), page as (select * from visible order by updated_at desc,id limit 25 offset p_page*25)
 select jsonb_build_object('total',(select count(*) from visible),'items',coalesce((select jsonb_agg(to_jsonb(page) order by updated_at desc,id) from page),'[]'::jsonb)) into result;
 return result;
end; $$;

create or replace function molip_script.support_detail(p_thread_id uuid,p_admin boolean default false,p_page integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare thread jsonb; messages jsonb; total bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_admin is null or (p_admin and not molip_profiles.has_access('molip-script')) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_page is null or p_page<0 or p_page>100000 then raise exception 'Invalid page' using errcode='22023'; end if;
 select jsonb_build_object('id',t.id,'title',t.title,'status',t.status,'created_at',t.created_at,'updated_at',t.updated_at,'username',case when p_admin then p.username end)
 into thread from molip_support.threads t left join molip_profiles.profiles p on p.id=t.user_id
 where t.id=p_thread_id and t.service_key='molip-script' and (t.user_id=auth.uid() or p_admin);
 if thread is null then raise exception 'Inquiry unavailable' using errcode='42501'; end if;
 select count(*) into total from molip_support.messages where thread_id=p_thread_id;
 select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at,m.id),'[]'::jsonb) into messages from (
  select id,sender_kind,body,created_at from molip_support.messages where thread_id=p_thread_id
  order by created_at desc,id desc limit 25 offset p_page*25
 ) m;
 return jsonb_build_object('thread',thread,'messages',messages,'total_messages',total);
end; $$;

create or replace function molip_script.support_create(p_title text,p_body text)
returns uuid language plpgsql security definer set search_path='' as $$
declare thread_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if nullif(btrim(p_title),'') is null or length(btrim(p_title))>100 or nullif(btrim(p_body),'') is null or length(btrim(p_body))>4000 then raise exception 'Invalid inquiry' using errcode='22023'; end if;
 insert into molip_support.threads(user_id,title) values(auth.uid(),btrim(p_title)) returning id into thread_id;
 insert into molip_support.messages(thread_id,sender_id,sender_kind,body) values(thread_id,auth.uid(),'member',btrim(p_body));
 return thread_id;
end; $$;

create or replace function molip_script.support_reply(p_thread_id uuid,p_body text,p_admin boolean default false)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_admin is null or (p_admin and not molip_profiles.has_access('molip-script')) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if nullif(btrim(p_body),'') is null or length(btrim(p_body))>4000 then raise exception 'Invalid message' using errcode='22023'; end if;
 perform 1 from molip_support.threads where id=p_thread_id and service_key='molip-script' and (user_id=auth.uid() or p_admin) for update;
 if not found then raise exception 'Inquiry unavailable' using errcode='42501'; end if;
 insert into molip_support.messages(thread_id,sender_id,sender_kind,body) values(p_thread_id,auth.uid(),case when p_admin then 'admin' else 'member' end,btrim(p_body));
 update molip_support.threads set status=case when p_admin then 'answered' else 'waiting' end,updated_at=now() where id=p_thread_id;
end; $$;
revoke all on function molip_script.support_list(boolean,integer) from public,anon,authenticated,service_role;
revoke all on function molip_script.support_detail(uuid,boolean,integer) from public,anon,authenticated,service_role;
revoke all on function molip_script.support_create(text,text) from public,anon,authenticated,service_role;
revoke all on function molip_script.support_reply(uuid,text,boolean) from public,anon,authenticated,service_role;
grant execute on function molip_script.support_list(boolean,integer) to authenticated;
grant execute on function molip_script.support_detail(uuid,boolean,integer) to authenticated;
grant execute on function molip_script.support_create(text,text) to authenticated;
grant execute on function molip_script.support_reply(uuid,text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
