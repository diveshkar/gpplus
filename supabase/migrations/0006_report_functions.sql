-- =============================================================================
-- GP+ Loyalty System  |  Phase 5: reporting
-- =============================================================================
-- Read-only aggregate functions for the dashboard. All month boundaries are
-- worked out in Sri Lanka time (Asia/Colombo), so a late-night transaction
-- lands in the correct month. Voided rows are excluded from every figure.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Total points liability: every customer's outstanding points added up. The app
-- multiplies this by the current redemption value to show the LKR worth owed.
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_liability()
returns numeric
language sql
stable
as $$
  select coalesce(sum(points_balance), 0) from public.customers;
$$;

-- -----------------------------------------------------------------------------
-- Points issued and redeemed within a given year and month.
-- -----------------------------------------------------------------------------
create or replace function public.monthly_summary(p_year int, p_month int)
returns table (issued numeric, redeemed numeric)
language sql
stable
as $$
  select
    coalesce(sum(points) filter (where entry_type = 'earn'), 0) as issued,
    coalesce(sum(-points) filter (where entry_type = 'redeem'), 0) as redeemed
  from public.transactions
  where voided = false
    and extract(year from (created_at at time zone 'Asia/Colombo')) = p_year
    and extract(month from (created_at at time zone 'Asia/Colombo')) = p_month;
$$;

-- -----------------------------------------------------------------------------
-- Top customers by points earned within a given year and month.
-- -----------------------------------------------------------------------------
create or replace function public.top_customers(
  p_year int,
  p_month int,
  p_limit int default 5
)
returns table (customer_id uuid, full_name text, points_earned numeric)
language sql
stable
as $$
  select t.customer_id, c.full_name, sum(t.points) as points_earned
  from public.transactions t
  join public.customers c on c.id = t.customer_id
  where t.voided = false
    and t.entry_type = 'earn'
    and extract(year from (t.created_at at time zone 'Asia/Colombo')) = p_year
    and extract(month from (t.created_at at time zone 'Asia/Colombo')) = p_month
  group by t.customer_id, c.full_name
  order by points_earned desc
  limit p_limit;
$$;

grant execute on function public.dashboard_liability() to authenticated;
grant execute on function public.monthly_summary(int, int) to authenticated;
grant execute on function public.top_customers(int, int, int) to authenticated;
