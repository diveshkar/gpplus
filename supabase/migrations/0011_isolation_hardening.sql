-- =============================================================================
-- GP+ Loyalty System  |  Multi-tenant isolation hardening
-- =============================================================================
-- Re-asserts, from a clean slate, that every business can only ever see its own
-- rows and that the super admin sees all. Run this if you ever suspect one org
-- can see another's data. It drops ALL existing policies on the tenant tables
-- (removing any stray or leftover permissive policy) and recreates exactly the
-- intended ones, and it makes sure Row Level Security is enabled everywhere.
--
-- Safe to run any number of times. It only touches policies and the two helper
-- functions; no data is changed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (recreated to be certain they are correct). SECURITY DEFINER
-- so the policies can read profiles without recursing through their own rules.
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

grant execute on function public.auth_org_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Make sure RLS is on for every table that holds tenant data or access rules.
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.paint_types   enable row level security;
alter table public.customers     enable row level security;
alter table public.transactions  enable row level security;

-- -----------------------------------------------------------------------------
-- Drop EVERY existing policy on these tables, so nothing permissive lingers.
-- -----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'organizations', 'profiles', 'paint_types', 'customers', 'transactions'
      )
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname, pol.tablename
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tenant data tables: a row is visible only to the super admin or to a member
-- of the row's own organization. Same rule for reads and writes.
-- -----------------------------------------------------------------------------
create policy "org access" on public.paint_types
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

create policy "org access" on public.customers
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

create policy "org access" on public.transactions
  for all to authenticated
  using (public.is_super_admin() or organization_id = public.auth_org_id())
  with check (public.is_super_admin() or organization_id = public.auth_org_id());

-- -----------------------------------------------------------------------------
-- organizations: super admin manages all; an org admin may read and edit only
-- their own organization, and may never create or delete one.
-- -----------------------------------------------------------------------------
create policy "org select" on public.organizations
  for select to authenticated
  using (public.is_super_admin() or id = public.auth_org_id());

create policy "org insert" on public.organizations
  for insert to authenticated
  with check (public.is_super_admin());

create policy "org update" on public.organizations
  for update to authenticated
  using (public.is_super_admin() or id = public.auth_org_id())
  with check (public.is_super_admin() or id = public.auth_org_id());

create policy "org delete" on public.organizations
  for delete to authenticated
  using (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- profiles: a user may read their own; the super admin manages all.
-- -----------------------------------------------------------------------------
create policy "profile select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy "profile manage" on public.profiles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- =============================================================================
-- VERIFY (optional). Run these two queries after applying, as the postgres role
-- in the SQL editor, to confirm the setup:
--
--   -- 1. Every tenant table should report rowsecurity = true.
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in
--       ('organizations','profiles','paint_types','customers','transactions');
--
--   -- 2. Each table should list only the policies created above.
--   select tablename, policyname, cmd
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in
--       ('organizations','profiles','paint_types','customers','transactions')
--   order by tablename, policyname;
-- =============================================================================
