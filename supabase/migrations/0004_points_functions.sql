-- =============================================================================
-- GP+ Loyalty System  |  Phase 3: the points engine
-- =============================================================================
-- These functions do the earning maths and keep the stored balance in step with
-- the transaction rows. Each function runs as a single database transaction, so
-- the row and the balance can never end up out of sync (plan Rule 4).
--
-- Points are calculated as amount * percentage / 100 and stored at the column's
-- natural precision (4 decimals), so a value like 1.25 or 1.75 is kept exactly.
-- Each earn row snapshots the paint type and the percentage it used (Rule 2).
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run: functions are created with "or replace".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Earn: record a purchase and add the points it earned.
-- Returns the new transaction id.
-- -----------------------------------------------------------------------------
create or replace function public.create_earn_transaction(
  p_customer_id uuid,
  p_paint_type_id uuid,
  p_amount numeric,
  p_description text
)
returns uuid
language plpgsql
as $$
declare
  v_percentage numeric;
  v_points numeric;
  v_id uuid;
begin
  if p_amount is null or p_amount < 0 then
    raise exception 'Amount must be zero or more';
  end if;

  select earning_percentage into v_percentage
  from public.paint_types
  where id = p_paint_type_id;

  if v_percentage is null then
    raise exception 'Paint type not found';
  end if;

  v_points := p_amount * v_percentage / 100;

  insert into public.transactions (
    customer_id, entry_type, description, amount, points,
    paint_type_id, earning_percentage
  )
  values (
    p_customer_id, 'earn', nullif(p_description, ''), p_amount, v_points,
    p_paint_type_id, v_percentage
  )
  returning id into v_id;

  update public.customers
  set points_balance = points_balance + v_points
  where id = p_customer_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Edit an earn transaction: recalculate its points from the corrected amount or
-- paint type, and move the balance by the difference.
-- -----------------------------------------------------------------------------
create or replace function public.edit_earn_transaction(
  p_transaction_id uuid,
  p_paint_type_id uuid,
  p_amount numeric,
  p_description text
)
returns void
language plpgsql
as $$
declare
  v_tx public.transactions;
  v_percentage numeric;
  v_new_points numeric;
begin
  if p_amount is null or p_amount < 0 then
    raise exception 'Amount must be zero or more';
  end if;

  select * into v_tx from public.transactions where id = p_transaction_id;
  if not found then
    raise exception 'Transaction not found';
  end if;
  if v_tx.voided then
    raise exception 'Cannot edit a cancelled transaction';
  end if;
  if v_tx.entry_type <> 'earn' then
    raise exception 'Only earn transactions can be edited here';
  end if;

  select earning_percentage into v_percentage
  from public.paint_types
  where id = p_paint_type_id;
  if v_percentage is null then
    raise exception 'Paint type not found';
  end if;

  v_new_points := p_amount * v_percentage / 100;

  update public.transactions
  set amount = p_amount,
      paint_type_id = p_paint_type_id,
      earning_percentage = v_percentage,
      points = v_new_points,
      description = nullif(p_description, '')
  where id = p_transaction_id;

  update public.customers
  set points_balance = points_balance - v_tx.points + v_new_points
  where id = v_tx.customer_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Void a transaction: mark it cancelled and reverse its effect on the balance,
-- as if it never counted. The row itself is kept for audit (Rule 5).
-- Works for any entry type: reversing means subtracting whatever it added.
-- -----------------------------------------------------------------------------
create or replace function public.void_transaction(
  p_transaction_id uuid
)
returns void
language plpgsql
as $$
declare
  v_tx public.transactions;
begin
  select * into v_tx from public.transactions where id = p_transaction_id;
  if not found then
    raise exception 'Transaction not found';
  end if;
  if v_tx.voided then
    return; -- already cancelled, nothing to do
  end if;

  update public.transactions
  set voided = true, voided_at = now()
  where id = p_transaction_id;

  update public.customers
  set points_balance = points_balance - v_tx.points
  where id = v_tx.customer_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Let the signed-in admin call these functions.
-- -----------------------------------------------------------------------------
grant execute on function public.create_earn_transaction(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.edit_earn_transaction(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.void_transaction(uuid) to authenticated;
