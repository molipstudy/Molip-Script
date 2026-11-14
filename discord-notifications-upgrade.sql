-- Additive migration: run in Supabase SQL Editor as postgres.
-- Enable pg_net and Vault in Dashboard first. Store the Discord URL in Vault under:
--   molip_script_signup_discord_webhook_url
-- Never put the webhook URL in this file or browser-facing VITE_* variables.
begin;

create extension if not exists pg_net with schema extensions;
create schema if not exists molip_notifications;
revoke all on schema molip_notifications from public, anon, authenticated;

-- A private enqueue ledger prevents duplicate signup notifications after profile reinsertion.
create table if not exists molip_notifications.events (
  event_key text primary key,
  request_id bigint,
  queued_at timestamptz not null default now()
);
alter table molip_notifications.events enable row level security;
revoke all on table molip_notifications.events from public, anon, authenticated;

create or replace function molip_notifications.send_event(
  p_kind text, p_id text, p_title text, p_description text
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook text;
  claimed text;
  request bigint;
begin
  if p_kind not in ('signup', 'inquiry', 'test') or p_id is null or length(p_id) > 200 then
    raise exception 'Invalid notification event';
  end if;
  select decrypted_secret into webhook from vault.decrypted_secrets
  where name = case p_kind
    when 'inquiry' then 'molip_script_inquiry_discord_webhook_url'
    else 'molip_script_signup_discord_webhook_url' end limit 1;
  if webhook is null or webhook !~ '^https://discord[.]com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+$' then
    raise exception 'Discord notification secret is not configured';
  end if;

  insert into molip_notifications.events(event_key)
  values (p_kind || ':' || p_id)
  on conflict do nothing returning event_key into claimed;
  if claimed is null then return null; end if;

  select net.http_post(
    url := webhook || '?wait=true',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'allowed_mentions', jsonb_build_object('parse', '[]'::jsonb),
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', left(p_title, 200), 'description', left(p_description, 1500),
        'color', 7363054, 'footer', jsonb_build_object('text', 'Molip Script'),
        'timestamp', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ))
    ),
    timeout_milliseconds := 5000
  ) into request;
  update molip_notifications.events set request_id = request where event_key = claimed;
  return request;
end;
$$;
alter function molip_notifications.send_event(text, text, text, text) owner to postgres;
revoke all on function molip_notifications.send_event(text, text, text, text) from public, anon, authenticated;

-- Existing profiles are recorded silently. No historical signup spam on install or reapply.
insert into molip_notifications.events(event_key)
select 'signup:' || id::text from molip_script.profiles
on conflict do nothing;

create or replace function molip_notifications.on_profile_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb;
  member_login text;
  member_email text;
  signup_source text;
begin
  select raw_user_meta_data into metadata from auth.users where id = new.id;
  member_login := coalesce(nullif(btrim(new.login_id), ''), '미등록');
  member_email := coalesce(nullif(btrim(new.email), ''), '미등록');

  signup_source := case metadata ->> 'signup_source'
    when '지인 홍보' then '지인 홍보'
    when '커뮤니티' then '커뮤니티'
    when 'Instagram' then 'Instagram'
    else '미선택' end;

  -- Keep each value on one line and prevent user-supplied Markdown formatting.
  member_login := regexp_replace(replace(left(member_login, 200), '`', ''), '[[:cntrl:]]', ' ', 'g');
  member_email := regexp_replace(replace(left(member_email, 320), '`', ''), '[[:cntrl:]]', ' ', 'g');
  perform molip_notifications.send_event(
    'signup', new.id::text, '새 회원이 가입했어요',
    format(E'아이디: `%s`\n이메일: `%s`\n가입 경로: `%s`', member_login, member_email, signup_source)
  );
  return new;
exception when others then
  -- Alerts must never block signup. Do not include SQLERRM or secrets in logs.
  raise warning 'Molip signup notification could not be queued';
  return new;
end;
$$;
alter function molip_notifications.on_profile_created() owner to postgres;
revoke all on function molip_notifications.on_profile_created() from public, anon, authenticated;

drop trigger if exists molip_discord_profile_created on molip_script.profiles;
create trigger molip_discord_profile_created
after insert on molip_script.profiles
for each row execute function molip_notifications.on_profile_created();

commit;
