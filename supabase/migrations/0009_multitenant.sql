-- =============================================================================
-- GP+ Loyalty System  |  Phase 8: multi-tenant foundation
-- =============================================================================
-- Turns the single-shop app into a multi-organization platform.
--
--   * organizations : one row per shop (its branding + loyalty settings = its
--                     "template", which the org's own admin can edit freely).
--   * profiles      : one row per Supabase Auth user, giving them a role
--                     (super_admin or org_admin) and, for org admins, the
--                     organization they belong to.
--   * every data table (paint_types, customers, transactions) gains an
--     organization_id, and Row Level Security makes each org see ONLY its own
--     rows. The super admin sees and manages everything.
--
-- The single-row `configuration` table is retired; its fields move onto
-- `organizations` so each org carries its own settings.
--
-- Existing single-shop data is preserved: on first run a "GP+" organization is
-- created from the current configuration, all existing rows are stamped with it,
-- and every existing login becomes that org's admin. Promote one account to
-- super_admin afterwards (see the note at the very bottom of this file).
--
-- Run once in the Supabase SQL Editor for STAGE (and for PROD at go-live).
-- Safe to re-run: the bootstrap only happens when no organization exists yet.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- organizations
-- Each row is a tenant. Branding (name, logo, admin display name, brand colour)
-- and loyalty rules (redemption threshold and value) live here so every org
-- customises its own copy without affecting anyone else.
-- -----------------------------------------------------------------------------
create table if not exists public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  logo_url             text,
  admin_name           text,
  brand_color          text not null default '#c1121f',
  redemption_threshold numeric(14, 4) not null default 10000 check (redemption_threshold >= 0),
  redemption_value     numeric(14, 4) not null default 1 check (redemption_value > 0),
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- profiles
-- Extends each Supabase Auth user with a role and (for org admins) their org.
-- A super admin belongs to no organization; an org admin always belongs to one.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            text not null default 'org_admin'
                    check (role in ('super_admin', 'org_admin')),
  organization_id uuid references public.organizations (id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint profile_org_matches_role check (
    (role = 'super_admin' and organization_id is null)
    or (role = 'org_admin' and organization_id is not null)
  )
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helper functions, used by the RLS policies below.
-- SECURITY DEFINER so they can read `profiles` without triggering the very
-- policies they help define (which would recurse). Kept tiny and read-only.
-- -----------------------------------------------------------------------------
create or replace function public.auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Add organization_id to every data table (nullable for now so we can backfill).
-- -----------------------------------------------------------------------------
alter table public.paint_types
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.customers
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.transactions
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

-- -----------------------------------------------------------------------------
-- Bootstrap: preserve the existing single shop as the first organization.
-- Runs only when there is no organization yet, so re-running is safe.
-- -----------------------------------------------------------------------------
do $$
declare
  v_org uuid;
  v_logo text;
  v_admin_name text;
  v_threshold numeric := 10000;
  v_value numeric := 1;
begin
  if not exists (select 1 from public.organizations) then
    -- Pull the old single-shop settings if the configuration table is still
    -- present. Done via dynamic SQL so this block still COMPILES after
    -- configuration has been dropped (a re-run), rather than failing to compile.
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'configuration'
    ) then
      execute $q$
        select logo_url, admin_name, redemption_threshold, redemption_value
        from public.configuration where id = 1
      $q$ into v_logo, v_admin_name, v_threshold, v_value;
    end if;

    insert into public.organizations (
      name, logo_url, admin_name, redemption_threshold, redemption_value
    )
    values (
      'GP+',
      v_logo,
      v_admin_name,
      coalesce(v_threshold, 10000),
      coalesce(v_value, 1)
    )
    returning id into v_org;

    update public.paint_types  set organization_id = v_org where organization_id is null;
    update public.customers    set organization_id = v_org where organization_id is null;
    update public.transactions set organization_id = v_org where organization_id is null;

    -- Every existing login becomes an admin of the migrated shop.
    insert into public.profiles (id, role, organization_id)
    select u.id, 'org_admin', v_org from auth.users u
    on conflict (id) do nothing;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Now that every row has an organization, make it mandatory.
-- -----------------------------------------------------------------------------
alter table public.paint_types  alter column organization_id set not null;
alter table public.customers    alter column organization_id set not null;
alter table public.transactions alter column organization_id set not null;

-- -----------------------------------------------------------------------------
-- Uniqueness becomes per-organization: two shops may use the same paint type
-- name or reuse a card number without clashing.
-- -----------------------------------------------------------------------------
alter table public.paint_types drop constraint if exists paint_types_name_key;
create unique index if not exists uq_paint_types_org_name
  on public.paint_types (organization_id, name);

alter table public.customers drop constraint if exists customers_barcode_id_key;
create unique index if not exists uq_customers_org_barcode
  on public.customers (organization_id, barcode_id);

-- Helpful indexes for the org-scoped lookups the app runs constantly.
create index if not exists idx_paint_types_org  on public.paint_types (organization_id);
create index if not exists idx_customers_org     on public.customers (organization_id);
create index if not exists idx_transactions_org  on public.transactions (organization_id);

-- -----------------------------------------------------------------------------
-- Stamp organization_id automatically on insert, from the caller's profile.
-- App code and the SQL functions never have to pass it, and an org admin can
-- never write a row into another org (auth_org_id() is always their own).
-- -----------------------------------------------------------------------------
create or replace function public.set_org_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null then
    new.organization_id := public.auth_org_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_paint_types_set_org on public.paint_types;
create trigger trg_paint_types_set_org
  before insert on public.paint_types
  for each row execute function public.set_org_id();

drop trigger if exists trg_customers_set_org on public.customers;
create trigger trg_customers_set_org
  before insert on public.customers
  for each row execute function public.set_org_id();

drop trigger if exists trg_transactions_set_org on public.transactions;
create trigger trg_transactions_set_org
  before insert on public.transactions
  for each row execute function public.set_org_id();

-- -----------------------------------------------------------------------------
-- Redemption now reads the calling org's settings instead of the retired global
-- configuration row. Everything else about the function is unchanged.
-- -----------------------------------------------------------------------------
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
  from public.organizations
  where id = public.auth_org_id();

  if v_value is null then
    raise exception 'Organization settings not found';
  end if;

  select points_balance into v_balance
  from public.customers
  where id = p_customer_id;

  if v_balance is null then
    raise exception 'Customer not found';
  end if;

  if v_balance < v_threshold then
    raise exception 'BELOW_THRESHOLD';
  end if;

  v_points := p_amount_lkr / v_value;

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

-- -----------------------------------------------------------------------------
-- Row Level Security
-- Each org sees only its own rows; the super admin sees everything.
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;

-- organizations: super admin manages all; an org admin may read and edit only
-- their own organization (its settings), but never create or delete one.
drop policy if exists "org select" on public.organizations;
create policy "org select" on public.organizations
  for select to authenticated
  using (public.is_super_admin() or id = public.auth_org_id());

drop policy if exists "org insert" on public.organizations;
create policy "org insert" on public.organizations
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists "org update" on public.organizations;
create policy "org update" on public.organizations
  for update to authenticated
  using (public.is_super_admin() or id = public.auth_org_id())
  with check (public.is_super_admin() or id = public.auth_org_id());

drop policy if exists "org delete" on public.organizations;
create policy "org delete" on public.organizations
  for delete to authenticated
  using (public.is_super_admin());

-- profiles: a user may read their own; the super admin manages all.
drop policy if exists "profile select" on public.profiles;
create policy "profile select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

drop policy if exists "profile manage" on public.profiles;
create policy "profile manage" on public.profiles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Data tables: replace the old "any admin, everything" policy with org scoping.
drop policy if exists "admin full access" on public.paint_types;
create policy "org access" on public.paint_types
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

drop policy if exists "admin full access" on public.customers;
create policy "org access" on public.customers
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

drop policy if exists "admin full access" on public.transactions;
create policy "org access" on public.transactions
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

-- -----------------------------------------------------------------------------
-- Privileges. RLS decides which rows; these grant the table access at all.
-- (See migration 0002: missing grants surface as error 42501.)
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant execute on function public.auth_org_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Retire the single global settings row (its fields now live on organizations).
-- -----------------------------------------------------------------------------
drop table if exists public.configuration;

-- =============================================================================
-- AFTER RUNNING THIS FILE: create your super admin.
-- 1. In Supabase Auth, create (or pick) the account that will be the platform
--    super admin, and copy its user UID.
-- 2. Run the following once, replacing the UID:
--
--    insert into public.profiles (id, role, organization_id)
--    values ('<SUPER_ADMIN_AUTH_UID>', 'super_admin', null)
--    on conflict (id) do update
--      set role = 'super_admin', organization_id = null;
-- =============================================================================
