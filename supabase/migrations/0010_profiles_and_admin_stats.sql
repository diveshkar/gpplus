-- =============================================================================
-- GP+ Loyalty System  |  Phase 8 and 9: admin profiles and platform stats
-- =============================================================================
-- Phase 8 gives each business admin a personal profile they can edit (name,
-- phone, photo) and a safe way to update just their own row. Phase 9 gives the
-- super admin a per-organization overview (customer count, points liability,
-- last active) for the management table.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Personal profile fields on the admin's profile row. Email lives in Supabase
-- Auth, so it is not duplicated here.
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists full_name  text,
  add column if not exists phone      text,
  add column if not exists avatar_url text;

-- -----------------------------------------------------------------------------
-- Let an admin update only their own personal fields, and nothing else.
-- SECURITY DEFINER so it can write the row, but the body hard-codes both the
-- target (auth.uid()) and the columns, so role and organization can never be
-- changed through it. This is why we do not open a broad update policy on
-- profiles.
-- -----------------------------------------------------------------------------
create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set full_name = p_full_name,
      phone = p_phone,
      avatar_url = p_avatar_url
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile(text, text, text) to authenticated;

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
