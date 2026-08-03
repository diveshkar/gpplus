"use client";

import Link from "next/link";
import { useState } from "react";
import { voidTransaction } from "@/lib/transactions/actions";
import { formatDate, formatLKR, formatPoints } from "@/lib/format";
import { card } from "@/lib/ui";
import type { TransactionRow } from "@/lib/transactions/queries";

function EntryBadge({ row }: { row: TransactionRow }) {
  if (row.voided) {
    return (
      <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted line-through">
        Cancelled
      </span>
    );
  }
  const isEarn = row.entry_type === "earn";
  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-xs font-medium",
        isEarn ? "bg-brand-soft text-brand-strong" : "bg-background text-foreground",
      ].join(" ")}
    >
      {isEarn ? "Earn" : "Redeem"}
    </span>
  );
}

function TransactionItem({
  row,
  customerId,
}: {
  row: TransactionRow;
  customerId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const isEarn = row.entry_type === "earn";
  const pointsLabel = `${row.points > 0 ? "+" : ""}${formatPoints(row.points)}`;

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="pt-0.5">
          <EntryBadge row={row} />
        </div>
        <div className="min-w-0">
          <p
            className={[
              "truncate text-sm font-medium",
              row.voided ? "text-muted line-through" : "text-foreground",
            ].join(" ")}
          >
            {row.description ?? (isEarn ? "Purchase" : "Redemption")}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {formatDate(row.created_at)}
            {" · "}
            {formatLKR(row.amount)}
            {isEarn && row.paint_type?.name ? ` · ${row.paint_type.name}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span
          className={[
            "text-sm font-semibold tabular-nums",
            row.voided
              ? "text-muted line-through"
              : isEarn
                ? "text-success"
                : "text-foreground",
          ].join(" ")}
        >
          {pointsLabel} pts
        </span>

        {!row.voided ? (
          <div className="flex items-center gap-1">
            {confirming ? (
              <form action={voidTransaction} className="flex items-center gap-1">
                <input type="hidden" name="transaction_id" value={row.id} />
                <input type="hidden" name="customer_id" value={customerId} />
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/5"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
                >
                  Keep
                </button>
              </form>
            ) : (
              <>
                {isEarn ? (
                  <Link
                    href={`/transactions/${row.id}/edit`}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
                  >
                    Edit
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-danger"
                >
                  Void
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TransactionList({
  transactions,
  customerId,
}: {
  transactions: TransactionRow[];
  customerId: string;
}) {
  return (
    <div className={`${card} divide-y divide-border overflow-hidden`}>
      {transactions.map((row) => (
        <TransactionItem key={row.id} row={row} customerId={customerId} />
      ))}
    </div>
  );
}
