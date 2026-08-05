-- =============================================================================
-- GP+ Loyalty System  |  Admin display name
-- =============================================================================
-- Adds a place to store the admin's display name, shown in the dashboard
-- greeting. This lives in our own configuration table (not Supabase's auth
-- tables, which the SQL Editor cannot modify), and is editable from the
-- Settings screen. The existing table-level grants cover this new column.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run.
-- =============================================================================

alter table public.configuration
  add column if not exists admin_name text;
