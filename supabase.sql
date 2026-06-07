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
  quiz_type text not null check (quiz_type in ('dictation')),
  mode text not null default 'standard',
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, script_id, quiz_type)
);

create index if not exists molip_script_profiles_login_id_idx
  on molip_script.profiles (login_id);
create index if not exists molip_script_scripts_owner_updated_idx
  on molip_script.scripts (owner_id, updated_at desc);
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

alter table molip_script.profiles enable row level security;
alter table molip_script.scripts enable row level security;
alter table molip_script.dictation_sessions enable row level security;
alter table molip_script.flashcard_sessions enable row level security;
alter table molip_script.sentence_stats enable row level security;
alter table molip_script.word_stats enable row level security;
alter table molip_script.active_quizzes enable row level security;

drop policy if exists molip_script_profiles_owner_all on molip_script.profiles;
drop policy if exists molip_script_profiles_owner_select on molip_script.profiles;
drop policy if exists molip_script_scripts_owner_all on molip_script.scripts;
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
grant all on table molip_script.profiles to authenticated;
grant all on table molip_script.scripts to authenticated;
grant all on table molip_script.dictation_sessions to authenticated;
grant all on table molip_script.flashcard_sessions to authenticated;
grant all on table molip_script.sentence_stats to authenticated;
grant all on table molip_script.word_stats to authenticated;
grant all on table molip_script.active_quizzes to authenticated;

notify pgrst, 'reload schema';
