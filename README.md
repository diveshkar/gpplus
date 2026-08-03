# GP+ Loyalty System

Admin-only loyalty points system for a single paint shop. Built with Next.js 16
(App Router, TypeScript, Tailwind) and Supabase.

The full project plan lives in [`loyalty-system-plan-v2.md`](./loyalty-system-plan-v2.md).

---

## Phase 0 status

Done in code:

- Next.js app scaffolded (TypeScript, Tailwind, App Router, `src/` dir).
- Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`).
- Keep-alive endpoint at `/api/keep-alive` (stops the free-tier database from
  auto-pausing).
- Branded placeholder homepage that shows whether Supabase is connected.

Still needs **your** account setup (steps below). These cannot be automated
because they involve creating accounts and copying secret keys.

---

## Run it locally

```bash
npm run dev
```

Then open http://localhost:3000. If you are not signed in you are sent to the
login screen. Complete the Phase 1 setup below to create your admin account and
sign in.

---

## One-time account setup (you do this)

### 1. Create two Supabase projects

At [supabase.com](https://supabase.com), create **two** free projects:

- one named **`gpplus-stage`** (for testing)
- one named **`gpplus-prod`** (for the real shop)

The free plan allows two projects per account, which is exactly what we need.
Keeping them separate means a testing mistake can never touch real customer
points.

### 2. Connect local development to the STAGE project

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. In the Supabase dashboard for **`gpplus-stage`**, go to
   **Project Settings → API**.
3. Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the **anon / public** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`. The homepage dot should turn green.

> `.env.local` is git-ignored. Never commit it. Local dev always points at the
> **stage** project, never prod.

### 3. Deploy to Vercel

1. Push this project to a GitHub repository.
2. At [vercel.com](https://vercel.com), import that repository (Hobby / free
   plan is fine).
3. In the Vercel project's **Settings → Environment Variables**, add the SAME
   two variable names, but with the values from the **`gpplus-prod`** Supabase
   project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Scope these to the **Production** environment.
4. (Optional, for a true stage deploy) Create a `stage` git branch and add the
   **stage** Supabase values scoped to **Preview** in Vercel, so preview
   deployments point at the stage database.

Your app is now live at a free `*.vercel.app` subdomain — no domain purchase
needed.

### 4. Set up the daily keep-alive (stops auto-pause)

Supabase free projects pause after ~7 days of no activity. To keep BOTH projects
awake (even during shop closures), schedule a daily call to the keep-alive URL.

Vercel's own cron (Hobby plan) only runs on the production deployment, so use a
free external scheduler instead — [cron-job.org](https://cron-job.org),
[UptimeRobot](https://uptimerobot.com), or a GitHub Actions cron — and point it
at **both**:

- `https://<your-prod-app>.vercel.app/api/keep-alive`
- `https://<your-stage-app>.vercel.app/api/keep-alive`

Once a day is plenty. A successful call returns `{"ok": true, ...}`.

> The keep-alive keeps the database **awake**. It is **not** a backup. Real data
> protection comes from the on-demand Excel export built in Phase 6.

---

## Phase 1 setup (you do this, once, on the stage project)

Phase 1 adds the database tables and the admin login. Two manual steps are
needed because I cannot reach your Supabase dashboard.

### 1. Create the database tables

1. Open the **`gpplus-stage`** project in Supabase.
2. Go to the **SQL Editor** and click **New query**.
3. Open the file [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   in this project, copy its whole contents, paste into the editor, and click
   **Run**.
4. You should see a success message. To confirm, go to **Table Editor**. You
   will see four tables: `paint_types`, `customers`, `transactions`, and
   `configuration`. The `paint_types` table already holds Decorative (0.5) and
   Autorefinish (1), and `configuration` holds one row with threshold 10000 and
   redemption value 1.

The file is safe to run more than once, so re-running it will not create
duplicates or wipe anything.

### 2. Create the single admin login

The password stays entirely with you. Never put it in the code or share it.

1. In the **`gpplus-stage`** project, go to **Authentication**, then **Users**.
2. Click **Add user**, then **Create new user**.
3. Enter the email and a strong password you want to sign in with. Leave
   **Auto Confirm User** on so the account is ready to use immediately.
4. Click **Create user**.

### 3. Sign in

1. Run `npm run dev`.
2. Open http://localhost:3000. You are not signed in, so you land on the login
   screen.
3. Enter the email and password you just created. You arrive at the protected
   admin home. The **Sign out** button returns you to the login screen.

If sign in fails, double check the email and password match the user you created
in step 2, and that `.env.local` points at the stage project.

---

## Project structure

```
src/
  proxy.ts                    # session refresh + auth redirect (Next 16 proxy)
  app/
    api/
      keep-alive/route.ts     # daily ping endpoint (prevents auto-pause)
    login/page.tsx            # public login screen
    (app)/                    # protected admin area
      layout.tsx              # verifies the signed-in admin, shows the shell
      page.tsx                # admin home
    layout.tsx                # root layout
    globals.css               # design tokens (colors, type, spacing)
  lib/
    supabase/
      client.ts               # browser Supabase client
      server.ts               # server Supabase client (cookie-based auth)
    auth/
      actions.ts              # login and logout server actions
supabase/
  migrations/
    0001_init.sql             # Phase 1 schema, run in the SQL Editor
.env.local.example            # copy to .env.local and fill in
```

---

## What's next

Phase 2: customer registration, barcode card linking, global scan quick entry,
and customer search. See the plan for details.
