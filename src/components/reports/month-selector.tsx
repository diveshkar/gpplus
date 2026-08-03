"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { select } from "@/lib/ui";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Year and month picker for the dashboard. Changing either updates the URL, so
 * the server re-runs the reports for the chosen period. "This month" jumps back
 * to the current period.
 */
export function MonthSelector({
  year,
  month,
  currentYear,
  currentMonth,
}: {
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 4; y--) {
    years.push(y);
  }

  const isCurrent = year === currentYear && month === currentMonth;

  function go(nextYear: number, nextMonth: number) {
    startTransition(() => {
      router.push(`/?year=${nextYear}&month=${nextMonth}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select
          aria-label="Month"
          value={month}
          onChange={(event) => go(year, Number(event.target.value))}
          className={`${select} h-10 w-40`}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <select
          aria-label="Year"
          value={year}
          onChange={(event) => go(Number(event.target.value), month)}
          className={`${select} h-10 w-28`}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {!isCurrent ? (
        <button
          type="button"
          onClick={() => go(currentYear, currentMonth)}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand"
        >
          This month
        </button>
      ) : null}

      {isPending ? (
        <span className="text-xs text-muted">Updating</span>
      ) : null}
    </div>
  );
}
