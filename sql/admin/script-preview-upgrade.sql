-- Read-only administrator inspection and independent copies; no new table grants.
begin;
create or replace function molip_script.admin_script_preview(p_script_id text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not molip_profiles.has_access('molip-script') then raise exception 'Administrator access required' using errcode='42501'; end if;
 select jsonb_build_object('id',id,'owner_id',owner_id,'title',title,'raw_text',raw_text,'excluded_words',excluded_words,'created_at',created_at,'updated_at',updated_at,'last_opened_at',last_opened_at)
 into result from molip_script.scripts where id=p_script_id;
 return result;
end; $$;
create or replace function molip_script.copy_script(p_script_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare original molip_script.scripts%rowtype; copied molip_script.scripts%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into original from molip_script.scripts where id=p_script_id and (owner_id=auth.uid() or molip_profiles.has_access('molip-script'));
 if not found then raise exception 'Script unavailable' using errcode='42501'; end if;
 insert into molip_script.scripts(id,owner_id,title,raw_text,excluded_words)
 values(gen_random_uuid()::text,auth.uid(),original.title||' (복사)',original.raw_text,original.excluded_words) returning * into copied;
 return jsonb_build_object('id',copied.id,'title',copied.title,'raw_text',copied.raw_text,'excluded_words',copied.excluded_words,'created_at',copied.created_at,'updated_at',copied.updated_at,'last_opened_at',copied.last_opened_at);
end; $$;
revoke all on function molip_script.admin_script_preview(text) from public,anon,authenticated,service_role;
revoke all on function molip_script.copy_script(text) from public,anon,authenticated,service_role;
grant execute on function molip_script.admin_script_preview(text) to authenticated;
grant execute on function molip_script.copy_script(text) to authenticated;
notify pgrst,'reload schema';
commit;
