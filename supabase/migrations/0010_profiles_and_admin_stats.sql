-- =============================================================================
-- GP+ Loyalty System  |  Phase 9: platform stats
-- =============================================================================
-- Gives the super admin a per-organization overview (customer count, points
-- liability, last active) for the management table.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Per-organization stats for the super admin management table.
-- SECURITY INVOKER (the default): Row Level Security still applies, so a super
-- admin sees every organization while anyone else would only ever see their own.
-- Scalar subqueries keep the customer and transaction totals independent (a
-- plain join would multiply them together).
-- -----------------------------------------------------------------------------
create or replace function public.admin_organization_stats()
returns table (
  organization_id uuid,
  customer_count bigint,
  points_liability numeric,
  last_active timestamptz
)
language sql
stable
as $$
  select
    o.id,
    (select count(*) from public.customers c where c.organization_id = o.id),
    (select coalesce(sum(c.points_balance), 0)
       from public.customers c where c.organization_id = o.id),
    (select max(t.created_at)
       from public.transactions t where t.organization_id = o.id)
  from public.organizations o;
$$;

grant execute on function public.admin_organization_stats() to authenticated;
