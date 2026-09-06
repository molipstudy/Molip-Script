-- Molip Script schema
--
-- Target app schemas:
-- - auth.users: Supabase Auth user table. The app writes login_id to user metadata at signup.
-- - molip_script: app data, RLS policies, and login helper RPCs.
--
-- Supabase Dashboard requirement:
-- Project Settings > Data API > Exposed schemas must contain molip_script.
-- Remove old app schemas from Exposed schemas: molip_english_blank, molip-script.

create schema if not exists molip_script;

-- Remove old app-owned schemas. Do not drop the public schema.
drop schema if exists molip_english_blank cascade;
drop schema if exists "molip-script" cascade;

create table if not exists molip_script.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text not null unique,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_id_format check (login_id ~ '^[a-z0-9][a-z0-9._-]{2,31}$')
);

create table if not exists molip_script.scripts (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  raw_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now()
);

-- Community entries are snapshots. Copying one creates a completely independent
-- script, and removing this row only cancels community sharing.
create table if not exists molip_script.community_scripts (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_login_id text not null,
  source_script_id text not null,
  title text not null,
  raw_text text not null,
  shared_at timestamptz not null default now(),
  unique (owner_id, source_script_id)
);

create table if not exists molip_script.dictation_sessions (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  script_id text not null references molip_script.scripts(id) on delete cascade,
  mode text not null default 'standard',
  created_at timestamptz not null default now(),
  total_questions integer not null,
  correct_questions integer not null,
  wrong_questions integer not null,
  wrong_words text[] not null default '{}'
);

create table if not exists molip_script.flashcard_sessions (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  script_id text not null references molip_script.scripts(id) on delete cascade,
  created_at timestamptz not null default now(),
  total_cards integer not null,
  unknown_cards integer not null,
  tracked_words text[] not null default '{}'
);

create table if not exists molip_script.sentence_stats (
  owner_id uuid not null references auth.users(id) on delete cascade,
  script_id text not null references molip_script.scripts(id) on delete cascade,
  sentence_key text not null,
  number text not null,
  meaning text not null,
  english text not null,
  flashcard_unknown_count integer not null default 0,
  dictation_attempts integer not null default 0,
  dictation_wrong_count integer not null default 0,
  starred boolean not null default false,
  last_studied_at timestamptz,
  last_dictation_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner_id, script_id, sentence_key)
);

create table if not exists molip_script.word_stats (
  owner_id uuid not null references auth.users(id) on delete cascade,
  script_id text not null references molip_script.scripts(id) on delete cascade,
  word text not null,
  source text not null check (source in ('dictation', 'flashcard')),
  wrong_count integer not null default 0,
  last_wrong_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner_id, script_id, word, source)
);

create table if not exists molip_script.active_quizzes (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  script_id text not null references molip_script.scripts(id) on delete cascade,
  quiz_type text not null check (quiz_type in ('dictation', 'flashcard')),
  mode text not null default 'standard',
  state jsonb not null,
  progress integer not null default 0 check (progress >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, script_id, quiz_type)
);

-- Safe migrations for projects that already have the tables above.
alter table molip_script.sentence_stats
  add column if not exists starred boolean not null default false;
alter table molip_script.active_quizzes
  add column if not exists progress integer not null default 0;
update molip_script.active_quizzes as active
set progress = greatest(
  progress,
  coalesce((state ->> 'currentIndex')::integer + 1, 0),
  coalesce((
    select count(*)::integer
    from pg_catalog.jsonb_object_keys(
      coalesce(active.state -> 'gradesByIndex', '{}'::jsonb)
    )
  ), 0)
)
where quiz_type = 'dictation';
alter table molip_script.active_quizzes
  drop constraint if exists active_quizzes_quiz_type_check;
alter table molip_script.active_quizzes
  add constraint active_quizzes_quiz_type_check check (quiz_type in ('dictation', 'flashcard'));
alter table molip_script.active_quizzes
  drop constraint if exists active_quizzes_progress_check;
alter table molip_script.active_quizzes
  add constraint active_quizzes_progress_check check (progress >= 0);

create index if not exists molip_script_profiles_login_id_idx
  on molip_script.profiles (login_id);
create index if not exists molip_script_scripts_owner_updated_idx
  on molip_script.scripts (owner_id, updated_at desc);
create index if not exists molip_script_community_shared_idx
  on molip_script.community_scripts (shared_at desc);
create index if not exists molip_script_dictation_sessions_owner_created_idx
  on molip_script.dictation_sessions (owner_id, created_at desc);
create index if not exists molip_script_flashcard_sessions_owner_created_idx
  on molip_script.flashcard_sessions (owner_id, created_at desc);
create index if not exists molip_script_sentence_stats_owner_weak_idx
  on molip_script.sentence_stats (owner_id, dictation_wrong_count desc, flashcard_unknown_count desc);
create index if not exists molip_script_word_stats_owner_weak_idx
  on molip_script.word_stats (owner_id, wrong_count desc, updated_at desc);
create index if not exists molip_script_active_quizzes_owner_updated_idx
  on molip_script.active_quizzes (owner_id, updated_at desc);

-- Login uses this public RPC to resolve a login ID to the email that Supabase
-- Auth needs for password verification. It intentionally reads only
-- molip_script.profiles, not auth.users, because auth.users is a managed table.
create or replace function molip_script.email_for_login_id(input_login_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(profiles.email)
  from molip_script.profiles as profiles
  where profiles.login_id = lower(trim(input_login_id))
  limit 1;
$$;

-- Atomically protects a newer learning state from an older browser tab.
-- The client retries with p_force = true only after the learner confirms.
create or replace function molip_script.save_active_learning(
  p_id text,
  p_script_id text,
  p_quiz_type text,
  p_mode text,
  p_state jsonb,
  p_progress integer,
  p_force boolean default false
)
returns table (
  saved boolean,
  requires_confirmation boolean,
  server_progress integer,
  server_updated_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_progress integer;
  existing_updated_at timestamptz;
  saved_updated_at timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_quiz_type not in ('dictation', 'flashcard') then
    raise exception 'invalid learning type';
  end if;
  if p_progress < 0 then
    raise exception 'invalid progress';
  end if;

  -- Also serializes the first insert, when there is no row to lock yet.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(auth.uid()::text || ':' || p_script_id || ':' || p_quiz_type, 0)
  );

  select active.progress, active.updated_at
    into existing_progress, existing_updated_at
  from molip_script.active_quizzes as active
  where active.owner_id = auth.uid()
    and active.script_id = p_script_id
    and active.quiz_type = p_quiz_type
  for update;

  if found and existing_progress > p_progress and not p_force then
    return query select false, true, existing_progress, existing_updated_at;
    return;
  end if;

  insert into molip_script.active_quizzes (
    id, owner_id, script_id, quiz_type, mode, state, progress, updated_at
  ) values (
    p_id, auth.uid(), p_script_id, p_quiz_type, p_mode, p_state, p_progress, saved_updated_at
  )
  on conflict (owner_id, script_id, quiz_type) do update set
    mode = excluded.mode,
    state = excluded.state,
    progress = excluded.progress,
    updated_at = excluded.updated_at;

  return query select true, false, p_progress, saved_updated_at;
end;
$$;

-- Toggles only the star flag so another tab cannot overwrite learning counters.
create or replace function molip_script.toggle_sentence_star(
  p_script_id text,
  p_sentence_key text,
  p_number text,
  p_meaning text,
  p_english text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_starred boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into molip_script.sentence_stats as current_stat (
    owner_id, script_id, sentence_key, number, meaning, english, starred, updated_at
  ) values (
    auth.uid(), p_script_id, p_sentence_key, p_number, p_meaning, p_english, true, now()
  )
  on conflict (owner_id, script_id, sentence_key) do update set
    number = excluded.number,
    meaning = excluded.meaning,
    english = excluded.english,
    starred = not current_stat.starred,
    updated_at = now()
  returning starred into next_starred;

  return next_starred;
end;
$$;

alter table molip_script.profiles enable row level security;
alter table molip_script.scripts enable row level security;
alter table molip_script.community_scripts enable row level security;
alter table molip_script.dictation_sessions enable row level security;
alter table molip_script.flashcard_sessions enable row level security;
alter table molip_script.sentence_stats enable row level security;
alter table molip_script.word_stats enable row level security;
alter table molip_script.active_quizzes enable row level security;

drop policy if exists molip_script_profiles_owner_all on molip_script.profiles;
drop policy if exists molip_script_profiles_owner_select on molip_script.profiles;
drop policy if exists molip_script_scripts_owner_all on molip_script.scripts;
drop policy if exists molip_script_community_read on molip_script.community_scripts;
drop policy if exists molip_script_community_insert on molip_script.community_scripts;
drop policy if exists molip_script_community_delete on molip_script.community_scripts;
drop policy if exists molip_script_dictation_sessions_owner_all on molip_script.dictation_sessions;
drop policy if exists molip_script_flashcard_sessions_owner_all on molip_script.flashcard_sessions;
drop policy if exists molip_script_sentence_stats_owner_all on molip_script.sentence_stats;
drop policy if exists molip_script_word_stats_owner_all on molip_script.word_stats;
drop policy if exists molip_script_active_quizzes_owner_all on molip_script.active_quizzes;

create policy molip_script_profiles_owner_all
  on molip_script.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy molip_script_scripts_owner_all
  on molip_script.scripts for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy molip_script_community_read
  on molip_script.community_scripts for select to authenticated
  using (true);

create policy molip_script_community_insert
  on molip_script.community_scripts for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from molip_script.scripts
      where scripts.id = source_script_id and scripts.owner_id = auth.uid()
    )
    and exists (
      select 1 from molip_script.profiles
      where profiles.id = auth.uid() and profiles.login_id = owner_login_id
    )
  );

create policy molip_script_community_delete
  on molip_script.community_scripts for delete to authenticated
  using (owner_id = auth.uid());

create policy molip_script_dictation_sessions_owner_all
  on molip_script.dictation_sessions for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy molip_script_flashcard_sessions_owner_all
  on molip_script.flashcard_sessions for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy molip_script_sentence_stats_owner_all
  on molip_script.sentence_stats for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy molip_script_word_stats_owner_all
  on molip_script.word_stats for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy molip_script_active_quizzes_owner_all
  on molip_script.active_quizzes for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant usage on schema molip_script to anon, authenticated;
grant execute on function molip_script.email_for_login_id(text) to anon, authenticated;
grant execute on function molip_script.save_active_learning(text, text, text, text, jsonb, integer, boolean) to authenticated;
grant execute on function molip_script.toggle_sentence_star(text, text, text, text, text) to authenticated;
grant all on table molip_script.profiles to authenticated;
grant all on table molip_script.scripts to authenticated;
grant select, insert, delete on table molip_script.community_scripts to authenticated;
grant all on table molip_script.dictation_sessions to authenticated;
grant all on table molip_script.flashcard_sessions to authenticated;
grant all on table molip_script.sentence_stats to authenticated;
grant all on table molip_script.word_stats to authenticated;
grant all on table molip_script.active_quizzes to authenticated;

notify pgrst, 'reload schema';
