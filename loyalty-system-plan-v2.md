# Paint Shop Loyalty System, Project Plan (v2)

> **Build progress (as of 2026-08-03)**
> Completed and tested on the stage environment: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4.
> Not started yet: Phase 5, Phase 6, Phase 7, Phase 8, Phase 9.
> Production has not been created yet. All work so far runs against the stage Supabase project. Database migrations applied to stage so far, in order: `0001_init.sql`, `0002_grants.sql`, `0003_barcode_required.sql`, `0004_points_functions.sql`, `0005_redeem_function.sql`. These same files must be run against production, in the same order, at go-live.

> **What changed since v1**
> - **Balance** is a stored running number, kept correct by writing the balance and the row together in one database transaction, plus a quiet drift check that *warns* the admin when a stored balance disagrees with the customer's rows (it never silently changes anything).
> - **Redemption value** is now a configurable setting (starts at 1 point = 1 LKR). Changing it re-values every customer's *remaining* points at their next redemption. Past redemptions are frozen forever, so products already given out are never affected.
> - **Deleting a transaction** is now a **void** (soft delete). The row is kept and marked cancelled; it stops counting toward the balance but stays visible for audit.
> - **The Excel export is a full backup.** It now also includes a customers sheet and a settings sheet, so the whole system can be rebuilt from one file, not just the transaction log.
> - **Doc fixes:** Phase 8 no longer mentions email or Google Sheets (the system is download-only). Phase 3's duplicated tasks were merged.
> - **Added guardrails:** barcode uniqueness, paint type stored by ID with the rate snapshotted onto each earn row, and a fixed report timezone (Asia/Colombo).

## Overview

This is an admin only loyalty points system for a single paint shop location. The admin logs in, adds customer transactions with a description and amount, points are calculated automatically, and points can be redeemed for products, fully or partially. Redemption is always given as a product, never handed out as cash. An on demand Excel export can be generated anytime with a single button, downloading straight to the admin's device. No public domain is required since the app will be accessed through the free hosting subdomain, not a custom purchased domain.

## Environments

Two separate environments will be maintained from day one.

**Stage environment**
Used for testing new features before they touch real customer data. Runs on its own Supabase project (free tier) and its own Vercel deployment branch.

**Production environment**
Used for real customers and real points. Runs on a separate Supabase project and the main Vercel deployment.

Keeping these separate means a mistake made while testing a new feature can never corrupt real customer point balances.

> **Operational note:** Supabase free projects automatically pause after about 7 days of no activity. To keep both projects awake even during shop closures, a daily keep-alive ping hits a lightweight endpoint that runs one tiny database query, which resets the idle timer (see Phase 0). This is a convenience only, it is not a backup. Protecting the actual data is a separate concern handled by the on-demand Export (Phase 6). Keeping the database awake and protecting its contents are two different things.

> **Shop closures:** with the keep-alive running, the production database stays awake whether the shop is open or closed, so there is no un-pause step on the first morning back. As an extra precaution before any long planned closure, press Export once (Phase 6) to keep a full copy of everything on the admin's device. A paused database is only asleep, never deleted, and restoring it is a single click in the Supabase dashboard, so no data is ever lost either way.

---

## Core Rules (apply across the whole system)

These rules are stated once here and referenced by later phases, so the behaviour is consistent everywhere.

**Rule 1, history is never rewritten.** Changing a setting only affects transactions recorded from that point forward. Every past transaction keeps the exact points it originally calculated. This applies to earning percentages and to a customer's default paint type.

**Rule 2, each earn row is self-contained.** When points are earned, the row stores the paint type used *and* the earning percentage applied at that moment, plus the calculated points. That way, renaming a paint type or changing a percentage later can never disturb any past row.

**Rule 3, the redemption value is configurable and forward-looking.** There is one Redemption Value setting, starting at 1 point = 1 LKR. Points are always stored as points, never as LKR. When the admin changes this value, every customer's *remaining* points are simply worth the new rate the next time they redeem. Any redemption already completed is frozen, the product was given and the points came off at that time, and nothing later reaches back to change it. Raising the value makes leftover points worth more, lowering it makes them worth less, but only points not yet redeemed are affected.

**Rule 4, balance and row always move together.** Every action that changes a balance (add, edit, void) writes the transaction row and updates the customer's stored balance inside a single database transaction, so the two can never end up half-done or out of sync.

**Rule 5, deletions are voids, not erasures.** A transaction entered by mistake is marked voided. It stops counting toward the balance but remains in the record, so a customer dispute or an audit can always be traced.

**Rule 6, a quiet drift check protects the stored balance.** Because the balance is stored rather than recalculated every time, the system periodically compares each stored balance against the sum of that customer's non-voided rows. If they ever disagree, the admin is *warned* on the customer's profile. The system never silently rewrites the balance on its own, a human decides what to do.

---

## Phase 0, Foundation Setup  [Completed on stage, 2026-08-03]

Goal: get the empty skeleton running in both environments before any real feature is built.

Tasks
1. Create the Next.js project
2. Create two Supabase projects, one named stage and one named prod
3. Connect the Next.js project to Vercel
4. Set up two Vercel environments, a preview branch pointing to the stage Supabase project, and a main branch pointing to the prod Supabase project
5. Confirm both environments load a blank homepage successfully
6. **Keep-alive endpoint and scheduler.** Add a lightweight API route (for example `/api/keep-alive`) that runs one tiny database query and returns quickly. Schedule a daily ping so neither Supabase project ever hits the 7-day idle pause. Because Vercel Hobby crons only fire on the production deployment, a free external scheduler (cron-job.org, UptimeRobot, or a GitHub Actions cron) is used to ping **both** the prod and stage keep-alive URLs once a day, covering both environments with one tool. This keeps databases awake only, it is not a backup.

Output of this phase: a working, empty app reachable at a free Vercel subdomain, with stage and prod fully separated, and both databases kept permanently awake by a daily keep-alive ping.

---

## Phase 1, Database and Authentication  [Completed on stage, 2026-08-03]

Goal: the data foundation and admin login.

Tasks
1. Create the core tables in both Supabase projects: **users**, **transactions**, **paint_types**, **configuration**. The transactions table holds both earning activity and redemption activity together, using an Entry Type field, either Earn or Redeem, instead of two separate tables.
2. Create an index on the transactions table covering User ID, Created Date, and Entry Type together, so customer history lookups and report queries stay fast as the table grows.
3. Create a second index on the users table covering Full Name, Date of Birth, and Phone Number together, so the customer search screen stays fast as the customer list grows.
4. Create a third index on the users table covering Barcode ID alone, since this is the field looked up every single time a card is scanned. Add a **UNIQUE constraint** on Barcode ID so the same card can never be linked to two customers by accident.
5. **Paint types live in their own small table** (paint_types: id, name, earning percentage), so types can be renamed freely without touching any history. Seeded with Decorative at 0.5 percent and Autorefinish at 1 percent, names provisional and renameable later. Each earn transaction stores the paint_type_id it used and snapshots the percentage applied at that moment (Rule 2).
6. Configuration table stores single settings that apply system-wide:
   - **Redemption Threshold**, starting at 10,000, the minimum points balance required before any redemption is allowed. Changeable later from the settings screen, never fixed permanently (Rule 3 for value, this is the separate gate).
   - **Redemption Value**, starting at 1 point = 1 LKR, changeable later (Rule 3).
7. Points fields, on both the users table (stored balance) and the transactions table, store decimal values, not whole numbers. A purchase can earn a value like 2.5 points and that exact value is saved directly, nothing is rounded and nothing is lost.
8. The users table carries a **stored points balance** column. It is only ever changed together with a transaction row, inside one database transaction (Rule 4).
9. The transactions table carries a **voided** flag (Rule 5). Voided rows are excluded from every balance, report, and total.
10. Set up Supabase Auth with a single admin account only, no separate staff roles or accounts.
11. Build the login screen.
12. Build a protected layout so no page is reachable without logging in.

Earning rates confirmed so far
Decorative, 0.5 percent, meaning 200 LKR spent earns 1 point.
Autorefinish, 1 percent, meaning 100 LKR spent earns 1 point.

Redemption stays uniform across both types. Once points are earned they are all worth the same amount when redeemed, regardless of which paint type earned them. Only the earning rate differs by type, not the redemption value.

Output of this phase: a secure, empty admin panel with nothing in it yet except login, and a configuration ready to hold type-based earning rates, the redemption threshold, and the redemption value.

> **Business check before go-live (not a code task):** with a 10,000-point threshold, a Decorative customer at 0.5 percent must spend 2,000,000 LKR before they can redeem anything, and an Autorefinish customer at 1 percent must spend 1,000,000 LKR. The system makes both numbers easy to change, but confirm with the shop owner that the threshold and rates are deliberate, not placeholders.

---

## Phase 2, Customer Management  [Completed on stage, 2026-08-03]

Goal: admin can register and search customers, and link each customer to their physical loyalty card.

Tasks
1. Add customer screen, capturing full name, address, date of birth, phone number, and customer type as the default paint type for that customer.
2. Barcode card setup, the shop already has pre-printed physical cards with a barcode on each one. During registration, the admin scans the physical card, and the scanned value is saved as that customer's Barcode ID. This scan happens once, at registration, and permanently links that specific card to that specific customer.
3. Barcode scan decision flow, any scan first checks the barcode against the users table. If it matches an existing customer, their profile opens directly, no prompt needed. If it does not match anyone, the admin is asked whether this is an existing customer or a new customer.

   **Existing customer path (lost card).** A customer registered before loses their card, and the shop issues a new one with a different barcode. Since that new barcode has never been seen, it does not match anyone on scan. The admin picks existing customer, then searches by name, date of birth, or phone number instead of by barcode. Once the correct profile is found, the new barcode is saved onto that same record and the old barcode value is deleted completely, not kept anywhere. Only the new barcode works for that customer going forward. Points balance and full history stay exactly as they were. The system also guards against reassigning a barcode that is already linked to a different customer (the UNIQUE constraint from Phase 1).

   **New customer path** leads straight into the Add Customer form with the Barcode ID already filled in from the scan.
4. Global scan quick entry, a Scan button lives in the sidebar itself, visible and usable from every screen. When a known customer's card is scanned from anywhere in the app, a popup opens immediately on top of whatever screen the admin was on, showing that customer, an Earn or Redeem choice, a description field, and an amount field, with the points or redemption calculated live as it is typed. Saving from this popup writes the row exactly the same way the full screens do, it is simply a faster shortcut for the most common counter action.
5. Customer list and search screen, searchable by name, phone number, or barcode ID, so a return visit can be looked up by simply scanning the card again.
6. Customer profile screen showing current points balance and default paint type. If the drift check (Rule 6) finds a mismatch for this customer, a clear warning is shown here.

Output of this phase: admin can fully manage the customer list, every printed card is properly linked to one customer, and no scan ever creates a duplicate or a wrong match by accident.

---

## Phase 3, Transactions and Points Engine  [Completed on stage, 2026-08-03]

Goal: the core loyalty logic.

Tasks
1. Add transaction screen, admin selects a customer by scan or search, which also pulls in the customer's default paint type automatically.
2. Quick action popup (the same popup reached from the global Scan button). Whenever a scan matches an existing customer anywhere in the app, a popup appears immediately with that customer's name filled in, a choice between Earn or Redeem, a Description field, and an Amount field. Paint type only appears when Earn is chosen, defaulted from the customer's profile but editable for that one transaction. This lets the admin log the whole transaction in one continuous action at the counter, without navigating to a separate screen first.
3. Type selector on the transaction screen, pre-filled with the customer's default type, editable for that one transaction only (for the case where a decorative customer buys autorefinish, or the reverse). Changing it here never changes the customer's stored default type (Rule 1).
4. Admin enters a description and an amount.
5. Server-side calculation, the system looks up the paint type used for this specific transaction, finds its percentage, multiplies the amount by that percentage to get points earned, and saves the result exactly as calculated, decimals included, nothing rounded. The row also snapshots the type and percentage used (Rule 2).
6. Points are added to the customer's stored balance and the row is written with Entry Type set to Earn, both inside one database transaction so they can never go out of sync (Rule 4).
7. History screen for each customer, showing every row in one combined timeline, Earn and Redeem together, with the paint type visible for Earn entries. Voided rows are shown as clearly cancelled rather than hidden.
8. **Edit and void capability** on any row, Earn or Redeem:
   - **Editing** a row recalculates that row's points using the same logic as a new entry (corrected amount or type), and adjusts the customer's stored balance to match, both together in one database transaction.
   - **Voiding** a row marks it cancelled and reverses its effect on the balance, as if it never counted, again both together in one database transaction. The row itself is preserved for audit (Rule 5).

Worked example
A customer buys Decorative for 250 LKR. At 0.5 percent, that is 1.25 points, saved directly as 1.25. A customer buys Autorefinish for 350 LKR. At 1 percent, that is 3.5 points, saved directly as 3.5. Nothing is ever lost, since the exact value is always kept.

Output of this phase: the shop can start earning points on real sales, correctly rated by paint type even when a customer occasionally buys the other type, with no leftover value ever lost, and any mistake correctable without erasing the record.

---

## Phase 4, Redemption Module  [Completed on stage, 2026-08-03]

Goal: turning points into a product, fully or partially, whatever the admin chooses, but only once the customer has crossed the redemption threshold. Points are never handed out as cash, only ever given as a product.

Tasks
1. Redeem screen, admin selects a customer, sees current points balance and the LKR value that balance is worth toward a product, calculated at the **current Redemption Value** (Rule 3).
2. Before allowing any redemption, the system checks the customer's current balance against the Redemption Threshold in the configuration table, currently 10,000, changeable by the admin at any time. This check always uses whatever the threshold is right now, so if the admin lowers it, say from 10,000 to 5,000, any customer already sitting between those two numbers becomes redeemable immediately the next time their profile is checked. If the balance is below the current threshold, the redeem action is blocked entirely and cannot be overridden on the spot, changing it means changing the setting itself.
3. Once the threshold is met, admin enters the amount actually being redeemed, either the full balance or any smaller amount (for example a product worth 7,500 LKR out of a 15,000 LKR balance), along with a description of the product given (for example paint brush set, or a tin of paint), using the same Description field the Earn side uses.
4. Server-side calculation, the entered LKR amount is converted into points at the **current Redemption Value** (Rule 3). At the default 1:1, 7,500 LKR redeemed equals 7,500 points deducted. The row snapshots the value used, so this completed redemption stays frozen even if the value is changed later. The system blocks any redemption worth more than the customer's current balance, this can never be overridden.
5. The customer's stored points balance is reduced by only that amount, the remainder stays fully intact. If the remainder falls back below the Redemption Threshold, it becomes non-redeemable again, still sitting safely in the account, until future purchases bring the balance back up.
6. A row is written into the same transactions table, Entry Type set to Redeem, points stored as a negative value, recording what was redeemed, with the balance update happening together with it in one database transaction (Rule 4).
7. History screen for each customer showing every row together in one place, Earn and Redeem mixed in date order.
8. Settings screen gets fields for **Redemption Threshold** and **Redemption Value**, so the admin can raise or lower either number whenever they choose. The settings screen states plainly that changing the value re-values everyone's remaining points at their next redemption, and does not affect any redemption already completed.

Worked example
A customer has 15,000 points. At the current value of 1 LKR each, that is worth 15,000 LKR, above the 10,000 threshold, so redemption is allowed. The shop gives them a product worth 7,500 LKR. The admin enters 7,500. The system deducts 7,500 points, leaving 7,500 points. Since 7,500 is now below the 10,000 threshold, that remaining balance is not redeemable again until future purchases bring it back to 10,000 or higher. If the admin later raises the value to 1.2 LKR per point, this customer's remaining 7,500 points would be worth 9,000 LKR at their next redemption, while the tin of paint already given stays recorded exactly as it was.

Output of this phase: the full earn and redeem loop is complete, gated correctly by an admin-adjustable threshold, valued by an admin-adjustable rate that never disturbs completed redemptions, with complete flexibility to give out any amount up to the customer's current balance once the threshold is met.

---

## Phase 5, Reports and Dashboard

Goal: visibility for the shop owner, for any period they choose.

Tasks
1. Dashboard screen showing total points liability across all customers, meaning total outstanding points multiplied by the **current Redemption Value**, since this represents product value owed, not cash owed.
2. Year and month selector, placed at the top of the reports area, letting the admin pick any specific year and month, instead of only the current period.
3. Monthly summary, points issued and points redeemed, for whichever year and month is selected, using the Created Date field. **All monthly boundaries are calculated in Sri Lanka time (Asia/Colombo)** so a late-night transaction lands in the correct month rather than slipping into the next one.
4. Top customers list by points earned, also within the selected year and month.
5. A quick way to jump back to the current month, since that will be the most common view.

Voided rows are excluded from every figure on this screen.

Output of this phase: the owner can see the financial picture of the loyalty program at a glance, for the current month or any past month.

---

## Phase 6, On Demand Excel Export (Full Backup)

Goal: the admin generates a complete data export whenever needed, with a single button, downloaded straight to their device. This export doubles as the interim backup until Supabase Pro daily backups are added, so it captures everything needed to rebuild the system, not just transactions.

Tasks
1. Year and month selector, placed on the reports screen, so the admin picks the period for the transaction sheets before exporting.
2. Export button, placed next to the selector.
3. Backend function written in Node.js using the exceljs library, builds a **five-sheet** Excel file:
   - **Summary** sheet, headline figures for the selected period.
   - **Transactions (Earn)** sheet, all Earn rows in the selected period.
   - **Redemptions** sheet, all Redeem rows in the selected period.
   - **Customers** sheet, the full customer list with current balances, so registrations can be recovered.
   - **Settings** sheet, the current paint types with percentages, the redemption threshold, and the redemption value, so the configuration can be recovered.

   The three transaction-based sheets are filtered to the selected year and month, all pulled from the same combined transactions table (voided rows clearly flagged so they are never mistaken for live ones). The customers and settings sheets are full snapshots, not period-filtered, since a backup needs the whole picture.
4. The finished xlsx file downloads directly to the admin's device through the browser, no email, no external service, no connection to set up.
5. A simple loading state shows while the export runs, using the shared spinning logo loading screen from Phase 7, followed by the file download completing.

Output of this phase: the admin can generate a complete, accurate, restorable export for any period at any time with one click, saved straight to their device as a plain xlsx file.

---

## Phase 7, Premium UI and UX Pass

Goal: the interface should feel considered and made for a real human, not a generic template.

Design principles
1. A distinct color identity, not default blue and gray, something that fits a paint shop, warm and confident. The GP+ logo (deep red on black) sets the palette.
2. Real typography choices, a proper heading font paired with a comfortable reading font, not the browser default.
3. Generous spacing, nothing cramped, comfortable tap targets since this will often be used on a tablet or touchscreen at the counter.
4. Friendly, human-written copy throughout, confirmation messages that sound like a person wrote them.
5. Thoughtful empty states, when a customer has no transactions yet, show something warm and encouraging instead of a blank table.
6. Clear loading and success feedback, subtle motion when a transaction is saved or points are added, so the admin feels the action landed.
7. A calm, uncluttered layout, one clear action per screen.
8. A single, consistent loading screen used everywhere, showing the GP+ logo animated as a spinning wheel, centered on the screen.

Tasks
1. Establish a small design system, colors, spacing scale, typography, button styles, used consistently everywhere.
2. Redesign every screen built in phases two through five with this system.
3. Add small human touches, a friendly greeting on login, a small congratulatory message when a customer crosses the redemption threshold.
4. Build the shared loading screen component, logo spinning-wheel animation, used as the loading state for every screen and every save action across the whole app.
5. Test on a tablet-sized screen since that is the likely counter device.

Output of this phase: the whole app feels like a premium, considered product rather than a rough internal tool.

---

## Phase 8, Staging Rehearsal

Goal: prove the entire system end to end before touching real data.

Tasks
1. Full walkthrough on the stage environment, register a test customer, run several transactions, edit one, void one, redeem points, and confirm the balance is correct at each step.
2. Change the redemption value on stage and confirm remaining points re-value correctly while a previously completed redemption stays frozen.
3. Press the export button once on stage and confirm the downloaded xlsx file opens correctly and all five sheets are accurate (summary, earn, redeem, customers, settings).
4. Trigger the drift check deliberately (if practical) and confirm the admin warning appears rather than a silent change.
5. Fix anything found during this rehearsal.

Output of this phase: confidence that production will behave correctly from day one.

---

## Phase 9, Go Live

Goal: switch over to production for real use.

Tasks
1. Set the real Decorative percentage, Autorefinish percentage, Redemption Threshold, and Redemption Value in the production configuration.
2. Register real customers.
3. Start recording real transactions.
4. Confirm the export button works correctly on production and downloads a valid five-sheet file.
5. Short handover walkthrough for whoever will use the admin panel day to day, including what the redemption value setting does, what the drift warning means, and the habit of pressing Export before any long shop closure as a safety copy.

Output of this phase: the system is live and running the real loyalty program.

---

## Summary Table

| Phase | Focus | Environment | Status |
|---|---|---|---|
| 0 | Foundation setup | Stage and Prod | Completed on stage |
| 1 | Database and login | Stage and Prod | Completed on stage |
| 2 | Customer management | Stage first, then Prod | Completed on stage |
| 3 | Transactions and points | Stage first, then Prod | Completed on stage |
| 4 | Redemption | Stage first, then Prod | Completed on stage |
| 5 | Reports and dashboard | Stage first, then Prod | Not started |
| 6 | On demand Excel export (full backup) | Stage first, then Prod | Not started |
| 7 | Premium UI and UX | Stage first, then Prod | Not started |
| 8 | Full rehearsal | Stage | Not started |
| 9 | Go live | Prod | Not started |

## Cost Note

Every phase above runs entirely on free tiers, Vercel Hobby and Supabase Free, for both stage and prod projects, since two free Supabase projects are allowed per account. No domain purchase is required since the free Vercel subdomain is enough for a single PC, admin only system. The on demand export in Phase 6 adds no extra cost, since it is just a file generated and downloaded directly, no external service involved, and it now doubles as a full backup. The only future cost to plan for is the Supabase Pro upgrade once daily automated backups are wanted in addition to the on demand export.
