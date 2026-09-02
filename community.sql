-- Molip Script: community sharing feature only
-- Run this file in the Supabase SQL Editor after the base schema is installed.

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

create index if not exists molip_script_community_shared_idx
  on molip_script.community_scripts (shared_at desc);

alter table molip_script.community_scripts enable row level security;

drop policy if exists molip_script_community_read
  on molip_script.community_scripts;
drop policy if exists molip_script_community_insert
  on molip_script.community_scripts;
drop policy if exists molip_script_community_delete
  on molip_script.community_scripts;

-- Every signed-in user can browse community scripts.
create policy molip_script_community_read
  on molip_script.community_scripts
  for select
  to authenticated
  using (true);

-- A user can only share one of their own scripts, under their own login ID.
create policy molip_script_community_insert
  on molip_script.community_scripts
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from molip_script.scripts
      where scripts.id = source_script_id
        and scripts.owner_id = auth.uid()
    )
    and exists (
      select 1
      from molip_script.profiles
      where profiles.id = auth.uid()
        and profiles.login_id = owner_login_id
    )
  );

-- Deleting this row only cancels sharing. It does not delete the owner's script.
create policy molip_script_community_delete
  on molip_script.community_scripts
  for delete
  to authenticated
  using (owner_id = auth.uid());

grant select, insert, delete
  on table molip_script.community_scripts
  to authenticated;

notify pgrst, 'reload schema';
