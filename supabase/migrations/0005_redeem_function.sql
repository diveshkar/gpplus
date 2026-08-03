-- =============================================================================
-- GP+ Loyalty System  |  Phase 4: the redemption engine
-- =============================================================================
-- Turns points into a product. Like the earn function, the row and the balance
-- update happen together in one transaction so they can never drift (Rule 4).
--
-- Rules honoured here:
--  - The gate uses the current threshold: a customer must already hold at least
--    that many points before any redemption is allowed. The remainder is free to
--    fall below the threshold afterwards.
--  - The entered LKR amount is converted to points at the CURRENT redemption
--    value (points = amount / value), and that value is snapshotted onto the row
--    so this completed redemption stays frozen even if the value changes later
--    (Rule 3).
--  - A customer can never redeem more than their balance is worth.
--
-- Errors are raised with short codes the app maps to friendly messages:
--   INVALID_AMOUNT, BELOW_THRESHOLD, EXCEEDS_BALANCE.
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run.
-- =============================================================================

create or replace function public.create_redeem_transaction(
  p_customer_id uuid,
  p_amount_lkr numeric,
  p_description text
)
returns uuid
language plpgsql
as $$
declare
  v_threshold numeric;
  v_value numeric;
  v_balance numeric;
  v_points numeric;
  v_id uuid;
begin
  if p_amount_lkr is null or p_amount_lkr <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select redemption_threshold, redemption_value
  into v_threshold, v_value
  from public.configuration
  where id = 1;

  select points_balance into v_balance
  from public.customers
  where id = p_customer_id;

  if v_balance is null then
    raise exception 'Customer not found';
  end if;

  -- Gate: must currently hold at least the threshold in points.
  if v_balance < v_threshold then
    raise exception 'BELOW_THRESHOLD';
  end if;

  -- Convert the product's LKR value into points at the current rate.
  v_points := p_amount_lkr / v_value;

  -- Never redeem more than the balance is worth.
  if v_points > v_balance then
    raise exception 'EXCEEDS_BALANCE';
  end if;

  insert into public.transactions (
    customer_id, entry_type, description, amount, points, redemption_value
  )
  values (
    p_customer_id, 'redeem', nullif(p_description, ''), p_amount_lkr,
    -v_points, v_value
  )
  returning id into v_id;

  update public.customers
  set points_balance = points_balance - v_points
  where id = p_customer_id;

  return v_id;
end;
$$;

grant execute on function public.create_redeem_transaction(uuid, numeric, text) to authenticated;
