# Loyalty System, Project Plan (current)

> This is the up-to-date plan. The older single-shop plan lives in
> `loyalty-system-plan-v2.md` and is kept only as history. The product has since
> become a multi-tenant SaaS for any business, not only paint shops.

## What the product is now

A multi-business loyalty platform. A **super admin** runs the platform and
creates **organizations** (businesses). Each business has one **admin** login
and runs its own loyalty program: customers, points earning and redemption,
categories, reports, an Excel backup, card scanning, and a managed pool of
printable loyalty cards. Everything a business sees is its own; businesses never
see each other's data.

## Architecture

- **Tenancy:** shared database, isolated by Row Level Security. Every data table
  carries `organization_id`; a business only sees rows for its own org, the super
  admin sees all. A trigger stamps the org automatically on insert.
- **Roles:** `super_admin` (platform, no org) and `org_admin` (one business).
- **Branding per business:** name, logo, and a brand colour drive the whole app
  and the printed cards. Only `--brand` is a raw colour; the shades derive from it.
- **Hosting:** Netlify (Next.js runtime) plus Supabase (database, auth, and soon
  storage). Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  and the server-only `SUPABASE_SERVICE_ROLE_KEY`.

## Database migrations (run in order)

`0001`-`0008` core schema and functions; `0009` multi-tenant foundation; `0010`
platform stats; `0011` isolation hardening; `0012` performance indexes; `0013`
function hardening; `0014` card pool; `0015` auto-enable RLS on new tables;
`0016` card-design columns. All are in `supabase/migrations/` and are run by hand in the Supabase SQL editor, in
order, on each project.

## Status

Done:
- Core loyalty: customers, transactions, points, redemption, reports, dashboard.
- On-demand Excel full-backup export.
- Premium UI and UX pass, responsive, standard page header, animations.
- Multi-tenant foundation: organizations, profiles, org-scoped security.
- Super admin area: create, edit, suspend, delete organizations; per-org stats
  table (customers, points liability, last active); reset an org admin's password.
- Admin profile and password change (in the business Settings page).
- Generic terminology: paint-specific wording replaced with "Categories".
- Categories: add, edit, remove in Settings, and now **set during org creation**.
- Card pool (Phase 10): generate batches of unique cards, branded vector PDF,
  Excel export of the numbers (with a Code 128 font column), inventory stats
  (total, assigned, unused, lost), assign-on-first-scan, and lost/replaced
  handling.
- Debranded login and super admin portal (neutral "Loyalty System" mark),
  neutral favicon.
- Loading screens: branded loader inside a business, a default animation for
  common areas; centred correctly on mobile.

- **Card design v2:** logos upload to a Supabase Storage bucket (`logos`, public)
  and are stored as URLs (migration none; app change); a business customizes the
  card (title, tagline, optional back with text) on the Cards page; the PDF
  outputs front and back; barcode numbers stay an Excel export. Migration `0016`
  adds the card-design columns. Requires the `logos` bucket to exist.

Next / planned:
- **Region migration:** move Supabase from Tokyo to Singapore for lower latency.
- **End-to-end verification** before onboarding real businesses.
- **Go-live:** production Supabase project, run all migrations, create the super
  admin, set Netlify env vars, smoke test.

## Latest decisions

- **Card pool = Option B.** A managed pool table, not just loose barcodes, so we
  get reservation and inventory (printed, assigned, unused, lost).
- **Card codes** are random and effectively unique everywhere, while the database
  still enforces uniqueness per business.
- **Two card outputs:** a branded PDF of the card design, and an Excel of the
  barcode numbers (some print shops want the numbers plus a barcode-font column).
- **PDF = true vector** via `pdf-lib`, standard card size with bleed.
- **Categories at creation:** the super admin sets a business's starting
  categories when creating it; the business can change them later.
- **Logos will move to Supabase Storage** (a public bucket) instead of being
  stored inline, so the card PDF and the app load the logo from a URL.
- **Card PDF will include front and back**; barcode details remain Excel-only.
- **Region:** create a new Supabase project in Singapore and migrate to it.
