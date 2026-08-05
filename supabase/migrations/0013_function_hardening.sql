-- =============================================================================
-- GP+ Loyalty System  |  Function hardening (Supabase linter)
-- =============================================================================
-- Clears the database linter's function warnings:
--  * Pins search_path on the functions that were missing it.
--  * Removes the default "anyone can call this" grant on the internal helper
--    functions, keeping access only where it is actually needed.
--
-- Changes no data. Safe to run more than once, and should be run after the
-- other migrations (a re-run of an earlier one would restore the default grant).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Pin search_path (function_search_path_mutable). ALTER sets it without having
-- to redefine the function bodies.
-- -----------------------------------------------------------------------------
alter function public.set_updated_at() set search_path = public;
alter function public.create_earn_transaction(uuid, uuid, numeric, text) set search_path = public;
alter function public.edit_earn_transaction(uuid, uuid, numeric, text) set search_path = public;
alter function public.void_transaction(uuid) set search_path = public;
alter function public.create_redeem_transaction(uuid, numeric, text) set search_path = public;
alter function public.dashboard_liability() set search_path = public;
alter function public.monthly_summary(integer, integer) set search_path = public;
alter function public.top_customers(integer, integer, integer) set search_path = public;
alter function public.admin_organization_stats() set search_path = public;

-- -----------------------------------------------------------------------------
-- Remove the default PUBLIC execute grant on the internal helpers, then grant
-- back only what is needed. (CREATE FUNCTION grants EXECUTE to PUBLIC by default,
-- which is what exposed these via the REST API.)
-- -----------------------------------------------------------------------------

-- Trigger only: nobody calls it directly, so no role needs EXECUTE.
revoke execute on function public.set_org_id() from public;

-- Used by the security rules: signed-in users need it, anonymous does not.
revoke execute on function public.auth_org_id() from public;
grant execute on function public.auth_org_id() to authenticated;

revoke execute on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- Called by the signed-in admin to edit their own profile: keep that, drop anon.
revoke execute on function public.update_my_profile(text, text, text) from public;
grant execute on function public.update_my_profile(text, text, text) to authenticated;
