-- Molip Script: one user's application data, read-only.
-- Run the ENTIRE file in Supabase SQL Editor as postgres.
-- Change only the login_id below. No schema/data changes and no auth secrets.
-- Existing RLS is not modified. In a client session, RLS may hide other users' rows.
-- Catalog discovery handles installed community extensions without guessing copy-table names.

begin transaction isolation level repeatable read read only;

with
params as (
  select lower(trim('jh1i2_'))::text as login_id -- <<< 조회할 아이디
),
target_user as materialized (
  select p.*
  from molip_script.profiles p
  join params on p.login_id = params.login_id
),
-- Discover actual user-reference columns in application tables only.
-- auth.users itself, Vault and notification internals are never exported.
user_columns as materialized (
  select n.nspname as schema_name, t.relname as table_name, a.attname as column_name
  from pg_catalog.pg_class t
  join pg_catalog.pg_namespace n on n.oid = t.relnamespace
  join pg_catalog.pg_attribute a on a.attrelid = t.oid
  where n.nspname = 'molip_script'
    and t.relkind in ('r', 'p')
    and t.relname <> 'profiles'
    and (
      t.relname in (
        'scripts', 'active_quizzes', 'dictation_sessions', 'flashcard_sessions',
        'sentence_stats', 'word_stats', 'community_scripts', 'community_likes',
        'publisher_follows', 'community_comments'
      )
      or exists (
        select 1 from pg_catalog.pg_constraint script_fk
        where script_fk.contype = 'f' and script_fk.conrelid = t.oid
          and script_fk.confrelid in (
            'molip_script.scripts'::regclass, 'molip_script.community_scripts'::regclass
          )
      )
    )
    and not t.relispartition
    and a.attnum > 0 and not a.attisdropped
    and a.atttypid in ('uuid'::regtype, 'text'::regtype, 'varchar'::regtype)
    and (
      a.attname in ('owner_id', 'user_id', 'publisher_id', 'follower_id', 'collector_id')
      or exists (
        select 1 from pg_catalog.pg_constraint fk
        where fk.contype = 'f' and fk.conrelid = t.oid
          and a.attnum = any(fk.conkey)
          and fk.confrelid in ('auth.users'::regclass, 'molip_script.profiles'::regclass)
      )
    )
),
queries as (
  select c.schema_name, c.table_name,
    format(
      'select coalesce(jsonb_agg(to_jsonb(r) order by coalesce(to_jsonb(r)->>''updated_at'', to_jsonb(r)->>''created_at'', to_jsonb(r)->>''shared_at'') desc nulls last), ''[]''::jsonb)::text as rows_json from %I.%I r where %s',
      c.schema_name, c.table_name,
      string_agg(format('r.%I = %L', c.column_name, u.id::text), ' or ' order by c.column_name)
    ) as sql_text
  from user_columns c cross join target_user u
  group by c.schema_name, c.table_name, u.id
),
-- All dynamically generated statements are SELECTs, executed in the read-only transaction.
-- XML is only a bridge for SELECT results; the exported records are JSON arrays.
table_data as materialized (
  select q.schema_name, q.table_name, x.rows_json::jsonb as records
  from queries q
  cross join lateral xmltable(
    '/table/row'
    passing pg_catalog.query_to_xml(q.sql_text, false, false, '')
    columns rows_json text path 'rows_json'
  ) x
),
-- Resolve counterpart IDs in follow/collection records, exposing only their login IDs.
related_user_ids as (
  select distinct r.record ->> c.column_name as user_id
  from table_data d
  join user_columns c on c.schema_name = d.schema_name and c.table_name = d.table_name
  cross join lateral jsonb_array_elements(d.records) r(record)
),
-- Discover foreign keys to community posts to include liked/collected/commented post titles.
community_reference_columns as (
  select t.relname as table_name, a.attname as column_name
  from pg_catalog.pg_constraint fk
  join pg_catalog.pg_class t on t.oid = fk.conrelid
  join pg_catalog.pg_namespace n on n.oid = t.relnamespace
  join pg_catalog.pg_attribute a on a.attrelid = t.oid and a.attnum = any(fk.conkey)
  where fk.contype = 'f' and n.nspname = 'molip_script'
    and fk.confrelid = 'molip_script.community_scripts'::regclass
),
referenced_post_ids as (
  select distinct r.record ->> c.column_name as post_id
  from table_data d
  join community_reference_columns c on c.table_name = d.table_name
  cross join lateral jsonb_array_elements(d.records) r(record)
),
report as (
  select 0 as section_order,
    case when exists(select 1 from target_user) then '회원 정보' else '해당 아이디를 찾을 수 없습니다' end as section,
    'profiles'::text as table_name,
    (select count(*) from target_user) as row_count,
    coalesce((select jsonb_agg(to_jsonb(u)) from target_user u), '[]'::jsonb) as records
  union all
  select 1,
    case
      when d.table_name = 'scripts' then '현재 내 스크립트 · 복사해 온 스크립트 포함'
      when d.table_name = 'active_quizzes' then '현재 퀴즈 세션 · 저장된 진행 상태'
      when d.table_name = 'dictation_sessions' then '받아쓰기 완료 기록'
      when d.table_name = 'flashcard_sessions' then '플래시카드·마스킹 완료 기록 · quiz_type으로 구분'
      when d.table_name = 'sentence_stats' then '문장별 학습·오답·별표 기록'
      when d.table_name = 'word_stats' then '취약 단어 기록'
      when d.table_name = 'community_scripts' then '직접 공유한 공개 스크립트'
      when d.table_name = 'community_likes' then '좋아요한 공개 스크립트'
      when d.table_name = 'publisher_follows' then '팔로잉·팔로워 · user_id가 본인이면 팔로잉'
      when d.table_name = 'community_comments' then '작성한 댓글'
      when d.table_name ~* '(collect|cop(y|ies)|import)' then '커뮤니티 담기·복사 관련 기록'
      else '그 밖의 회원 관련 기록'
    end,
    d.table_name, jsonb_array_length(d.records), d.records
  from table_data d
  union all
  select 2, '연관 회원 아이디 · 팔로우 상대 확인용', 'related_profiles', count(*),
    coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'login_id', p.login_id) order by p.login_id), '[]'::jsonb)
  from molip_script.profiles p
  where p.id::text in (select user_id from related_user_ids)
  union all
  select 3, '좋아요·담기·댓글에서 참조한 공개 스크립트', 'referenced_community_scripts', count(*),
    coalesce(jsonb_agg(to_jsonb(s) order by s.shared_at desc), '[]'::jsonb)
  from molip_script.community_scripts s
  where s.id in (select post_id from referenced_post_ids)
)
select section, table_name, row_count, records
from report
order by section_order, table_name;

commit;

-- Interpretation:
-- * scripts is the current library. Deleted scripts cannot be reconstructed here.
-- * Copy origin/local-copy linkage is reported only if actually stored by the installed schema.
--   Titles or matching raw_text are NOT treated as proof of a copy relationship.
-- * active_quizzes.state is the actual saved JSON; progress is not a fabricated completion rate.
-- * flashcard_sessions.quiz_type = masking means masking; absent/null means legacy flashcards.
-- * publisher_follows.user_id = target -> following; publisher_id = target -> followers.
-- * Every section is independent; joins cannot multiply counts/history records.
-- * Large raw_text/state/history arrays may be truncated in the editor preview; export results.
