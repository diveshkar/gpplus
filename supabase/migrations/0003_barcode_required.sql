-- =============================================================================
-- GP+ Loyalty System  |  Phase 2: make the loyalty card mandatory
-- =============================================================================
-- Every customer must be linked to a card, enforced at the database level so it
-- can never be bypassed by any route, not just the form.
--
-- IMPORTANT: a NOT NULL rule cannot be added while any customer still has an
-- empty barcode. Phase 2 is still on test data and no transactions exist yet,
-- so this file first removes any barcode-less test customers, then applies the
-- rule. Review before running on PROD if real customers could ever lack a card.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to run more than once.
-- =============================================================================

-- Remove leftover test customers that were saved without a card.
delete from public.customers
where barcode_id is null;

-- From now on, a customer row must always carry a card barcode.
alter table public.customers
  alter column barcode_id set not null;
