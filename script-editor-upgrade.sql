-- Run once in Supabase SQL Editor for existing installations.
begin;
alter table molip_script.scripts add column if not exists excluded_words text[] not null default '{}';
alter table molip_script.community_scripts add column if not exists excluded_words text[] not null default '{}';
notify pgrst, 'reload schema';
commit;
