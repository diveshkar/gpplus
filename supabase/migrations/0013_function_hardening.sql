-- =============================================================================
-- GP+ Loyalty System  |  Function hardening (Supabase linter)
-- =============================================================================
-- Clears the database linter's function warnings:
--  * Pins search_path on the functions that were missing it.
--  * Removes the default "anyone can call this" grant on the internal helper
--    functions, keeping access only where it is actually needed.
--
-- Run this AFTER migrations 0001-0012, so the functions it tunes already exist.
-- Each change is guarded, so if a function is somehow missing this migration
-- skips it instead of failing. Changes no data. Safe to run more than once.
-- =============================================================================

do $$
declare
  sig text;
  -- Functions that should have a pinned search_path.
  sigs text[] := array[
    'public.set_updated_at()',
    'public.create_earn_transaction(uuid, uuid, numeric, text)',
    'public.edit_earn_transaction(uuid, uuid, numeric, text)',
    'public.void_transaction(uuid)',
    'public.create_redeem_transaction(uuid, numeric, text)',
    'public.dashboard_liability()',
    'public.monthly_summary(integer, integer)',
    'public.top_customers(integer, integer, integer)',
    'public.admin_organization_stats()'
  ];
begin
  foreach sig in array sigs loop
    if to_regprocedure(sig) is not null then
      execute format('alter function %s set search_path = public', sig);
    end if;
  end loop;

  -- Remove the default PUBLIC execute grant on the internal helpers, then grant
  -- back only what is needed. (CREATE FUNCTION grants EXECUTE to PUBLIC by
  -- default, which is what exposed these via the REST API.)

  -- Trigger only: nobody calls it directly, so no role needs EXECUTE.
  if to_regprocedure('public.set_org_id()') is not null then
    execute 'revoke execute on function public.set_org_id() from public';
  end if;

  -- Used by the security rules: signed-in users need it, anonymous does not.
  if to_regprocedure('public.auth_org_id()') is not null then
    execute 'revoke execute on function public.auth_org_id() from public';
    execute 'grant execute on function public.auth_org_id() to authenticated';
  end if;

  if to_regprocedure('public.is_super_admin()') is not null then
    execute 'revoke execute on function public.is_super_admin() from public';
    execute 'grant execute on function public.is_super_admin() to authenticated';
  end if;
end
$$;
