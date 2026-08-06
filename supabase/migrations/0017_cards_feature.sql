-- =============================================================================
-- GP+ Loyalty System  |  Card feature toggle (per organization)
-- =============================================================================
-- The printable loyalty-card feature is now optional per business. The super
-- admin decides who gets it, from the org create/edit screens. It is OFF by
-- default: a new (or existing) business does not see the Cards area until the
-- super admin turns it on.
--
-- `default false` means every existing organization starts with the feature
-- disabled after this migration runs; re-enable the ones that need it from the
-- super admin area.
--
-- Run once in the Supabase SQL editor, after the earlier migrations. Safe to
-- re-run. No new grants needed: this is a column on organizations, which the
-- existing table grants and RLS policies already cover.
-- =============================================================================

alter table public.organizations
  add column if not exists cards_enabled boolean not null default false;
