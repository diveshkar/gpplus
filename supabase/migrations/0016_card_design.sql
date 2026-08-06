-- =============================================================================
-- GP+ Loyalty System  |  Card design customization
-- =============================================================================
-- Lets each business customise the printed card: a title, a tagline, and an
-- optional back with its own text. Branding (logo, colour, name) already lives
-- on organizations and is reused for the card.
--
-- Run once in the Supabase SQL editor, after the earlier migrations. Safe to
-- re-run.
-- =============================================================================

alter table public.organizations
  add column if not exists card_title        text,
  add column if not exists card_tagline      text,
  add column if not exists card_back_enabled boolean not null default true,
  add column if not exists card_back_text    text;
