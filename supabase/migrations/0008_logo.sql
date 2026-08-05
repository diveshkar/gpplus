-- =============================================================================
-- GP+ Loyalty System  |  Custom logo
-- =============================================================================
-- Stores the admin-uploaded logo as a small data URL, shown across the signed-in
-- app and the loading screen. It lives in our own configuration table and is set
-- from the Settings screen. The image is resized small in the browser before it
-- is saved, so the row stays lightweight. The existing table grants cover this
-- new column.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run.
-- =============================================================================

alter table public.configuration
  add column if not exists logo_url text;
