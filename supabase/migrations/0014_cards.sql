-- =============================================================================
-- GP+ Loyalty System  |  Phase 10: card pool
-- =============================================================================
-- A managed pool of loyalty cards per business. A business generates a batch of
-- unused cards, prints them, and hands them out. A card becomes "assigned" the
-- first time it is scanned and linked to a customer. This gives real inventory:
-- how many were printed, assigned, or lost.
--
-- Org-scoped exactly like the other tenant tables (same RLS and the same
-- auto-stamp trigger). Run once in the Supabase SQL editor. Safe to re-run.
-- =============================================================================

create table if not exists public.cards (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code            text not null,
  status          text not null default 'unused'
                    check (status in ('unused', 'assigned', 'lost')),
  customer_id     uuid references public.customers (id) on delete set null,
  batch_id        uuid,
  assigned_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- A code is unique within a business (two businesses may reuse the same code).
create unique index if not exists uq_cards_org_code
  on public.cards (organization_id, code);
create index if not exists idx_cards_org_status
  on public.cards (organization_id, status);
create index if not exists idx_cards_org_batch
  on public.cards (organization_id, batch_id);

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

drop trigger if exists trg_cards_set_org on public.cards;
create trigger trg_cards_set_org
  before insert on public.cards
  for each row execute function public.set_org_id();

alter table public.cards enable row level security;

drop policy if exists "org access" on public.cards;
create policy "org access" on public.cards
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

grant select, insert, update, delete on public.cards to authenticated;

-- -----------------------------------------------------------------------------
-- Inventory counts for the Cards page. SECURITY INVOKER, so RLS scopes them to
-- the calling business automatically.
-- -----------------------------------------------------------------------------
create or replace function public.card_stats()
returns table (total bigint, unused bigint, assigned bigint, lost bigint)
language sql
stable
set search_path = public
as $$
  select
    count(*),
    count(*) filter (where status = 'unused'),
    count(*) filter (where status = 'assigned'),
    count(*) filter (where status = 'lost')
  from public.cards;
$$;

grant execute on function public.card_stats() to authenticated;

-- -----------------------------------------------------------------------------
-- One row per print run, newest first, with how many of that batch are in use.
-- -----------------------------------------------------------------------------
create or replace function public.card_batches()
returns table (batch_id uuid, total bigint, assigned bigint, created_at timestamptz)
language sql
stable
set search_path = public
as $$
  select
    batch_id,
    count(*),
    count(*) filter (where status = 'assigned'),
    min(created_at)
  from public.cards
  where batch_id is not null
  group by batch_id
  order by min(created_at) desc;
$$;

grant execute on function public.card_batches() to authenticated;
