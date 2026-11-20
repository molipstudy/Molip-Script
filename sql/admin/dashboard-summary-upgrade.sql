-- Recent operational widgets and signup/script graphs. Run after support-upgrade.sql.
begin;
create or replace function molip_script.admin_dashboard_summary(p_days integer default 7)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; since_time timestamptz;
begin
 if not molip_profiles.has_access('molip-script') then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_days is null or p_days not in (1,7,30) then raise exception 'Invalid period' using errcode='22023'; end if;
 since_time:=now()-make_interval(days=>p_days);
 with accounts as (
  select u.id,u.created_at,p.username from auth.users u left join molip_profiles.profiles p on p.id=u.id
  where molip_profiles.has_access('global') or exists(select 1 from molip_profiles.service_registrations r where r.user_id=u.id and r.service_key='molip-script')
 ), dates as (
  select generate_series(date_trunc('day',since_time at time zone 'UTC'),date_trunc('day',now() at time zone 'UTC'),interval '1 day') as day
 ) select jsonb_build_object(
  'total_members',(select count(*) from accounts),
  'new_members',(select count(*) from accounts where created_at>=since_time),
  'new_members_24h',(select count(*) from accounts where created_at>=now()-interval '24 hours'),
  'previous_new_members',(select count(*) from accounts where created_at>=since_time-make_interval(days=>p_days) and created_at<since_time),
  'total_scripts',(select count(*) from molip_script.scripts),
  'new_scripts',(select count(*) from molip_script.scripts where created_at>=since_time),
  'new_scripts_24h',(select count(*) from molip_script.scripts where created_at>=now()-interval '24 hours'),
  'total_shared',(select count(*) from molip_script.community_scripts),
  'active_learnings',(select count(*) from molip_script.active_quizzes),
  'waiting_inquiries',(select count(*) from molip_support.threads where service_key='molip-script' and status='waiting'),
  'new_inquiries',(select count(*) from molip_support.threads where service_key='molip-script' and created_at>=since_time),
  'new_inquiries_24h',(select count(*) from molip_support.threads where service_key='molip-script' and created_at>=now()-interval '24 hours'),
  'recent_members',(select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at desc,m.id),'[]'::jsonb) from (select id,username,created_at from accounts order by created_at desc,id limit 5) m),
  'recent_scripts',(select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc,s.id),'[]'::jsonb) from (select s.id,s.title,s.created_at,p.username from molip_script.scripts s left join molip_profiles.profiles p on p.id=s.owner_id order by s.created_at desc,s.id limit 5) s),
  'recent_inquiries',(select coalesce(jsonb_agg(to_jsonb(t) order by t.updated_at desc,t.id),'[]'::jsonb) from (select t.id,t.title,t.status,t.updated_at,p.username from molip_support.threads t left join molip_profiles.profiles p on p.id=t.user_id where t.service_key='molip-script' order by t.updated_at desc,t.id limit 5) t),
  'daily',(select jsonb_agg(jsonb_build_object('timestamp',to_char(d.day,'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'signups',(select count(*) from accounts a where a.created_at>=since_time and (a.created_at at time zone 'UTC')>=d.day and (a.created_at at time zone 'UTC')<d.day+interval '1 day'),
    'scripts',(select count(*) from molip_script.scripts s where s.created_at>=since_time and (s.created_at at time zone 'UTC')>=d.day and (s.created_at at time zone 'UTC')<d.day+interval '1 day')) order by d.day) from dates d),
  'signup_sources',(select coalesce(jsonb_agg(to_jsonb(r) order by r.count desc,r.label),'[]'::jsonb) from (select coalesce(signup_source,'미선택') as label,count(*) as count from molip_profiles.service_registrations where service_key='molip-script' and joined_at>=since_time group by signup_source) r),
  'since',since_time,'until',now(),'days',p_days
 ) into result;
 return result;
end; $$;
revoke all on function molip_script.admin_dashboard_summary(integer) from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_dashboard_summary(integer) to authenticated;
notify pgrst,'reload schema';
commit;
