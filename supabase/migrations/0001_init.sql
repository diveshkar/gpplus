-- =============================================================================
-- GP+ Loyalty System  |  Phase 1 initial schema
-- =============================================================================
-- Run this once in the Supabase SQL Editor for the STAGE project.
-- At go-live, run the exact same file once against the PROD project so both
-- environments are identical.
--
-- This file is safe to re-run. Tables use "if not exists", policies and
-- triggers are dropped first then recreated, and seed rows use "on conflict".
--
-- Core rules honoured here (see loyalty-system-plan-v2.md):
--  Rule 2: each earn row snapshots the paint type and percentage it used.
--  Rule 3: each redeem row snapshots the redemption value it used.
--  Rule 4: the stored balance lives on customers.points_balance.
--  Rule 5: rows are voided (soft deleted), never physically removed.
-- =============================================================================

-- gen_random_uuid() is available in Supabase by default.

-- -----------------------------------------------------------------------------
-- Helper: keep updated_at fresh on every UPDATE.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- paint_types
-- Earning rate per paint type. Percentages are stored as a percent value,
-- so Decorative 0.5 means 0.5 percent and points = amount * percentage / 100.
-- Names are provisional and can be renamed later without touching history,
-- because every earn row stores its own snapshot of the percentage used.
-- -----------------------------------------------------------------------------
create table if not exists public.paint_types (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null unique,
  earning_percentage numeric(6, 4) not null check (earning_percentage >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- customers
-- One row per registered customer. points_balance is the stored running
-- balance, only ever changed together with a transaction row inside one
-- database transaction (built in Phase 3). barcode_id is unique so one printed
-- card can never link to two customers. It is nullable so a customer can exist
-- briefly without a card, and Postgres allows many NULLs under a unique index.
-- -----------------------------------------------------------------------------
create table if not exists public.customers (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  address               text,
  date_of_birth         date,
  phone_number          text,
  default_paint_type_id uuid references public.paint_types (id) on delete set null,
  barcode_id            text unique,
  points_balance        numeric(14, 4) not null default 0 check (points_balance >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- transactions
-- Holds both earning and redemption activity in one timeline, distinguished by
-- entry_type. points is positive for earn and negative for redeem. Earn rows
-- carry paint_type_id and earning_percentage snapshots; redeem rows carry a
-- redemption_value snapshot. Rows are voided rather than deleted.
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references public.customers (id) on delete restrict,
  entry_type         text not null check (entry_type in ('earn', 'redeem')),
  description        text,
  amount             numeric(14, 2) not null check (amount >= 0),
  points             numeric(14, 4) not null,
  paint_type_id      uuid references public.paint_types (id) on delete set null,
  earning_percentage numeric(6, 4),
  redemption_value   numeric(14, 4),
  voided             boolean not null default false,
  voided_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Points sign must match the entry type.
  constraint points_sign_matches_entry_type check (
    (entry_type = 'earn' and points >= 0)
    or (entry_type = 'redeem' and points <= 0)
  )
);


-- -----------------------------------------------------------------------------
-- configuration
-- A single row of system-wide settings. The id check keeps it to exactly one
-- row. redemption_threshold is the minimum balance before redeeming is allowed;
-- redemption_value is how many LKR one point is worth. Both are admin editable.
-- -----------------------------------------------------------------------------
create table if not exists public.configuration (
  id                   smallint primary key default 1 check (id = 1),
  redemption_threshold numeric(14, 4) not null default 10000 check (redemption_threshold >= 0),
  redemption_value     numeric(14, 4) not null default 1 check (redemption_value > 0),
  updated_at           timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- Indexes (Phase 1 tasks 2, 3, 4)
-- -----------------------------------------------------------------------------

-- Customer history lookups and report queries.
create index if not exists idx_transactions_customer_created_type
  on public.transactions (customer_id, created_at, entry_type);

-- Customer search screen (by name, date of birth, phone number).
create index if not exists idx_customers_name_dob_phone
  on public.customers (full_name, date_of_birth, phone_number);

-- The unique constraint on customers.barcode_id already creates the index used
-- on every card scan, so no separate barcode index is needed.


-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
drop trigger if exists trg_paint_types_updated_at on public.paint_types;
create trigger trg_paint_types_updated_at
  before update on public.paint_types
  for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_configuration_updated_at on public.configuration;
create trigger trg_configuration_updated_at
  before update on public.configuration
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Row Level Security
-- This is an admin only system with a single Supabase Auth account, so any
-- authenticated request is the admin and may do everything. Anonymous requests
-- get nothing. Every table has RLS enabled with a single all-access policy for
-- the authenticated role.
-- -----------------------------------------------------------------------------
alter table public.paint_types   enable row level security;
alter table public.customers     enable row level security;
alter table public.transactions  enable row level security;
alter table public.configuration enable row level security;

drop policy if exists "admin full access" on public.paint_types;
create policy "admin full access" on public.paint_types
  for all to authenticated using (true) with check (true);

drop policy if exists "admin full access" on public.customers;
create policy "admin full access" on public.customers
  for all to authenticated using (true) with check (true);

drop policy if exists "admin full access" on public.transactions;
create policy "admin full access" on public.transactions
  for all to authenticated using (true) with check (true);

drop policy if exists "admin full access" on public.configuration;
create policy "admin full access" on public.configuration
  for all to authenticated using (true) with check (true);


-- -----------------------------------------------------------------------------
-- Seed data
-- Provisional paint types and their earning rates, plus the single settings row.
-- -----------------------------------------------------------------------------
insert into public.paint_types (name, earning_percentage)
values
  ('Decorative', 0.5),
  ('Autorefinish', 1)
on conflict (name) do nothing;

insert into public.configuration (id, redemption_threshold, redemption_value)
values (1, 10000, 1)
on conflict (id) do nothing;
