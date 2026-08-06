-- =============================================================================
-- GP+ Loyalty System  |  Auto-enable RLS on new public tables (safety net)
-- =============================================================================
-- A backstop so no table can ever be created in the public schema without Row
-- Level Security turned on. An event trigger runs after every CREATE TABLE and
-- enables RLS on the new table. The migrations already enable RLS on each table
-- explicitly; this just guarantees it for anything added later.
--
-- Run once in the Supabase SQL editor (needs the postgres role, which the editor
-- uses). Safe to re-run.
-- =============================================================================

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name = 'public' then
      begin
        execute format(
          'alter table if exists %s enable row level security',
          cmd.object_identity
        );
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end;
$function$;

-- Event triggers keep firing regardless of this, so it is safe to remove the
-- default public execute grant (also clears the linter warning).
revoke execute on function public.rls_auto_enable() from public;

drop event trigger if exists ensure_rls;
create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();
