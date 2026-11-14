-- Optional cleanup: only the unused deployment relay added for the abandoned Edge Function.
-- No signup functions, tables, event history or secrets are removed.
begin;
drop function if exists molip_script.queue_vercel_deployment(jsonb);
notify pgrst,'reload schema';
commit;
