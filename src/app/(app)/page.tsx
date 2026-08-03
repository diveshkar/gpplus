import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConfiguration } from "@/lib/settings/queries";
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${card} p-5`}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground">
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
  const name = user?.email?.split("@")[0] ?? "there";

  const [liabilityPoints, config, summary, topCustomers] = await Promise.all([
    getLiabilityPoints(),
    getConfiguration(),
    getMonthlySummary(year, month),
    getTopCustomers(year, month),
  ]);

  const liabilityWorth = liabilityPoints * config.redemption_value;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Here is how the loyalty program is doing.
        </p>
      </section>

      {/* Liability headline */}
      <section className={`${card} bg-brand-soft/40 p-6`}>
        <p className="text-sm text-muted">Points liability across all customers</p>
        <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground">
          {formatPoints(liabilityPoints)}
          <span className="ml-1.5 text-base font-normal text-muted">points</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          Worth {formatLKR(liabilityWorth)} in product owed, at the current
          redemption value.
        </p>
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
          />
          <StatCard
            label="Points redeemed"
            value={formatPoints(summary.redeemed)}
          />
        </div>
      </section>

      {/* Top customers */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Top customers this period
        </h2>
        {topCustomers.length === 0 ? (
          <div className={`${card} px-6 py-8 text-center`}>
            <p className="text-sm text-muted">
              No points were earned in {monthLabel(year, month)}.
            </p>
          </div>
        ) : (
          <div className={`${card} divide-y divide-border overflow-hidden`}>
            {topCustomers.map((row, index) => (
              <Link
                key={row.customer_id}
                href={`/customers/${row.customer_id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-background"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-sm font-semibold text-muted tabular-nums">
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
