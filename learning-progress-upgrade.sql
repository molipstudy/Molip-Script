-- Run once in Supabase SQL Editor for the learning progress, flashcard resume,
-- and starred sentence upgrade.

alter table molip_script.sentence_stats
  add column if not exists starred boolean not null default false;

alter table molip_script.active_quizzes
  add column if not exists progress integer not null default 0;

-- Preserve the real progress of dictation rows created before this upgrade.
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
  add constraint active_quizzes_quiz_type_check
  check (quiz_type in ('dictation', 'flashcard'));

alter table molip_script.active_quizzes
  drop constraint if exists active_quizzes_progress_check;
alter table molip_script.active_quizzes
  add constraint active_quizzes_progress_check check (progress >= 0);

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

grant execute on function molip_script.save_active_learning(
  text, text, text, text, jsonb, integer, boolean
) to authenticated;
grant execute on function molip_script.toggle_sentence_star(
  text, text, text, text, text
) to authenticated;

notify pgrst, 'reload schema';
