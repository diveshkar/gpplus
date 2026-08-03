-- =============================================================================
-- GP+ Loyalty System  |  Phase 2 fix: table privileges for the admin role
-- =============================================================================
-- Row Level Security decides which ROWS a request may touch, but Postgres also
-- requires table-level PRIVILEGES before RLS is even consulted. If those
-- privileges are missing, an authenticated request is refused with error 42501
-- (permission denied), which is what the admin panel hit.
--
-- This grants the signed-in admin (the `authenticated` role) full access to the
-- four tables. The RLS policies from 0001 still apply, so nothing is opened up
-- beyond what those policies already allow. The anonymous role is granted
-- nothing, keeping this an admin-only system.
--
-- Run this once in the Supabase SQL Editor for the STAGE project (and later for
-- PROD at go-live). It is safe to run more than once.
-- =============================================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.paint_types,
  public.customers,
  public.transactions,
  public.configuration
to authenticated;
