-- Read-only post-cutover verification. Does not change data or privileges.
select jsonb_build_object(
 'canonical_profiles',(select count(*) from molip_profiles.profiles),
 'auth_accounts',(select count(*) from auth.users),
 'missing_profiles',(select count(*) from auth.users u left join molip_profiles.profiles p on p.id=u.id where p.id is null),
 'old_public_profile',to_regclass('public.profiles')::text,
 'old_script_profile',to_regclass('molip_script.profiles')::text,
 'old_legacy_profile',to_regclass('public.molip_script_profiles')::text,
 'old_admin_schema',to_regnamespace('molip_admin')::text,
 'voca_profile_fks',(select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'validated',c.convalidated))
   from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
   where c.contype='f' and n.nspname='molip_voca' and c.confrelid='molip_profiles.profiles'::regclass),
 'direct_access',(select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,
   'anon_read',has_table_privilege('anon',c.oid,'SELECT'),
   'member_read',has_table_privilege('authenticated',c.oid,'SELECT'),
   'member_write',has_table_privilege('authenticated',c.oid,'INSERT')))
   from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='molip_profiles' and c.relkind='r')
) as verification;
