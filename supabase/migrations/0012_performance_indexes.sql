-- =============================================================================
-- GP+ Loyalty System  |  Performance indexes for org-scoped queries
-- =============================================================================
-- Every list and report now filters by organization first, then sorts or scans
-- a date range. These composite indexes match those exact access patterns so
-- they stay fast as each business grows. All additive and safe to re-run.
-- =============================================================================

-- Customer list: filtered by organization (via RLS), then ordered. Cover the
-- default order (newest first) and the two sortable columns.
create index if not exists idx_customers_org_created
  on public.customers (organization_id, created_at desc);

create index if not exists idx_customers_org_balance
  on public.customers (organization_id, points_balance desc);

create index if not exists idx_customers_org_name
  on public.customers (organization_id, full_name);

-- Transactions: the monthly reports and the super admin "last active" stat filter
-- by organization and a created_at range.
create index if not exists idx_transactions_org_created
  on public.transactions (organization_id, created_at);

-- The plain single-column organization indexes are now redundant: a composite
-- index that begins with organization_id already serves an organization-only
-- filter, so dropping these removes needless write overhead.
drop index if exists public.idx_customers_org;
drop index if exists public.idx_transactions_org;
