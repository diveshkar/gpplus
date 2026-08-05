import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organizations/queries";
import {
  currentPeriod,
  getLiabilityPoints,
  getMonthlySummary,
  getTopCustomers,
} from "@/lib/reports/queries";
import { formatLKR, formatPoints } from "@/lib/format";
import { card } from "@/lib/ui";
import { MonthSelector } from "@/components/reports/month-selector";
import { ExportButton } from "@/components/reports/export-button";
import { LottiePlayer } from "@/components/ui/lottie-player";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "brand" | "neutral";
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center gap-2">
        <span
          className={[
            "h-2 w-2 rounded-full",
            accent === "brand" ? "bg-brand" : "bg-foreground/40",
          ].join(" ")}
          aria-hidden
        />
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { year: yearParam, month: monthParam } = await searchParams;
  const current = currentPeriod();

  const parsedYear = Number(yearParam);
  const parsedMonth = Number(monthParam);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : current.year;
  const month =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : current.month;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [liabilityPoints, config, summary, topCustomers] = await Promise.all([
    getLiabilityPoints(),
    getCurrentOrganization(),
    getMonthlySummary(year, month),
    getTopCustomers(year, month),
  ]);

  // Use the display name set in Settings; fall back to the email prefix.
  const name =
    config.admin_name?.trim() || user?.email?.split("@")[0] || "there";

  const liabilityWorth = liabilityPoints * config.redemption_value;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-4 shadow-card sm:gap-4 sm:px-5">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-semibold tracking-tight text-foreground">
            {greeting()}, {name}.
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Here is how the loyalty program is doing.
          </p>
        </div>
      </header>

      {/* Liability hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-ink p-6 text-white shadow-card sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-3xl"
          aria-hidden
        />
        <Image
          src="/paintcanparnsparent.png"
          alt=""
          width={320}
          height={320}
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-6 hidden h-56 w-auto select-none opacity-20 sm:block"
        />
        <div className="relative">
          <p className="text-sm text-white/60">
            Points liability across all customers
          </p>
          <p className="mt-2 font-heading text-4xl font-semibold tracking-tight">
            {formatPoints(liabilityPoints)}
            <span className="ml-2 text-lg font-normal text-white/50">
              points
            </span>
          </p>
          <p className="mt-2 text-sm text-white/70">
            Worth{" "}
            <span className="font-medium text-white">
              {formatLKR(liabilityWorth)}
            </span>{" "}
            in product owed, at the current redemption value.
          </p>
        </div>
      </section>

      {/* Reports */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {monthLabel(year, month)}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <MonthSelector
              year={year}
              month={month}
              currentYear={current.year}
              currentMonth={current.month}
            />
            <ExportButton year={year} month={month} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Points issued"
            value={formatPoints(summary.issued)}
            accent="brand"
          />
          <StatCard
            label="Points redeemed"
            value={formatPoints(summary.redeemed)}
            accent="neutral"
          />
        </div>
      </section>

      {/* Top customers */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Top customers this period
        </h2>
        {topCustomers.length === 0 ? (
          <div className={`${card} flex flex-col items-center px-6 py-8 text-center`}>
            <LottiePlayer src="/car-wash.json" className="h-44 w-72" />
            <p className="text-sm font-medium text-foreground">
              Nothing earned yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              No points were earned in {monthLabel(year, month)}. Log a sale to
              see it here.
            </p>
          </div>
        ) : (
          <div className={`${card} divide-y divide-border overflow-hidden`}>
            {topCustomers.map((row, index) => (
              <Link
                key={row.customer_id}
                href={`/customers/${row.customer_id}`}
                className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-background"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      index === 0
                        ? "bg-brand text-white"
                        : "bg-brand-soft text-brand-strong",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {row.full_name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatPoints(row.points_earned)}
                  <span className="ml-1 text-xs font-normal text-muted">
                    pts
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
