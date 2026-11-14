-- Existing installations: run only this file in Supabase SQL Editor as postgres.
-- Requires discord-notifications-upgrade.sql to have been installed already.
-- Replaces only the signup notification function. No data, trigger, ledger,
-- Vault secret or RLS changes. Does not send historical notifications.
begin;

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

commit;
